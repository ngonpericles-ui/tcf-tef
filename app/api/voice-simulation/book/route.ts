import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingType, preferredDates, voicePreference } = body;

    console.log('📤 Forwarding booking request to backend:', {
      bookingType,
      hasPreferredDates: !!preferredDates,
      preferredDatesCount: preferredDates?.length || 0,
      voicePreference
    });

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const authHeader = request.headers.get('authorization') || '';
    
    const response = await fetch(`${backendUrl}/api/voice-simulation/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ bookingType, preferredDates, voicePreference })
    });

    // Get response data
    const contentType = response.headers.get('content-type');
    const responseText = await response.text(); // Read response as text first
    
    console.log('📥 Backend response:', {
      status: response.status,
      contentType,
      text: responseText.substring(0, 500),
      length: responseText.length
    });
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed response data:', {
          success: data.success,
          message: data.message,
          error: data.error,
          hasData: !!data.data
        });
        return NextResponse.json(data, { status: response.status });
      } catch (parseError: any) {
        console.error('❌ Failed to parse JSON response:', {
          error: parseError.message,
          text: responseText.substring(0, 500)
        });
        return NextResponse.json({
          success: false,
          message: 'Invalid JSON response from server',
          error: 'Failed to parse response',
          rawResponse: responseText.substring(0, 200)
        }, { status: 500 });
      }
    } else {
      // If backend returns non-JSON, return error
      console.error('❌ Backend returned non-JSON:', {
        contentType,
        status: response.status,
        text: responseText.substring(0, 500)
      });
      return NextResponse.json({
        success: false,
        message: 'Invalid response from server',
        error: 'Non-JSON response',
        status: response.status
      }, { status: response.status || 500 });
    }
  } catch (error: any) {
    console.error('❌ Error in book route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error',
      error: 'Failed to book simulation'
    }, { status: 500 });
  }
}

