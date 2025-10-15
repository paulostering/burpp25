'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export function FavoritesIcon() {
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [isVendor, setIsVendor] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const checkIfVendor = async () => {
      if (!user) {
        setIsVendor(false)
        return
      }

      try {
        // Check if user is a vendor
        const { data: vendorProfile } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()


        setIsVendor(!!vendorProfile)
      } catch (error) {
        setIsVendor(false)
      }
    }

    checkIfVendor()
  }, [user, supabase])

  useEffect(() => {
    if (!user || isVendor) {
      setFavoritesCount(0)
      return
    }

    // Ensure user has a valid ID
    if (!user.id) {
      setFavoritesCount(0)
      return
    }

    const loadFavoritesCount = async () => {
      try {
        const { data, error } = await supabase
          .from('user_vendor_favorites')
          .select('id')
          .eq('user_id', user.id)

        if (error) {
          // Check if the error is due to table not existing
          if (error.message?.includes('relation "user_vendor_favorites" does not exist') ||
              error.message?.includes('does not exist') ||
              error.message?.includes('Could not find the table') ||
              error.code === '42P01' ||
              error.code === 'PGRST205') {
            setFavoritesCount(0)
            return
          }

          // Set count to 0 on error to prevent UI issues
          setFavoritesCount(0)
          return
        }

        const count = data?.length || 0
        setFavoritesCount(count)
      } catch (error) {
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
          loadFavoritesCount()
        }
      )
      .subscribe()

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
