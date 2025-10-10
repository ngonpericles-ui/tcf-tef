import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock data for monthly voice simulation count
    const mockMonthlyCount = {
      currentMonth: 12,
      previousMonth: 8,
      totalSessions: 45,
      averageScore: 82
    }

    return NextResponse.json({
      success: true,
      data: mockMonthlyCount
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monthly count'
    }, { status: 500 })
  }
}
