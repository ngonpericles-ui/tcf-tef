"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  BookOpen,
  Clock,
  Star,
  BarChart3
} from "lucide-react"
import { useLang } from "./language-provider"
import { useSession } from "./use-session"

interface WeeklyProgress {
  week: string
  hours: number
  lessons: number
  tests: number
  streak: number
}

interface LearningGoal {
  id: string
  title: { fr: string; en: string }
  target: number
  current: number
  unit: string
  deadline: string
  priority: "high" | "medium" | "low"
}

export default function LearningProgress() {
  const { t, lang } = useLang()
  const { user, isAuthenticated } = useSession()
  const [mounted, setMounted] = useState(false)

  // Mock data - will be replaced with real API calls
  const [weeklyData] = useState<WeeklyProgress[]>([
    { week: "Sem 1", hours: 8, lessons: 12, tests: 3, streak: 5 },
    { week: "Sem 2", hours: 12, lessons: 18, tests: 5, streak: 7 },
    { week: "Sem 3", hours: 10, lessons: 15, tests: 4, streak: 6 },
    { week: "Sem 4", hours: 14, lessons: 20, tests: 6, streak: 8 },
  ])

  const [goals] = useState<LearningGoal[]>([
    {
      id: "vocabulary",
      title: { fr: "Vocabulaire", en: "Vocabulary" },
      target: 500,
      current: 320,
      unit: "mots",
      deadline: "2024-12-31",
      priority: "high"
    },
    {
      id: "listening",
      title: { fr: "Compréhension orale", en: "Listening Comprehension" },
      target: 20,
      current: 12,
      unit: "heures",
      deadline: "2024-11-30",
      priority: "medium"
    },
    {
      id: "grammar",
      title: { fr: "Grammaire", en: "Grammar" },
      target: 50,
      current: 35,
      unit: "leçons",
      deadline: "2024-12-15",
      priority: "high"
    }
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isAuthenticated || !user) {
    return null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔴"
      case "medium": return "🟡"
      case "low": return "🟢"
      default: return "⚪"
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            {t("Vos Progrès", "Your Progress")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Activity */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {t("Activité Hebdomadaire", "Weekly Activity")}
              </h4>
              <div className="space-y-2">
                {weeklyData.slice(-4).map((week, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{week.week}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((week.hours / 15) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{week.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Streak */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("Série Actuelle", "Current Streak")}
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-1">
                  {weeklyData[weeklyData.length - 1]?.streak || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("jours consécutifs", "consecutive days")}
                </p>
                <div className="mt-2">
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                    🔥 {t("En feu !", "On fire!")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* This Week's Stats */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">
                {t("Cette Semaine", "This Week")}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {t("Temps", "Time")}
                  </span>
                  <span className="font-medium">{weeklyData[weeklyData.length - 1]?.hours || 0}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {t("Leçons", "Lessons")}
                  </span>
                  <span className="font-medium">{weeklyData[weeklyData.length - 1]?.lessons || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {t("Tests", "Tests")}
                  </span>
                  <span className="font-medium">{weeklyData[weeklyData.length - 1]?.tests || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            {t("Objectifs d'Apprentissage", "Learning Goals")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (goal.current / goal.target) * 100
              const isCompleted = progress >= 100
              
              return (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-foreground">
                        {goal.title[lang]}
                      </h4>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {getPriorityIcon(goal.priority)} {goal.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target} {goal.unit}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(progress, 100)} 
                      className={`h-3 ${isCompleted ? 'bg-green-500' : ''}`}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("Échéance", "Deadline")}: {new Date(goal.deadline).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                      <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-foreground'}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex items-center text-green-600">
                      <Award className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">
                        {t("Objectif atteint !", "Goal achieved!")} 🎉
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
