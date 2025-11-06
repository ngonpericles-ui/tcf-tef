import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
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
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const authHeader = request.headers.get('authorization') || '';
    
    console.log('🗑️ Frontend API route: Canceling simulation:', {
      id,
      backendUrl: `${backendUrl}/api/voice-simulation/cancel/${id}`,
      hasAuth: !!authHeader,
      authPreview: authHeader.substring(0, 20) + '...'
    });
    
    const response = await fetch(`${backendUrl}/api/voice-simulation/cancel/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    console.log('📡 Backend response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
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
        error: responseData?.message || responseData?.error?.message || responseData?.error || 'Failed to cancel simulation'
      }, { status: response.status });
    }

    console.log('✅ Frontend API route: Simulation cancelled successfully');
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error in frontend API route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel simulation'
    }, { status: 500 });
  }
}

