"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Headphones, 
  MessageSquare, 
  Users, 
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  Zap
} from "lucide-react"
import { useLang } from "./language-provider"
import { useSession } from "./use-session"
import Link from "next/link"

interface Recommendation {
  id: string
  type: "course" | "practice" | "social" | "challenge"
  title: { fr: string; en: string }
  description: { fr: string; en: string }
  difficulty: "Facile" | "Moyen" | "Difficile"
  duration: string
  rating: number
  participants?: number
  progress?: number
  isNew?: boolean
  isTrending?: boolean
  icon: React.ReactNode
  color: string
  href: string
}

interface PersonalizedInsight {
  id: string
  type: "strength" | "improvement" | "achievement" | "tip"
  title: { fr: string; en: string }
  description: { fr: string; en: string }
  action?: { fr: string; en: string }
  href?: string
  icon: React.ReactNode
  color: string
}

export default function SmartRecommendations() {
  const { t, lang } = useLang()
  const { user, isAuthenticated } = useSession()
  const [mounted, setMounted] = useState(false)

  // Mock data - will be replaced with real API calls
  const [recommendations] = useState<Recommendation[]>([
    {
      id: "advanced-grammar",
      type: "course",
      title: { fr: "Grammaire Avancée", en: "Advanced Grammar" },
      description: { fr: "Maîtrisez les temps composés et le subjonctif", en: "Master compound tenses and subjunctive" },
      difficulty: "Difficile",
      duration: "45 min",
      rating: 4.8,
      progress: 0,
      isNew: true,
      icon: <BookOpen className="h-5 w-5" />,
      color: "from-blue-500 to-cyan-500",
      href: "/cours/grammaire-avancee"
    },
    {
      id: "french-conversation",
      type: "social",
      title: { fr: "Conversation Française", en: "French Conversation" },
      description: { fr: "Pratiquez avec des natifs en temps réel", en: "Practice with native speakers in real-time" },
      difficulty: "Moyen",
      duration: "30 min",
      rating: 4.9,
      participants: 12,
      isTrending: true,
      icon: <Users className="h-5 w-5" />,
      color: "from-green-500 to-emerald-500",
      href: "/live/conversation"
    },
    {
      id: "listening-mastery",
      type: "practice",
      title: { fr: "Maîtrise de l'Écoute", en: "Listening Mastery" },
      description: { fr: "Améliorez votre compréhension orale", en: "Improve your listening comprehension" },
      difficulty: "Moyen",
      duration: "25 min",
      rating: 4.7,
      progress: 60,
      icon: <Headphones className="h-5 w-5" />,
      color: "from-purple-500 to-pink-500",
      href: "/practice/listening"
    },
    {
      id: "vocabulary-challenge",
      type: "challenge",
      title: { fr: "Défi Vocabulaire Express", en: "Express Vocabulary Challenge" },
      description: { fr: "Apprenez 50 mots en 15 minutes", en: "Learn 50 words in 15 minutes" },
      difficulty: "Facile",
      duration: "15 min",
      rating: 4.6,
      icon: <Zap className="h-5 w-5" />,
      color: "from-orange-500 to-red-500",
      href: "/challenges/vocabulary-express"
    }
  ])

  const [insights] = useState<PersonalizedInsight[]>([
    {
      id: "strength-grammar",
      type: "strength",
      title: { fr: "Votre Point Fort", en: "Your Strength" },
      description: { fr: "Vous excellez en grammaire française !", en: "You excel at French grammar!" },
      action: { fr: "Continuez avec des cours avancés", en: "Continue with advanced courses" },
      href: "/cours/grammaire-avancee",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "improvement-pronunciation",
      type: "improvement",
      title: { fr: "Zone d'Amélioration", en: "Improvement Area" },
      description: { fr: "Votre prononciation peut être améliorée", en: "Your pronunciation can be improved" },
      action: { fr: "Pratiquez avec des exercices de phonétique", en: "Practice with phonetic exercises" },
      href: "/practice/pronunciation",
      icon: <Target className="h-5 w-5" />,
      color: "from-yellow-500 to-orange-500"
    },
    {
      id: "achievement-streak",
      type: "achievement",
      title: { fr: "Nouvel Accomplissement", en: "New Achievement" },
      description: { fr: "7 jours consécutifs d'apprentissage !", en: "7 consecutive days of learning!" },
      icon: <Star className="h-5 w-5" />,
      color: "from-purple-500 to-pink-500"
    }
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isAuthenticated || !user) {
    return null
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Facile": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "Moyen": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "Difficile": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course": return "📚"
      case "practice": return "🎯"
      case "social": return "👥"
      case "challenge": return "⚡"
      default: return "📖"
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength": return "💪"
      case "improvement": return "📈"
      case "achievement": return "🏆"
      case "tip": return "💡"
      default: return "ℹ️"
    }
  }

  return (
    <div className="space-y-6">
      {/* Personalized Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
            {t("💡 Insights Personnalisés", "💡 Personalized Insights")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-white/20">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${insight.color} text-white`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground text-sm">
                        {insight.title[lang]}
                      </h4>
                      <span className="text-lg">{getInsightIcon(insight.type)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description[lang]}
                    </p>
                    {insight.action && (
                      <Button size="sm" variant="outline" className="text-xs">
                        {insight.action[lang]}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            {t("Recommandé pour Vous", "Recommended for You")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${rec.color} text-white`}>
                      {rec.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      {rec.isNew && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Nouveau
                        </Badge>
                      )}
                      {rec.isTrending && (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                          🔥 Trending
                        </Badge>
                      )}
                      <Badge className={getDifficultyColor(rec.difficulty)}>
                        {rec.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(rec.type)}</span>
                      <h3 className="font-semibold text-foreground">
                        {rec.title[lang]}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {rec.description[lang]}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {rec.duration}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                          {rec.rating}
                        </div>
                        {rec.participants && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {rec.participants}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {rec.progress && rec.progress > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{t("Progression", "Progress")}</span>
                          <span className="text-foreground font-medium">{rec.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${rec.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${rec.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-muted-foreground">
                        {t("Basé sur vos préférences", "Based on your preferences")}
                      </div>
                      <Button size="sm" className="group-hover:bg-primary/90 transition-colors">
                        {rec.progress && rec.progress > 0 ? t("Continuer", "Continue") : t("Commencer", "Start")}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
