import { createAdminSupabase } from "@/lib/supabase/server"
import { InfiniteScrollVendors } from "@/components/infinite-scroll-vendors"
import type { VendorProfile } from "@/types/db"

async function geocode(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    q
  )}`
  const res = await fetch(url, {
    headers: { "User-Agent": "burpp-web/1.0" },
    // edge runtime caches by default; avoid caching geocode responses
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const category: string | undefined = sp.category || undefined
  const q: string | undefined = sp.q || undefined
  const searchCoords = q ? await geocode(q) : null

  // Get initial vendors directly from database
  const supabase = createAdminSupabase()
  let vendors: VendorProfile[] = []
  const limit = 12

  if (searchCoords) {
    // Get all vendors in the category (if specified)
    let query = supabase
      .from('vendor_profiles')
      .select('*')
    
    if (category) {
      query = query.contains('service_categories', [category])
    }

    const { data: allVendors } = await query
    const allVendorsList = (allVendors as VendorProfile[]) ?? []

    // Filter vendors based on their service offerings and location
    const filteredVendors = []
    
    for (const vendor of allVendorsList) {
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
        } catch {
          // Ignore geocoding errors for individual vendors
        }
      }

      if (shouldInclude) {
        filteredVendors.push(vendor)
      }
    }
    
    // Take first page of results
    vendors = filteredVendors.slice(0, limit)
  } else {
    // No search location, just get vendors by category with pagination
    let query = supabase
      .from('vendor_profiles')
      .select('*')
      .range(0, limit - 1)
    
    if (category) {
      query = query.contains('service_categories', [category])
    }

    const { data } = await query
    vendors = (data as VendorProfile[]) ?? []
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search Results Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {vendors.length > 0 
              ? `${vendors.length} professionals found` 
              : 'No professionals found'
            }
          </h1>
          {q && (
            <p className="text-muted-foreground text-lg">
              Showing vendors who service "{q}" based on their service radius
            </p>
          )}
        </div>

        {/* Vendor Results - Fixed TypeScript types */}
        <InfiniteScrollVendors 
          initialVendors={vendors}
          searchParams={{ category, q }}
        />
      </div>
    </div>
  )
}


