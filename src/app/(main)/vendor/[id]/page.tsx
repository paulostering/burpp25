import { createAdminSupabase } from '@/lib/supabase/server'
import { VendorProfile } from '@/components/vendor-profile'
import { notFound } from 'next/navigation'
import type { VendorProfile as VendorProfileType } from '@/types/db'

interface VendorPageProps {
  params: Promise<{ id: string }>
}

async function getVendor(id: string): Promise<VendorProfileType | null> {
  const supabase = createAdminSupabase()
  
  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getCategories() {
  const supabase = createAdminSupabase()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { id } = await params
  
  const [vendor, categories] = await Promise.all([
    getVendor(id),
    getCategories()
  ])

  if (!vendor) {
    notFound()
  }

  return <VendorProfile vendor={vendor} categories={categories} />
}

export async function generateMetadata({ params }: VendorPageProps) {
  const { id } = await params
  const vendor = await getVendor(id)

  if (!vendor) {
    return {
      title: 'Vendor Not Found',
    }
  }

  return {
    title: `${vendor.business_name || 'Vendor Profile'} - Professional Services`,
    description: vendor.about || `Professional services by ${vendor.business_name}`,
  }
}
