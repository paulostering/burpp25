import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !['profile', 'cover'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid photo type' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabase()

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create file path following vendor registration pattern: {userId}/{type}/{filename}
    const fileName = type === 'profile' ? 'profile.jpg' : 'cover.jpg'
    const filePath = `${userId}/${type}/${fileName}`

    // Upload to storage with upsert to replace existing
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    if (!uploadData) {
      return NextResponse.json(
        { error: 'Upload failed: No data returned' },
        { status: 500 }
      )
    }

    // Get public URL with cache-busting timestamp
    const { data: { publicUrl } } = supabase.storage
      .from('vendor')
      .getPublicUrl(uploadData.path)

    // Add timestamp to URL to bust cache
    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

    // Update vendor profile
    const updateField = type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'

    const { data, error } = await supabase
      .from('vendor_profiles')
      .update({ 
        [updateField]: cacheBustedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to update profile: No data returned' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, publicUrl: cacheBustedUrl })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

