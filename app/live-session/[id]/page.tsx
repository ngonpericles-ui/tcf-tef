"use client"

import { TutorVideoSession } from "@/components/tutor-video-session"
import { StudentVideoSession } from "@/components/student-video-session"
import { Suspense, useEffect, useState } from "react"
import { SessionSkeleton } from "@/components/session-skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function LiveSessionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  useEffect(() => {
    console.log('🔍 Live session page auth check:', {
      loading,
      user: user ? { id: user.id, role: user.role, email: user.email } : null
    });

    if (loading) {
      console.log('⏳ Still loading authentication...');
      return
    }

    if (!user) {
      console.log('❌ No user found, redirecting to login');
      // Not authenticated, redirect to login
      router.push('/connexion')
      return
    }

    console.log('✅ User authenticated, allowing access to live session');
    // All authenticated users can use this full-screen live session page
    setIsCheckingAccess(false)
  }, [user, loading, router])

  if (loading || isCheckingAccess) {
    return <SessionSkeleton />
  }

  // Determine which component to render based on user role
  const renderSessionComponent = () => {
    if (!user) return <SessionSkeleton />

    // Use TutorVideoSession for admins and managers (they have full controls)
    if (['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role)) {
      return <TutorVideoSession onSessionEnd={() => {
        // Redirect to appropriate section based on role
        if (user.role === 'ADMIN') {
          router.push('/admin/live-sessions')
        } else if (['SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role)) {
          router.push('/manager/sessions')
        }
      }} />
    }

    // Use StudentVideoSession for students
    if (user.role === 'STUDENT') {
      return <StudentVideoSession onSessionEnd={() => {
        // Redirect students to their live sessions page
        router.push('/live')
      }} />
    }

    // Fallback to student interface
    return <StudentVideoSession onSessionEnd={() => {
      router.push('/live')
    }} />
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Suspense fallback={<SessionSkeleton />}>
        {renderSessionComponent()}
      </Suspense>
    </div>
  )
}
