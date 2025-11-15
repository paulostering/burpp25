import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from "@/lib/supabase/server"
import type { VendorProfile } from "@/types/db"
import { vendorLocationCache } from '@/lib/vendor-location-cache'

// Simple in-memory cache for search location geocoding
const searchLocationCache = new Map<string, { coords: { lat: number; lng: number } | null; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

async function geocodeSearchLocation(q: string) {
  const cached = searchLocationCache.get(q)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Geocode] Using cached coords for "${q}":`, cached.coords)
    return cached.coords
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
    console.log(`[Geocode] Fetching from Nominatim:`, url)
    const res = await fetch(url, {
      headers: { "User-Agent": "burpp-web/1.0" },
      cache: "force-cache",
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

    console.log(`[Search] Starting search for: "${q}", category: ${category}`)
    
    const geocodeStart = Date.now()
    const searchCoords = q ? await geocodeSearchLocation(q) : null
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
      
      if (category) {
        query = query.contains('service_categories', [category])
      }

      const dbStart = Date.now()
      const { data: allVendors } = await query
      console.log(`[Search] DB query took: ${Date.now() - dbStart}ms, found ${allVendors?.length || 0} vendors`)
      
      vendors = (allVendors as VendorProfile[]) ?? []

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
          
          // Log first few vendors
          if (index < 3) {
            console.log(`[Search] Vendor ${vendor.business_name}:`, {
              vendor_coords: { lat: vendor.latitude, lng: vendor.longitude },
              search_coords: { lat: searchCoords.lat, lng: searchCoords.lng },
              distance: distance.toFixed(2) + ' miles',
              service_radius: vendor.service_radius + ' miles',
              within_radius: distance <= vendor.service_radius!
            })
          }
          
          // Check if within service radius
          return distance <= vendor.service_radius!
        } catch (error) {
          console.error(`Error processing vendor ${vendor.id}:`, error)
          return false
        }
      })
      
      console.log(`[Search] Filtering took: ${Date.now() - filterStart}ms, found ${filteredLocationVendors.length} matching vendors`)
      
      // Combine virtual-only and location-based vendors
      const filteredVendors = [...virtualOnlyVendors, ...filteredLocationVendors]
      const totalCount = filteredVendors.length
      
      // Apply pagination to filtered results
      vendors = filteredVendors.slice(offset, offset + limit)
      
      console.log(`[Search] Total time: ${Date.now() - startTime}ms`)
      
      return NextResponse.json({
        vendors,
        count: totalCount,
        page,
        limit,
        hasMore: offset + vendors.length < totalCount
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

      console.log(`[Search] Total time: ${Date.now() - startTime}ms`)

      return NextResponse.json({
        vendors,
        count: totalCount || 0,
        page,
        limit,
        hasMore: offset + vendors.length < (totalCount || 0)
      })
    }
  } catch (error) {
    console.error('[Search] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search vendors', vendors: [], count: 0 },
      { status: 500 }
    )
  }
}
