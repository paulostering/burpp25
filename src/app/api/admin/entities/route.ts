import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createAdminSupabase()
    
    const { data: entities, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching entities:', error)
      return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
    }
    
    return NextResponse.json({ entities: entities || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/entities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

