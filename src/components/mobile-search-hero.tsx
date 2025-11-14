'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X, ChevronLeft } from 'lucide-react'
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
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [modalCategorySearch, setModalCategorySearch] = useState<string>('')
  const [filteredModalCategories, setFilteredModalCategories] = useState<Category[]>([])
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [userLocation, setUserLocation] = useState<string>('')
  const locationInputRef = useRef<HTMLInputElement>(null)
  const locationContainerRef = useRef<HTMLDivElement>(null)
  const modalSearchInputRef = useRef<HTMLInputElement>(null)

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationContainerRef.current && !locationContainerRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false)
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

  // Filter modal categories based on search
  useEffect(() => {
    if (!modalCategorySearch) {
      setFilteredModalCategories(categories)
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(modalCategorySearch.toLowerCase())
      )
      setFilteredModalCategories(filtered)
    }
  }, [modalCategorySearch, categories])

  // Initialize modal categories when modal opens
  useEffect(() => {
    if (isCategoryModalOpen) {
      setFilteredModalCategories(categories)
      setModalCategorySearch('')
      setTimeout(() => {
        modalSearchInputRef.current?.focus()
      }, 100)
    }
  }, [isCategoryModalOpen, categories])

  // Removed automatic geolocation - only request on user gesture

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
    setIsCategoryModalOpen(false)
  }

  // Open category modal
  const openCategoryModal = () => {
    setIsCategoryModalOpen(true)
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
            <div className="relative">
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
                  onClick={openCategoryModal}
                  onFocus={openCategoryModal}
                  readOnly
                  className="border-0 p-0 h-auto shadow-none bg-transparent focus-visible:ring-0 font-semibold text-gray-700 placeholder:text-gray-500 pr-8 cursor-pointer"
                  style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
                />
                {categorySearch && (
                  <button
                    onClick={() => {
                      setCategorySearch('')
                      setSelectedCategory('')
                      setSelectedCategoryName('')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
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
                        highlightedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
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

      {/* Category Selection Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="h-6 w-6 mr-1" />
                Back
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Select Category</h2>
              <div className="w-16" />
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  ref={modalSearchInputRef}
                  type="text"
                  placeholder="Search categories..."
                  value={modalCategorySearch}
                  onChange={(e) => setModalCategorySearch(e.target.value)}
                  className="pl-10 pr-4 py-3 text-base border-gray-300 focus:border-primary focus:ring-primary"
                  style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}
                />
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto">
              {filteredModalCategories.length > 0 ? (
                <div className="p-4">
                  {filteredModalCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id, category.name)}
                      className="w-full px-4 py-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-base text-gray-900">
                        {highlightText(category.name, modalCategorySearch)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Search className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No categories found</p>
                  <p className="text-sm">Try searching for something else</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
