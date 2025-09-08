"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { CondensedSearch } from "@/components/condensed-search"
import { InboxIcon } from "@/components/inbox-icon"
import { FavoritesIcon } from "@/components/favorites-icon"

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [firstInitial, setFirstInitial] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Hide avatar on registration pages
  const isRegistrationPage = pathname?.includes('/vendor-registration')
  // Hide navigation on auth pages
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup')
  // Show condensed search on non-homepage pages
  const isHomePage = pathname === '/' || pathname === '/home'
  const showCondensedSearch = !isHomePage && !isAuthPage && !isRegistrationPage

  const computeInitial = (user: { user_metadata?: { first_name?: string }; email?: string } | null | undefined) => {
    if (!user) return null
    const first = (user.user_metadata?.first_name as string | undefined) || ""
    const initial = first.trim().charAt(0).toUpperCase() || (user.email?.charAt(0).toUpperCase() ?? null)
    setFirstInitial(initial)
  }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      computeInitial(data.user)
      
      // Check if user is admin
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single()
        
        const isAdminUser = (profile?.role === 'administrator' && profile?.is_active) ||
                           data.user.user_metadata?.role === 'administrator'
        setIsAdmin(isAdminUser)
      }
    }
    load()
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      computeInitial(session?.user)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active')
          .eq('id', session.user.id)
          .single()
        
        const isAdminUser = (profile?.role === 'administrator' && profile?.is_active) ||
                           session.user.user_metadata?.role === 'administrator'
        setIsAdmin(isAdminUser)
      } else {
        setIsAdmin(false)
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

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
          {!firstInitial && !isRegistrationPage && (
            <Link href="/burp-for-business" className="text-sm hover:underline">
              Join as a Pro
            </Link>
          )}
          {firstInitial && !isRegistrationPage ? (
            <>
              {!isAdmin && (
                <>
                  <InboxIcon />
                  <FavoritesIcon />
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{firstInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    const supabase = createClient()
                    const { error } = await supabase.auth.signOut()
                    if (error) return toast.error(error.message)
                    setFirstInitial(null)
                    toast.success("Signed out")
                    router.push("/login")
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !isRegistrationPage ? (
            <>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}


