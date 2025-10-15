import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// GET - Fetch all categories
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const body = await request.json()

    const { name, icon_url, is_active, is_featured } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
          // Create the category
      const { data: category, error } = await supabase
        .from('categories')
        .insert([
          {
            name: name.trim(),
            icon_url: icon_url || null,
            is_active: is_active ?? true,
            is_featured: is_featured ?? false,
            created_by: user.id,
            updated_by: user.id
          }
        ])
        .select()
        .single()

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
