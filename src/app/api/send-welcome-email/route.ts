import { NextRequest, NextResponse } from 'next/server'
import { sendClientWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  console.log('\n')
  console.log('═══════════════════════════════════════════')
  console.log('🚀 API ROUTE: /api/send-welcome-email')
  console.log('═══════════════════════════════════════════')
  
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { email, firstName, lastName } = body

    if (!email || !firstName || !lastName) {
      console.error('❌ Missing required fields:', { email, firstName, lastName })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('✓ All required fields present')
    console.log('Calling sendClientWelcomeEmail...')
    
    // Send welcome email
    const result = await sendClientWelcomeEmail(email, firstName, lastName)

    if (!result.success) {
      console.error('❌ Failed to send welcome email:', result.error)
      // Don't fail the request - email is not critical for signup
      return NextResponse.json({ 
        success: false, 
        warning: 'Account created but welcome email failed to send' 
      })
    }

    console.log('✓ Welcome email sent successfully!')
    console.log('═══════════════════════════════════════════\n')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in POST /api/send-welcome-email:', error)
    console.log('═══════════════════════════════════════════\n')
    // Don't fail - email sending is non-critical
    return NextResponse.json({ 
      success: false, 
      error: 'Email sending failed' 
    })
  }
}

