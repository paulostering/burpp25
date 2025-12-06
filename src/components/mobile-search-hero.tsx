'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
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
  const [isOpen, setIsOpen] = useState(false)
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (locationContainerRef.current && !locationContainerRef.current.contains(target)) {
        setIsLocationOpen(false)
      }
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(target)) {
        setIsCategoryOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchend', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchend', handleClickOutside)
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
    setHighlightedCategoryIndex(-1)
  }, [categorySearch, categories])

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
      setHighlightedIndex(-1)
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
    if (!location) {
      toast.error('Please enter a location')
      return
    }

    const params = new URLSearchParams()
    if (selectedCategory) {
      params.set('category', selectedCategory)
    }
    params.set('q', location)

    setIsOpen(false)
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

  const requestGeolocation = () => {
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
              setLocation(locationText)
              localStorage.setItem('burpp_search_location', locationText)
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error)
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

        {/* Search Button to Open Drawer */}
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="top">
          <DrawerTrigger asChild>
            <Button
              size="lg"
              className="w-full max-w-md h-14 rounded-lg bg-white hover:bg-gray-50 text-gray-900 font-semibold text-lg shadow-lg"
            >
              <Search className="h-5 w-5 mr-2" />
              Search Services
            </Button>
          </DrawerTrigger>
          
          <DrawerContent className="max-h-[90vh]">
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle>Search Services</DrawerTitle>
                <DrawerDescription>
                  Find local professionals for any service
                </DrawerDescription>
              </DrawerHeader>
              
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
                          className={`w-full px-4 py-3 text-left focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors ${
                            highlightedCategoryIndex === index ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white'
                          }`}
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
                      onClick={requestGeolocation}
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
              </div>

              <DrawerFooter>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="w-full h-12 text-lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" size="lg" className="w-full h-12">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
        
        {/* Scuba Instructor Tag - Inline */}
        <div className="mt-4 flex items-center mt-16 mb-12">
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
