import { createAdminSupabase } from '@/lib/supabase/server'
import { validatePageParams, calculatePagination } from '@/lib/admin'
import { VendorsDataTable } from './vendors-data-table'
import type { VendorWithProfile } from '@/types/db'

interface VendorsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getVendors(page: number, perPage: number, search?: string) {
  const supabase = createAdminSupabase()
  
  let query = supabase
    .from('vendor_profiles')
    .select(`
      *,
      user_profile:user_id (
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at
      )
    `, { count: 'exact' })
  
  // Add search filter
  if (search) {
    query = query.or(`business_name.ilike.%${search}%,profile_title.ilike.%${search}%,user_profile.email.ilike.%${search}%`)
  }
  
  // Calculate offset for pagination
  const { offset, limit } = calculatePagination(page, 0, perPage)
  
  // Apply pagination
  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching vendors:', error)
    return { vendors: [], total: 0 }
  }
  
  // Get review counts and ratings for each vendor
  const vendorsWithStats = await Promise.all((data || []).map(async (vendor: any) => {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('vendor_id', vendor.id)
    
    const totalReviews = reviews?.length || 0
    const averageRating = totalReviews > 0 && reviews
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
      : 0
    
    return {
      ...vendor,
      total_reviews: totalReviews,
      average_rating: Math.round(averageRating * 10) / 10
    } as VendorWithProfile
  }))
  
  return {
    vendors: vendorsWithStats,
    total: count || 0
  }
}

export async function VendorsTable({ searchParams }: VendorsTableProps) {
  const searchParamsObj = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      searchParamsObj.set(key, value)
    }
  })
  
  const { page, perPage } = validatePageParams(searchParamsObj)
  const search = searchParamsObj.get('search') || undefined
  
  const { vendors, total } = await getVendors(page, perPage, search)
  const pagination = calculatePagination(page, total, perPage)
  
  return (
    <VendorsDataTable 
      vendors={vendors}
      pagination={pagination}
      currentSearch={search}
    />
  )
}







