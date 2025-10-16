import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabase()
    
    // Get the current admin user
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    const { error } = await supabase
      .from('reviews')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user?.id || null,
      })
      .eq('id', id)

    if (error) {
      console.error('Error approving review:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to approve review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

