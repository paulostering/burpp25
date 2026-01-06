import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from "@/lib/supabase/server"
import type { VendorProfile } from "@/types/db"

// Simple in-memory cache for search location geocoding
const searchLocationCache = new Map<string, { coords: { lat: number; lng: number } | null; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

async function geocodeSearchLocation(q: string, bypassCache = false) {
  if (!bypassCache) {
    const cached = searchLocationCache.get(q)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.coords
    }
  }

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
    
    searchLocationCache.set(q, { coords, timestamp: Date.now() })
    return coords
  } catch (error) {
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

async function resolveCategoryFilterIds(supabase: ReturnType<typeof createAdminSupabase>, categoryId: string) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)

  // Support both UUID category IDs and slugs in the URL.
  const { data: categoryRow } = await supabase
    .from('categories')
    .select('id, parent_id')
    .eq(isUuid ? 'id' : 'slug', isUuid ? categoryId : categoryId.toLowerCase())
    .maybeSingle()

  // If it's not found, signal invalid filter.
  if (!categoryRow) return null

  // If it's a subcategory, filter by that specific ID.
  if (categoryRow.parent_id) return [categoryRow.id]

  const { data: children } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)

  return [categoryRow.id, ...(children?.map((c) => c.id) ?? [])]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const q = (searchParams.get('q') || '').trim()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit
    
    // Check if we should bypass cache (for debugging)
    const bypassCache = searchParams.get('bypass_cache') === 'true'
    
    const searchCoords = q ? await geocodeSearchLocation(q, bypassCache) : null
    
    const supabase = createAdminSupabase()
    const categoryFilterIds = category ? await resolveCategoryFilterIds(supabase, category) : null
    if (category && (!categoryFilterIds || categoryFilterIds.length === 0)) {
      return NextResponse.json({ vendors: [], count: 0, page, limit, hasMore: false })
    }

    if (searchCoords) {
      // Pull all candidates by category (and admin_approved), then apply the rule:
      // - virtual-only vendors always pass
      // - in-person vendors must be within their service radius
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('admin_approved', true)

      if (categoryFilterIds && categoryFilterIds.length > 0) {
        query = query.overlaps('service_categories', categoryFilterIds)
      }

      // Stable ordering for pagination (even though we paginate after filtering)
      query = query.order('created_at', { ascending: false })

      const { data: allVendors, error } = await query
      if (error) {
        return NextResponse.json({ error: 'Failed to search vendors', vendors: [], count: 0 }, { status: 500 })
      }

      const candidates = (allVendors as VendorProfile[]) ?? []

      const filtered = candidates.filter((v) => {
        // Virtual-only vendors always pass (not tied to a radius)
        if (v.offers_virtual_services && !v.offers_in_person_services) return true

        // In-person vendors must be within their own service radius
        if (v.offers_in_person_services && v.service_radius && v.latitude && v.longitude) {
          const distance = calculateDistance(searchCoords.lat, searchCoords.lng, v.latitude, v.longitude)
          return distance <= v.service_radius
        }

        return false
      })

      const totalCount = filtered.length
      const vendors = filtered.slice(offset, offset + limit)

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
      // If we don't have coordinates (no q, or geocode failed), we can only reliably show:
      // - virtual-only vendors (since "within radius" can't be evaluated)
      let countQuery = supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('admin_approved', true)
        .eq('offers_virtual_services', true)
        .eq('offers_in_person_services', false)

      let dataQuery = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('admin_approved', true)
        .eq('offers_virtual_services', true)
        .eq('offers_in_person_services', false)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (categoryFilterIds && categoryFilterIds.length > 0) {
        countQuery = countQuery.overlaps('service_categories', categoryFilterIds)
        dataQuery = dataQuery.overlaps('service_categories', categoryFilterIds)
      }

      const [{ count: totalCount }, { data: vendorData }] = await Promise.all([
        countQuery,
        dataQuery
      ])

      const vendors = (vendorData as VendorProfile[]) ?? []
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
