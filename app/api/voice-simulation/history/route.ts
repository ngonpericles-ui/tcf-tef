import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Frontend API route: Fetching voice simulation history from backend...');
    
    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const authHeader = request.headers.get('authorization') || '';
    
    console.log('📋 Frontend API route auth check:', {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader.length,
      authPreview: authHeader.substring(0, 30) + '...'
    });
    
    if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
      console.error('❌ No valid auth header in frontend API route');
      return NextResponse.json({
        success: false,
        error: 'Authorization required',
        message: 'Please log in to access this resource'
      }, { status: 401 });
    }
    
    const response = await fetch(`${backendUrl}/api/voice-simulation/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    const contentType = response.headers.get('content-type');
    let responseData: any;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.error('❌ Backend returned non-JSON:', text.substring(0, 200));
      return NextResponse.json({
        success: false,
        error: 'Invalid response from backend',
        message: 'Backend returned non-JSON response'
      }, { status: response.status || 500 });
    }

    if (!response.ok) {
      console.error('❌ Backend error:', {
        status: response.status,
        error: responseData
      });
      return NextResponse.json({
        success: false,
        error: responseData?.message || responseData?.error?.message || responseData?.error || 'Failed to fetch voice simulation history'
      }, { status: response.status });
    }

    console.log('✅ Frontend API route: History fetched from backend:', {
      success: responseData.success,
      count: responseData.data?.length || 0
    });
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error in frontend API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch voice simulation history'
    }, { status: 500 })
  }
}
