import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminVendorDashboardWrapper } from '@/components/admin/admin-vendor-dashboard-wrapper'
import { createAdminSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { VendorProfile, Category } from '@/types/db'

async function getVendorData(vendorId: string) {
  const supabase = createAdminSupabase()
  
  // Get vendor profile
  const { data: vendor, error: vendorError } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('id', vendorId)
    .single()

  if (vendorError || !vendor) {
    console.error('Error fetching vendor:', vendorError)
    return null
  }

  // Get vendor stats in parallel
  const [conversationsResult, messagesResult, reviewsResult, categoriesResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
  ])

  const stats = {
    conversations: conversationsResult.count || 0,
    messages: messagesResult.count || 0,
    reviews: reviewsResult.count || 0,
  }

  const categories = categoriesResult.data || []

  return { vendor, stats, categories }
}

interface AdminVendorPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminVendorPage({ params }: AdminVendorPageProps) {
  const { id } = await params
  const data = await getVendorData(id)

  if (!data) {
    notFound()
  }

  const { vendor, stats, categories } = data

  return (
    <AdminVendorDashboardWrapper 
      vendor={vendor} 
      stats={stats} 
      categories={categories}
    />
  )
}

