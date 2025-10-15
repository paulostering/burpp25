import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

// Create a new product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params
    const body = await request.json()

    const supabase = createAdminSupabase()

    // Insert product
    const { data, error } = await supabase
      .from('vendor_products')
      .insert({
        vendor_id: vendorId,
        title: body.title,
        description: body.description,
        starting_price: body.starting_price,
        image_url: body.image_url,
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in product creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all products for a vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params

    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from('vendor_products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in product fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

