'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, MapPin, CircleDollarSign, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

interface FavoriteVendor {
  id: string
  vendor_id: string
  created_at: string
  vendor_profiles: {
    id: string
    business_name: string
    profile_title: string
    profile_photo_url: string
    zip_code: string
    hourly_rate: number | null
    service_radius: number | null
    averageRating?: number
    totalReviews?: number
    service_categories: string[]
    offers_virtual_services: boolean
    offers_in_person_services: boolean
  } | null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) {
      return
    }

    const loadFavorites = async () => {
      setIsLoading(true)

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoading(false)
        setHasError(true)
      }, 10000) // 10 second timeout
      
      try {

        // Fetch favorites via API endpoint to handle RLS issues
        const response = await fetch('/api/favorites', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          setFavorites([])
          setHasError(true)
          return
        }

        const data: FavoriteVendor[] = await response.json()

        setFavorites(data || [])
      } catch {
        setFavorites([])
        setHasError(true)
        toast.error('Failed to load favorites')
      } finally {
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [user, supabase])

  // Load review stats for favorited vendors to match search card styling
  useEffect(() => {
    const loadReviewStats = async () => {
      const vendorIds = favorites
        .map((fav) => fav.vendor_profiles?.id)
        .filter((id): id is string => Boolean(id))

      if (vendorIds.length === 0) return

      const { data: reviews } = await supabase
        .from('reviews')
        .select('vendor_id, rating')
        .in('vendor_id', vendorIds)
        .eq('approved', true)

      if (!reviews) return

      const statsMap = new Map<string, { totalReviews: number; averageRating: number }>()

      reviews.forEach((review) => {
        const existing = statsMap.get(review.vendor_id) || { totalReviews: 0, averageRating: 0 }
        existing.totalReviews += 1
        existing.averageRating += review.rating
        statsMap.set(review.vendor_id, existing)
      })

      statsMap.forEach((stats, vendorId) => {
        stats.averageRating = stats.averageRating / stats.totalReviews
        statsMap.set(vendorId, stats)
      })

      setFavorites((prev) =>
        prev.map((fav) => {
          const vendor = fav.vendor_profiles
          if (!vendor) return fav
          const stats = statsMap.get(vendor.id)
          if (!stats) return fav

          return {
            ...fav,
            vendor_profiles: {
              ...vendor,
              totalReviews: stats.totalReviews,
              averageRating: stats.averageRating,
            },
          }
        })
      )
    }

    loadReviewStats()
  }, [favorites.length, supabase])

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_vendor_favorites')
        .delete()
        .eq('id', favoriteId)

      if (error) {
        // Check if the error is due to table not existing
        if (error.message?.includes('Could not find the table') ||
            error.code === 'PGRST205') {
          toast.error('Favorites feature is not available')
          return
        }
        toast.error('Failed to remove favorite')
        return
      }

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
      toast.success('Removed from favorites')
    } catch {
      toast.error('Failed to remove favorite')
    }
  }


  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header - match search page container/typography */}
        <div className="mb-8 flex flex-col gap-1">
          <p className="text-xs md:text-sm text-gray-700">Favorites</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">
            My Saved Pros
          </h1>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : hasError ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 mx-auto mb-4 text-red-500">⚠️</div>
            <h2 className="text-lg font-medium mb-2">Failed to load favorites</h2>
            <p className="text-gray-600 mb-4">There was an error loading your favorites. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-medium mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-4">Start favoriting vendors to see them here</p>
            <Button asChild>
              <Link href="/search">Browse Vendors</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {favorites.map((favorite) => {
              const vendor = favorite.vendor_profiles
              if (!vendor) {
                // Show a placeholder card for debugging
                return (
                  <Card key={favorite.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg text-red-600">Missing Vendor Data</h3>
                        <p className="text-sm text-red-500">Favorite ID: {favorite.id}</p>
                        <p className="text-sm text-red-500">Vendor ID: {favorite.vendor_id}</p>
                        <p className="text-xs text-gray-500 mt-2">This vendor profile may have been deleted or is blocked by access policies.</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <div key={favorite.id} className="relative">
                  {/* Remove from favorites button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-600 bg-white/80 hover:bg-white/90 rounded-full shadow-sm"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>

                  <Link href={`/vendor/${vendor.id}`}>
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

                        {/* Reviews - match search result style */}
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


