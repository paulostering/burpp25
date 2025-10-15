import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { first_name, last_name, email, is_active } = body

    const supabase = createAdminSupabase()

    // Update user profile in database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id,
        first_name,
        last_name,
        email,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update client profile' },
        { status: 500 }
      )
    }

    // Update email in auth if it changed
    const { data: authUser } = await supabase.auth.admin.getUserById(id)
    if (authUser.user && authUser.user.email !== email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(id, {
        email,
      })

      if (emailError) {
        console.error('Error updating email:', emailError)
        // Don't fail the request if email update fails, just log it
      }
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('Error in PATCH /api/admin/clients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

