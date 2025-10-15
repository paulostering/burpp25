import { createClient } from '@/lib/supabase/server'

interface EmailVariables {
  [key: string]: string
}

export async function sendTemplateEmail(
  eventName: string,
  recipientEmail: string,
  variables: EmailVariables
) {
  const supabase = createClient()
  
  // Add siteUrl to variables automatically
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const allVariables = {
    ...variables,
    siteUrl
  }
  
  // Get the template
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('event_name', eventName)
    .eq('is_active', true)
    .single()
  
  if (templateError || !template) {
    console.error('Email template not found or inactive:', eventName)
    return { success: false, error: 'Template not found' }
  }
  
  // Replace variables in subject and body
  let subject = template.subject
  let bodyHtml = template.body_html
  let bodyText = template.body_text || ''
  
  Object.entries(allVariables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, value)
    bodyHtml = bodyHtml.replace(regex, value)
    bodyText = bodyText.replace(regex, value)
  })
  
  // Here you would integrate with your email service (SendGrid, Resend, etc.)
  // For now, we'll just log it
  console.log('Sending email:', {
    to: recipientEmail,
    from: `${template.from_name} <${template.from_email}>`,
    subject,
    html: bodyHtml,
    text: bodyText
  })
  
  // TODO: Integrate with actual email service
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: `${template.from_name} <${template.from_email}>`,
  //   to: recipientEmail,
  //   subject,
  //   html: bodyHtml,
  //   text: bodyText
  // })
  
  return { success: true }
}

// Example usage functions for each template

export async function sendClientWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string
) {
  return sendTemplateEmail('client_welcome', email, {
    firstName,
    lastName,
    email,
    dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
  })
}

export async function sendVendorWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string,
  businessName: string
) {
  return sendTemplateEmail('vendor_welcome', email, {
    firstName,
    lastName,
    businessName,
    email,
    dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
  })
}

export async function sendVendorMessageNotification(
  vendorEmail: string,
  vendorFirstName: string,
  businessName: string,
  clientName: string,
  messagePreview: string,
  conversationId: string
) {
  return sendTemplateEmail('vendor_message_received', vendorEmail, {
    firstName: vendorFirstName,
    businessName,
    clientName,
    messagePreview,
    messageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/messages?conversation=${conversationId}`,
    settingsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`
  })
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string
) {
  return sendTemplateEmail('password_reset_request', email, {
    firstName,
    email,
    resetUrl
  })
}

export async function sendPasswordResetConfirmation(
  email: string,
  firstName: string
) {
  const now = new Date()
  return sendTemplateEmail('password_reset_confirmed', email, {
    firstName,
    email,
    resetDate: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    resetTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
  })
}

