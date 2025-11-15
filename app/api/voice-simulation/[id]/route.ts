import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ vs older versions)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!id) {
      console.error('❌ No ID provided in route params');
      return NextResponse.json({
        success: false,
        error: 'Simulation ID is required'
      }, { status: 400 });
    }
    
    // Get backend URL - try multiple environment variable options
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                       process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                       'http://localhost:3001';
    
    // Handle token from query parameter (for email links)
    const token = request.nextUrl.searchParams.get('token');
    const authHeader = token 
      ? `Bearer ${token}` 
      : (request.headers.get('authorization') || '');
    
    // Build URL with token if present
    const url = token 
      ? `${backendUrl}/api/voice-simulation/${id}?token=${token}`
      : `${backendUrl}/api/voice-simulation/${id}`;
    
    console.log('📋 Frontend API route: Fetching simulation:', {
      id,
      url,
      hasToken: !!token,
      hasAuth: !!authHeader,
      backendUrl
    });
    
    const response = await fetch(url, {
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
        error: 'Invalid response from backend'
      }, { status: response.status || 500 });
    }

    if (!response.ok) {
      console.error('❌ Backend error:', {
        status: response.status,
        error: responseData,
        url,
        hasToken: !!token,
        hasAuth: !!authHeader
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch simulation';
      if (response.status === 404) {
        errorMessage = responseData?.message || 'Simulation not found';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = responseData?.message || 'Access denied or authentication failed';
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (responseData?.error?.message) {
        errorMessage = responseData.error.message;
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: responseData?.code,
        details: responseData
      }, { status: response.status });
    }

    console.log('✅ Frontend API route: Simulation fetched successfully');
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error in frontend API route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch simulation'
    }, { status: 500 });
  }
}

