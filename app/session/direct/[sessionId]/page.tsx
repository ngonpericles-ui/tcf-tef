'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'
import OneOnOneVideoCall from '@/components/OneOnOneVideoCall'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface SessionData {
  sessionId: string
  title: string
  description: string
  instructor: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  duration: number
  status: string
}

export default function DirectSessionPage() {
  const params = useParams() ?? {}
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<{ id: string, name: string, role: string } | null>(null)

  const sessionId = (params as any).sessionId as string

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    fetchSessionData()
  }, [user, authLoading, sessionId])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch session data from backend
      const response = await apiClient.get(`/messages/session/${sessionId}`)
      
      if (response.success && response.data) {
        const session = response.data || {}
        setSessionData({
          sessionId: session.sessionId ?? '',
          title: session.title ?? '',
          description: session.description ?? '',
          instructor: session.instructor ?? { id: '', firstName: '', lastName: '' },
          duration: session.duration ?? 0,
          status: session.status ?? ''
        })
        // Safely handle otherParticipant
        if (session.otherParticipant) {
          setContactInfo(session.otherParticipant)
        } else if (session.instructor && user) {
          setContactInfo({
            id: session.instructor.id,
            name: `${session.instructor.firstName} ${session.instructor.lastName}`,
            role: 'INSTRUCTOR'
          })
        } else {
          setContactInfo(null)
        }
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to fetch session data')
      }
    } catch (err: any) {
      console.error('Error fetching session data:', err)
      setError('Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const handleEndCall = () => {
    // Role-based redirection after call ends
    const userRole = user?.role;
    switch (userRole) {
      case 'STUDENT':
      case 'USER':
        router.push('/messages');
        break;
      case 'ADMIN':
        router.push('/admin/messages');
        break;
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        router.push('/messages');
        break;
      default:
        router.push('/messages');
        break;
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Session Error</h1>
          <p className="text-gray-300 mb-6">{error || 'Session not found'}</p>
          <Button onClick={() => router.push('/messages')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/messages')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">{sessionData.title}</h1>
              <p className="text-sm text-gray-400">
                with {sessionData.instructor.firstName} {sessionData.instructor.lastName}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Duration: {sessionData.duration} minutes
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      <div className="h-[calc(100vh-73px)]">
        <OneOnOneVideoCall
          sessionId={sessionData?.sessionId}
          onEndCall={handleEndCall}
          userRole={user?.role}
          userId={user?.id}
          userName={`${user?.firstName || ''} ${user?.lastName || ''}`}
          userProfileImage={user?.profileImage}
          contactId={contactInfo?.id}
          contactName={contactInfo?.name}
          contactRole={contactInfo?.role}
        />
      </div>
    </div>
  )
}
