import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VendorsDataTable } from '@/components/admin/vendors-data-table'
import { createAdminSupabase } from '@/lib/supabase/server'

async function getVendors(page: number = 1, perPage: number = 20) {
  const supabase = createAdminSupabase()
  
  // Get all auth users and their profiles (if they exist)
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return { vendors: [], pagination: null }
  }
  
  // Get all user profiles
  const { data: userProfiles, error: userProfilesError } = await supabase
    .from('user_profiles')
    .select('*')
  
  if (userProfilesError) {
    console.error('Error fetching user profiles:', userProfilesError)
  }
  
  // Get all vendor profiles
  const { data: vendorProfiles, error: vendorProfilesError } = await supabase
    .from('vendor_profiles')
    .select('*')
  
  if (vendorProfilesError) {
    console.error('Error fetching vendor profiles:', vendorProfilesError)
  }
  
  // Create maps for quick lookup
  const userProfilesMap = new Map(userProfiles?.map(p => [p.id, p]) || [])
  const vendorProfilesMap = new Map(vendorProfiles?.map(p => [p.user_id || p.id, p]) || [])
  
  // Filter and transform users to show only vendors
  const allVendors = authUsers.users
    .filter(user => {
      const userProfile = userProfilesMap.get(user.id)
      const hasVendorRole = userProfile?.role === 'vendor' || user.user_metadata?.role === 'vendor'
      return hasVendorRole
    })
    .map(user => {
      const userProfile = userProfilesMap.get(user.id)
      const vendorProfile = vendorProfilesMap.get(user.id)
      
      // Combine data from auth, user_profiles, and vendor_profiles to match VendorProfile interface
      return {
        id: vendorProfile?.id || user.id,
        user_id: user.id,
        business_name: vendorProfile?.business_name || null,
        profile_title: vendorProfile?.profile_title || null,
        about: vendorProfile?.about || null,
        profile_photo_url: vendorProfile?.profile_photo_url || null,
        cover_photo_url: vendorProfile?.cover_photo_url || null,
        offers_virtual_services: vendorProfile?.offers_virtual_services || null,
        offers_in_person_services: vendorProfile?.offers_in_person_services || null,
        hourly_rate: vendorProfile?.hourly_rate || null,
        zip_code: vendorProfile?.zip_code || null,
        service_radius: vendorProfile?.service_radius || null,
        service_categories: vendorProfile?.service_categories || null,
        first_name: userProfile?.first_name || user.user_metadata?.first_name || null,
        last_name: userProfile?.last_name || user.user_metadata?.last_name || null,
        email: user.email || '',
        phone_number: vendorProfile?.phone_number || user.user_metadata?.phone_number || null,
        allow_phone_contact: vendorProfile?.allow_phone_contact || null,
        admin_approved: vendorProfile?.admin_approved || false,
        admin_notes: vendorProfile?.admin_notes || null,
        approved_at: vendorProfile?.approved_at || null,
        approved_by: vendorProfile?.approved_by || null,
        created_at: vendorProfile?.created_at || user.created_at,
        updated_at: vendorProfile?.updated_at || user.updated_at,
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  // Implement pagination
  const total = allVendors.length
  const totalPages = Math.ceil(total / perPage)
  const offset = (page - 1) * perPage
  const vendors = allVendors.slice(offset, offset + perPage)
  
  const pagination = {
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
    offset,
    limit: perPage
  }
  
  return { vendors, pagination }
}

interface AdminVendorsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminVendorsPage({ searchParams }: AdminVendorsPageProps) {
  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)
  const { vendors, pagination } = await getVendors(currentPage)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Vendors</h1>
        <p className="text-gray-600 mt-1">
          Review and approve vendor profiles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorsDataTable vendors={vendors} pagination={pagination} />
        </CardContent>
      </Card>
    </div>
  )
}


