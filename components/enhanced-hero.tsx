"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee,
  Target,
  Zap,
  Trophy,
  Clock,
  BookOpen,
  Headphones,
  ArrowRight,
  Sparkles,
  Timer
} from "lucide-react"
import { useLang } from "./language-provider"
import { useSession } from "./use-session"
import { useStudySession } from "@/contexts/StudySessionContext"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"
import Image from "next/image"

// Daily challenges will be fetched from backend

const ambientBackgrounds = [
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1400&auto=format&fit=crop", // Library
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1400&auto=format&fit=crop", // Cafe
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1400&auto=format&fit=crop", // Nature
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1400&auto=format&fit=crop"  // Modern workspace
]

export default function EnhancedHero() {
  const { t, lang } = useLang()
  const { user, isAuthenticated } = useSession()
  const { 
    studySession, 
    studyTimer, 
    isTimerRunning, 
    loading, 
    startStudySession, 
    stopStudySession, 
    resetStudySession 
  } = useStudySession()
  const [dailyChallenges, setDailyChallenges] = useState<any[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [currentBackground, setCurrentBackground] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showTimeSetter, setShowTimeSetter] = useState(false)
  const [selectedMinutes, setSelectedMinutes] = useState(15)
  const [selectedSeconds, setSelectedSeconds] = useState(0)
  const [challengesLoading, setChallengesLoading] = useState(true)

  // Function declarations (moved before useEffect to avoid hoisting issues)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetTime = () => {
    setShowTimeSetter(true)
  }

  const handleConfirmTime = async () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds
    setShowTimeSetter(false)
    // Start session with the defined time
    try {
      const response = await apiClient.post('/home/study-session/start', {
        targetTime: totalSeconds
      })
      if (response.success) {
        // Update the study session context with the target time
        await startStudySession(totalSeconds)
      }
    } catch (error) {
      console.error('Error starting study session:', error)
    }
  }

  const handleCancelTime = () => {
    
    setShowTimeSetter(false)
  }

  const fetchDailyChallenges = async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !user) {
      setChallengesLoading(false)
      return
    }

    try {
      setChallengesLoading(true)
      const response = await apiClient.get('/challenges/daily')
      if (response.success) {
        const challenges = (response.data as any[]).map((challenge: any) => ({
          ...challenge,
          icon: challenge.category === 'vocabulary' ? <BookOpen className="h-5 w-5" /> :
                challenge.category === 'listening' ? <Headphones className="h-5 w-5" /> :
                <Zap className="h-5 w-5" />,
          color: challenge.category === 'vocabulary' ? "from-green-500/10 to-emerald-500/10" :
                 challenge.category === 'listening' ? "from-blue-500/10 to-cyan-500/10" :
                 "from-purple-500/10 to-pink-500/10",
          borderColor: challenge.category === 'vocabulary' ? "border-green-500/20" :
                      challenge.category === 'listening' ? "border-blue-500/20" :
                      "border-purple-500/20"
        }))
        setDailyChallenges(challenges)
        if (challenges.length > 0) {
          setSelectedChallenge(challenges[0])
        }
      }
    } catch (error) {
      console.error('Error fetching daily challenges:', error)
      // Don't show error to user, just silently fail
    } finally {
      setChallengesLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    // Change background every 30 seconds
    const bgInterval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % ambientBackgrounds.length)
    }, 30000)

    return () => clearInterval(bgInterval)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDailyChallenges()
    }
  }, [isAuthenticated, user])

  if (!mounted) {
    return null
  }

  return (
    <section className="py-10 relative overflow-hidden">
      {/* Section Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          key={ambientBackgrounds[currentBackground]}
          src={ambientBackgrounds[currentBackground]}
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
        {/* Readability overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background/90" />
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Study Timer Card */}
        <Card className="lg:col-span-1 overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="relative h-48 overflow-hidden">
            <Image
              src={ambientBackgrounds[currentBackground]}
              alt="Study Environment"
              fill
              className="object-cover transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            
            {/* Timer Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="text-center space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {lang === "fr" ? "Session d'étude" : "Study Session"}
                  </span>
                </div>
                
                {/* Timer removed - now in Temps d'étude aujourd'hui */}
                
                <div className="flex items-center gap-2">
                  {!studySession?.isActive ? (
                    <Button
                      size="sm"
                      onClick={handleSetTime}
                      disabled={loading}
                      className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                    >
                      <Timer className="h-4 w-4" />
                      {lang === "fr" ? "Définir mon temps" : "Set My Time"}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      {!isTimerRunning ? (
                        <Button
                          size="sm"
                          onClick={() => startStudySession()}
                          disabled={loading}
                          className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                        >
                          {loading ? <Timer className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          {lang === "fr" ? "Commencer session" : "Start Session"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={stopStudySession}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          {loading ? <Timer className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                          {lang === "fr" ? "Arrêter" : "Stop"}
                        </Button>
                      )}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetStudySession}
                    disabled={loading}
                    className="border-white/60 text-white hover:bg-white/10 dark:border-white/60 dark:text-white dark:hover:bg-white/10 bg-white/10 text-black hover:bg-white/20 dark:bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {lang === "fr" ? "Objectif quotidien" : "Daily Goal"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {studySession?.targetTime ? 
                      `${Math.floor(studySession.targetTime / 60)}:${(studySession.targetTime % 60).toString().padStart(2, '0')}` : 
                      ''
                    }
                  </span>
                  {studySession?.isActive && !isTimerRunning && (
                    <Button
                      size="sm"
                      onClick={() => startStudySession()}
                      disabled={loading}
                      className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black text-xs px-2 py-1"
                    >
                      {loading ? <Timer className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      {lang === "fr" ? "Continuer" : "Continue"}
                    </Button>
                  )}
                </div>
              </div>
              
              <Progress value={studySession?.progress || (studyTimer / 900) * 100} className="h-2" />
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coffee className="h-3 w-3" />
                <span>
                  {lang === "fr" 
                    ? "Prenez une pause toutes les 25 minutes" 
                    : "Take a break every 25 minutes"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Challenge Card */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-[#2ECC71]" />
                    <h3 className="text-xl font-bold">
                      {lang === "fr" ? "Défi du jour" : "Daily Challenge"}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lang === "fr" 
                      ? "Complétez votre défi quotidien pour gagner des récompenses"
                      : "Complete your daily challenge to earn rewards"
                    }
                  </p>
                </div>
                
                <Badge className="bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/20">
                  {lang === "fr" ? "Nouveau" : "New"}
                </Badge>
              </div>

              {/* Challenge Selection */}
              <div className="grid md:grid-cols-3 gap-3">
                {challengesLoading ? (
                  <div className="col-span-3 text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2ECC71] mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {lang === "fr" ? "Chargement des défis..." : "Loading challenges..."}
                    </p>
                  </div>
                ) : dailyChallenges.length > 0 ? dailyChallenges.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => setSelectedChallenge(challenge)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      selectedChallenge.id === challenge.id
                        ? `bg-gradient-to-br ${challenge.color} ${challenge.borderColor} border-2`
                        : "border-gray-200 dark:border-gray-700 bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {challenge.icon}
                      <span className="font-semibold text-sm">
                        {lang === "fr" ? challenge.title.fr : challenge.title.en}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {lang === "fr" ? challenge.description.fr : challenge.description.en}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {challenge.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {challenge.duration}
                        </span>
                      </div>
                    </div>
                  </button>
                )) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {lang === "fr" ? "Aucun défi disponible" : "No challenges available"}
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Challenge Details */}
              {selectedChallenge && (
                <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedChallenge.color} border ${selectedChallenge.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">
                      {lang === "fr" ? selectedChallenge.title.fr : selectedChallenge.title.en}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {lang === "fr" ? selectedChallenge.description.fr : selectedChallenge.description.en}
                    </p>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#2ECC71]" />
                      <span className="text-sm font-medium">
                        {lang === "fr" ? selectedChallenge.reward.fr : selectedChallenge.reward.en}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black gap-2">
                      <Play className="h-4 w-4" />
                      {lang === "fr" ? "Commencer" : "Start"}
                    </Button>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {selectedChallenge.duration}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Link href="/tests">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Target className="h-4 w-4" />
                    {lang === "fr" ? "Tests rapides" : "Quick Tests"}
                  </Button>
                </Link>
                <Link href="/cours">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    {lang === "fr" ? "Continuer le cours" : "Continue Course"}
                  </Button>
                </Link>
                <Link href="/live">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Headphones className="h-4 w-4" />
                    {lang === "fr" ? "Session live" : "Live Session"}
                  </Button>
                </Link>
                <Link href="/tests/all">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    {lang === "fr" ? "Voir tout" : "View All"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Setter Modal */}
      {showTimeSetter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {lang === "fr" ? "Définir votre temps d'étude" : "Set Your Study Time"}
                </h3>
                <p className="text-muted-foreground">
                  {lang === "fr" ? "Combien de temps voulez-vous étudier aujourd'hui ?" : "How long do you want to study today?"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <label className="text-sm font-medium mb-2 block">
                    {lang === "fr" ? "Minutes" : "Minutes"}
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMinutes(Math.max(0, selectedMinutes - 5))}
                      disabled={selectedMinutes <= 0}
                    >
                      -
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">
                      {selectedMinutes}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMinutes(Math.min(120, selectedMinutes + 5))}
                      disabled={selectedMinutes >= 120}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <label className="text-sm font-medium mb-2 block">
                    {lang === "fr" ? "Secondes" : "Seconds"}
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSeconds(Math.max(0, selectedSeconds - 15))}
                      disabled={selectedSeconds <= 0}
                    >
                      -
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">
                      {selectedSeconds.toString().padStart(2, '0')}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSeconds(Math.min(59, selectedSeconds + 15))}
                      disabled={selectedSeconds >= 59}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-[#2ECC71]">
                  {lang === "fr" ? "Temps total:" : "Total time:"} {selectedMinutes}:{selectedSeconds.toString().padStart(2, '0')}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelTime}
                  className="flex-1"
                >
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <Button
                  onClick={handleConfirmTime}
                  className="flex-1 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                >
                  {lang === "fr" ? "Confirmer" : "Confirm"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}
