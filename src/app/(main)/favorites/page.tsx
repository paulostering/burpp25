'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import type { Category } from '@/types/db'

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
    hourly_rate: number
    service_categories: string[]
    offers_virtual_services: boolean
    offers_in_person_services: boolean
  } | null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
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
        // Load categories first
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('id, name, icon_url')

        setCategories((categoriesData as Category[]) || [])

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
      } catch (error) {
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
        return
      }

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
    } catch (error) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Favorites</h1>
            <p className="text-gray-600">Vendors you've saved for later</p>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


