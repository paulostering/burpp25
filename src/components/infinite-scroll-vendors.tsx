'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, CircleDollarSign } from "lucide-react"
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
  sortBy?: 'rating' | 'hourly'
}

const VENDORS_PER_PAGE = 12

function sortVendors(vendors: VendorWithReviews[], sortBy?: 'rating' | 'hourly') {
  const list = [...vendors]

  if (sortBy === 'rating') {
    return list.sort((a, b) => {
      const ratingA = a.averageRating || 0
      const ratingB = b.averageRating || 0

      // Higher rating first; if equal rating, more reviews first
      if (ratingB !== ratingA) return ratingB - ratingA
      const reviewsA = a.totalReviews || 0
      const reviewsB = b.totalReviews || 0
      return reviewsB - reviewsA
    })
  }

  if (sortBy === 'hourly') {
    return list.sort((a, b) => {
      const rateA = typeof a.hourly_rate === 'number' ? a.hourly_rate : Number.POSITIVE_INFINITY
      const rateB = typeof b.hourly_rate === 'number' ? b.hourly_rate : Number.POSITIVE_INFINITY
      return rateA - rateB
    })
  }

  return list
}

export function InfiniteScrollVendors({ initialVendors, searchParams, sortBy }: InfiniteScrollVendorsProps) {
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

  const displayedVendors = useMemo(
    () => sortVendors(vendors, sortBy),
    [vendors, sortBy]
  )

  if (!displayedVendors?.length) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {displayedVendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
            <Card className="overflow-hidden border border-neutral-200 shadow-none cursor-pointer h-full bg-white pt-0">
              {/* Image */}
              <div className="relative h-[200px] w-full bg-neutral-100 overflow-hidden">
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
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted-foreground">
                    {vendor.business_name?.[0] ?? "V"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="bg-white px-5 py-4 space-y-3">
                {/* Business Name */}
                <h3 className="font-semibold text-lg leading-tight line-clamp-1 text-black">
                  {vendor.business_name}
                </h3>

                {/* Reviews */}
                <div className="flex items-center gap-3">
                  {/* Star Icons */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const rating = vendor.averageRating || 0
                      const hasReviews = !!vendor.totalReviews && vendor.totalReviews > 0
                      const isFilled = hasReviews && starIndex <= Math.round(rating)

                      let containerClass = "flex h-7 w-7 items-center justify-center rounded-md"
                      let iconClass = "h-4 w-4"

                      if (!hasReviews) {
                        containerClass += " bg-gray-200"
                        iconClass += " text-gray-400"
                      } else if (isFilled) {
                        containerClass += " bg-[#5C3CD7]"
                        iconClass += " text-white"
                      } else {
                        containerClass += " bg-[#E5DDFD]"
                        iconClass += " text-[#5C3CD7]"
                      }

                      return (
                        <div key={starIndex} className={containerClass}>
                          <Star className={iconClass} />
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Rating and Review Count */}
                  {vendor.totalReviews && vendor.totalReviews > 0 ? (
                    <span className="text-xs text-black">
                      {vendor.averageRating?.toFixed(1)} ({vendor.totalReviews} {vendor.totalReviews === 1 ? 'Review' : 'Reviews'})
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">No reviews</span>
                  )}
                </div>

                {/* In-person radius / location */}
                {vendor.offers_in_person_services && vendor.zip_code && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-black" />
                    <p className="text-sm text-black">
                      <span>In Person Up to </span>
                      <span className="font-semibold">
                        {vendor.service_radius ?? 0}
                      </span>
                      <span> miles From </span>
                      <span className="font-semibold">
                        {vendor.zip_code}
                      </span>
                    </p>
                  </div>
                )}

                {/* Rate line */}
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-black" />
                  <p className="text-sm text-black">
                    <span>Rates starting from </span>
                    {typeof vendor.hourly_rate === "number" ? (
                      <span className="font-semibold">
                        ${vendor.hourly_rate.toFixed(2)} /hr
                      </span>
                    ) : (
                      <span className="font-semibold">
                        Contact for rates
                      </span>
                    )}
                  </p>
                </div>

                {/* Service Type Badge */}
                <div>
                  {vendor.offers_virtual_services && !vendor.offers_in_person_services && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                      🔮 Virtual
                    </Badge>
                  )}
                  {vendor.offers_virtual_services && vendor.offers_in_person_services && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                      🔮 Virtual &amp; In-Person
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
