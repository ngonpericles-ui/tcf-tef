"use client"

import { TutorVideoSession } from "@/components/tutor-video-session"
import { Suspense } from "react"
import { SessionSkeleton } from "@/components/session-skeleton"

export default function TutorPage() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <TutorVideoSession />
    </Suspense>
  )
}
