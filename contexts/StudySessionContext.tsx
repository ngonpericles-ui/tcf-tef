"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { apiClient } from "@/lib/api-client"

interface StudySessionData {
  isActive: boolean
  currentDuration: number
  totalTimeToday: number
  progress: number
  targetTime?: number
  isRunning?: boolean
  startTime?: string
  endTime?: string
  dailyGoal?: number
}

interface StudySessionContextType {
  studySession: StudySessionData | null
  studyTimer: number
  isTimerRunning: boolean
  loading: boolean
  startStudySession: (targetTime?: number) => Promise<void>
  stopStudySession: () => Promise<void>
  resetStudySession: () => Promise<void>
  fetchStudySession: () => Promise<void>
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined)

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const [studySession, setStudySession] = useState<StudySessionData | null>(null)
  const [studyTimer, setStudyTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchStudySession = async () => {
    try {
      const response = await apiClient.get('/home/study-session')
      if (response.success) {
        const sessionData = response.data as StudySessionData
        setStudySession(sessionData)
        if (sessionData.isActive) {
          setIsTimerRunning(true)
          // Start timer from 0 for new sessions
          setStudyTimer(0)
        }
      }
    } catch (error) {
      console.error('Error fetching study session:', error)
    }
  }

  const startStudySession = async (targetTime?: number) => {
    try {
      setLoading(true)
      const response = await apiClient.post('/home/study-session/start', {
        targetTime: targetTime
      })
      if (response.success) {
        setStudySession(response.data as StudySessionData)
        setIsTimerRunning(true)
        // Always start timer from 0 when starting a new session
        setStudyTimer(0)
      }
    } catch (error) {
      console.error('Error starting study session:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopStudySession = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post('/home/study-session/stop')
      if (response.success) {
        setStudySession(response.data as StudySessionData)
        setIsTimerRunning(false)
      }
    } catch (error) {
      console.error('Error stopping study session:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetStudySession = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post('/home/study-session/reset')
      if (response.success) {
        setStudySession(response.data as StudySessionData)
        setIsTimerRunning(false)
        setStudyTimer(0)
      }
    } catch (error) {
      console.error('Error resetting study session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Timer effect - countdown from target time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerRunning && studySession?.targetTime) {
      // Start countdown from target time
      setStudyTimer(studySession.targetTime)
      
      interval = setInterval(() => {
        setStudyTimer((prev) => {
          if (prev <= 1) {
            // Timer reached 0 - objective achieved
            setIsTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, studySession?.targetTime])

  // Sync with backend every 30 seconds when timer is running
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null
    
    if (isTimerRunning) {
      syncInterval = setInterval(() => {
        fetchStudySession()
      }, 30000)
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval)
    }
  }, [isTimerRunning])

  const value: StudySessionContextType = {
    studySession,
    studyTimer,
    isTimerRunning,
    loading,
    startStudySession,
    stopStudySession,
    resetStudySession,
    fetchStudySession
  }

  return (
    <StudySessionContext.Provider value={value}>
      {children}
    </StudySessionContext.Provider>
  )
}

export function useStudySession() {
  const context = useContext(StudySessionContext)
  if (context === undefined) {
    throw new Error('useStudySession must be used within a StudySessionProvider')
  }
  return context
}
