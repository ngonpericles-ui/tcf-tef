"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the AI chat assistant to avoid SSR issues
const AIChatAssistant = dynamic(() => import('@/components/ai-chat-assistant'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de l'assistant IA...</p>
      </div>
    </div>
  )
})

export default function AIChatPage() {
  return (
    <div className="h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initialisation...</p>
          </div>
        </div>
      }>
        <AIChatAssistant />
      </Suspense>
    </div>
  )
}
