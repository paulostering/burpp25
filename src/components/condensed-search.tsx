'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X, LayoutGrid } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { getCategories } from '@/lib/categories-cache'
import { toast } from 'sonner'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

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
  const [isMobile, setIsMobile] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1)
  const hasAttemptedGeolocation = useRef(false)
  const hasLoadedFromStorage = useRef(false)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const categoryContainerRef = useRef<HTMLDivElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
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
        
        // Only update state if component is still mounted
        if (isMounted) {
          setCategories(data)
          setFilteredCategories(data)
        }
      } catch {
        // Silently fail if categories can't be loaded
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
              localStorage.setItem('burpp_search_location', locationText)
            }
          } catch {
            // Silently fail if reverse geocoding fails
          }
        },
        (error) => {
          // Silently fail if user denies or error occurs
          console.log('Geolocation error:', error.code)
        }
      )
    }
  }, [])

  // Handle location search with debounce
  const handleLocationSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 3) {
      setLocationSuggestions([])
      setHighlightedIndex(-1)
      return
    }

    // Debounce the API call
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,neighborhood,postcode&country=us`
        )
        const data = await response.json()
        setLocationSuggestions(data.features || [])
        setHighlightedIndex(-1) // Reset highlighted index when new suggestions arrive
      } catch {
        // Silently fail if location suggestions can't be loaded
      }
    }, 300) // 300ms debounce
  }, [])

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
  const handleCategorySelect = useCallback((categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId)
    setSelectedCategoryName(categoryName)
    setCategorySearch(categoryName)
    setIsCategoryOpen(false)
    setHighlightedCategoryIndex(-1)
    localStorage.setItem('burpp_search_category_id', categoryId)
    localStorage.setItem('burpp_search_category_name', categoryName)
  }, [])

  // Handle keyboard navigation for category suggestions
  const handleCategoryKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
  }, [isCategoryOpen, filteredCategories, highlightedCategoryIndex, handleCategorySelect])

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation('')
    localStorage.removeItem('burpp_search_location')
    setIsLocationOpen(false)
    setHighlightedIndex(-1)
  }, [])

  // Handle keyboard navigation for location suggestions
  const handleLocationKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
  }, [isLocationOpen, locationSuggestions, highlightedIndex])

  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    if (!location) return

    const params = new URLSearchParams()
    if (selectedCategory) {
      params.set('category', selectedCategory)
    }
    params.set('q', location)

    router.push(`/search?${params.toString()}`)
    
    // Close drawer on mobile after search
    if (isMobile) {
      setIsDrawerOpen(false)
    }
  }, [selectedCategory, location, router, isMobile])

  // Search form component for desktop
  const searchForm = useMemo(() => (
    <div className="relative w-full">
      {/* Unified Search Field */}
      <div className="hidden md:flex items-center bg-white border-2 border-gray-200 rounded-lg pl-5 pr-3 py-2.5 h-14 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
        {/* Category Section */}
        <div className="flex-1 min-w-0 relative" ref={categoryContainerRef}>
          <div className="flex items-center">
            <LayoutGrid className="h-4 w-4 text-gray-500 mr-3 flex-shrink-0" />
            <Input
              ref={categoryInputRef}
              type="text"
              placeholder="What are you looking for?"
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
              onFocus={() => setIsCategoryOpen(true)}
              onKeyDown={handleCategoryKeyDown}
              className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 text-base font-medium text-gray-900 placeholder:text-gray-500 placeholder:font-normal pr-6"
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
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Category Dropdown */}
          {isCategoryOpen && filteredCategories.length > 0 && (
            <div className={cn(
              "absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto",
              isMobile ? "w-full" : "w-96"
            )}>
              {filteredCategories.map((category, index) => (
                <button
                  key={category.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleCategorySelect(category.id, category.name)
                  }}
                  onMouseEnter={() => setHighlightedCategoryIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-xl last:rounded-b-xl transition-colors",
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
                      } catch {
                        // Silently fail if reverse geocoding fails
                      }
                    },
                    (error) => {
                      console.error('Error getting location:', error)
                      // Provide user-friendly error messages
                      if (error.code === 2) {
                        // POSITION_UNAVAILABLE
                        toast.error('Location unavailable. Please enter your location manually.')
                      } else if (error.code === 3) {
                        // TIMEOUT
                        toast.error('Location request timed out. Please try again or enter manually.')
                      }
                      // code 1 (PERMISSION_DENIED) - silently fail as user chose not to share
                    }
                  )
                }
              }}
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <MapPin className="h-4 w-4" />
            </button>
            <Input
              ref={locationInputRef}
              type="text"
              placeholder="Near"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                handleLocationSearch(e.target.value)
              }}
              onFocus={() => setIsLocationOpen(true)}
              onKeyDown={handleLocationKeyDown}
              className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 focus:ring-0 focus:outline-none text-base font-medium text-gray-900 placeholder:text-gray-500 placeholder:font-normal pr-6"
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
            <div className={cn(
              "absolute top-full right-0 z-50 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto",
              isMobile ? "w-full" : "w-96"
            )}>
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
                    "w-full px-4 py-3 text-left focus:outline-none flex items-start gap-3 first:rounded-t-xl last:rounded-b-xl transition-colors",
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
                        {suggestion.context.map((c) => c.text).join(', ')}
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
          onClick={handleSearchSubmit}
          disabled={!location}
          size="lg"
          className="ml-3 h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm font-semibold"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Stacked Layout */}
      <div className="md:hidden space-y-3">
        {/* Row 1: Category */}
        <div className="relative">
          <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
            <div className="flex items-center">
              <LayoutGrid className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
              <Input
                ref={categoryInputRef}
                type="text"
                placeholder="What are you looking for?"
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
                className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-medium text-gray-900 placeholder:text-gray-500 pr-8"
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
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {filteredCategories.map((category, index) => (
                <button
                  key={category.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleCategorySelect(category.id, category.name)
                  }}
                  onMouseEnter={() => setHighlightedCategoryIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-xl last:rounded-b-xl transition-colors",
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
        <div className="relative">
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
                        } catch {
                          // Silently fail if reverse geocoding fails
                        }
                      },
                      (error) => {
                        console.error('Error getting location:', error)
                        if (error.code === 2) {
                          toast.error('Location unavailable. Please enter your location manually.')
                        } else if (error.code === 3) {
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
                placeholder="Near"
                value={location}
                onChange={(e) => handleLocationSearch(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-medium text-gray-900 placeholder:text-gray-500 pr-8"
              />
            </div>
            {location && (
              <button
                onClick={clearLocation}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location Dropdown */}
          {isLocationOpen && locationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto">
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
                    "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-xl last:rounded-b-xl transition-colors flex items-start gap-3",
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
                        {suggestion.context.map((c) => c.text).join(', ')}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Search Button */}
        <Button
          onClick={handleSearchSubmit}
          disabled={!location}
          size="lg"
          className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>
    </div>
  ), [
    categorySearch,
    selectedCategory,
    selectedCategoryName,
    isCategoryOpen,
    filteredCategories,
    location,
    isLocationOpen,
    locationSuggestions,
    isMobile,
    highlightedIndex,
    highlightedCategoryIndex,
    handleCategorySelect,
    handleCategoryKeyDown,
    highlightText,
    handleLocationSearch,
    handleLocationKeyDown,
    clearLocation,
    handleSearchSubmit
  ])

  return (
    <div className="relative w-full max-w-4xl">
      {isMobile ? (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="top">
          <DrawerTrigger asChild>
            <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-md transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </div>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh]">
            <div className="mx-auto w-full max-w-md">
              <VisuallyHidden>
                <DrawerTitle>Search Services</DrawerTitle>
              </VisuallyHidden>
              
              <div className="p-4 space-y-4">
                {/* Category Field */}
                <div className="relative" ref={categoryContainerRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                          localStorage.removeItem('burpp_search_category_id')
                          localStorage.removeItem('burpp_search_category_name')
                        }
                      }}
                      onFocus={() => setIsCategoryOpen(true)}
                      onKeyDown={handleCategoryKeyDown}
                      className="pl-10 pr-10 h-12 text-base"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearch('')
                          setSelectedCategory('')
                          setSelectedCategoryName('')
                          localStorage.removeItem('burpp_search_category_id')
                          localStorage.removeItem('burpp_search_category_name')
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Category Dropdown */}
                  {isCategoryOpen && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCategories.map((category, index) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category.id, category.name)}
                          onMouseEnter={() => setHighlightedCategoryIndex(index)}
                          className={cn(
                            "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors",
                            highlightedCategoryIndex === index ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white'
                          )}
                        >
                          <div className="font-medium">
                            {highlightText(category.name, categorySearch)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Field */}
                <div className="relative" ref={locationContainerRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <button
                      type="button"
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
                              } catch {
                                // Silently fail if reverse geocoding fails
                              }
                            },
                            (error) => {
                              console.error('Error getting location:', error)
                              if (error.code === 2) {
                                toast.error('Location unavailable. Please enter your location manually.')
                              } else if (error.code === 3) {
                                toast.error('Location request timed out. Please try again or enter manually.')
                              }
                            }
                          )
                        }
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <MapPin className="h-5 w-5" />
                    </button>
                    <Input
                      ref={locationInputRef}
                      type="text"
                      placeholder="Enter your location"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value)
                        handleLocationSearch(e.target.value)
                      }}
                      onFocus={() => setIsLocationOpen(true)}
                      onKeyDown={handleLocationKeyDown}
                      className="pl-10 pr-10 h-12 text-base"
                    />
                    {location && (
                      <button
                        type="button"
                        onClick={clearLocation}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Location Suggestions Dropdown */}
                  {isLocationOpen && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setLocation(suggestion.place_name)
                            localStorage.setItem('burpp_search_location', suggestion.place_name)
                            setIsLocationOpen(false)
                            setHighlightedIndex(-1)
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={cn(
                            "w-full px-4 py-3 text-left focus:outline-none flex items-start gap-3 first:rounded-t-lg last:rounded-b-lg transition-colors",
                            highlightedIndex === index ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white'
                          )}
                        >
                          <MapPin className={cn(
                            "mt-0.5 h-4 w-4 flex-shrink-0",
                            highlightedIndex === index ? 'text-white' : 'text-gray-400'
                          )} />
                          <div>
                            <div className="font-medium text-sm">
                              {highlightText(suggestion.place_name, location)}
                            </div>
                            {suggestion.context && suggestion.context.length > 0 && (
                              <div className={cn(
                                "text-xs",
                                highlightedIndex === index ? 'text-white/80' : 'text-gray-500'
                              )}>
                                {suggestion.context.map((c) => c.text).join(', ')}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DrawerFooter>
                <Button
                  onClick={handleSearchSubmit}
                  size="lg"
                  className="w-full h-12 text-lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        searchForm
      )}
    </div>
  )
}
