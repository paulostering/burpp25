import { createAdminSupabase } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface EmailVariables {
  [key: string]: string
}

export async function sendTemplateEmail(
  eventName: string,
  recipientEmail: string,
  variables: EmailVariables
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 SENDING EMAIL')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Event:', eventName)
  console.log('Recipient:', recipientEmail)
  console.log('Variables:', variables)
  
  const supabase = createAdminSupabase()
  
  // Add siteUrl to variables automatically
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const allVariables = {
    ...variables,
    siteUrl
  }
  
  console.log('All variables (including siteUrl):', allVariables)
  
  // Get the template
  console.log('Fetching template:', eventName)
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('event_name', eventName)
    .eq('is_active', true)
    .single()
  
  if (templateError || !template) {
    console.error('❌ Email template not found or inactive:', eventName)
    console.error('Error:', templateError)
    return { success: false, error: 'Template not found' }
  }
  
  console.log('✓ Template found:', template.event_label)
  console.log('From:', `${template.from_name} <${template.from_email}>`)
  console.log('Subject (before replacement):', template.subject)
  
  // Replace variables in subject and body
  let subject = template.subject
  let bodyHtml = template.body_html
  let bodyText = template.body_text || ''
  
  Object.entries(allVariables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(regex, value)
    bodyHtml = bodyHtml.replace(regex, value)
    bodyText = bodyText.replace(regex, value)
  })
  
  console.log('Subject (after replacement):', subject)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📨 EMAIL CONTENT:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('To:', recipientEmail)
  console.log('From:', `${template.from_name} <${template.from_email}>`)
  console.log('Subject:', subject)
  console.log('HTML Length:', bodyHtml.length, 'characters')
  console.log('Text Length:', bodyText.length, 'characters')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('HTML Preview (first 500 chars):')
  console.log(bodyHtml.substring(0, 500))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Send email with Resend
  if (!resend) {
    console.log('⚠️  RESEND_API_KEY not found in environment variables')
    console.log('⚠️  Email was prepared but not sent')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return { success: false, error: 'Resend not configured' }
  }

  try {
    console.log('📤 Sending email via Resend...')
    console.log('Sending from:', `${template.from_name} <${template.from_email}>`)
    
    const result = await resend.emails.send({
      from: `${template.from_name} <${template.from_email}>`,
      to: recipientEmail,
      subject,
      html: bodyHtml,
      text: bodyText,
    })
    
    if (result.error) {
      console.error('❌ Resend Error:', result.error)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return { success: false, error: result.error.message }
    }
    
    console.log('✅ Email sent successfully via Resend!')
    console.log('Resend Message ID:', result.data?.id)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return { success: true, messageId: result.data?.id }
  } catch (sendError: unknown) {
    console.error('❌ Resend Error:', sendError)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return { success: false, error: 'Failed to send via Resend' }
  }
}

// Helper to get site URL with fallback
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// Example usage functions for each template

export async function sendClientWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string
) {
  const siteUrl = getSiteUrl()
  return sendTemplateEmail('client_welcome', email, {
    firstName,
    lastName,
    email,
    dashboardUrl: `${siteUrl}/dashboard`
  })
}

export async function sendVendorWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string,
  businessName: string
) {
  const siteUrl = getSiteUrl()
  return sendTemplateEmail('vendor_welcome', email, {
    firstName,
    lastName,
    businessName,
    email,
    dashboardUrl: `${siteUrl}/dashboard`
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
  const siteUrl = getSiteUrl()
  return sendTemplateEmail('vendor_message_received', vendorEmail, {
    firstName: vendorFirstName,
    businessName,
    clientName,
    messagePreview,
    messageUrl: `${siteUrl}/messages?conversation=${conversationId}`,
    settingsUrl: `${siteUrl}/settings`
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
  const siteUrl = getSiteUrl()
  const now = new Date()
  return sendTemplateEmail('password_reset_confirmed', email, {
    firstName,
    email,
    resetDate: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    resetTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    loginUrl: `${siteUrl}/login`
  })
}

