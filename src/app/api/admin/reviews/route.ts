import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createAdminSupabase()
    
    // Fetch reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
    
    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ reviews: [] })
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
    
    return NextResponse.json({ reviews: enrichedReviews })
  } catch (error) {
    console.error('Error in GET /api/admin/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

