import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { type, businessName, categories, currentText } = await request.json()

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    let prompt = ''
    let characterLimit: number | null = null
    
    if (type === 'title') {
      if (currentText) {
        // Refine existing title
        prompt = `Refine this professional profile title for a service provider business. Make it concise, professional, and compelling.

Business Name: ${businessName}
Service Categories: ${categories?.join(', ') || 'Various services'}
Current Title: ${currentText}

Provide only the refined title, nothing else. Maximum 60 characters.`
      } else {
        // Generate new title
        prompt = `Create a professional profile title for a service provider business. Make it concise, professional, and compelling.

Business Name: ${businessName}
Service Categories: ${categories?.join(', ') || 'Various services'}

Provide only the title, nothing else. Maximum 60 characters.`
      }
      characterLimit = 60
    } else if (type === 'description') {
      if (currentText) {
        // Refine existing description
        prompt = `Refine this professional "About" section for a service provider business. Make it engaging, professional, highlight expertise, and end with a call to action.

Business Name: ${businessName}
Service Categories: ${categories?.join(', ') || 'Various services'}
Current Description: ${currentText}

Provide only the refined description, nothing else. Keep it concise and under 200 characters while preserving key selling points and a clear call to action.`
        characterLimit = 200
      } else {
        // Generate new description
        prompt = `Create a professional "About" section for a service provider business. Make it engaging, professional, highlight expertise and experience, and end with a call to action encouraging customers to reach out. The result must be concise and approximately 100 characters (between 90 and 110 characters), never exceeding 200 characters.

Business Name: ${businessName}
Service Categories: ${categories?.join(', ') || 'Various services'}

Provide only the description, nothing else.`
        characterLimit = 100
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter specializing in service provider profiles. Create compelling, professional content that helps businesses attract customers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: type === 'title' ? 50 : 300,
    })

    let generatedText = completion.choices[0]?.message?.content?.trim()

    if (!generatedText) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Clean up the response - remove quotes, markdown, and unwanted prefixes
    generatedText = generatedText
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .replace(/^(Title:|Description:|About:|Profile Title:)/i, '') // Remove labels
      .trim()

    if (characterLimit) {
      if (generatedText.length > characterLimit) {
        const truncated = generatedText.slice(0, characterLimit)
        const lastSpace = truncated.lastIndexOf(' ')
        generatedText = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()
      }
    }

    return NextResponse.json({
      text: generatedText,
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

