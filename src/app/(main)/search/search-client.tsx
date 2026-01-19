'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { InfiniteScrollVendors } from '@/components/infinite-scroll-vendors'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import type { VendorProfile } from '@/types/db'
import { getCategories } from '@/lib/categories-cache'
import type { Category } from '@/types/db'
import { createClient } from '@/lib/supabase/client'

export function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [sortBy, setSortBy] = useState<'rating' | 'hourly'>('rating')
  const [categoryName, setCategoryName] = useState<string | undefined>()
  const [categories, setCategories] = useState<Category[]>([])
  const [shouldRender, setShouldRender] = useState(false)

  // Redirect to /pros if registration is disabled
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'user_registration_enabled')
          .single()

        let registrationEnabled = true
        if (data) {
          const value = data.setting_value
          if (typeof value === 'boolean') {
            registrationEnabled = value
          } else if (typeof value === 'string') {
            registrationEnabled = value.toLowerCase().replace(/"/g, '') === 'true'
          }
        }

        if (!registrationEnabled) {
          router.replace('/pros')
          return
        }
        
        setShouldRender(true)
      } catch (error) {
        setShouldRender(true)
      }
    }

    checkAndRedirect()
  }, [router])

  const categoryParam = searchParams.get('category') || undefined
  const q = searchParams.get('q') || undefined

  // Initialize from URL to avoid an initial "unfiltered" fetch that causes flicker.
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(() => categoryParam)
  const lastSearchKeyRef = useRef<string | null>(null)

  // Prevent "flash of old results" when URL params change by clearing results
  // before the browser paints the next frame.
  useLayoutEffect(() => {
    const key = `${categoryParam ?? ''}|${q ?? ''}`
    if (lastSearchKeyRef.current === null) {
      lastSearchKeyRef.current = key
      return
    }
    if (lastSearchKeyRef.current !== key) {
      lastSearchKeyRef.current = key
      setLoading(true)
      setVendors([])
      setCount(0)
    }
  }, [categoryParam, q])

  useEffect(() => {
    let isStale = false
    const fetchVendors = async () => {
      setLoading(true)
      setVendors([]) // Clear vendors immediately when search changes
      setCount(0)
      
      // Set a timeout to show results even if API is slow
      const timeoutId = setTimeout(() => {
        console.log('Search taking too long, showing empty results')
        setLoading(false)
        setVendors([])
        setCount(0)
      }, 30000) // 30 second timeout on client side
      
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (activeCategoryId) params.set('category', activeCategoryId)
        // Add timestamp to prevent caching and bypass geocoding cache for fresh results
        params.set('_t', Date.now().toString())
        params.set('bypass_cache', 'true') // Bypass geocoding cache to get fresh coordinates

        const response = await fetch(`/api/search-vendors?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        const data = await response.json()
        
        clearTimeout(timeoutId)
        if (!isStale) {
          setVendors(data.vendors || [])
          setCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching vendors:', error)
        clearTimeout(timeoutId)
        if (!isStale) {
          setVendors([])
          setCount(0)
        }
      } finally {
        if (!isStale) {
          setLoading(false)
        }
      }
    }

    fetchVendors()

    return () => {
      isStale = true
    }
  }, [activeCategoryId, q])

  // Sync active category with URL param
  useEffect(() => {
    setActiveCategoryId(categoryParam || undefined)
  }, [categoryParam])

  // Load categories and resolve category id to human-readable name for header
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        const parentCategories = data.filter((c) => !c.parent_id)
        setCategories(parentCategories)

        if (activeCategoryId) {
          const match = data.find((c) => c.id === activeCategoryId || c.slug === activeCategoryId)
          setCategoryName(match?.name)
        } else {
          setCategoryName(undefined)
        }
      } catch {
        setCategoryName(undefined)
      }
    }

    loadCategories()
  }, [activeCategoryId])

  // Don't render anything until registration check completes
  if (!shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Search Results Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Vendor Results Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-sm">
                {/* Image Skeleton */}
                <Skeleton className="aspect-square w-full" />
                
                {/* Content Skeleton */}
                <div className="p-4 space-y-2">
                  {/* Business Name */}
                  <Skeleton className="h-5 w-3/4" />
                  
                  {/* Reviews */}
                  <Skeleton className="h-4 w-1/2" />
                  
                  {/* Rate */}
                  <Skeleton className="h-4 w-2/3" />
                  
                  {/* Badge */}
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search Results Header + Sort */}
        {count > 0 ? (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {/* Small label line (category / count) */}
              <p className="text-xs md:text-sm text-gray-700 mb-1">
                {categoryName || (q ? 'Search results' : 'Browse professionals')}
              </p>

              {/* Main heading inspired by Figma header */}
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">
                {categoryName && q
                  ? `Best ${categoryName} Pros Near ${q}`
                  : q
                    ? `Best Pros Near ${q}`
                    : 'Find the best pros near you'}
              </h1>
            </div>

            {/* Sort controls (Rating, Hourly rate) */}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="hidden md:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'hourly')}
                className="bg-transparent px-1 py-1 text-sm font-semibold shadow-none focus:outline-none focus:ring-0 border-none"
              >
                <option value="rating">Rating</option>
                <option value="hourly">Hourly rate</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="mb-8 py-12">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4">
              No Burpp Pros available in your area…yet
            </h1>
            <p className="text-lg text-muted-foreground">
              We couldn't find any providers for your search. Please try expanding your radius or check back soon as new pros join regularly.
            </p>
          </div>
        )}

        {/* Category chips row for filtering */}
        {categories.length > 0 && (
          <div className="mb-6 -mx-4 px-4">
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">
                Popular categories:
              </span>
              <div className="flex gap-3 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isSelected =
                  activeCategoryId === cat.slug || activeCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const slug = cat.slug || cat.id
                      const newActive =
                        activeCategoryId === slug ? undefined : slug
                      setActiveCategoryId(newActive)

                      const params = new URLSearchParams(window.location.search)
                      if (q) {
                        params.set('q', q)
                      }
                      if (newActive) {
                        params.set('category', newActive)
                      } else {
                        params.delete('category')
                      }
                      router.push(`/search?${params.toString()}`, { scroll: false })
                    }}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-gray-200 text-gray-700 bg-white hover:border-primary/60 hover:text-primary'
                    }`}
                  >
                    {cat.icon_url && (
                      <div className="relative h-5 w-5">
                        <Image
                          src={cat.icon_url}
                          alt={cat.name}
                          fill
                          sizes="20px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span>{cat.name}</span>
                  </button>
                )
              })}
              </div>
            </div>
          </div>
        )}

        {/* Vendor Results */}
        {count > 0 && (
          <InfiniteScrollVendors
            initialVendors={vendors}
            searchParams={{ category: activeCategoryId, q }}
            sortBy={sortBy}
          />
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

