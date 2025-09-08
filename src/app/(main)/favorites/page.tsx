'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { User } from '@supabase/supabase-js'
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
  }[] | null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  useEffect(() => {
    if (!user) return

    const loadFavorites = async () => {
      setIsLoading(true)
      
      try {
        // Load categories first
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, icon_url')

        setCategories((categoriesData as Category[]) || [])

        // Load favorites with vendor data
        const { data, error } = await supabase
          .from('user_vendor_favorites')
          .select(`
            id,
            vendor_id,
            created_at,
            vendor_profiles (
              id,
              business_name,
              profile_title,
              profile_photo_url,
              zip_code,
              hourly_rate,
              service_categories
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading favorites:', error)
          return
        }

        setFavorites(data || [])
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
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
        console.error('Error removing favorite:', error)
        return
      }

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getVendorCategories = (categoryIds: string[]) => {
    return categoryIds?.map(id => 
      categories.find(cat => cat.id === id)?.name
    ).filter(Boolean).slice(0, 3) || []
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const vendor = favorite.vendor_profiles?.[0]
              if (!vendor) return null

              const vendorCategories = getVendorCategories(vendor.service_categories || [])

              return (
                <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={vendor.profile_photo_url || undefined} />
                        <AvatarFallback>
                          {getInitials(vendor.business_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{vendor.business_name}</h3>
                        <p className="text-sm text-gray-600">{vendor.profile_title}</p>
                      </div>

                      {vendor.zip_code && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {vendor.zip_code}
                        </div>
                      )}

                      {vendor.hourly_rate && (
                        <div className="text-lg font-bold">
                          ${vendor.hourly_rate.toFixed(2)}/hr
                        </div>
                      )}

                      {vendorCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {vendorCategories.map((category, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button asChild className="w-full mt-4">
                        <Link href={`/vendor/${vendor.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


