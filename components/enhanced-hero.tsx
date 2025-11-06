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
  const [currentBackground, setCurrentBackground] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showTimeSetter, setShowTimeSetter] = useState(false)
  const [selectedMinutes, setSelectedMinutes] = useState(15)
  const [selectedSeconds, setSelectedSeconds] = useState(0)
  const [dailyGoal, setDailyGoal] = useState<any>(null)
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState(30)
  const [goalLoading, setGoalLoading] = useState(false)
  const [selectedChallengeType, setSelectedChallengeType] = useState<string | null>(null)
  const [isChallengeStarted, setIsChallengeStarted] = useState(false)

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

  // Challenge type templates for students to choose from (UI templates only - NOT mock data)
  const challengeTemplates = [
    {
      id: 'vocabulary',
      icon: <BookOpen className="h-5 w-5" />,
      title: { fr: 'Défi Vocabulaire Express', en: 'Express Vocabulary Challenge' },
      description: { fr: 'Apprenez 10 nouveaux mots en 5 minutes', en: 'Learn 10 new words in 5 minutes' },
      suggestedTime: 5,
      difficulty: { fr: 'Facile', en: 'Easy' }
    },
    {
      id: 'listening',
      icon: <Headphones className="h-5 w-5" />,
      title: { fr: 'Écoute Active', en: 'Active Listening' },
      description: { fr: 'Compréhension orale avec audio natif', en: 'Oral comprehension with native audio' },
      suggestedTime: 10,
      difficulty: { fr: 'Moyen', en: 'Medium' }
    },
    {
      id: 'expression',
      icon: <Zap className="h-5 w-5" />,
      title: { fr: 'Expression Rapide', en: 'Quick Expression' },
      description: { fr: 'Construisez 5 phrases complexes', en: 'Build 5 complex sentences' },
      suggestedTime: 15,
      difficulty: { fr: 'Difficile', en: 'Difficult' }
    }
  ]

  // Use challenge template to set goal
  const useChallengeTemplate = (template: typeof challengeTemplates[0]) => {
    setSelectedChallengeType(template.id)
    setGoalTitle(lang === 'fr' ? template.title.fr : template.title.en)
    setGoalTarget(template.suggestedTime)
    setShowGoalEditor(true)
  }

  useEffect(() => {
    setMounted(true)
    // Change background every 30 seconds
    const bgInterval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % ambientBackgrounds.length)
    }, 30000)

    return () => clearInterval(bgInterval)
  }, [])

  // Fetch daily goal - REAL DATA ONLY, NO MOCK DATA
  const fetchDailyGoal = async () => {
    if (!isAuthenticated || !user) return

    try {
      const response = await apiClient.get('/daily-goals/today').catch(() => null)
      if (response && response.success && response.data) {
        const goalData = response.data as any
        setDailyGoal(goalData)
        setGoalTitle(goalData.title || '')
        setGoalTarget(goalData.targetValue || 30)
        // Reset selection if goal exists
        if (goalData && !goalData.isCompleted) {
          setSelectedChallengeType(null)
        }
      } else {
        // No goal set - this is fine, user needs to create one
        setDailyGoal(null)
        setSelectedChallengeType(null) // Reset selection when no goal
      }
    } catch (error) {
      console.error('Error fetching daily goal:', error)
      // On error, no goal set - no mock data
      setDailyGoal(null)
      setSelectedChallengeType(null) // Reset selection on error
    }
  }

  // Save daily goal
  const saveDailyGoal = async () => {
    if (!goalTitle.trim()) return

    setGoalLoading(true)
    try {
      // XP reward is calculated based on difficulty/target - not fixed
      const xpReward = Math.max(30, Math.floor(goalTarget * 1.5)) // Base: 1.5 XP per minute, minimum 30
      
      const response = await apiClient.post('/daily-goals/set', {
        title: goalTitle,
        targetValue: goalTarget,
        unit: 'minutes',
        xpReward: xpReward
      })

      if (response && response.success) {
        setDailyGoal(response.data)
        setShowGoalEditor(false)
        setIsChallengeStarted(false)
        setSelectedChallengeType(null) // Reset selection after saving
      }
    } catch (error) {
      console.error('Error saving daily goal:', error)
    } finally {
      setGoalLoading(false)
    }
  }

  // Complete daily goal - only when actually completed
  const completeDailyGoal = async () => {
    if (!dailyGoal || (dailyGoal as any).isCompleted) return
    
    setGoalLoading(true)
    try {
      const response = await apiClient.post('/daily-goals/complete')
      if (response && response.success) {
        setDailyGoal(response.data)
        setIsChallengeStarted(false)
        // XP is awarded automatically by backend when completing
      }
    } catch (error) {
      console.error('Error completing goal:', error)
    } finally {
      setGoalLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDailyGoal()
    } else {
      // Reset states when not authenticated
      setDailyGoal(null)
      setSelectedChallengeType(null)
    }
  }, [isAuthenticated, user])

  // Sync study session progress with daily goal when challenge is started
  useEffect(() => {
    if (dailyGoal && isChallengeStarted && studySession?.isActive && !(dailyGoal as any).isCompleted) {
      // Timer counts DOWN, so calculate progress from elapsed time
      // If targetTime is 30 minutes (1800s) and timer is at 10 minutes (600s) left, then 20 minutes elapsed
      const goal = dailyGoal as any
      const elapsedSeconds = (goal.targetValue * 60) - studyTimer
      const progressMinutes = Math.max(0, Math.floor(elapsedSeconds / 60))
      
      // Only update if progress increased (debounce)
      if (progressMinutes > goal.currentValue && progressMinutes <= goal.targetValue) {
        apiClient.put('/daily-goals/progress', {
          progressValue: progressMinutes
        }).then(response => {
          if (response && response.success && response.data) {
            const updatedGoal = response.data as any
            setDailyGoal(updatedGoal)
            // Auto-complete if target reached (progress = 100%)
            if (updatedGoal && updatedGoal.progress >= 100 && !updatedGoal.isCompleted) {
              completeDailyGoal()
            }
          }
        }).catch(() => {})
      }
    }
  }, [studyTimer, dailyGoal, studySession, isChallengeStarted])

  // Start challenge - begins tracking progress
  const startChallenge = async () => {
    if (!dailyGoal) {
      // First set a goal
      setShowGoalEditor(true)
      return
    }

    setIsChallengeStarted(true)
    
    // Start study session with the goal's target time (countdown timer)
    const goal = dailyGoal as any
    const targetSeconds = goal.targetValue * 60 // Convert minutes to seconds
    try {
      await startStudySession(targetSeconds)
      // Initialize progress to 0 when starting
      await apiClient.put('/daily-goals/progress', {
        progressValue: 0
      }).then(response => {
        if (response && response.success) {
          setDailyGoal(response.data)
        }
      })
    } catch (error) {
      console.error('Error starting challenge:', error)
      setIsChallengeStarted(false)
    }
  }

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

        {/* Défi du jour Card - Student's Daily Goal */}
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
                {!dailyGoal && (
                <Badge className="bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/20">
                  {lang === "fr" ? "Nouveau" : "New"}
                </Badge>
                )}
              </div>

              {/* Challenge Type Selection - ALWAYS show ALL 3 options when no active goal */}
              {(!dailyGoal || (dailyGoal as any).isCompleted) && (
                <>
                  {/* Always show the 3 challenge type cards */}
                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    {challengeTemplates.map((template) => (
                  <button
                        key={template.id}
                        onClick={() => useChallengeTemplate(template)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                          selectedChallengeType === template.id
                            ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 border-2'
                            : 'border-gray-200 dark:border-gray-700 bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                          <div className={selectedChallengeType === template.id ? 'text-[#2ECC71]' : 'text-muted-foreground'}>
                            {template.icon}
                          </div>
                      <span className="font-semibold text-sm">
                            {lang === "fr" ? template.title.fr : template.title.en}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                            {lang === "fr" ? template.description.fr : template.description.en}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                              {template.difficulty ? (lang === "fr" ? template.difficulty.fr : template.difficulty.en) : ''}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                              {template.suggestedTime} min
                        </span>
                      </div>
                    </div>
                  </button>
                    ))}
                  </div>
                </>
              )}

              {/* Selected Challenge Details / Current Goal */}
              {dailyGoal && !(dailyGoal as any).isCompleted ? (
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{(dailyGoal as any).title || ''}</h4>
                      {(dailyGoal as any).description && (
                        <p className="text-sm text-muted-foreground mb-2">{(dailyGoal as any).description}</p>
                      )}
                      {/* Only show XP reward when completed */}
                      {(dailyGoal as any).isCompleted && (
                        <div className="flex items-center gap-2 mt-2">
                          <Trophy className="h-4 w-4 text-[#2ECC71]" />
                          <span className="text-sm font-medium">
                            {lang === "fr" ? "Récompense gagnée" : "Reward earned"}: +${(dailyGoal as any).xpReward || 0} XP
                          </span>
                  </div>
                )}
              </div>

                    <div className="flex flex-col gap-2 items-end">
                      {!(dailyGoal as any).isCompleted ? (
                        <>
                          {!isChallengeStarted ? (
                            <Button 
                              className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black gap-2"
                              onClick={startChallenge}
                              disabled={goalLoading || loading}
                            >
                              <Play className="h-4 w-4" />
                              {lang === "fr" ? "Commencer" : "Start"}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              onClick={() => setIsChallengeStarted(false)}
                              size="sm"
                            >
                              {lang === "fr" ? "Arrêter" : "Stop"}
                            </Button>
                          )}
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {(dailyGoal as any).targetValue || 0} {lang === "fr" ? "min" : "min"}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Badge className="bg-[#2ECC71] text-white">
                          {lang === "fr" ? "✓ Complété" : "✓ Completed"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar - Only show if started */}
                  {isChallengeStarted && !(dailyGoal as any).isCompleted && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-green-500/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {lang === "fr" ? "Progression" : "Progress"}
                        </span>
                        <span className="font-semibold">
                          {(dailyGoal as any).currentValue || 0} / {(dailyGoal as any).targetValue || 0} min
                        </span>
                      </div>
                      <Progress 
                        value={(dailyGoal as any).progress || 0} 
                        className="h-2" 
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Show selected template preview below the 3 cards - student can see preview and start */}
              {selectedChallengeType && (!dailyGoal || (dailyGoal as any).isCompleted) && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">
                        {lang === "fr" ? challengeTemplates.find(t => t.id === selectedChallengeType)?.title.fr : challengeTemplates.find(t => t.id === selectedChallengeType)?.title.en}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {lang === "fr" ? challengeTemplates.find(t => t.id === selectedChallengeType)?.description.fr : challengeTemplates.find(t => t.id === selectedChallengeType)?.description.en}
                      </p>
                      {/* XP reward hidden - only shown after completion */}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                      <Button 
                        className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black gap-2"
                        onClick={async () => {
                          await saveDailyGoal()
                          // After saving, the goal will be fetched and displayed
                        }}
                        disabled={goalLoading}
                      >
                        {goalLoading ? (
                          <Timer className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                      <Play className="h-4 w-4" />
                      {lang === "fr" ? "Commencer" : "Start"}
                          </>
                        )}
                    </Button>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                          {challengeTemplates.find(t => t.id === selectedChallengeType)?.suggestedTime} {lang === "fr" ? "min" : "min"}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              )}


              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
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
                    {lang === "fr" ? "→ Voir tout" : "→ See All"}
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

      {/* Goal Editor Dialog */}
      {showGoalEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowGoalEditor(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {lang === "fr" ? "Définir votre défi du jour" : "Set Your Daily Challenge"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {lang === "fr" 
                    ? "Définissez votre objectif d'étude pour aujourd'hui" 
                    : "Set your study goal for today"
                  }
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {lang === "fr" ? "Titre" : "Title"}
                  </label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder={lang === "fr" ? "Ex: Étudier 30 minutes" : "Ex: Study 30 minutes"}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {lang === "fr" ? "Objectif (minutes)" : "Target (minutes)"}
                  </label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(parseInt(e.target.value) || 30)}
                    min="1"
                    max="480"
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={saveDailyGoal}
                    disabled={goalLoading || !goalTitle.trim()}
                    className="flex-1 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                  >
                    {goalLoading ? (
                      <Timer className="h-4 w-4 animate-spin" />
                    ) : (
                      lang === "fr" ? "Sauvegarder" : "Save"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowGoalEditor(false)}
                    disabled={goalLoading}
                    className="flex-1"
                  >
                    {lang === "fr" ? "Annuler" : "Cancel"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
