'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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

export function CondensedSearch() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const categoryContainerRef = useRef<HTMLDivElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
          // Log detailed error information
          const errorMessages = {
            1: 'User denied location permission',
            2: 'Location unavailable',
            3: 'Location request timeout'
          }
          console.log('Geolocation error:', {
            code: error.code,
            message: error.message,
            reason: errorMessages[error.code as keyof typeof errorMessages] || 'Unknown error'
          })
          // Silently fail - user can still manually enter location
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

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place&country=us`
      )
      const data = await response.json()
      setLocationSuggestions(data.features || [])
    } catch (error) {
      console.error('Error searching locations:', error)
    }
  }

  // Handle search submission
  const handleSearch = () => {
    if (!selectedCategory || !location) return

    const params = new URLSearchParams()
    params.set('category', selectedCategory)
    params.set('q', location)

    router.push(`/search?${params.toString()}`)
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

  // Clear location
  const clearLocation = () => {
    setLocation('')
    setUserLocation('')
    setIsLocationOpen(false)
  }

  // Handle search submission
  const handleSearchSubmit = () => {
    if (!selectedCategory || !location) return

    const params = new URLSearchParams()
    params.set('category', selectedCategory)
    params.set('q', location)

    router.push(`/search?${params.toString()}`)
    
    // Close sheet on mobile after search
    if (isMobile) {
      setIsSheetOpen(false)
    }
  }

  // Search form component (reusable for both desktop and mobile)
  const SearchForm = () => (
    <div className="relative w-full" ref={locationContainerRef}>
      {/* Unified Search Field */}
      <div className="flex items-center bg-white border border-gray-200 rounded-md hover:shadow-md transition-shadow duration-200 pl-4 pr-2 py-1 h-10">
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
            className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 text-sm text-gray-600 placeholder:text-gray-400 pr-6"
          />
          {categorySearch && (
            <button
              onClick={() => {
                setCategorySearch('')
                setSelectedCategory('')
                setSelectedCategoryName('')
                setIsCategoryOpen(false)
              }}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          {/* Category Suggestions Dropdown */}
          {isCategoryOpen && filteredCategories.length > 0 && (
            <div className={cn(
              "absolute top-full left-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto",
              isMobile ? "w-full" : "w-96"
            )}>
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
        <div className="w-px h-6 bg-gray-300 mx-3" />

        {/* Location Section */}
        <div className="flex-1 min-w-0 relative">
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
                      // Log detailed error information
                      const errorMessages = {
                        1: 'User denied location permission',
                        2: 'Location unavailable',
                        3: 'Location request timeout'
                      }
                      console.log('Geolocation error:', {
                        code: error.code,
                        message: error.message,
                        reason: errorMessages[error.code as keyof typeof errorMessages] || 'Unknown error'
                      })
                      // Silently fail - user can still manually enter location
                    }
                  )
                }
              }}
              className="mr-2 text-gray-400 hover:text-gray-600"
            >
              <MapPin className="h-3 w-3" />
            </button>
            <Input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                handleLocationSearch(e.target.value)
              }}
              onFocus={() => setIsLocationOpen(true)}
              className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 text-sm text-gray-600 placeholder:text-gray-400 pr-6"
            />
            {location && (
              <button
                onClick={clearLocation}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearchSubmit}
          disabled={!selectedCategory || !location}
          size="sm"
          className="ml-3 h-6 w-6 p-0 rounded-full bg-primary hover:bg-primary/90"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>

        {/* Location Suggestions Dropdown */}
        {isLocationOpen && locationSuggestions.length > 0 && (
          <div className={cn(
            "absolute top-full right-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto",
            isMobile ? "w-full" : "w-96"
          )}>
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
  )

  return (
    <div className="relative w-full max-w-4xl">
      {isMobile ? (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-md transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </div>
          </SheetTrigger>
          <SheetContent side="top" className="h-full p-6">
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">Search Services</h2>
              </div>
              <div className="flex-1">
                <SearchForm />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <SearchForm />
      )}
    </div>
  )
}
