import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'

// GET - Fetch user's favorites with vendor data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching favorites for user:', user.id)

    // First, get the user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_vendor_favorites')
      .select('id, vendor_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json([])
    }

    // Use admin client to fetch vendor profiles (bypasses RLS)
    const adminSupabase = createAdminSupabase()
    const vendorIds = favorites.map(fav => fav.vendor_id)

    console.log('Fetching vendor profiles for IDs:', vendorIds)

    const { data: vendorProfiles, error: vendorError } = await adminSupabase
      .from('vendor_profiles')
      .select(`
        id,
        business_name,
        profile_title,
        profile_photo_url,
        zip_code,
        hourly_rate,
        service_categories,
        admin_approved
      `)
      .in('id', vendorIds)

    if (vendorError) {
      console.error('Error fetching vendor profiles:', vendorError)
      return NextResponse.json({ error: 'Failed to fetch vendor data' }, { status: 500 })
    }

    console.log('Found vendor profiles:', vendorProfiles?.length || 0)

    // Combine favorites with vendor data
    const combinedData = favorites.map(favorite => ({
      ...favorite,
      vendor_profiles: vendorProfiles?.find(vendor => vendor.id === favorite.vendor_id) || null
    }))

    return NextResponse.json(combinedData)
    
  } catch (error) {
    console.error('Error in GET /api/favorites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

