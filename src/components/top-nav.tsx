"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { CondensedSearch } from "@/components/condensed-search"
import { InboxIcon } from "@/components/inbox-icon"
import { FavoritesIcon } from "@/components/favorites-icon"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function TopNav() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [isVendor, setIsVendor] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsVendor(false)
        setRoleLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        const userIsVendor = profile?.role === 'vendor' || 
                           user.user_metadata?.role === 'vendor' ||
                           (user as any).raw_user_meta_data?.role === 'vendor'
        
        setIsVendor(userIsVendor)
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsVendor(false)
      } finally {
        setRoleLoading(false)
      }
    }

    checkUserRole()
  }, [user])

  // Hide avatar on registration pages
  const isRegistrationPage = pathname?.includes('/vendor-registration')
  // Hide navigation on auth pages
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup')
  // Hide condensed search on vendor dashboard pages to prevent API call issues
  const isVendorDashboard = pathname?.includes('/vendor/') && pathname?.includes('/dashboard')
  // Show condensed search on non-homepage pages, but not for vendors
  const isHomePage = pathname === '/' || pathname === '/home'
  const showCondensedSearch = !isHomePage && !isAuthPage && !isRegistrationPage && !isVendorDashboard && !isVendor && !roleLoading

  // Get user initial from email
  const getUserInitial = () => {
    if (!user?.email) return null
    return user.email.charAt(0).toUpperCase()
  }

  const firstInitial = getUserInitial()

  // Hide entire top nav on auth pages
  if (isAuthPage) {
    return null
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image 
              src="/images/burpp_logo.png" 
              alt="Burpp Logo" 
              width={80} 
              height={32} 
              className="h-8 w-auto"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>
          
          {/* Condensed Search - Desktop only */}
          {showCondensedSearch && (
            <div className="max-w-lg hidden md:block">
              <CondensedSearch />
            </div>
          )}
        </div>
        
        <nav className="flex items-center gap-3">
          {/* Condensed Search Icon - Mobile only */}
          {showCondensedSearch && (
            <div className="md:hidden">
              <CondensedSearch />
            </div>
          )}
          
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : user && firstInitial && !isRegistrationPage ? (
            <>
              <InboxIcon />
              <FavoritesIcon />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{firstInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !isRegistrationPage ? (
            <>
              <Link href="/burp-for-business" className="hidden md:block text-sm hover:underline">
                Join as a Pro
              </Link>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
              <Button asChild size="sm" className="text-sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}