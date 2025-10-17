import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// This tells Next.js not to pre-render this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client inside the function to avoid build-time initialization
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    const { title, comment } = await request.json()

    if (!title && !comment) {
      return NextResponse.json(
        { error: 'No content to moderate' },
        { status: 400 }
      )
    }

    // Combine title and comment for moderation
    const contentToModerate = [title, comment].filter(Boolean).join('\n')

    // Use OpenAI's moderation API
    const moderation = await openai.moderations.create({
      input: contentToModerate,
    })

    const result = moderation.results[0]

    // Check if content is flagged
    if (result.flagged) {
      return NextResponse.json({
        approved: false,
        flagged: true,
        categories: result.categories,
        reason: 'Content violates community guidelines',
      })
    }

    // Additionally check for spam using GPT
    const spamCheck = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content moderator. Analyze the following review and determine if it is spam, contains inappropriate language, or is a genuine review. Respond with only "SPAM", "INAPPROPRIATE", or "GENUINE".',
        },
        {
          role: 'user',
          content: contentToModerate,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    })

    const classification = spamCheck.choices[0]?.message?.content?.trim().toUpperCase()

    if (classification === 'SPAM') {
      return NextResponse.json({
        approved: false,
        flagged: true,
        reason: 'Review appears to be spam',
      })
    }

    if (classification === 'INAPPROPRIATE') {
      return NextResponse.json({
        approved: false,
        flagged: true,
        reason: 'Review contains inappropriate content',
      })
    }

    // Content passes moderation
    return NextResponse.json({
      approved: true,
      flagged: false,
    })

  } catch (error) {
    console.error('Moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate content', approved: false },
      { status: 500 }
    )
  }
}

