import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { admin_approved } = body

    if (typeof admin_approved !== 'boolean') {
      return NextResponse.json(
        { error: 'admin_approved must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabase()

    // Update vendor status
    const { data, error } = await supabase
      .from('vendor_profiles')
      .update({
        admin_approved,
        approved_at: admin_approved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vendor status:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in vendor status update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

