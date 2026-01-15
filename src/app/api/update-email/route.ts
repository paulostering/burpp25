import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is already in use
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      )
    }

    // Use admin client to update auth.users email
    const adminSupabase = createAdminSupabase()
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      { email }
    )

    if (authError) {
      console.error('Error updating auth.users:', authError)
      throw authError
    }

    // Update user_profiles
    const { error: userProfileError } = await supabase
      .from('user_profiles')
      .update({ email })
      .eq('id', user.id)

    if (userProfileError) {
      console.error('Error updating user_profiles:', userProfileError)
      throw userProfileError
    }

    // Update vendor_profiles if user is a vendor
    const { data: vendorProfile } = await supabase
      .from('vendor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorProfile) {
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .update({ email })
        .eq('user_id', user.id)

      if (vendorError) {
        console.error('Error updating vendor_profiles:', vendorError)
        throw vendorError
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully'
    })

  } catch (error) {
    console.error('Error updating email:', error)
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    )
  }
}

