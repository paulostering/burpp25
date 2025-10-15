import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile if authenticated
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    userProfile = profile
  }

  // Check if user is admin (either from profile or user metadata)
  const isAdmin = user && (
    (userProfile?.role === 'administrator' && userProfile?.is_active) ||
    user.user_metadata?.role === 'administrator' ||
    (user as any).raw_user_meta_data?.role === 'administrator'
  )

  // Check if user is vendor (either from profile or user metadata)
  const isVendor = user && (
    (userProfile?.role === 'vendor' && userProfile?.is_active) ||
    user.user_metadata?.role === 'vendor' ||
    (user as any).raw_user_meta_data?.role === 'vendor'
  )

  // Admin routing logic
  if (isAdmin) {
    // Admin users should be redirected to admin dashboard for most public routes
    const publicRoutes = ['/', '/search', '/vendor', '/favorites', '/messages']
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + '/')
    )
    
    // Allow access to login/logout, admin routes and messages/inbox
    const allowedRoutes = ['/login', '/signup', '/logout', '/admin', '/messages']
    const isAllowedRoute = allowedRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + '/')
    )
    
    if (isPublicRoute && !isAllowedRoute) {
      // Redirect admin users to admin dashboard when they try to access public routes
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Vendor routing logic
  if (isVendor) {
    // Vendors should be redirected to their dashboard when accessing public routes
    const publicRoutes = ['/', '/search', '/vendor', '/favorites', '/messages']
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + '/')
    )
    
    // Allow access to login/logout, messages/inbox and vendor dashboard routes
    const allowedRoutes = ['/login', '/signup', '/logout', '/messages', `/vendor/${user.id}/dashboard`]
    const isAllowedRoute = allowedRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + '/')
    )
    
    if (isPublicRoute && !isAllowedRoute) {
      // Redirect vendor users to their dashboard when they try to access public routes
      return NextResponse.redirect(new URL(`/vendor/${user.id}/dashboard`, request.url))
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
    }

    if (!isAdmin) {
      // Redirect to home if not an admin
      return NextResponse.redirect(new URL('/?error=access_denied', request.url))
    }
  }

  // Protect vendor dashboard routes (but not public profile pages)
  if (request.nextUrl.pathname.startsWith('/vendor') && 
      request.nextUrl.pathname !== '/vendor-registration' && 
      request.nextUrl.pathname !== '/vendor-registration/thank-you' &&
      !request.nextUrl.pathname.match(/^\/vendor\/[^\/]+$/)) { // Allow /vendor/[id] (public profiles)
    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has vendor role
    const userRole = user.user_metadata?.role
    if (userRole !== 'vendor') {
      // Redirect to home if not a vendor
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
