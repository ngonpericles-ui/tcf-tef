import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, text } = body;

    if (!voiceId) {
      return NextResponse.json({
        success: false,
        message: 'Voice ID is required'
      }, { status: 400 });
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/voice-simulation/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify({ voiceId, text })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in preview route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate voice preview'
    }, { status: 500 });
  }
}
