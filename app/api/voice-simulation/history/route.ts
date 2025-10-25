import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock data for voice simulation history
    const mockHistory = [
      {
        id: '1',
        date: '2024-01-15',
        duration: 300,
        score: 85,
        level: 'A2',
        type: 'conversation'
      },
      {
        id: '2', 
        date: '2024-01-14',
        duration: 240,
        score: 78,
        level: 'A1',
        type: 'pronunciation'
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockHistory
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch voice simulation history'
    }, { status: 500 })
  }
}
