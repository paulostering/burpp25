import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

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

async function geocodeSearchLocation(q: string) {
  try {
    // For US zip codes, add country code to improve accuracy
    const searchQuery = /^\d{5}(-\d{4})?$/.test(q.trim()) 
      ? `${q.trim()}, USA`
      : q.trim()
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=us&limit=1`
    const res = await fetch(url, {
      headers: { "User-Agent": "burpp-web/1.0" },
      cache: "no-store",
    })
    
    if (!res.ok) {
      return null
    }
    
    const data = await res.json()
    const coords = (!Array.isArray(data) || data.length === 0) 
      ? null 
      : { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    
    return coords
  } catch (error) {
    console.error(`[Geocode] Error for "${q}":`, error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const searchLocation = searchParams.get('location') || ''
    const category = searchParams.get('category') || ''

    const supabase = createAdminSupabase()

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found', details: vendorError },
        { status: 404 }
      )
    }

    // Check all requirements for search visibility
    const checks = {
      admin_approved: {
        value: vendor.admin_approved,
        required: true,
        pass: vendor.admin_approved === true,
        message: vendor.admin_approved ? '✓ Approved' : '✗ Not approved - vendor will not appear in search'
      },
      offers_in_person_services: {
        value: vendor.offers_in_person_services,
        required: true,
        pass: vendor.offers_in_person_services === true,
        message: vendor.offers_in_person_services 
          ? '✓ Offers in-person services' 
          : '✗ Does not offer in-person services - will only appear if offers virtual services only'
      },
      has_latitude: {
        value: vendor.latitude,
        required: true,
        pass: vendor.latitude != null,
        message: vendor.latitude != null 
          ? `✓ Has latitude: ${vendor.latitude}` 
          : '✗ Missing latitude - vendor location not geocoded'
      },
      has_longitude: {
        value: vendor.longitude,
        required: true,
        pass: vendor.longitude != null,
        message: vendor.longitude != null 
          ? `✓ Has longitude: ${vendor.longitude}` 
          : '✗ Missing longitude - vendor location not geocoded'
      },
      has_service_radius: {
        value: vendor.service_radius,
        required: true,
        pass: vendor.service_radius != null && vendor.service_radius > 0,
        message: vendor.service_radius != null && vendor.service_radius > 0
          ? `✓ Has service radius: ${vendor.service_radius} miles`
          : '✗ Missing or zero service radius'
      },
      has_category: {
        value: vendor.service_categories,
        required: category ? true : false,
        pass: category ? (vendor.service_categories?.includes(category) || false) : true,
        message: category
          ? (vendor.service_categories?.includes(category)
              ? `✓ Has category "${category}" in service_categories`
              : `✗ Missing category "${category}" in service_categories. Current categories: ${vendor.service_categories?.join(', ') || 'none'}`)
          : 'Category check skipped (no category specified)'
      }
    }

    // If search location provided, check distance
    let distanceCheck = null
    if (searchLocation && vendor.latitude && vendor.longitude) {
      const searchCoords = await geocodeSearchLocation(searchLocation)
      if (searchCoords) {
        const distance = calculateDistance(
          searchCoords.lat,
          searchCoords.lng,
          vendor.latitude,
          vendor.longitude
        )
        const withinRadius = vendor.service_radius ? distance <= vendor.service_radius : false
        distanceCheck = {
          search_location: searchLocation,
          search_coords: searchCoords,
          vendor_coords: { lat: vendor.latitude, lng: vendor.longitude },
          distance_miles: distance.toFixed(2),
          service_radius: vendor.service_radius,
          within_radius: withinRadius,
          pass: withinRadius,
          message: withinRadius
            ? `✓ Within service radius (${distance.toFixed(2)} miles <= ${vendor.service_radius} miles)`
            : `✗ Outside service radius (${distance.toFixed(2)} miles > ${vendor.service_radius} miles)`
        }
      } else {
        distanceCheck = {
          search_location: searchLocation,
          error: 'Could not geocode search location'
        }
      }
    }

    const allChecksPass = Object.values(checks).every(check => check.pass) && 
      (!distanceCheck || distanceCheck.pass !== false)

    return NextResponse.json({
      vendor_id: id,
      business_name: vendor.business_name,
      all_checks_pass: allChecksPass,
      will_appear_in_search: allChecksPass,
      checks,
      distance_check: distanceCheck,
      vendor_data: {
        admin_approved: vendor.admin_approved,
        offers_in_person_services: vendor.offers_in_person_services,
        offers_virtual_services: vendor.offers_virtual_services,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        service_radius: vendor.service_radius,
        service_categories: vendor.service_categories,
        zip_code: vendor.zip_code
      }
    })
  } catch (error) {
    console.error('Error in search debug:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

