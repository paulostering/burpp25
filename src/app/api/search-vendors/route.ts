import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from "@/lib/supabase/server"
import type { VendorProfile } from "@/types/db"
import { vendorLocationCache } from '@/lib/vendor-location-cache'

// Simple in-memory cache for search location geocoding
const searchLocationCache = new Map<string, { coords: { lat: number; lng: number } | null; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

async function geocodeSearchLocation(q: string, bypassCache = false) {
  if (!bypassCache) {
    const cached = searchLocationCache.get(q)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Geocode] Using cached coords for "${q}":`, cached.coords)
      return cached.coords
    }
  } else {
    console.log(`[Geocode] Bypassing cache for "${q}"`)
  }

  try {
    // For US zip codes, add country code to improve accuracy
    const searchQuery = /^\d{5}(-\d{4})?$/.test(q.trim()) 
      ? `${q.trim()}, USA`
      : q.trim()
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=us&limit=1`
    console.log(`[Geocode] Fetching from Nominatim:`, url)
    const res = await fetch(url, {
      headers: { "User-Agent": "burpp-web/1.0" },
      cache: "no-store",
    })
    
    if (!res.ok) {
      console.log(`[Geocode] Nominatim request failed with status:`, res.status)
      return null
    }
    
    const data = await res.json()
    console.log(`[Geocode] Nominatim response for "${q}":`, data.slice(0, 2)) // Log first 2 results
    
    const coords = (!Array.isArray(data) || data.length === 0) 
      ? null 
      : { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    
    console.log(`[Geocode] Extracted coords for "${q}":`, coords)
    searchLocationCache.set(q, { coords, timestamp: Date.now() })
    return coords
  } catch (error) {
    console.error(`[Geocode] Error for "${q}":`, error)
    return null
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    console.log(`[Search] ========================================`)
    console.log(`[Search] Starting search for: "${q}", category: ${category}`)
    console.log(`[Search] ========================================`)
    
    // Check if we should bypass cache (for debugging)
    const bypassCache = searchParams.get('bypass_cache') === 'true'
    
    const geocodeStart = Date.now()
    const searchCoords = q ? await geocodeSearchLocation(q, bypassCache) : null
    console.log(`[Search] Geocoding took: ${Date.now() - geocodeStart}ms`)
    console.log(`[Search] Search coordinates:`, searchCoords)
    
    const supabase = createAdminSupabase()
    let vendors: VendorProfile[] = []

    if (searchCoords) {
      // Get all vendors in the category (if specified)
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('admin_approved', true)
      
      console.log(`[Search] Category filter: ${category || 'NONE'}`)
      
      if (category) {
        query = query.contains('service_categories', [category])
        console.log(`[Search] Applied category filter to query: ${category}`)
      }

      const dbStart = Date.now()
      const { data: allVendors, error: queryError } = await query
      if (queryError) {
        console.error(`[Search] DB query error:`, queryError)
      }
      console.log(`[Search] DB query took: ${Date.now() - dbStart}ms, found ${allVendors?.length || 0} vendors`)
      
      // Log vendor IDs for debugging
      if (allVendors && allVendors.length > 0) {
        console.log(`[Search] ===== VENDORS FROM DB QUERY =====`)
        allVendors.slice(0, 20).forEach((v, idx) => {
          const hasCategory = category ? (v.service_categories && Array.isArray(v.service_categories) && v.service_categories.includes(category)) : true
          console.log(`[Search] Vendor ${idx + 1}: ${v.business_name} (${v.id})`)
          console.log(`[Search]   - Admin approved: ${v.admin_approved}`)
          console.log(`[Search]   - Categories:`, v.service_categories)
          console.log(`[Search]   - Has selected category (${category}): ${hasCategory}`)
          console.log(`[Search]   - Offers in-person: ${v.offers_in_person_services}`)
          console.log(`[Search]   - Has coords: ${!!(v.latitude && v.longitude)}`)
          console.log(`[Search]   - Service radius: ${v.service_radius}`)
        })
        console.log(`[Search] =================================`)
      }
      
      vendors = (allVendors as VendorProfile[]) ?? []

      // Additional client-side category filtering to ensure accuracy
      // (Supabase contains might have edge cases)
      if (category) {
        const beforeCount = vendors.length
        vendors = vendors.filter(v => {
          const hasCategory = v.service_categories && Array.isArray(v.service_categories) && v.service_categories.includes(category)
          if (!hasCategory) {
            console.log(`[Search] ❌ FILTERING OUT: ${v.business_name} (${v.id}) - missing category ${category}`)
            console.log(`[Search]    Has categories:`, v.service_categories)
          } else {
            console.log(`[Search] ✅ KEEPING: ${v.business_name} (${v.id}) - has category ${category}`)
          }
          return hasCategory
        })
        console.log(`[Search] Client-side category filter: ${beforeCount} -> ${vendors.length} vendors`)
      }
      
      // Separate virtual-only vendors (instant) from location-based vendors
      const virtualOnlyVendors = vendors.filter(
        v => v.offers_virtual_services && !v.offers_in_person_services
      )
      
      const locationBasedVendors = vendors.filter(
        v => v.offers_in_person_services && v.service_radius && v.latitude && v.longitude
      )
      
      console.log(`[Search] Virtual-only: ${virtualOnlyVendors.length}, Location-based: ${locationBasedVendors.length}`)

      // Process ALL location-based vendors using stored coordinates (INSTANT!)
      const filterStart = Date.now()
      
      // Log first few vendors for debugging
      console.log(`[Search] First 3 location-based vendors:`, locationBasedVendors.slice(0, 3).map(v => ({
        id: v.id,
        business_name: v.business_name,
        coordinates: { lat: v.latitude, lng: v.longitude },
        service_radius: v.service_radius
      })))
      
      // Filter vendors based on distance using their stored coordinates (no geocoding needed!)
      const filteredLocationVendors = locationBasedVendors.filter((vendor, index) => {
        try {
          const distance = calculateDistance(
            searchCoords.lat,
            searchCoords.lng,
            vendor.latitude!,
            vendor.longitude!
          )
          
          const withinRadius = distance <= vendor.service_radius!
          
          // Log all vendors for debugging (or first 10)
          if (index < 10 || !withinRadius) {
            console.log(`[Search] Vendor ${vendor.business_name} (${vendor.id}):`, {
              vendor_coords: { lat: vendor.latitude, lng: vendor.longitude },
              search_coords: { lat: searchCoords.lat, lng: searchCoords.lng },
              distance: distance.toFixed(2) + ' miles',
              service_radius: vendor.service_radius + ' miles',
              within_radius: withinRadius,
              category_match: category ? vendor.service_categories?.includes(category) : 'N/A'
            })
          }
          
          // Check if within service radius
          return withinRadius
        } catch (error) {
          console.error(`Error processing vendor ${vendor.id}:`, error)
          return false
        }
      })
      
      console.log(`[Search] Filtering took: ${Date.now() - filterStart}ms, found ${filteredLocationVendors.length} matching vendors`)
      
      // Combine virtual-only and location-based vendors
      const filteredVendors = [...virtualOnlyVendors, ...filteredLocationVendors]
      const totalCount = filteredVendors.length
      
      console.log(`[Search] ===== FINAL RESULTS =====`)
      console.log(`[Search] Virtual-only vendors: ${virtualOnlyVendors.length}`)
      console.log(`[Search] Location-based vendors: ${filteredLocationVendors.length}`)
      console.log(`[Search] Total vendors before pagination: ${totalCount}`)
      filteredVendors.slice(0, 10).forEach((v, idx) => {
        console.log(`[Search] Result ${idx + 1}: ${v.business_name} (${v.id})`)
        console.log(`[Search]   - Categories:`, v.service_categories)
      })
      console.log(`[Search] ========================`)
      
      // Apply pagination to filtered results
      vendors = filteredVendors.slice(offset, offset + limit)
      
      console.log(`[Search] Total time: ${Date.now() - startTime}ms`)
      console.log(`[Search] Returning ${vendors.length} vendors (page ${page}, limit ${limit})`)
      
      return NextResponse.json({
        vendors,
        count: totalCount,
        page,
        limit,
        hasMore: offset + vendors.length < totalCount
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } else {
      // No search location, just get vendors by category with pagination
      let countQuery = supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('admin_approved', true)

      let dataQuery = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('admin_approved', true)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (category) {
        countQuery = countQuery.contains('service_categories', [category])
        dataQuery = dataQuery.contains('service_categories', [category])
      }

      const [{ count: totalCount }, { data: vendorData }] = await Promise.all([
        countQuery,
        dataQuery
      ])

      vendors = (vendorData as VendorProfile[]) ?? []
      
      // Additional client-side category filtering to ensure accuracy
      if (category) {
        vendors = vendors.filter(v => {
          const hasCategory = v.service_categories && Array.isArray(v.service_categories) && v.service_categories.includes(category)
          if (!hasCategory) {
            console.log(`[Search] Filtering out vendor ${v.id} (${v.business_name}) - missing category ${category}. Has:`, v.service_categories)
          }
          return hasCategory
        })
        console.log(`[Search] After client-side category filter (no location): ${vendors.length} vendors`)
      }

      console.log(`[Search] Total time: ${Date.now() - startTime}ms`)

      return NextResponse.json({
        vendors,
        count: totalCount || 0,
        page,
        limit,
        hasMore: offset + vendors.length < (totalCount || 0)
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
  } catch (error) {
    console.error('[Search] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search vendors', vendors: [], count: 0 },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}
