"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { StudySessionProvider } from "@/contexts/StudySessionContext"
import PageShell from "@/components/page-shell"
import { Skeleton } from "@/components/ui/skeleton"
import PersonalizedGreeting from "@/components/personalized-greeting"
import SmartDashboard from "@/components/smart-dashboard"
import EnhancedHero from "@/components/enhanced-hero"
import Image from "next/image"

// Dynamic imports for better performance
const Snapshot = dynamic(() => import("@/components/snapshot"), {
  loading: () => <Skeleton className="h-32 w-full" />,
})

const CourseExplorer = dynamic(() => import("@/components/course-explorer"), {
  loading: () => <Skeleton className="h-64 w-full" />,
})

const TestsPanel = dynamic(() => import("@/components/tests-panel"), {
  loading: () => <Skeleton className="h-48 w-full" />,
})

const LiveSessions = dynamic(() => import("@/components/live-sessions"), {
  loading: () => <Skeleton className="h-40 w-full" />,
})



const Upsell = dynamic(() => import("@/components/upsell"), {
  loading: () => <Skeleton className="h-32 w-full" />,
})

const AIAssistant = dynamic(() => import("@/components/ai-assistant"), {
  ssr: false,
  loading: () => null,
})



// Background images for the rotating effect
const backgroundImages = [
  {
    url: "/images/home/bg1.jpg", // French classroom
    gradient: "from-blue-100/30 via-purple-50/20 to-pink-100/30"
  },
  {
    url: "/images/home/bg2.jpg", // French cafe
    gradient: "from-green-100/30 via-blue-50/20 to-cyan-100/30"
  },
  {
    url: "/images/home/bg3.jpg", // French library
    gradient: "from-purple-100/30 via-pink-50/20 to-red-100/30"
  },
  {
    url: "/images/home/bg4.jpg", // French landscape
    gradient: "from-yellow-100/30 via-orange-50/20 to-red-100/30"
  },
  {
    url: "/images/home/bg5.jpg", // French architecture
    gradient: "from-cyan-100/30 via-teal-50/20 to-green-100/30"
  }
]

export default function Page() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      )
    }, 8000) // Change image every 8 seconds

    return () => clearInterval(interval)
  }, [])
  return (
    <StudySessionProvider>
      <main className="font-sans bg-background text-foreground relative overflow-hidden">
        {/* Dynamic Background with Images and Gradients */}
        <div className="fixed inset-0 -z-10">
          {backgroundImages.map((bg, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Background Image */}
              <Image
                src={bg.url}
                alt={`French learning background ${index + 1}`}
                fill
                className="object-cover"
                style={{
                  filter: 'blur(1px) brightness(0.4)',
                }}
                priority={index === 0}
              />
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${bg.gradient}`} />
            </div>
          ))}
          
          {/* Additional overlay gradients for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/85 to-background/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,background_60%)]" />
        </div>

        <PageShell>
          {/* Skip to content for accessibility */}
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:bg-card focus:text-foreground focus:ring-2 focus:ring-[#007BFF] rounded z-50"
          >
            Skip to content
          </a>

          {/* Enhanced Layout with Full Width */}
          <div className="min-h-screen relative z-10">
            {/* Personalized Greeting Header */}
            <PersonalizedGreeting />

            {/* Main Content Container */}
            <div id="content" className="container mx-auto max-w-screen-2xl px-4 md:px-8">
              {/* Smart Dashboard Analytics */}
              <SmartDashboard />

              {/* Enhanced Hero Section */}
              <EnhancedHero />

              {/* Traditional Components Enhanced */}
              <div className="space-y-8">
                <Snapshot />
                <CourseExplorer />
                <TestsPanel />
                <LiveSessions />
                <Upsell />
              </div>
            </div>

            {/* AI Assistant */}
            <AIAssistant />
          </div>
        </PageShell>
      </main>
    </StudySessionProvider>
  )
}