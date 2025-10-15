import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { from_email, from_name, subject, body_html, body_text, is_active } = body

    const supabase = createAdminSupabase()

    // Update email template
    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        from_email,
        from_name,
        subject,
        body_html,
        body_text,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json(
        { error: 'Failed to update email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    console.error('Error in PATCH /api/admin/email-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

