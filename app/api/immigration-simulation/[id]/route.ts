import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!id) {
      console.error('❌ No ID provided in route params');
      return NextResponse.json({
        success: false,
        error: 'Simulation ID is required'
      }, { status: 400 });
    }
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const token = request.nextUrl.searchParams.get('token');
    const authHeader = token 
      ? `Bearer ${token}` 
      : (request.headers.get('authorization') || '');
    
    console.log('📋 Frontend API route: Fetching immigration simulation:', {
      id,
      backendUrl: `${backendUrl}/api/immigration-simulation/${id}`,
      hasAuth: !!authHeader
    });
    
    const url = token 
      ? `${backendUrl}/api/immigration-simulation/${id}?token=${token}`
      : `${backendUrl}/api/immigration-simulation/${id}`;
    
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
        error: responseData
      });
      return NextResponse.json({
        success: false,
        error: responseData?.message || responseData?.error?.message || responseData?.error || 'Failed to fetch simulation'
      }, { status: response.status });
    }

    console.log('✅ Frontend API route: Immigration simulation fetched successfully');
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error in frontend API route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch simulation'
    }, { status: 500 });
  }
}

