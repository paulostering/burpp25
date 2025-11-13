import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function GET() {
  const diagnostics = {
    resendConfigured: !!process.env.RESEND_API_KEY,
    resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
    templates: [] as any[]
  }

  // Check if email templates exist
  try {
    const supabase = createAdminSupabase()
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('event_name, event_label, is_active, from_email')
      .order('event_name')

    if (error) {
      return NextResponse.json({
        ...diagnostics,
        error: 'Failed to fetch email templates',
        details: error.message
      })
    }

    diagnostics.templates = templates || []
  } catch (error: any) {
    return NextResponse.json({
      ...diagnostics,
      error: 'Database connection failed',
      details: error.message
    })
  }

  return NextResponse.json(diagnostics)
}

