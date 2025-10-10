"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Flame, 
  TrendingUp, 
  BookOpen, 
  Target, 
  Play, 
  Clock,
  Star,
  ArrowRight,
  Zap,
  Trophy,
  Brain
} from "lucide-react"
import { useLang } from "./language-provider"
import { useSession } from "./use-session"
import Link from "next/link"

interface LearningStats {
  streak: number
  progress: number
  coursesCompleted: number
  testsCompleted: number
  timeStudied: string
  level: number
  xp: number
}

interface QuickAction {
  id: string
  title: { fr: string; en: string }
  description: { fr: string; en: string }
  progress?: number
  duration: string
  difficulty: "Facile" | "Moyen" | "Difficile"
  icon: React.ReactNode
  href: string
  color: string
}

interface DailyChallenge {
  id: string
  title: { fr: string; en: string }
  description: { fr: string; en: string }
  reward: { fr: string; en: string }
  duration: string
  difficulty: "Facile" | "Moyen" | "Difficile"
  completed: boolean
  progress: number
}

export default function HeroDashboard() {
  const { t, lang } = useLang()
  const { user, isAuthenticated } = useSession()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Mock data - will be replaced with real API calls
  const [stats, setStats] = useState<LearningStats>({
    streak: 7,
    progress: 85,
    coursesCompleted: 3,
    testsCompleted: 12,
    timeStudied: "2h 30m",
    level: 5,
    xp: 1250
  })

  const [quickActions] = useState<QuickAction[]>([
    {
      id: "continue-course",
      title: { fr: "Français de Base", en: "Basic French" },
      description: { fr: "Continuez votre leçon", en: "Continue your lesson" },
      progress: 65,
      duration: "15 min",
      difficulty: "Facile",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/cours/francais-de-base",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "listening-practice",
      title: { fr: "Écoute Active", en: "Active Listening" },
      description: { fr: "Pratiquez votre compréhension", en: "Practice your comprehension" },
      duration: "10 min",
      difficulty: "Moyen",
      icon: <Play className="h-5 w-5" />,
      href: "/practice/listening",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "vocabulary-challenge",
      title: { fr: "Défi Vocabulaire", en: "Vocabulary Challenge" },
      description: { fr: "Apprenez 20 nouveaux mots", en: "Learn 20 new words" },
      duration: "8 min",
      difficulty: "Facile",
      icon: <Brain className="h-5 w-5" />,
      href: "/challenges/vocabulary",
      color: "from-purple-500 to-pink-500"
    }
  ])

  const [dailyChallenge] = useState<DailyChallenge>({
    id: "daily-numbers",
    title: { fr: "Défi Quotidien: Les Nombres", en: "Daily Challenge: Numbers" },
    description: { fr: "Maîtrisez les nombres français de 1 à 100", en: "Master French numbers from 1 to 100" },
    reward: { fr: "50 XP + Badge Nombres", en: "50 XP + Numbers Badge" },
    duration: "5 min",
    difficulty: "Facile",
    completed: false,
    progress: 0
  })

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted || !isAuthenticated || !user) {
    return null
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return { fr: "Bonjour", en: "Good morning" }
    if (hour < 18) return { fr: "Bon après-midi", en: "Good afternoon" }
    return { fr: "Bonsoir", en: "Good evening" }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Facile": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "Moyen": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "Difficile": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {greeting[lang]}, {user.firstName}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("Prêt à continuer votre apprentissage du français ?", "Ready to continue your French learning?")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.streak}</div>
            <div className="text-sm text-muted-foreground">
              {t("jours de suite", "day streak")}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.progress}%</div>
            <div className="text-sm text-muted-foreground">
              {t("progression", "progress")}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.coursesCompleted}</div>
            <div className="text-sm text-muted-foreground">
              {t("cours terminés", "courses completed")}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.testsCompleted}</div>
            <div className="text-sm text-muted-foreground">
              {t("tests réussis", "tests passed")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {t("🚀 Continuez votre apprentissage", "🚀 Continue Learning")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <Badge className={getDifficultyColor(action.difficulty)}>
                    {action.difficulty}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-foreground mb-1">
                  {action.title[lang]}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {action.description[lang]}
                </p>
                
                {action.progress && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t("Progression", "Progress")}</span>
                      <span className="text-foreground font-medium">{action.progress}%</span>
                    </div>
                    <Progress value={action.progress} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {action.duration}
                  </div>
                  <Button size="sm" className="group-hover:bg-primary/90 transition-colors">
                    {t("Continuer", "Continue")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Daily Challenge */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white mr-3">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t("💡 Défi Quotidien", "💡 Daily Challenge")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("Relevez le défi du jour et gagnez des récompenses !", "Take today's challenge and earn rewards!")}
                </p>
              </div>
            </div>
            <Badge className={getDifficultyColor(dailyChallenge.difficulty)}>
              {dailyChallenge.difficulty}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">
              {dailyChallenge.title[lang]}
            </h4>
            <p className="text-sm text-muted-foreground">
              {dailyChallenge.description[lang]}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {dailyChallenge.duration}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 mr-1" />
                  {dailyChallenge.reward[lang]}
                </div>
              </div>
              
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                {dailyChallenge.completed ? t("Terminé", "Completed") : t("Commencer", "Start")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
