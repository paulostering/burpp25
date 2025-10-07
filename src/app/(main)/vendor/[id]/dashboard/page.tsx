'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface VendorDashboardPageProps {
  params: Promise<{ id: string }>
}

// This route is deprecated. Redirect to the new dashboard route.
export default function VendorDashboardPage({ params }: VendorDashboardPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new dashboard route
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

