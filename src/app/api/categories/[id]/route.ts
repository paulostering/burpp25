import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

// GET - Fetch single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabase()
    
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      console.error('Error fetching category:', error)
      return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error in GET /api/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update category by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabase()
    const body = await request.json()
    
    const { name, icon_url, is_active, is_featured, parent_id, description } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    if (parent_id && parent_id === id) {
      return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 })
    }
    
    // Update the category
    const updateData: Record<string, any> = {
      name: name.trim(),
      icon_url: icon_url || null,
      is_active: is_active ?? true,
      is_featured: is_featured ?? false,
      updated_at: new Date().toISOString()
    }

    // Only change parent_id if caller provided it (allows PUTs from older clients)
    if ('parent_id' in body) {
      updateData.parent_id = parent_id || null
    }

    // Only change description if caller provided it (allows PUTs from older clients)
    if ('description' in body) {
      updateData.description = description || null
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      console.error('Error updating category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error in PUT /api/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete category by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabase()
    
    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      console.error('Error deleting category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
