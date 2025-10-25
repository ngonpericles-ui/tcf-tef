import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()
    
    if (!message || !context) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call backend AI service
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify({
        message,
        context
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to process chat' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

