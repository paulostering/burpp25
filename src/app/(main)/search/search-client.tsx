'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { InfiniteScrollVendors } from '@/components/infinite-scroll-vendors'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import type { VendorProfile } from '@/types/db'

export function SearchClient() {
  const searchParams = useSearchParams()
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  const category = searchParams.get('category') || undefined
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
      }, 5000) // 5 second timeout on client side
      
      try {
        const params = new URLSearchParams()
        if (category) params.set('category', category)
        if (q) params.set('q', q)
        
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
  }, [category, q])

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
        {/* Search Results Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {count > 0 
              ? `${count} professional${count === 1 ? '' : 's'} found` 
              : 'No professionals found'
            }
          </h1>
          {q && count > 0 && (
            <p className="text-muted-foreground text-lg">
              Showing vendors who service "{q}" based on their service radius
            </p>
          )}
          {count === 0 && q && (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg text-gray-700 mb-2">
                We couldn't find any professionals serving <strong>"{q}"</strong> in this category.
              </p>
              <p className="text-gray-600">
                Try searching in a different location or browse all professionals in this category.
              </p>
            </div>
          )}
        </div>

        {/* Vendor Results */}
        {count > 0 && (
          <InfiniteScrollVendors
            initialVendors={vendors}
            searchParams={{ category, q }}
          />
        )}
      </div>
    </div>
  )
}

