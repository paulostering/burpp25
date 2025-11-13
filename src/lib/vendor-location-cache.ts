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
    const coords = await this.geocode(zipCode)
    if (!coords) return null

    const location: VendorLocation = {
      vendorId,
      lat: coords.lat,
      lng: coords.lng,
      serviceRadius,
      zipCode
    }

    this.cache.set(vendorId, location)
    return location
  }

  private async geocode(zipCode: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zipCode)}`
      const res = await fetch(url, {
        headers: { "User-Agent": "burpp-web/1.0" },
        cache: "force-cache", // Cache geocoding results
      })
      
      if (!res.ok) return null
      
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) return null
      
      return { 
        lat: parseFloat(data[0].lat), 
        lng: parseFloat(data[0].lon) 
      }
    } catch (error) {
      console.error(`Geocoding error for ${zipCode}:`, error)
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

