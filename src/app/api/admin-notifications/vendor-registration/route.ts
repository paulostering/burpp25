import { NextRequest, NextResponse } from 'next/server'
import { sendAdminVendorRegistrationNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      firstName, 
      lastName, 
      businessName, 
      phone, 
      categories, 
      location, 
      serviceType, 
      userId 
    } = body

    if (!email || !firstName || !lastName || !businessName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send admin notification email
    const result = await sendAdminVendorRegistrationNotification(
      email,
      firstName,
      lastName,
      businessName,
      phone || 'Not provided',
      categories || 'Not specified',
      location || 'Not specified',
      serviceType || 'Not specified',
      userId
    )

    if (!result.success) {
      console.error('Failed to send admin notification:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/admin-notifications/vendor-registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

