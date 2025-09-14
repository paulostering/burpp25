'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Parse user from auth cookie as fallback
  const parseUserFromCookie = (): User | null => {
    try {
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-slvqwoglqaqccibwmpwx-auth-token='))
        ?.split('=')[1]

      if (!authCookie) return null

      const decoded = atob(authCookie.replace('base64-', ''))
      const authData = JSON.parse(decoded)
      
      // Check if token is expired
      const expiresAt = authData.expires_at
      const now = Math.floor(Date.now() / 1000)
      
      console.log('AuthProvider: Token check:', { 
        expiresAt, 
        now, 
        isExpired: now >= expiresAt,
        user: authData.user?.email 
      })
      
      if (now >= expiresAt) {
        console.warn('AuthProvider: Token is expired, clearing cookies')
        // Clear expired cookies
        const authCookies = [
          'sb-slvqwoglqaqccibwmpwx-auth-token',
          'sb-slvqwoglqaqccibwmpwx-auth-token-code-verifier'
        ]
        
        authCookies.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })
        
        return null
      }
      
      console.log('AuthProvider: Parsed user from cookie:', authData.user?.email)
      return authData.user || null
    } catch (error) {
      console.error('AuthProvider: Failed to parse auth cookie:', error)
      return null
    }
  }

  useEffect(() => {
    // Try to get session with timeout, fallback to cookie parsing
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...')
        
        // First try to refresh the session if we have a refresh token
        try {
          console.log('AuthProvider: Attempting to refresh session...')
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshedSession?.user && !refreshError) {
            console.log('AuthProvider: Session refreshed successfully:', refreshedSession.user.email)
            setUser(refreshedSession.user)
            return
          }
        } catch (refreshErr) {
          console.log('AuthProvider: Session refresh failed:', refreshErr)
        }
        
        // Try regular session get with timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        )
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (error) {
          console.error('AuthProvider: Session error:', error)
          throw error
        }
        
        console.log('AuthProvider: Session loaded:', session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        
      } catch (error) {
        console.warn('AuthProvider: Session failed, trying cookie fallback:', error)
        
        // Fallback: parse user from cookie
        const cookieUser = parseUserFromCookie()
        if (cookieUser) {
          console.log('AuthProvider: Using cookie user:', cookieUser.email)
          setUser(cookieUser)
        } else {
          console.log('AuthProvider: No valid auth found')
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes (but don't rely on it)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.email || 'No user')
        if (session?.user) {
          setUser(session.user)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    try {
      // Clear user immediately for better UX
      setUser(null)
      
      // Clear all auth cookies manually since Supabase calls are failing
      const authCookies = [
        'sb-slvqwoglqaqccibwmpwx-auth-token',
        'sb-slvqwoglqaqccibwmpwx-auth-token-code-verifier'
      ]
      
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
      
      console.log('AuthProvider: Cleared auth cookies')
      
      // Try to sign out via Supabase, but don't wait too long
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(resolve, 1000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      
      // Force page reload to clear any cached state
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
      // Still redirect even if sign out failed
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
