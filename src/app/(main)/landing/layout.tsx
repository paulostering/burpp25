'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { useAuth } from '@/contexts/auth-context'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <>
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

