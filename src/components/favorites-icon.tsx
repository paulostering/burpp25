'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function FavoritesIcon() {
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [isVendor, setIsVendor] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if user is a vendor
        const { data: vendorProfile } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        setIsVendor(!!vendorProfile)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (!session?.user) {
        setIsVendor(false)
        setFavoritesCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!user || isVendor) {
      setFavoritesCount(0)
      return
    }

    // Ensure user has a valid ID
    if (!user.id) {
      console.warn('User ID is missing, skipping favorites load')
      setFavoritesCount(0)
      return
    }

    const loadFavoritesCount = async () => {
      try {
        console.log('Loading favorites count for user:', user.id)
        
        const { data, error } = await supabase
          .from('user_vendor_favorites')
          .select('id')
          .eq('user_id', user.id)

        if (error) {
          // Check if the error is due to table not existing
          if (error.message?.includes('relation "user_vendor_favorites" does not exist') || 
              error.message?.includes('does not exist') ||
              error.code === '42P01') {
            console.warn('user_vendor_favorites table does not exist. Favorites feature not available.')
            setFavoritesCount(0)
            return
          }
          
          console.error('Error loading favorites count:', error)
          // Set count to 0 on error to prevent UI issues
          setFavoritesCount(0)
          return
        }

        const count = data?.length || 0
        console.log('Favorites count:', count)
        setFavoritesCount(count)
      } catch (error) {
        console.error('Unexpected error loading favorites count:', error)
        // Set count to 0 on error to prevent UI issues
        setFavoritesCount(0)
      }
    }

    loadFavoritesCount()

    // Set up real-time subscription for favorites updates
    const channel = supabase
      .channel(`favorites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_vendor_favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Favorites updated:', payload)
          loadFavoritesCount()
        }
      )
      .subscribe((status) => {
        console.log('Favorites subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isVendor, supabase])

  // Only show for non-vendor users
  if (!user || isVendor) return null

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
      <Link href="/favorites">
        <Heart className="h-4 w-4" />
        {favoritesCount > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 text-[10px] p-0 flex items-center justify-center bg-primary text-white"
          >
            {favoritesCount > 99 ? '99+' : favoritesCount}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
