import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// GET - Fetch featured categories for home page
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    
    // First, get all featured categories
    const { data: featuredCategories, error: featuredError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (featuredError) {
      console.error('Error fetching featured categories:', featuredError)
      return NextResponse.json({ error: 'Failed to fetch featured categories' }, { status: 500 })
    }

    // If we have 8 or more featured categories, return them
    if (featuredCategories && featuredCategories.length >= 8) {
      // Shuffle and take first 8
      const shuffled = featuredCategories.sort(() => 0.5 - Math.random())
      return NextResponse.json(shuffled.slice(0, 8))
    }

    // If we have less than 8 featured categories, get additional random categories
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (allError) {
      console.error('Error fetching all categories:', allError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Combine featured categories with random non-featured categories
    const nonFeaturedCategories = allCategories?.filter(cat => !cat.is_featured) || []
    const shuffledNonFeatured = nonFeaturedCategories.sort(() => 0.5 - Math.random())
    
    // Take featured categories first, then fill with random non-featured
    const result = [
      ...(featuredCategories || []),
      ...shuffledNonFeatured.slice(0, 8 - (featuredCategories?.length || 0))
    ]

    // Shuffle the final result for variety
    const finalResult = result.sort(() => 0.5 - Math.random())
    
    return NextResponse.json(finalResult)
  } catch (error) {
    console.error('Error in GET /api/categories/featured:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
