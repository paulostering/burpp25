import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createAdminSupabase()
    
    // Get all vendor profiles directly (source of truth)
    const { data: vendorProfiles, error: vendorProfilesError } = await supabase
      .from('vendor_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (vendorProfilesError) {
      console.error('Error fetching vendor profiles:', vendorProfilesError)
      return NextResponse.json({ error: 'Failed to fetch vendor profiles' }, { status: 500 })
    }
    
    if (!vendorProfiles || vendorProfiles.length === 0) {
      return NextResponse.json({ vendors: [] })
    }
    
    // Get all user profiles for email and name lookup
    const userIds = vendorProfiles.map(vp => vp.user_id).filter(Boolean) as string[]
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds.length > 0 ? userIds : [''])
    
    // Get auth users for email lookup (fallback)
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    // Create maps for quick lookup
    const userProfilesMap = new Map(userProfiles?.map(p => [p.id, p]) || [])
    const authUsersMap = new Map(authUsers?.users.map(u => [u.id, u]) || [])
    
    // Transform vendor profiles to match VendorProfile interface
    const vendors = vendorProfiles.map(vendorProfile => {
      const userProfile = vendorProfile.user_id ? userProfilesMap.get(vendorProfile.user_id) : null
      const authUser = vendorProfile.user_id ? authUsersMap.get(vendorProfile.user_id) : null
      
      return {
        id: vendorProfile.id,
        user_id: vendorProfile.user_id || null,
        business_name: vendorProfile.business_name || null,
        profile_title: vendorProfile.profile_title || null,
        about: vendorProfile.about || null,
        profile_photo_url: vendorProfile.profile_photo_url || null,
        cover_photo_url: vendorProfile.cover_photo_url || null,
        offers_virtual_services: vendorProfile.offers_virtual_services || null,
        offers_in_person_services: vendorProfile.offers_in_person_services || null,
        hourly_rate: vendorProfile.hourly_rate || null,
        zip_code: vendorProfile.zip_code || null,
        service_radius: vendorProfile.service_radius || null,
        service_categories: vendorProfile.service_categories || null,
        first_name: vendorProfile.first_name || userProfile?.first_name || authUser?.user_metadata?.first_name || null,
        last_name: vendorProfile.last_name || userProfile?.last_name || authUser?.user_metadata?.last_name || null,
        email: vendorProfile.email || userProfile?.email || authUser?.email || '',
        phone_number: vendorProfile.phone_number || null,
        allow_phone_contact: vendorProfile.allow_phone_contact || null,
        admin_approved: vendorProfile.admin_approved || false,
        admin_notes: vendorProfile.admin_notes || null,
        approved_at: vendorProfile.approved_at || null,
        approved_by: vendorProfile.approved_by || null,
        created_at: vendorProfile.created_at || '',
        updated_at: vendorProfile.updated_at || '',
      }
    })
    
    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Error in GET /api/admin/vendors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

