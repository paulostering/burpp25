import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabase()
    
    // Get user profile for first name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('email', email)
      .maybeSingle()

    const firstName = profile?.first_name || 'User'
    
    // Get site URL for redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://burpp.com' : 'http://localhost:3000')
    
    // Generate password reset link
    // Supabase will redirect to this URL after verifying the token
    const redirectUrl = `${siteUrl}/reset-password`
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    })

    // For security, don't reveal if user exists or not (prevent email enumeration)
    if (resetError || !resetData?.properties?.action_link) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      })
    }

    // Use the Supabase-generated link as-is
    // The link goes to Supabase's verify endpoint, which validates the token
    // and redirects to our app with access_token in the hash fragment
    const resetLink = resetData.properties.action_link
    console.log('✓ Using Supabase reset link:', resetLink)
    
    // Send password reset email
    const result = await sendPasswordResetEmail(
      email,
      firstName,
      resetLink
    )

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/send-password-reset-email:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Email sending failed' 
    }, { status: 500 })
  }
}
