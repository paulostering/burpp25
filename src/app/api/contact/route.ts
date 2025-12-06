import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    // Check if Resend API key is configured
    if (!resend) {
      console.error('RESEND_API_KEY not configured')
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

    // Send email using Resend
    try {
      const result = await resend.emails.send({
        from: 'Burpp Contact Form <contact@burpp.com>',
        to: 'support@burpp.com',
        replyTo: email,
        subject: `New Contact Form Submission from ${firstName} ${lastName}`,
        text: emailContent,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Contact Form Submission</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
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
      })

      if (result.error) {
        console.error('Resend error:', result.error)
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        )
      }

      console.log('Contact form email sent successfully, ID:', result.data?.id)
    } catch (sendError) {
      console.error('Failed to send contact email:', sendError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
