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

  useEffect(() => {
    // Simplified auth initialization to prevent infinite loops
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      // Try to sign out via Supabase, but don't wait too long
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(resolve, 1000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      
      // Force page reload to clear any cached state
      window.location.href = '/login'
    } catch {
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
