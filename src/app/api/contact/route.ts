import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Set SendGrid API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Check if SendGrid API key is configured
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY)
    console.log('SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY?.length || 0)
    
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const { firstName, lastName, email, phone, message } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create email content
    const emailContent = `
New Contact Form Submission

Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || 'Not provided'}

Message:
${message}

---
This message was sent from the Burpp contact form.
    `.trim()

    // Send email using SendGrid
    const msg = {
      to: 'contact@burpp.com',
      from: 'contact@burpp.com', // This should be a verified sender in SendGrid
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="background: #fff; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This message was sent from the Burpp contact form.
          </p>
        </div>
      `
    }

    try {
      await sgMail.send(msg)
      console.log('Email sent successfully to contact@burpp.com')
    } catch (sendGridError) {
      console.error('SendGrid error:', sendGridError)
      console.error('SendGrid error details:', JSON.stringify(sendGridError, null, 2))
      return NextResponse.json(
        { error: 'Failed to send email', details: sendGridError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
