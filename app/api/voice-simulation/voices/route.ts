import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock data for available voices
    const mockVoices = [
      {
        id: 'voice-1',
        name: 'Marie',
        language: 'fr-FR',
        gender: 'female',
        description: 'Native French female voice'
      },
      {
        id: 'voice-2', 
        name: 'Pierre',
        language: 'fr-FR',
        gender: 'male',
        description: 'Native French male voice'
      },
      {
        id: 'voice-3',
        name: 'Sophie',
        language: 'fr-FR', 
        gender: 'female',
        description: 'Professional French voice'
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockVoices
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available voices'
    }, { status: 500 })
  }
}
