"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Play, 
  Trophy, 
  Star,
  BookOpen,
  ArrowRight,
  Zap,
  Users,
  Timer,
  Award,
  BarChart3,
  Brain,
  FileText,
  Mic,
  Headphones
} from "lucide-react"
import { useLang } from "./language-provider"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api-client"

interface TestStats {
  dailyProgress: number
  currentLevel: string
  weeklyXP: number
  testsCompleted: number
}

interface QuickTest {
  id: string
  title: { fr: string; en: string }
  type: string
  duration: number
  level: string
  questions: number
  color: string
  popularity: number
}

interface LiveSession {
  id: string
  title: string
  instructor: string
  date: string
  duration: number
  maxParticipants: number
  currentParticipants: number
  status: string
  level: string
}

export default function TestsPanel() {
  const { t, lang } = useLang()
  const { isAuthenticated } = useAuth()
  const [selectedDuration, setSelectedDuration] = useState<15 | 20 | 30>(15)
  const [testStats, setTestStats] = useState<TestStats>({
    dailyProgress: 0,
    currentLevel: "A1",
    weeklyXP: 0,
    testsCompleted: 0
  })
  const [quickTests, setQuickTests] = useState<QuickTest[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch test data from backend
  useEffect(() => {
    const fetchTestData = async () => {
      if (!isAuthenticated) return
      
      try {
        setLoading(true)
        const [testsResponse, liveSessionsResponse, statsResponse] = await Promise.all([
          apiClient.get('/tests').catch(() => ({ success: false, data: [] })), // Catch errors gracefully
          apiClient.get('/live-sessions?page=1&limit=3&status=LIVE,SCHEDULED').catch(() => ({ success: false, data: [] })),
          apiClient.get('/home/dashboard').catch(() => ({ success: false, data: {} }))
        ])

        if (testsResponse.success && testsResponse.data) {
          // Handle both array and object with tests property
          const testsData = Array.isArray(testsResponse.data) 
            ? testsResponse.data 
            : (testsResponse.data as any).tests || []
          const quickTestsData: QuickTest[] = testsData.slice(0, 4).map((test: any, index: number) => ({
            id: test.id,
            title: { fr: test.title, en: test.titleEn || test.title },
            type: test.category || 'Général',
            duration: test.duration || 15,
            level: test.level || 'A1',
            questions: test.questions?.length || 10,
            color: ['#2ECC71', '#007BFF', '#F39C12', '#9B59B6'][index],
            popularity: Math.floor(Math.random() * 100)
          }))
          setQuickTests(quickTestsData)
        }

        if (liveSessionsResponse.success && liveSessionsResponse.data) {
          const sessionsData = Array.isArray(liveSessionsResponse.data)
            ? liveSessionsResponse.data
            : (liveSessionsResponse.data as any).sessions || []
          setLiveSessions(sessionsData)
        }

        if (statsResponse.success && statsResponse.data) {
          const stats = statsResponse.data
          setTestStats({
            dailyProgress: (stats as any).dailyProgress || 0,
            currentLevel: (stats as any).currentLevel || 'A1',
            weeklyXP: (stats as any).weeklyXP || 0,
            testsCompleted: (stats as any).testsCompleted || 0
          })
        }
      } catch (error) {
        console.error('Error fetching test data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTestData()
  }, [isAuthenticated])

  const testCategories = [
    { key: 'grammar', icon: BookOpen, color: '#8E44AD', title: { fr: 'Grammaire', en: 'Grammar' } },
    { key: 'listening', icon: Headphones, color: '#007BFF', title: { fr: 'Compréhension orale', en: 'Listening' } },
    { key: 'writing', icon: FileText, color: '#16A085', title: { fr: 'Expression écrite', en: 'Writing' } },
    { key: 'speaking', icon: Mic, color: '#E74C3C', title: { fr: 'Expression orale', en: 'Speaking' } }
  ]

  return null
}