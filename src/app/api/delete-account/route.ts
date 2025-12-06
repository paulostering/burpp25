import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    // Get the current user from the session
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the request body to verify confirmation
    const body = await request.json()
    if (body.confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text does not match' },
        { status: 400 }
      )
    }

    // Use admin client to delete user (this will cascade to user_profiles, vendor_profiles, etc.)
    const adminSupabase = createAdminSupabase()
    
    // First, delete user-related data that might not cascade automatically
    // Delete user's favorites
    await adminSupabase
      .from('user_vendor_favorites')
      .delete()
      .eq('user_id', user.id)

    // Delete user's messages
    await adminSupabase
      .from('messages')
      .delete()
      .eq('sender_id', user.id)

    // Delete user's conversations (as customer)
    await adminSupabase
      .from('conversations')
      .delete()
      .eq('customer_id', user.id)

    // Delete user's conversations (as vendor)
    await adminSupabase
      .from('conversations')
      .delete()
      .eq('vendor_id', user.id)

    // Delete user's reviews
    await adminSupabase
      .from('reviews')
      .delete()
      .eq('user_id', user.id)

    // Delete vendor profile if exists
    await adminSupabase
      .from('vendor_profiles')
      .delete()
      .eq('user_id', user.id)

    // Delete user profile
    await adminSupabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id)

    // Finally, delete the auth user
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    console.log('Account deleted successfully:', user.id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in delete-account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

