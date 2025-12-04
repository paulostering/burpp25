'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Global component to handle password reset redirects from Supabase
 * When Supabase redirects back to our app after verifying the token,
 * it includes hash fragments with the tokens. We need to ensure users
 * are on the /reset-password page to handle them.
 */
export function PasswordResetHandler() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Don't redirect if already on reset-password page
    if (pathname === '/reset-password') return
    
    // Check for password reset token in URL hash
    const hash = window.location.hash
    if (!hash) return
    
    const hashParams = new URLSearchParams(hash.substring(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')
    
    // If this is a password reset link (type=recovery), redirect immediately
    if (type === 'recovery' && accessToken) {
      // Use window.location.replace for immediate redirect (blocks page render)
      window.location.replace(`/reset-password${hash}`)
    }
  }, [pathname])

  return null
}
