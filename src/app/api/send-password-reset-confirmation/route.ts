import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  console.log('\n')
  console.log('═══════════════════════════════════════════')
  console.log('🚀 API ROUTE: /api/send-password-reset-confirmation')
  console.log('═══════════════════════════════════════════')
  
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { email, firstName } = body

    if (!email || !firstName) {
      console.error('❌ Missing required fields:', { email, firstName })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('✓ All required fields present')
    console.log('Calling sendPasswordResetConfirmation...')
    
    // Send password reset confirmation email
    const result = await sendPasswordResetConfirmation(email, firstName)

    if (!result.success) {
      console.error('❌ Failed to send confirmation email:', result.error)
      return NextResponse.json({ 
        success: false, 
        warning: 'Password updated but confirmation email failed to send' 
      })
    }

    console.log('✓ Password reset confirmation email sent successfully!')
    console.log('═══════════════════════════════════════════\n')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in POST /api/send-password-reset-confirmation:', error)
    console.log('═══════════════════════════════════════════\n')
    return NextResponse.json({ 
      success: false, 
      error: 'Email sending failed' 
    })
  }
}

