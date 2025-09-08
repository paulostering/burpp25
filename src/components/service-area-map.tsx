'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface ServiceAreaMapProps {
  address: string
  serviceRadius: number // in miles
  mapboxToken: string
}

export function ServiceAreaMap({ address, serviceRadius, mapboxToken }: ServiceAreaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return

    // Initialize map
    mapboxgl.accessToken = mapboxToken
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/upshootdigital/cme4ifph300x001s74iqf18ci',
      center: [-74.5, 40], // Default center, will be updated
      zoom: 10
    })

    // Geocode the address and add circle
    const geocodeAndAddCircle = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
        )
        const data = await response.json()
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center
          
          // Center map on location and adjust zoom based on service radius
          map.current?.setCenter([lng, lat])
          
          // Calculate appropriate zoom level based on service radius - zoom out more to show full radius
          // Smaller radius = higher zoom, larger radius = lower zoom
          const zoomLevel = Math.max(6, Math.min(10, 10 - (serviceRadius / 8)))
          map.current?.setZoom(zoomLevel)
          
          // Add marker for business location - use brand purple
          new mapboxgl.Marker({
            color: '#7452A5', // Brand purple color
            scale: 1.2 // Make it slightly larger
          })
            .setLngLat([lng, lat])
            .addTo(map.current!)
          
          // Convert miles to meters for the circle
          const radiusInMeters = serviceRadius * 1609.344
          
          // Create circle coordinates
          const createCircle = (center: [number, number], radiusInMeters: number, points = 64) => {
            const coords = []
            for (let i = 0; i < points; i++) {
              const angle = (i * 360) / points
              const dx = radiusInMeters * Math.cos(angle * Math.PI / 180)
              const dy = radiusInMeters * Math.sin(angle * Math.PI / 180)
              
              // Convert meters to degrees (approximate)
              const deltaLat = dy / 111000
              const deltaLng = dx / (111000 * Math.cos(center[1] * Math.PI / 180))
              
              coords.push([center[0] + deltaLng, center[1] + deltaLat])
            }
            coords.push(coords[0]) // Close the circle
            return coords
          }
          
          const circleCoords = createCircle([lng, lat], radiusInMeters)
          
          // Wait for map to load before adding source and layer
          const addServiceArea = () => {
            if (!map.current) return
            
            // Remove existing source and layers if they exist
            if (map.current.getLayer('service-area-border')) {
              map.current.removeLayer('service-area-border')
            }
            if (map.current.getLayer('service-area-fill')) {
              map.current.removeLayer('service-area-fill')
            }
            if (map.current.getSource('service-area')) {
              map.current.removeSource('service-area')
            }
            
            // Add circle source
            map.current.addSource('service-area', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [circleCoords]
                }
              }
            })
            
            // Add circle layer with primary color and opacity
            map.current.addLayer({
              id: 'service-area-fill',
              type: 'fill',
              source: 'service-area',
              paint: {
                'fill-color': '#7452A5', // Primary purple color
                'fill-opacity': 0.35
              }
            })
            
            // Add circle border - thicker and more prominent
            map.current.addLayer({
              id: 'service-area-border',
              type: 'line',
              source: 'service-area',
              paint: {
                'line-color': '#7452A5', // Primary purple color
                'line-width': 4,
                'line-opacity': 1
              }
            })
          }
          
          if (map.current?.isStyleLoaded()) {
            addServiceArea()
          } else if (map.current) {
            map.current.on('load', addServiceArea)
          }
        }
      } catch (error) {
        console.error('Error geocoding address:', error)
      }
    }

    geocodeAndAddCircle()

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [address, serviceRadius, mapboxToken])

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[300px] rounded-lg overflow-hidden border border-gray-200"
    />
  )
}
