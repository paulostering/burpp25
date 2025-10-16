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
    } else if (type === 'description') {
      if (currentText) {
        // Refine existing description
        prompt = `Refine this professional "About" section for a service provider business. Make it engaging, professional, highlight expertise, and end with a call to action.

Business Name: ${businessName}
Service Categories: ${categories?.join(', ') || 'Various services'}
Current Description: ${currentText}

Provide only the refined description, nothing else. 2-3 paragraphs, maximum 500 characters.`
      } else {
        // Generate new description
        prompt = `Create a professional "About" section for a service provider business. Make it engaging, professional, highlight expertise and experience, and end with a call to action encouraging customers to reach out.

Business Name: ${businessName}
Service Categories: ${categories?.join(', ') || 'Various services'}

Provide only the description, nothing else. 2-3 paragraphs, maximum 500 characters.`
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

