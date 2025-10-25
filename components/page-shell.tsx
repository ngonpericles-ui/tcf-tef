"use client"

import React from "react"
import dynamic from "next/dynamic"
import SiteHeader from "@/components/site-header"
import PromoRibbon from "@/components/promo-ribbon"
import FloatingAIButton from "@/components/ai-chat/floating-ai-button"
import { useAuth } from "@/contexts/AuthContext"

// Dynamic import for footer (not critical for initial page load)
const SiteFooter = dynamic(() => import("@/components/site-footer"), {
  ssr: false,
  loading: () => <div className="h-32" />,
})

const PageShell = React.memo(function PageShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const showStudentAssistant = user?.role === 'USER'

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      {/* Defer promo ribbon to reduce first paint on navigations */}
      <React.Suspense fallback={null}>
        <PromoRibbon />
      </React.Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />

      {/* Floating AI Assistant - students only */}
      {showStudentAssistant ? <FloatingAIButton /> : null}
    </div>
  )
})

PageShell.displayName = 'PageShell'

export default PageShell
