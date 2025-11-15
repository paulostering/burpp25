'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X, LayoutGrid } from 'lucide-react'
import { getCategories } from '@/lib/categories-cache'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface LocationSuggestion {
  place_name: string
  center: [number, number]
  context: Array<{ text: string }>
}

export function MobileSearchHero() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1)
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [userLocation, setUserLocation] = useState<string>('')
  const hasAttemptedGeolocation = useRef(false)
  const hasLoadedFromStorage = useRef(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const categoryContainerRef = useRef<HTMLDivElement>(null)

  // Load location and category from localStorage on mount
  useEffect(() => {
    if (!hasLoadedFromStorage.current) {
      const savedLocation = localStorage.getItem('burpp_search_location')
      if (savedLocation) {
        setLocation(savedLocation)
        hasAttemptedGeolocation.current = true // Don't auto-detect if we have a saved location
      }
      
      const savedCategoryId = localStorage.getItem('burpp_search_category_id')
      const savedCategoryName = localStorage.getItem('burpp_search_category_name')
      if (savedCategoryId && savedCategoryName) {
        setSelectedCategory(savedCategoryId)
        setSelectedCategoryName(savedCategoryName)
        setCategorySearch(savedCategoryName)
      }
      
      hasLoadedFromStorage.current = true
    }
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
    if (categories.length > 0) return
    
    let isMounted = true
    
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        
        if (isMounted) {
          setCategories(data)
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
    setHighlightedCategoryIndex(-1) // Reset highlight when filter changes
  }, [categorySearch, categories])

  // Auto-detect user location on mount
  useEffect(() => {
    if (hasAttemptedGeolocation.current) return // Only attempt once
    hasAttemptedGeolocation.current = true
    
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
              const locationText = `${place.text}, ${place.context?.find((c: {id: string; text: string}) => c.id.startsWith('region'))?.text || ''}`
              setLocation(locationText)
              setUserLocation(locationText)
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error)
          }
        },
        (error) => {
          // Silently fail if user denies or error occurs
          console.log('Geolocation error:', error.code)
        }
      )
    }
  }, [])

  // Handle location search
  const handleLocationSearch = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([])
      setHighlightedIndex(-1)
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,neighborhood,postcode&country=us`
      )
      const data = await response.json()
      setLocationSuggestions(data.features || [])
      setHighlightedIndex(-1) // Reset highlighted index when new suggestions arrive
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
        <span key={index} className="font-bold">
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
    setHighlightedCategoryIndex(-1)
    localStorage.setItem('burpp_search_category_id', categoryId)
    localStorage.setItem('burpp_search_category_name', categoryName)
  }

  // Handle keyboard navigation for category suggestions
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCategoryOpen || filteredCategories.length === 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIsCategoryOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedCategoryIndex((prev) => 
          prev < filteredCategories.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedCategoryIndex((prev) => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedCategoryIndex >= 0 && highlightedCategoryIndex < filteredCategories.length) {
          const category = filteredCategories[highlightedCategoryIndex]
          handleCategorySelect(category.id, category.name)
        }
        break
      case 'Escape':
        setIsCategoryOpen(false)
        setHighlightedCategoryIndex(-1)
        break
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

  // Clear location
  const clearLocation = () => {
    setLocation('')
    setUserLocation('')
    setHighlightedIndex(-1)
    if (locationInputRef.current) {
      locationInputRef.current.focus()
    }
  }

  // Handle keyboard navigation for location suggestions
  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isLocationOpen || locationSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => 
          prev < locationSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < locationSuggestions.length) {
          setLocation(locationSuggestions[highlightedIndex].place_name)
          setIsLocationOpen(false)
          setHighlightedIndex(-1)
        }
        break
      case 'Escape':
        setIsLocationOpen(false)
        setHighlightedIndex(-1)
        break
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
      
      <div className="relative z-10 mx-auto max-w-6xl pt-24 px-6">
        <div className="text-left mb-8 max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Find Your Next Anything
          </h1>
          <p className="text-lg text-white">
            Burpp is your go-to source for finding highly rated independent contractors to assist you with anything. <strong>Fast. Local. Reliable</strong>
          </p>
        </div>

        {/* Mobile Search Form - 3 Rows */}
        <div className="relative w-full max-w-md">
          <div className="space-y-3">
            {/* Row 1: Category */}
            <div className="relative" ref={categoryContainerRef}>
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <div className="flex items-center">
                  <LayoutGrid className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <Input
                    ref={categoryInputRef}
                    type="text"
                    placeholder="Category"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value)
                      setIsCategoryOpen(true)
                      if (!selectedCategory || e.target.value !== selectedCategoryName) {
                        setSelectedCategory('')
                        setSelectedCategoryName('')
                        localStorage.removeItem('burpp_search_category_id')
                        localStorage.removeItem('burpp_search_category_name')
                      }
                    }}
                    onKeyDown={handleCategoryKeyDown}
                    className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-semibold text-gray-700 placeholder:text-gray-500 pr-8"
                    style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>
                {categorySearch && (
                  <button
                    onClick={() => {
                      setCategorySearch('')
                      setSelectedCategory('')
                      setSelectedCategoryName('')
                      localStorage.removeItem('burpp_search_category_id')
                      localStorage.removeItem('burpp_search_category_name')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Category Dropdown */}
              {isCategoryOpen && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={category.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCategorySelect(category.id, category.name)
                      }}
                      onMouseEnter={() => setHighlightedCategoryIndex(index)}
                      className={`w-full px-4 py-3 text-left focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        highlightedCategoryIndex === index ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white'
                      }`}
                    >
                      <div className="font-medium" style={{ fontSize: '16px' }}>
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
                            // Provide user-friendly error messages
                            if (error.code === 1) {
                              // PERMISSION_DENIED - user chose not to share
                            } else if (error.code === 2) {
                              // POSITION_UNAVAILABLE
                              toast.error('Location unavailable. Please enter your location manually.')
                            } else if (error.code === 3) {
                              // TIMEOUT
                              toast.error('Location request timed out. Please try again or enter manually.')
                            }
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
                    onKeyDown={handleLocationKeyDown}
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
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setLocation(suggestion.place_name)
                        setIsLocationOpen(false)
                        setHighlightedIndex(-1)
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full px-4 py-3 text-left focus:outline-none flex items-start gap-3 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        highlightedIndex === index ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white'
                      }`}
                    >
                      <MapPin className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        highlightedIndex === index ? 'text-white' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-sm">
                          {highlightText(suggestion.place_name, location)}
                        </div>
                        {suggestion.context && suggestion.context.length > 0 && (
                          <div className={`text-xs ${
                            highlightedIndex === index ? 'text-white/80' : 'text-gray-500'
                          }`}>
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
            <div>
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
        
        {/* Featured Service Tag */}
        <div className="mt-16 flex mb-12">
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
