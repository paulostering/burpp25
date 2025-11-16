"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { usePathname, useRouter } from "next/navigation"
import { CondensedSearch } from "@/components/condensed-search"
import { InboxIcon } from "@/components/inbox-icon"
import { FavoritesIcon } from "@/components/favorites-icon"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { User, LayoutDashboard, LogOut, Menu, X } from "lucide-react"

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [isVendor, setIsVendor] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check user role and get profile photo
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsVendor(false)
        setProfilePhotoUrl(null)
        setRoleLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active, profile_photo_url')
          .eq('id', user.id)
          .single()

        const userIsVendor = profile?.role === 'vendor' ||
                           user.user_metadata?.role === 'vendor' ||
                           (user as any).raw_user_meta_data?.role === 'vendor'

        setIsVendor(userIsVendor)
        setProfilePhotoUrl(profile?.profile_photo_url || null)
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsVendor(false)
        setProfilePhotoUrl(null)
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
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="flex h-20 items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 font-semibold flex-shrink-0">
            <Image 
              src="/images/burpp_logo.png" 
              alt="Burpp Logo" 
              width={72} 
              height={28} 
              className="h-5 md:h-9 w-auto"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>
          
          {/* Condensed Search - Desktop only */}
          {showCondensedSearch && (
            <div className="max-w-3xl w-full hidden md:block flex-1">
              <CondensedSearch />
            </div>
          )}
        </div>
        
        <nav className="flex items-center gap-2 md:gap-3 flex-shrink-0">
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
                      {profilePhotoUrl && <AvatarImage src={profilePhotoUrl} alt="Profile" />}
                      <AvatarFallback>{firstInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isVendor && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !isRegistrationPage ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-3">
                <Link href="/burp-for-business" className="text-base hover:underline px-4 whitespace-nowrap">
                  Join as a Pro
                </Link>
                <Button asChild variant="ghost" size="sm" className="text-base border border-gray-300 px-6 whitespace-nowrap">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="text-base px-6 whitespace-nowrap">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full p-6 [&>button.absolute]:hidden">
                  <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </VisuallyHidden>
                  <div className="flex items-center justify-between mb-8">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                      <Image 
                        src="/images/burpp_logo.png" 
                        alt="Burpp Logo" 
                        width={100} 
                        height={39} 
                        className="h-10 w-auto"
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                      />
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-10 w-10"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                  <nav className="flex flex-col gap-4">
                    <Link 
                      href="/burp-for-business" 
                      className="text-lg font-medium py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Join as a Pro
                    </Link>
                    <Link 
                      href="/login" 
                      className="text-lg font-medium py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      className="text-lg font-medium py-3 px-4 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}