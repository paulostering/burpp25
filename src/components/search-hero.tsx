'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategories } from '@/lib/categories-cache'
import { toast } from 'sonner'
import type { Category } from '@/types/db'

interface LocationSuggestion {
  place_name: string
  center: [number, number]
  context: Array<{ text: string }>
}

export function SearchHero() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('') // slug (preferred) or UUID fallback
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1)
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
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
      const savedCategorySlug = localStorage.getItem('burpp_search_category_slug')
      const savedCategoryName = localStorage.getItem('burpp_search_category_name')
      if (savedCategorySlug && savedCategoryName) {
        setSelectedCategory(savedCategorySlug)
        setSelectedCategoryName(savedCategoryName)
        setCategorySearch(savedCategoryName)
      } else if (savedCategoryId && savedCategoryName) {
        // Back-compat: old storage used UUID. We'll convert it to slug once categories load.
        setSelectedCategory(savedCategoryId)
        setSelectedCategoryName(savedCategoryName)
        setCategorySearch(savedCategoryName)
      }
      
      hasLoadedFromStorage.current = true
    }
  }, [])

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (locationContainerRef.current && !locationContainerRef.current.contains(target)) {
        setIsLocationOpen(false)
      }
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(target)) {
        setIsCategoryOpen(false)
      }
    }

    // Use both mousedown and touchend for cross-device compatibility
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchend', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchend', handleClickOutside)
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
        const allCategories = data
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Do NOT require slug here — local DBs may not have run the slug migration yet.
          // We fall back to UUIDs in URLs until slugs exist.
          setCategories(allCategories)
          setFilteredCategories(allCategories)

          // If localStorage has a selected category that doesn't exist anymore, clear it.
          const savedSlug = localStorage.getItem('burpp_search_category_slug')
          const savedId = localStorage.getItem('burpp_search_category_id')

          if (savedSlug && !allCategories.some((c) => c.slug === savedSlug || c.id === savedSlug)) {
            setSelectedCategory('')
            setSelectedCategoryName('')
            setCategorySearch('')
            localStorage.removeItem('burpp_search_category_slug')
            localStorage.removeItem('burpp_search_category_name')
          } else if (!savedSlug && savedId) {
            // Migration path: convert old saved UUID -> slug if possible
            const match = allCategories.find((c) => c.id === savedId)
            if (match?.slug) {
              setSelectedCategory(match.slug)
              localStorage.setItem('burpp_search_category_slug', match.slug)
              localStorage.removeItem('burpp_search_category_id')
            }
          }
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

    console.log('Searching for location:', query)

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
  const handleCategorySelect = (categorySlug: string, categoryName: string) => {
    setSelectedCategory(categorySlug)
    setSelectedCategoryName(categoryName)
    setCategorySearch(categoryName)
    setIsCategoryOpen(false)
    setHighlightedCategoryIndex(-1)
    localStorage.setItem('burpp_search_category_slug', categorySlug)
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
          handleCategorySelect(category.slug || category.id, category.name)
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
    if (!location) return

    const params = new URLSearchParams()
    if (selectedCategory) {
      params.set('category', selectedCategory)
    }
    params.set('q', location)

    router.push(`/search?${params.toString()}`)
  }

  // Clear location
  const clearLocation = () => {
    setLocation('')
    localStorage.removeItem('burpp_search_location')
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
          const newLocation = locationSuggestions[highlightedIndex].place_name
          setLocation(newLocation)
          localStorage.setItem('burpp_search_location', newLocation)
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
              <div className="flex items-center">
                <LayoutGrid className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <Input
                  ref={categoryInputRef}
                  type="text"
                  placeholder="What gig do you need help with?"
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value)
                    setIsCategoryOpen(true)
                    if (!selectedCategory || e.target.value !== selectedCategoryName) {
                      setSelectedCategory('')
                      setSelectedCategoryName('')
                      localStorage.removeItem('burpp_search_category_slug')
                      localStorage.removeItem('burpp_search_category_name')
                    }
                  }}
                  onFocus={() => setIsCategoryOpen(true)}
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
                    localStorage.removeItem('burpp_search_category_slug')
                    localStorage.removeItem('burpp_search_category_name')
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Desktop Category Dropdown */}
              {isCategoryOpen && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 w-96 z-50 mt-2 bg-white rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={category.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCategorySelect(category.slug || category.id, category.name)
                      }}
                      onMouseEnter={() => setHighlightedCategoryIndex(index)}
                      className={cn(
                        "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-2xl last:rounded-b-2xl transition-colors",
                        highlightedCategoryIndex === index ? "bg-primary text-white" : "hover:bg-primary hover:text-white"
                      )}
                    >
                      <div className="font-medium" style={{ fontSize: '16px' }}>
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
                              const locationText = `${place.text}, ${place.context?.find((c: {id: string; text: string}) => c.id.startsWith('region'))?.text || ''}`
                              setLocation(locationText)
                              localStorage.setItem('burpp_search_location', locationText)
                            }
                          } catch (error) {
                            console.error('Error reverse geocoding:', error)
                          }
                        },
                        (error) => {
                          console.error('Error getting location:', error)
                          // Provide user-friendly error messages
                          if (error.code === 1) {
                            // PERMISSION_DENIED
                            // Don't show error - user chose not to share location
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
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setLocation(suggestion.place_name)
                        localStorage.setItem('burpp_search_location', suggestion.place_name)
                        setIsLocationOpen(false)
                        setHighlightedIndex(-1)
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "w-full px-4 py-3 text-left focus:outline-none flex items-start gap-3 first:rounded-t-2xl last:rounded-b-2xl transition-colors",
                        highlightedIndex === index ? "bg-primary text-white" : "hover:bg-primary hover:text-white"
                      )}
                    >
                      <MapPin className={cn(
                        "mt-0.5 h-4 w-4 flex-shrink-0",
                        highlightedIndex === index ? "text-white" : "text-gray-400"
                      )} />
                      <div>
                        <div className="font-medium text-sm">
                          {highlightText(suggestion.place_name, location)}
                        </div>
                        {suggestion.context && suggestion.context.length > 0 && (
                          <div className={cn(
                            "text-xs",
                            highlightedIndex === index ? "text-white/80" : "text-gray-500"
                          )}>
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
                <div className="flex items-center">
                  <LayoutGrid className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="What gig do you need help with?"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value)
                      setIsCategoryOpen(true)
                      if (!selectedCategory || e.target.value !== selectedCategoryName) {
                        setSelectedCategory('')
                        setSelectedCategoryName('')
                        localStorage.removeItem('burpp_search_category_slug')
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
                      localStorage.removeItem('burpp_search_category_slug')
                      localStorage.removeItem('burpp_search_category_name')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Mobile Category Dropdown */}
              {isCategoryOpen && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={category.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCategorySelect(category.slug || category.id, category.name)
                      }}
                      onMouseEnter={() => setHighlightedCategoryIndex(index)}
                      className={cn(
                        "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors",
                        highlightedCategoryIndex === index ? "bg-primary text-white" : "hover:bg-primary hover:text-white"
                      )}
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
                                const locationText = `${place.text}, ${place.context?.find((c: {id: string; text: string}) => c.id.startsWith('region'))?.text || ''}`
                                setLocation(locationText)
                                localStorage.setItem('burpp_search_location', locationText)
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
                        localStorage.setItem('burpp_search_location', suggestion.place_name)
                        setIsLocationOpen(false)
                        setHighlightedIndex(-1)
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "w-full px-4 py-3 text-left focus:outline-none flex items-start gap-3 first:rounded-t-lg last:rounded-b-lg transition-colors",
                        highlightedIndex === index ? "bg-primary text-white" : "hover:bg-primary hover:text-white"
                      )}
                    >
                      <MapPin className={cn(
                        "mt-0.5 h-4 w-4 flex-shrink-0",
                        highlightedIndex === index ? "text-white" : "text-gray-400"
                      )} />
                      <div>
                        <div className="font-medium text-sm">
                          {highlightText(suggestion.place_name, location)}
                        </div>
                        {suggestion.context && suggestion.context.length > 0 && (
                          <div className={cn(
                            "text-xs",
                            highlightedIndex === index ? "text-white/80" : "text-gray-500"
                          )}>
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
