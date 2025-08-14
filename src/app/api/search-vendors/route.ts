import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from "@/lib/supabase/server"
import type { VendorProfile } from "@/types/db"

async function geocode(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    q
  )}`
  const res = await fetch(url, {
    headers: { "User-Agent": "burpp-web/1.0" },
    cache: "no-store",
  })
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
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
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    const searchCoords = q ? await geocode(q) : null
    const supabase = createAdminSupabase()
    let vendors: VendorProfile[] = []

    if (searchCoords) {
      // Get all vendors in the category (if specified)
      let query = supabase
        .from('vendor_profiles')
        .select('*')
      
      if (category) {
        query = query.contains('service_categories', [category])
      }

      const { data: allVendors } = await query
      vendors = (allVendors as VendorProfile[]) ?? []

      // Filter vendors based on their service offerings and location
      const filteredVendors = []
      
      for (const vendor of vendors) {
        // Check if vendor offers services at the search location
        let shouldInclude = false

        // For vendors who offer virtual services only (no in-person), include them everywhere
        if (vendor.offers_virtual_services && !vendor.offers_in_person_services) {
          shouldInclude = true
        }
        
        // For vendors who offer in-person services (with or without virtual), check distance
        if (vendor.offers_in_person_services && vendor.service_radius && vendor.zip_code) {
          try {
            // Geocode the vendor's zip code
            const vendorCoords = await geocode(vendor.zip_code)
            
            if (vendorCoords) {
              // Calculate distance between search location and vendor location
              const distance = calculateDistance(
                searchCoords.lat, 
                searchCoords.lng, 
                vendorCoords.lat, 
                vendorCoords.lng
              )
              
              // Check if distance is within vendor's service radius
              if (distance <= vendor.service_radius) {
                shouldInclude = true
              }
            }
          } catch (error) {
            console.error(`Error calculating distance for vendor ${vendor.id}:`, error)
          }
        }

        if (shouldInclude) {
          filteredVendors.push(vendor)
        }
      }
      
      // Apply pagination to filtered results
      vendors = filteredVendors.slice(offset, offset + limit)
    } else {
      // No search location, just get vendors by category with pagination
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .range(offset, offset + limit - 1)
      
      if (category) {
        query = query.contains('service_categories', [category])
      }

      const { data } = await query
      vendors = (data as VendorProfile[]) ?? []
    }

    return NextResponse.json({
      vendors,
      page,
      limit,
      hasMore: vendors.length === limit
    })
  } catch (error) {
    console.error('Search vendors API error:', error)
    return NextResponse.json(
      { error: 'Failed to search vendors' },
      { status: 500 }
    )
  }
}
