import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createAdminSupabase()
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'user_registration_enabled')
      .single()

    if (error) {
      console.error('Error fetching registration setting:', error)
      return NextResponse.json(
        { error: 'Failed to fetch setting' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    const value = data.setting_value
    // Handle various formats
    let isEnabled = true
    if (typeof value === 'boolean') {
      isEnabled = value
    } else if (typeof value === 'string') {
      const normalized = value.toLowerCase().replace(/"/g, '')
      isEnabled = normalized === 'true'
    }

    return NextResponse.json({ enabled: isEnabled })
  } catch (error) {
    console.error('Error in GET /api/admin/user-registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { enabled: boolean }' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from('app_settings')
      .update({
        setting_value: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'user_registration_enabled')
      .select()
      .single()

    if (error) {
      console.error('Error updating registration setting:', error)
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      )
    }

    return NextResponse.json({ enabled, data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/user-registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

