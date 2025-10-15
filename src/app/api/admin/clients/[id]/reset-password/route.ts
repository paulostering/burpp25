import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabase()

    // Get user to find their email
    const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(id)

    if (userError || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate password reset link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: authUser.user.email!,
    })

    if (error) {
      console.error('Error generating reset link:', error)
      return NextResponse.json(
        { error: 'Failed to generate password reset link' },
        { status: 500 }
      )
    }

    // In production, you would send this link via email
    // For now, we'll just return success
    // You can integrate with your email service here

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset email sent successfully',
      // Remove this in production - only for development
      resetLink: data.properties.action_link 
    })
  } catch (error) {
    console.error('Error in POST /api/admin/clients/[id]/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

