'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VendorDashboardWrapper } from '@/components/vendor-dashboard-wrapper'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import type { VendorProfile as VendorProfileType, Category } from '@/types/db'

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState<VendorProfileType | null>(null)
  const [stats, setStats] = useState({
    conversations: 0,
    messages: 0,
    reviews: 0,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDashboardData = async () => {
      // Wait for auth to finish loading
      if (authLoading) return
      
      if (!user) {
        router.push('/login')
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get vendor profile by user_id (the logged-in user)
        const vendorResult = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (vendorResult.error || !vendorResult.data) {
          setError('No vendor profile found for this user. Please complete vendor registration.')
          setLoading(false)
          return
        }

        const vendorId = vendorResult.data.id

        // Fetch stats and categories in parallel
        const [statsResult, categoriesResult] = await Promise.all([
          // Get vendor stats
          Promise.all([
            supabase
              .from('conversations')
              .select('*', { count: 'exact', head: true })
              .eq('vendor_id', vendorId),
            supabase
              .from('messages')
              .select('*, conversations!inner(vendor_id)', { count: 'exact', head: true })
              .eq('conversations.vendor_id', vendorId),
            supabase
              .from('reviews')
              .select('*', { count: 'exact', head: true })
              .eq('vendor_id', vendorId)
              .eq('approved', true)
          ]),
          
          // Get categories
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name')
        ])

        // Check for errors
        if (categoriesResult.error) {
          console.error('Error fetching categories:', categoriesResult.error)
        }

        // Process stats
        const [conversationsCount, messagesCount, reviewsCount] = statsResult
        const processedStats = {
          conversations: conversationsCount.count || 0,
          messages: messagesCount.count || 0,
          reviews: reviewsCount.count || 0,
        }

        // Set data
        setVendor(vendorResult.data)
        setStats(processedStats)
        setCategories(categoriesResult.data || [])

        // Check for new vendor welcome flag
        const isNewVendor = sessionStorage.getItem('burpp_new_vendor_welcome')
        if (isNewVendor === 'true') {
          setShowWelcomeModal(true)
          sessionStorage.removeItem('burpp_new_vendor_welcome')
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, authLoading, router, supabase])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-24" />
              </nav>
            </div>
          </div>

          {/* Profile Content Skeleton */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-5 w-5" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Dashboard</h1>
          <p className="text-gray-600 mb-6">{error || 'Vendor profile not found'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/vendor-registration')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Register as Vendor
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <VendorDashboardWrapper 
        vendor={vendor} 
        stats={stats} 
        categories={categories}
      />
      
      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6 animate-in fade-in-50 zoom-in-95 duration-500">
            {/* Success Icon with animated glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-green-500 rounded-full p-4 animate-in zoom-in-50 duration-700">
                <CheckCircle className="h-10 w-10 text-white animate-in zoom-in-50 duration-1000 delay-300" strokeWidth={2.5} />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="text-center space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-200">
              <h3 className="text-2xl font-bold text-gray-900">
                You're all set.
              </h3>
              <p className="text-base text-gray-600 max-w-md">
                Burpp is currently onboarding vendors only. We'll notify you as soon as the platform goes live for users.
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full max-w-xs h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-400"
              size="lg"
            >
              View Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}