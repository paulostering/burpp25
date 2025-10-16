'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategories } from '@/lib/categories-cache'

interface Category {
  id: string
  name: string
}

interface LocationSuggestion {
  place_name: string
  center: [number, number]
  context: Array<{ text: string }>
}

export function SearchHero() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<string>('')
  const locationInputRef = useRef<HTMLInputElement>(null)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const categoryContainerRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationContainerRef.current && !locationContainerRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false)
      }
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load categories using cache
  useEffect(() => {
    // Only load categories if we don't have them already
    if (categories.length > 0) return
    
    let isMounted = true
    
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        
        // Only update state if component is still mounted
        if (isMounted) {
          setCategories(data)
          setFilteredCategories(data)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    
    loadCategories()
    
    return () => {
      isMounted = false
    }
  }, [categories.length])

  // Filter categories based on search
  useEffect(() => {
    if (!categorySearch) {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
      setFilteredCategories(filtered)
    }
  }, [categorySearch, categories])

  // Auto-detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place`
            )
            const data = await response.json()
            if (data.features && data.features.length > 0) {
              const place = data.features[0]
              const locationText = `${place.text}, ${place.context?.find((c: any) => c.id.startsWith('region'))?.text || ''}`
              setUserLocation(locationText)
              setLocation(locationText)
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  // Handle location search
  const handleLocationSearch = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([])
      return
    }

    console.log('Searching for location:', query)
    console.log('Mapbox token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place&country=us`
      )
      const data = await response.json()
      console.log('Mapbox response:', data)
      setLocationSuggestions(data.features || [])
    } catch (error) {
      console.error('Error searching locations:', error)
    }
  }

  // Helper function to highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  // Handle category selection
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId)
    setSelectedCategoryName(categoryName)
    setCategorySearch(categoryName)
    setIsCategoryOpen(false)
  }

  // Handle search submission
  const handleSearch = () => {
    if (!selectedCategory || !location) return

    const params = new URLSearchParams()
    params.set('category', selectedCategory)
    params.set('q', location)

    router.push(`/search?${params.toString()}`)
  }

  // Clear location
  const clearLocation = () => {
    setLocation('')
    setUserLocation('')
    if (locationInputRef.current) {
      locationInputRef.current.focus()
    }
  }

  return (
    <div className="relative bg-gray-100 rounded-br-[4rem] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home-hero2.jpeg"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <div className="relative z-10 mx-auto max-w-6xl pt-24 md:pt-48 px-6">
        <div className="text-left mb-8 max-w-3xl">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Find Your Next Anything
          </h1>
          <p className="text-xl text-white">
            Burpp is your go-to source for finding highly rated independent contractors to assist you with anything. <strong>Fast. Local. Reliable</strong>
          </p>
        </div>

        {/* Search Form */}
        <div className="relative w-full max-w-4xl">
          {/* Desktop Layout - Horizontal */}
          <div className="hidden md:flex items-center bg-white border border-gray-300 rounded-full pl-6 pr-3 py-2 h-16">
            {/* Category Section */}
            <div className="flex-1 min-w-0 relative" ref={categoryContainerRef}>
              <Input
                type="text"
                placeholder="Category"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value)
                  if (!selectedCategory || e.target.value !== selectedCategoryName) {
                    setSelectedCategory('')
                    setSelectedCategoryName('')
                  }
                }}
                onFocus={() => setIsCategoryOpen(true)}
                className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-semibold text-gray-700 placeholder:text-gray-500 pr-8"
                style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
              />
              {categorySearch && (
                <button
                  onClick={() => {
                    setCategorySearch('')
                    setSelectedCategory('')
                    setSelectedCategoryName('')
                    setIsCategoryOpen(false)
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Category Suggestions Dropdown */}
              {isCategoryOpen && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 w-96 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id, category.name)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="font-medium text-sm">
                        {highlightText(category.name, categorySearch)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-300 mx-4" />
            {/* Location Section */}
            <div className="flex-1 min-w-0 relative" ref={locationContainerRef}>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords
                          try {
                            const response = await fetch(
                              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place`
                            )
                            const data = await response.json()
                            if (data.features && data.features.length > 0) {
                              const place = data.features[0]
                              const locationText = `${place.text}, ${place.context?.find((c: any) => c.id.startsWith('region'))?.text || ''}`
                              setUserLocation(locationText)
                              setLocation(locationText)
                            }
                          } catch (error) {
                            console.error('Error reverse geocoding:', error)
                          }
                        },
                        (error) => {
                          console.error('Error getting location:', error)
                        }
                      )
                    }
                  }}
                  className="mr-3 text-gray-400 hover:text-gray-600"
                >
                  <MapPin className="h-4 w-4" />
                </button>
                <Input
                  ref={locationInputRef}
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    handleLocationSearch(e.target.value)
                  }}
                  onFocus={() => setIsLocationOpen(true)}
                  className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-semibold text-gray-700 placeholder:text-gray-500 pr-8"
                  style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
                />
                {location && (
                  <button
                    onClick={clearLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Location Suggestions Dropdown */}
              {isLocationOpen && locationSuggestions.length > 0 && (
                <div className="absolute top-full right-0 w-96 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setLocation(suggestion.place_name)
                        setIsLocationOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-start gap-3 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm">
                          {highlightText(suggestion.place_name, location)}
                        </div>
                        {suggestion.context && suggestion.context.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {suggestion.context.map((c, i) => c.text).join(', ')}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              size="lg"
              className="ml-4 h-10 w-10 p-0 rounded-full bg-primary hover:bg-primary/90"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Layout - 3 Rows */}
          <div className="md:hidden space-y-3">
            {/* Row 1: Category */}
            <div className="relative" ref={categoryContainerRef}>
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <Input
                  type="text"
                  placeholder="Category"
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value)
                    if (!selectedCategory || e.target.value !== selectedCategoryName) {
                      setSelectedCategory('')
                      setSelectedCategoryName('')
                    }
                  }}
                  onFocus={() => setIsCategoryOpen(true)}
                  className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-semibold text-gray-700 placeholder:text-gray-500 pr-8"
                  style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
                />
                {categorySearch && (
                  <button
                    onClick={() => {
                      setCategorySearch('')
                      setSelectedCategory('')
                      setSelectedCategoryName('')
                      setIsCategoryOpen(false)
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Category Suggestions Dropdown */}
              {isCategoryOpen && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id, category.name)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="font-medium text-sm">
                        {highlightText(category.name, categorySearch)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 2: Location */}
            <div className="relative" ref={locationContainerRef}>
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords
                            try {
                              const response = await fetch(
                                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place`
                              )
                              const data = await response.json()
                              if (data.features && data.features.length > 0) {
                                const place = data.features[0]
                                const locationText = `${place.text}, ${place.context?.find((c: any) => c.id.startsWith('region'))?.text || ''}`
                                setUserLocation(locationText)
                                setLocation(locationText)
                              }
                            } catch (error) {
                              console.error('Error reverse geocoding:', error)
                            }
                          },
                          (error) => {
                            console.error('Error getting location:', error)
                          }
                        )
                      }
                    }}
                    className="mr-3 text-gray-400 hover:text-gray-600"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                  <Input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value)
                      handleLocationSearch(e.target.value)
                    }}
                    onFocus={() => setIsLocationOpen(true)}
                    className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-semibold text-gray-700 placeholder:text-gray-500 pr-8"
                    style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
                  />
                  {location && (
                    <button
                      onClick={clearLocation}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Location Suggestions Dropdown */}
              {isLocationOpen && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setLocation(suggestion.place_name)
                        setIsLocationOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-start gap-3 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm">
                          {highlightText(suggestion.place_name, location)}
                        </div>
                        {suggestion.context && suggestion.context.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {suggestion.context.map((c, i) => c.text).join(', ')}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Search Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 font-semibold text-lg"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scuba Instructor Tag - Inline */}
        <div className="mt-4 flex items-center mt-16 md:mt-36 mb-12">
          <div className="bg-black/50 backdrop-blur-sm pl-4 pr-8 py-4 shadow-lg border-l-4 border-primary">
            <div className="text-lg font-medium text-white">
              Fitness Instructor
            </div>
            <div className="text-xs text-white/80">
              Dave From Haleiwa, HI
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
