'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { useAuth } from '@/contexts/auth-context'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [showBanner, setShowBanner] = useState(true)

  // Check if banner was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('prosOnlyBannerDismissed')
    if (dismissed === 'true') {
      setShowBanner(false)
    }
  }, [])

  const dismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem('prosOnlyBannerDismissed', 'true')
  }

  return (
    <>
      {/* Alert Banner */}
      {showBanner && (
        <div className="bg-primary text-white py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">Currently Onboarding Pros Only</span>
            </div>
            <button 
              onClick={dismissBanner}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="flex h-20 items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold flex-shrink-0">
            <Image 
              src="/images/burpp_logo.png" 
              alt="Burpp Logo" 
              width={72} 
              height={28} 
              className="h-5 md:h-9 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="text-base px-6 whitespace-nowrap"
                onClick={() => router.push('/vendor/dashboard')}
              >
                Dashboard
              </Button>
            )}
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                className="text-base px-6 whitespace-nowrap"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            )}
            <Button
              size="sm"
              className="text-base px-6 whitespace-nowrap"
              onClick={() => router.push('/vendor-registration')}
            >
              Join Burpp
            </Button>
          </div>
        </div>
      </header>
      {children}
      <Footer />
    </>
  )
}

