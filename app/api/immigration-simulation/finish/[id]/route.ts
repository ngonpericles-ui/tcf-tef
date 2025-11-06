import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!id) {
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
    
    const url = token 
      ? `${backendUrl}/api/immigration-simulation/finish/${id}?token=${token}`
      : `${backendUrl}/api/immigration-simulation/finish/${id}`;
    
    const response = await fetch(url, {
      method: 'POST',
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
      return NextResponse.json({
        success: false,
        error: responseData?.message || responseData?.error || 'Failed to finish simulation'
      }, { status: response.status });
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error finishing immigration simulation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to finish simulation'
    }, { status: 500 });
  }
}

