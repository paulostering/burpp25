import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewsDataTable } from '@/components/admin/reviews-data-table'
import { createAdminSupabase } from '@/lib/supabase/server'

async function getReviews() {
  const supabase = createAdminSupabase()
  
  // Fetch reviews
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
  
  if (!reviews || reviews.length === 0) {
    return []
  }
  
  // Fetch user profiles
  const userIds = [...new Set(reviews.map(r => r.user_id))]
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds)
  
  // Fetch vendor profiles
  const vendorIds = [...new Set(reviews.map(r => r.vendor_id))]
  const { data: vendors } = await supabase
    .from('vendor_profiles')
    .select('id, business_name')
    .in('id', vendorIds)
  
  // Map users and vendors to reviews
  const usersMap = new Map((users || []).map(u => [u.id, u]))
  const vendorsMap = new Map((vendors || []).map(v => [v.id, v]))
  
  const enrichedReviews = reviews.map(review => ({
    ...review,
    user: usersMap.get(review.user_id),
    vendor: vendorsMap.get(review.vendor_id),
  }))
  
  return enrichedReviews
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews()

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

