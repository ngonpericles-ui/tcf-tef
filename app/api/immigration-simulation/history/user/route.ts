import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
      console.error('❌ No valid authorization header found');
      return NextResponse.json({
        success: false,
        error: 'Authorization required'
      }, { status: 401 });
    }
    
    console.log('📋 Frontend API route: Fetching immigration simulation history:', {
      backendUrl: `${backendUrl}/api/immigration-simulation/history/user`,
      hasAuth: !!authHeader
    });
    
    const response = await fetch(`${backendUrl}/api/immigration-simulation/history/user`, {
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
        error: responseData?.message || responseData?.error || 'Failed to fetch immigration simulation history'
      }, { status: response.status || 500 });
    }

    console.log('✅ Immigration simulation history fetched successfully:', {
      count: responseData?.data?.length || 0
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error in immigration simulation history API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
