// Server-side cache for vendor locations
// This caches all vendor coordinates so we don't need to geocode on every search

interface VendorLocation {
  vendorId: string
  lat: number
  lng: number
  serviceRadius: number
  zipCode: string
}

class VendorLocationCache {
  private cache: Map<string, VendorLocation> = new Map()
  private lastUpdate: number = 0
  private readonly UPDATE_INTERVAL = 3600000 // 1 hour

  async getVendorLocation(vendorId: string, zipCode: string, serviceRadius: number): Promise<VendorLocation | null> {
    // Check if we have this vendor cached
    const cached = this.cache.get(vendorId)
    if (cached) {
      return cached
    }

    // Geocode and cache it
    console.log(`[VendorCache] Geocoding vendor location for zip: ${zipCode}`)
    const coords = await this.geocode(zipCode)
    if (!coords) {
      console.log(`[VendorCache] Failed to geocode zip: ${zipCode}`)
      return null
    }

    const location: VendorLocation = {
      vendorId,
      lat: coords.lat,
      lng: coords.lng,
      serviceRadius,
      zipCode
    }

    console.log(`[VendorCache] Cached location for zip ${zipCode}:`, { lat: coords.lat, lng: coords.lng })
    this.cache.set(vendorId, location)
    return location
  }

  private async geocode(zipCode: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zipCode)}`
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout per request
      
      const res = await fetch(url, {
        headers: { "User-Agent": "burpp-web/1.0" },
        cache: "force-cache", // Cache geocoding results
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        console.log(`[VendorCache] Nominatim returned status ${res.status} for ${zipCode}`)
        return null
      }
      
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`[VendorCache] No results from Nominatim for ${zipCode}`)
        return null
      }
      
      return { 
        lat: parseFloat(data[0].lat), 
        lng: parseFloat(data[0].lon) 
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.error(`[VendorCache] Geocoding timeout for ${zipCode}`)
      } else {
        console.error(`[VendorCache] Geocoding error for ${zipCode}:`, error)
      }
      return null
    }
  }

  getAllLocations(): VendorLocation[] {
    return Array.from(this.cache.values())
  }

  clear() {
    this.cache.clear()
    this.lastUpdate = 0
  }

  shouldUpdate(): boolean {
    return Date.now() - this.lastUpdate > this.UPDATE_INTERVAL
  }

  markUpdated() {
    this.lastUpdate = Date.now()
  }
}

// Singleton instance
export const vendorLocationCache = new VendorLocationCache()

