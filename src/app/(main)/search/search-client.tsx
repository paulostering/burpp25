'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { InfiniteScrollVendors } from '@/components/infinite-scroll-vendors'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import type { VendorProfile } from '@/types/db'
import { getCategories } from '@/lib/categories-cache'

type Category = {
  id: string
  name: string
  icon_url?: string | null
}

export function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [sortBy, setSortBy] = useState<'rating' | 'hourly'>('rating')
  const [categoryName, setCategoryName] = useState<string | undefined>()
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>()

  const categoryParam = searchParams.get('category') || undefined
  const q = searchParams.get('q') || undefined

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      
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

        const response = await fetch(`/api/search-vendors?${params.toString()}`)
        const data = await response.json()
        
        clearTimeout(timeoutId)
        setVendors(data.vendors || [])
        setCount(data.count || 0)
      } catch (error) {
        console.error('Error fetching vendors:', error)
        clearTimeout(timeoutId)
        setVendors([])
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
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
        setCategories(data as Category[])

        if (activeCategoryId) {
          const match = (data as Category[]).find((c) => c.id === activeCategoryId)
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
          {count > 0 && (
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
          )}
        </div>

        {/* Category chips row for filtering */}
        {categories.length > 0 && (
          <div className="mb-6 -mx-4 px-4">
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">
                Popular categories:
              </span>
              <div className="flex gap-3 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isSelected = activeCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const newActive =
                        activeCategoryId === cat.id ? undefined : cat.id
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

