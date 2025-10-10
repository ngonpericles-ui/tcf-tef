"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Sun, Moon, Sunrise, Sunset, Flame, Target } from "lucide-react"
import { useLang } from "./language-provider"
import { useSession } from "./use-session"
import { useStudySession } from "@/contexts/StudySessionContext"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

const motivationalQuotes = [
  {
    fr: "Chaque mot appris vous rapproche de vos rêves.",
    en: "Every word learned brings you closer to your dreams."
  },
  {
    fr: "La persévérance est la clé de la maîtrise du français.",
    en: "Perseverance is the key to mastering French."
  },
  {
    fr: "Votre accent n'est pas un défaut, c'est votre signature.",
    en: "Your accent isn't a flaw, it's your signature."
  },
  {
    fr: "Aujourd'hui est une nouvelle opportunité d'apprendre.",
    en: "Today is a new opportunity to learn."
  },
  {
    fr: "Le français vous ouvre les portes du monde.",
    en: "French opens doors to the world for you."
  }
]

export default function PersonalizedGreeting() {
  const { t, lang } = useLang()
  const { user, isAuthenticated } = useSession()
  const { studySession, studyTimer, startStudySession, loading } = useStudySession()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [aiMessages, setAiMessages] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Function declarations (moved before useEffect to avoid hoisting issues)
  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/home/dashboard')
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchAIMessages = async () => {
    try {
      const response = await apiClient.get('/home/ai-messages')
      if (response.success) {
        setAiMessages(response.data)
      }
    } catch (error) {
      console.error('Error fetching AI messages:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
      fetchAIMessages()
    }
  }, [isAuthenticated, user])

  if (!mounted || !isAuthenticated || !user) {
    return null
  }

  const hour = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  const seconds = currentTime.getSeconds()

  // Time-based greeting
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) {
      return {
        greeting: lang === "fr" ? "Bon matin" : "Good morning",
        icon: <Sunrise className="h-5 w-5 text-orange-500" />,
        color: "from-orange-500/10 to-yellow-500/10",
        borderColor: "border-orange-500/20"
      }
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: lang === "fr" ? "Bon après-midi" : "Good afternoon",
        icon: <Sun className="h-5 w-5 text-yellow-500" />,
        color: "from-yellow-500/10 to-orange-500/10",
        borderColor: "border-yellow-500/20"
      }
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: lang === "fr" ? "Bonsoir" : "Good evening",
        icon: <Sunset className="h-5 w-5 text-orange-600" />,
        color: "from-orange-600/10 to-red-500/10",
        borderColor: "border-orange-600/20"
      }
    } else {
      return {
        greeting: lang === "fr" ? "Bonne nuit" : "Good night",
        icon: <Moon className="h-5 w-5 text-blue-500" />,
        color: "from-blue-500/10 to-purple-500/10",
        borderColor: "border-blue-500/20"
      }
    }
  }

  const timeInfo = getGreeting()
  const randomQuote = aiMessages?.motivation || motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  
  // Debug AI messages
  console.log('AI Messages:', aiMessages)
  console.log('Dashboard Data:', dashboardData)

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-US", {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: lang !== "fr"
    })
  }

  const formatDate = (time: Date) => {
    return time.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-background via-background to-muted/10 border-b border-gray-200 dark:border-gray-700">
      {/* Background Image (non-blurred), chosen per time of day */}
      <div className="absolute inset-0 -z-10">
        <img
          src={
            hour < 12
              ? "/images/greeting/day3.jpg"
              : hour < 18
                ? "/images/greeting/day1.jpg"
                : "/images/greeting/day4.jpg"
          }
          alt="Greeting background"
          className="w-full h-full object-cover"
        />
        {/* Readability overlays – dim for dark theme, normal for light theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/40 dark:from-background/70 dark:via-background/50 dark:to-background/70" />
      </div>

      {/* Subtle pattern on top */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "55px 24px",
        }}
      />
      
      <div className="container relative mx-auto max-w-screen-2xl px-4 md:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Greeting Card */}
          <Card className={`lg:col-span-2 p-6 bg-gradient-to-br ${timeInfo.color} border ${timeInfo.borderColor} hover:shadow-lg transition-all duration-300`}>
            <div className="space-y-4">
              {/* Greeting Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {timeInfo.icon}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {timeInfo.greeting}, <span className="text-[#2ECC71]">{user.firstName || "Apprenant"}</span>!
                    </h1>
                    <p className="text-muted-foreground">
                      {lang === "fr" ? "Prêt pour une nouvelle session d'apprentissage ?" : "Ready for a new learning session?"}
                    </p>
                  </div>
                </div>
                
                {/* Streak Badge */}
                <Badge className="bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/20 flex items-center gap-1 px-3 py-1">
                  <Flame className="h-4 w-4" />
                  <span className="font-semibold">{dashboardData?.daysOnPlatform || 1}</span> {lang === "fr" ? "jours" : "days"}
                </Badge>
              </div>

              {/* Motivational Quote */}
              <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-[#2ECC71] mt-0.5" />
                  <p className="text-sm italic text-muted-foreground">
                    "{typeof randomQuote === 'string' ? randomQuote : (lang === "fr" ? randomQuote.fr : randomQuote.en)}"
                  </p>
                </div>
              </div>

              {/* Today's Goals Preview */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#2ECC71]" />
                  <span>{lang === "fr" ? "Objectif du jour:" : "Today's goal:"}</span>
                  <span className="font-semibold">
                    {studySession?.targetTime ? 
                      `${Math.floor(studySession.targetTime / 60)}:${(studySession.targetTime % 60).toString().padStart(2, '0')}` : 
                      '15:00'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>{lang === "fr" ? "Tests complétés:" : "Tests completed:"}</span>
                  <span className="font-semibold">2/3</span>
                </div>
                {/* Continuer button moved to Objectif quotidien */}
              </div>
            </div>
          </Card>

          {/* Live Clock Card */}
          <Card className="p-6 text-center bg-card hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-[#2ECC71]" />
                <h2 className="font-semibold">{lang === "fr" ? "Heure actuelle" : "Current Time"}</h2>
              </div>
              
              {/* Digital Clock */}
              <div className="font-mono text-3xl md:text-4xl font-bold text-[#2ECC71] tracking-wider">
                {dashboardData?.regionalTime?.time || formatTime(currentTime)}
              </div>
              
              {/* Date */}
              <div className="text-sm text-muted-foreground capitalize">
                {dashboardData?.regionalTime?.date || formatDate(currentTime)}
              </div>

              {/* Study Time Indicator */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-muted-foreground mb-2">
                  {lang === "fr" ? "Temps d'étude aujourd'hui" : "Study time today"}
                </div>
                
                {/* Countdown Timer or Achievement Message */}
                {studySession?.isActive && studySession?.targetTime ? (
                  studyTimer <= 0 ? (
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#2ECC71] mb-2">
                        🎉 {lang === "fr" ? "Objectif atteint!" : "Goal achieved!"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lang === "fr" ? "Félicitations! Vous avez terminé votre session d'étude." : "Congratulations! You've completed your study session."}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold text-[#2ECC71] tracking-wider">
                        {Math.floor(studyTimer / 60)}:{(studyTimer % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {lang === "fr" ? "Temps restant" : "Time remaining"}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-lg font-semibold text-foreground">
                    {studySession?.totalTimeToday ? 
                      `${Math.floor(studySession.totalTimeToday / (1000 * 60 * 60))}h ${Math.floor((studySession.totalTimeToday % (1000 * 60 * 60)) / (1000 * 60))}min` : 
                      '0h 0min'
                    }
                  </div>
                )}
                
                {/* Progress Bar */}
                {studySession?.isActive && studySession?.targetTime && studyTimer > 0 && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-[#2ECC71] h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(0, ((studySession.targetTime - studyTimer) / studySession.targetTime) * 100)}%` }}
                    ></div>
                  </div>
                )}
                
                {/* Goal Display */}
                {studySession?.targetTime && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {lang === "fr" ? "Objectif: " : "Goal: "}
                    {Math.floor(studySession.targetTime / 60)}:{(studySession.targetTime % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
