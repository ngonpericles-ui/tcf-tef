import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Proxy to backend to get VAPI public key
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                       process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                       'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/voice-simulation/vapi-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error fetching VAPI config from backend:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch VAPI configuration',
      message: error.message
    }, { status: 500 });
  }
}

