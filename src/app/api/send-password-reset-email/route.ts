import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  console.log('\n')
  console.log('═══════════════════════════════════════════')
  console.log('🚀 API ROUTE: /api/send-password-reset-email')
  console.log('═══════════════════════════════════════════')
  
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { email } = body

    if (!email) {
      console.error('❌ Missing email field')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('✓ Email field present')
    
    const supabase = createAdminSupabase()
    
    // Get user profile for first name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('email', email)
      .maybeSingle()

    const firstName = profile?.first_name || 'User'
    console.log('User first name:', firstName)
    
    // Generate reset link with custom redirect URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUrl = `${siteUrl}/reset-password`
    
    console.log('Generating password reset link...')
    console.log('Redirect URL:', redirectUrl)
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (resetError || !resetData) {
      console.error('❌ Failed to generate reset link:', resetError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate reset link' 
      })
    }

    console.log('✓ Reset link generated')
    console.log('Reset link:', resetData.properties.action_link)
    
    // Verify we have a valid reset link
    if (!resetData.properties.action_link) {
      console.error('❌ No action link in reset data')
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate reset link' 
      })
    }
    
    console.log('Calling sendPasswordResetEmail with custom template...')
    
    // Send password reset email with our custom template
    const result = await sendPasswordResetEmail(
      email,
      firstName,
      resetData.properties.action_link
    )

    if (!result.success) {
      console.error('❌ Failed to send password reset email:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

    console.log('✅ Custom branded password reset email sent successfully!')
    console.log('═══════════════════════════════════════════\n')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in POST /api/send-password-reset-email:', error)
    console.log('═══════════════════════════════════════════\n')
    return NextResponse.json({ 
      success: false, 
      error: 'Email sending failed' 
    })
  }
}

