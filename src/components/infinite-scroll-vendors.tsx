'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { VendorProfile } from "@/types/db"
import { createClient } from "@/lib/supabase/client"

interface VendorWithReviews extends VendorProfile {
  averageRating?: number
  totalReviews?: number
}

interface InfiniteScrollVendorsProps {
  initialVendors: VendorProfile[]
  searchParams: {
    category?: string
    q?: string
  }
}

const VENDORS_PER_PAGE = 12

export function InfiniteScrollVendors({ initialVendors, searchParams }: InfiniteScrollVendorsProps) {
  const [vendors, setVendors] = useState<VendorWithReviews[]>(initialVendors)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialVendors.length === VENDORS_PER_PAGE)
  const [page, setPage] = useState(1)
  const supabase = createClient()

  // Fetch review stats for vendors
  useEffect(() => {
    const fetchReviewStats = async () => {
      const vendorIds = vendors.map(v => v.id)
      if (vendorIds.length === 0) return

      const { data: reviews } = await supabase
        .from('reviews')
        .select('vendor_id, rating')
        .in('vendor_id', vendorIds)
        .eq('approved', true)

      if (reviews) {
        // Calculate stats for each vendor
        const statsMap = new Map<string, { totalReviews: number; averageRating: number }>()
        
        reviews.forEach(review => {
          const existing = statsMap.get(review.vendor_id) || { totalReviews: 0, averageRating: 0 }
          existing.totalReviews += 1
          existing.averageRating += review.rating
          statsMap.set(review.vendor_id, existing)
        })

        // Calculate averages
        statsMap.forEach((stats, vendorId) => {
          stats.averageRating = stats.averageRating / stats.totalReviews
        })

        // Update vendors with review stats
        setVendors(prevVendors => 
          prevVendors.map(vendor => ({
            ...vendor,
            totalReviews: statsMap.get(vendor.id)?.totalReviews || 0,
            averageRating: statsMap.get(vendor.id)?.averageRating || 0
          }))
        )
      }
    }

    fetchReviewStats()
  }, [vendors.length, supabase]) // Only refetch when vendors list changes

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: VENDORS_PER_PAGE.toString(),
        ...(searchParams.category && { category: searchParams.category }),
        ...(searchParams.q && { q: searchParams.q }),
      })

      const response = await fetch(`/api/search-vendors?${params.toString()}`)
      const data = await response.json()

      if (data.vendors && data.vendors.length > 0) {
        setVendors(prev => [...prev, ...data.vendors])
        setPage(prev => prev + 1)
        setHasMore(data.vendors.length === VENDORS_PER_PAGE)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more vendors:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, searchParams])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById('scroll-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, loading])

  if (!vendors?.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No professionals found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or expanding your search radius.
          </p>
          <Button onClick={() => window.history.back()}>
            Adjust Search
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-0 shadow-sm cursor-pointer h-full">
              {/* Image */}
              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                {vendor.profile_photo_url ? (
                  <Image
                    src={vendor.profile_photo_url}
                    alt={vendor.business_name || "Vendor"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl font-semibold text-muted-foreground">
                    {vendor.business_name?.[0] ?? "V"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                {/* Business Name */}
                <h3 className="font-semibold text-base leading-tight line-clamp-1 text-gray-900">
                  {vendor.business_name}
                </h3>

                {/* Reviews */}
                {vendor.totalReviews && vendor.totalReviews > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-900 ml-1">
                        {vendor.averageRating?.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({vendor.totalReviews} {vendor.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No reviews yet
                  </div>
                )}

                {/* Rate */}
                {typeof vendor.hourly_rate === "number" && (
                  <div className="text-sm text-primary font-medium">
                    From ${vendor.hourly_rate} / hour
                  </div>
                )}

                {/* Service Type Badge */}
                <div>
                  {vendor.offers_virtual_services && !vendor.offers_in_person_services && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                      🔮 Virtual
                    </Badge>
                  )}
                  {vendor.offers_in_person_services && !vendor.offers_virtual_services && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                      👤 In-Person
                    </Badge>
                  )}
                  {vendor.offers_virtual_services && vendor.offers_in_person_services && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                      🔮 Virtual
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Loading indicator and scroll sentinel */}
      {hasMore && (
        <div id="scroll-sentinel" className="flex justify-center py-8">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      )}

    </>
  )
}
