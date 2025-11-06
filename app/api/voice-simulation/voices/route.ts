import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Fetch real voices from backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/voice-simulation/voices`, {
      headers: {
        'Authorization': request.headers.get('authorization') || ''
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices from backend');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching voices:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available voices'
    }, { status: 500 })
  }
}
