'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const categoryContainerRef = useRef<HTMLDivElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Removed automatic geolocation - only request on user gesture

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
        <span key={index} className="bg-yellow-200 font-semibold">
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
  }, [isLocationOpen, locationSuggestions, highlightedIndex])

  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    if (!selectedCategory || !location) return

    const params = new URLSearchParams()
    params.set('category', selectedCategory)
    params.set('q', location)

    router.push(`/search?${params.toString()}`)
    
    // Close sheet on mobile after search
    if (isMobile) {
      setIsSheetOpen(false)
    }
  }, [selectedCategory, location, router, isMobile])

  // Search form component (reusable for both desktop and mobile)
  const searchForm = useMemo(() => (
    <div className="relative w-full">
      {/* Unified Search Field */}
      <div className="flex items-center bg-white border border-gray-200 rounded-md pl-4 pr-2 py-1 h-10">
        {/* Category Section */}
        <div className="flex-1 min-w-0 relative" ref={categoryContainerRef}>
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
              }
            }}
            onFocus={() => setIsCategoryOpen(true)}
            onKeyDown={handleCategoryKeyDown}
            className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 text-sm text-gray-600 placeholder:text-gray-400 pr-6"
          />
          {categorySearch && (
            <button
              onClick={() => {
                setCategorySearch('')
                setSelectedCategory('')
                setSelectedCategoryName('')
              }}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          {/* Category Dropdown */}
          {isCategoryOpen && filteredCategories.length > 0 && (
            <div className={cn(
              "absolute top-full left-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto",
              isMobile ? "w-full" : "w-96"
            )}>
              {filteredCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id, category.name)}
                  onMouseEnter={() => setHighlightedCategoryIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 text-left focus:outline-none first:rounded-t-2xl last:rounded-b-2xl transition-colors",
                    highlightedCategoryIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
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
              className="mr-2 text-gray-400 hover:text-gray-600"
            >
              <MapPin className="h-3 w-3" />
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
              className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 focus:ring-0 focus:outline-none text-sm text-gray-600 placeholder:text-gray-400 pr-6"
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

          {/* Location Suggestions Dropdown */}
          {isLocationOpen && locationSuggestions.length > 0 && (
            <div className={cn(
              "absolute top-full right-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto",
              isMobile ? "w-full" : "w-96"
            )}>
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
                  className={cn(
                    "w-full px-4 py-3 text-left focus:outline-none flex items-start gap-3 first:rounded-t-2xl last:rounded-b-2xl transition-colors",
                    highlightedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">
                      {highlightText(suggestion.place_name, location)}
                    </div>
                    {suggestion.context && suggestion.context.length > 0 && (
                      <div className="text-xs text-gray-500">
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
          disabled={!selectedCategory || !location}
          size="sm"
          className="ml-3 h-6 w-6 p-0 rounded-full bg-primary hover:bg-primary/90"
        >
          <Search className="h-3 w-3" />
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
                {searchForm}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        searchForm
      )}
    </div>
  )
}
