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

    // Use the Supabase-generated link but FORCE the correct redirect_to parameter
    // Supabase sometimes ignores the options.redirectTo or defaults to the site URL
    let resetLink = resetData.properties.action_link
    
    try {
      const url = new URL(resetLink)
      // Force the redirect_to parameter to point to /reset-password
      // We use the detected siteUrl to ensure it matches the environment
      // IMPORTANT: Supabase requires the Redirect URL to be in the Allow List in Auth settings
      // If this URL is not in the list, Supabase will fall back to the Site URL (likely /home)
      const redirectTarget = `${siteUrl}/reset-password`
      url.searchParams.set('redirect_to', redirectTarget)
      resetLink = url.toString()
      console.log('✓ Forced redirect_to in link:', resetLink)
    } catch (e) {
      console.error('Failed to modify reset link params:', e)
    }
    
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
