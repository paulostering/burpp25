'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewsDataTable } from '@/components/admin/reviews-data-table'
import { Skeleton } from '@/components/ui/skeleton'

interface Review {
  id: string
  user_id: string
  vendor_id: string
  rating: number
  title?: string
  comment?: string
  approved: boolean
  created_at: string
  user?: {
    first_name?: string
    last_name?: string
    email?: string
  }
  vendor?: {
    business_name?: string
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/reviews', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }
      
      setReviews(data.reviews || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Reviews</h1>
          <p className="text-gray-600 mt-1">
            Review and approve customer reviews
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Reviews</h1>
          <p className="text-gray-600 mt-1">
            Review and approve customer reviews
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchReviews}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Reviews</h1>
        <p className="text-gray-600 mt-1">
          Review and approve customer reviews
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewsDataTable reviews={reviews} />
        </CardContent>
      </Card>
    </div>
  )
}

