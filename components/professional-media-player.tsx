"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward,
  Settings,
  Download,
  Share2,
  BookOpen,
  Brain,
  MessageSquare,
  Star,
  Clock,
  Users
} from "lucide-react"
import { useLang } from "@/components/language-provider"

interface MediaPlayerProps {
  src: string
  title: string
  description?: string
  duration?: number
  level?: string
  category?: string
  instructor?: string
  enrolledCount?: string
  rating?: number
  onProgress?: (progress: number) => void
  onComplete?: () => void
  aiFeatures?: boolean
}

export default function ProfessionalMediaPlayer({
  src,
  title,
  description,
  duration,
  level,
  category,
  instructor,
  enrolledCount,
  rating,
  onProgress,
  onComplete,
  aiFeatures = true
}: MediaPlayerProps) {
  const { lang } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiNotes, setAiNotes] = useState<string[]>([])
  const [aiQuestions, setAiQuestions] = useState<string[]>([])

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime / video.duration)
    }

    const updateDuration = () => {
      setTotalDuration(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onProgress, onComplete])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = (value[0] / 100) * totalDuration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0] / 100
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!isFullscreen) {
      video.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, totalDuration))
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const generateAiNotes = () => {
    // Simulate AI-generated notes based on current timestamp
    const notes = [
      t("Point clé: Utilisation du subjonctif après 'il faut que'", "Key point: Use of subjunctive after 'il faut que'"),
      t("Attention: Accord du participe passé avec l'auxiliaire être", "Note: Past participle agreement with auxiliary être"),
      t("Vocabulaire: Expressions idiomatiques courantes", "Vocabulary: Common idiomatic expressions"),
      t("Grammaire: Formation du conditionnel présent", "Grammar: Present conditional formation")
    ]
    setAiNotes(prev => [...prev, notes[Math.floor(Math.random() * notes.length)]])
  }

  const generateAiQuestion = () => {
    // Simulate AI-generated questions
    const questions = [
      t("Pouvez-vous expliquer la règle grammaticale mentionnée?", "Can you explain the grammar rule mentioned?"),
      t("Comment utiliseriez-vous cette expression dans une phrase?", "How would you use this expression in a sentence?"),
      t("Quelle est la différence avec la forme précédente?", "What's the difference with the previous form?"),
      t("Dans quel contexte utilise-t-on cette structure?", "In what context is this structure used?")
    ]
    setAiQuestions(prev => [...prev, questions[Math.floor(Math.random() * questions.length)]])
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-black rounded-lg overflow-hidden shadow-2xl">
      {/* Video Container */}
      <div 
        className="relative bg-black aspect-video"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          onClick={togglePlay}
        />

        {/* Video Overlay Controls */}
        {showControls && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4">
            {/* Top Bar */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {level && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    {level}
                  </Badge>
                )}
                {category && (
                  <Badge variant="outline" className="border-white text-white">
                    {category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Center Play Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                variant="ghost"
                className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-2">
              {/* Progress Bar */}
              <Slider
                value={[totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0]}
                onValueChange={handleSeek}
                className="w-full"
                max={100}
                step={0.1}
              />

              {/* Control Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-white" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white" onClick={() => skip(-10)}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white" onClick={() => skip(10)}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="ghost" className="text-white" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                      max={100}
                    />
                  </div>

                  <span className="text-white text-sm ml-4">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={playbackRate}
                    onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                    className="bg-white/20 text-white text-sm rounded px-2 py-1 border-none"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                  <Button size="sm" variant="ghost" className="text-white">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Information */}
      <div className="bg-white dark:bg-gray-900 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {instructor && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {instructor}
                </div>
              )}
              {enrolledCount && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {enrolledCount} {t("inscrits", "enrolled")}
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {rating}
                </div>
              )}
              {duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.round(duration)} min
                </div>
              )}
            </div>
          </div>

          {/* AI Features Panel Toggle */}
          {aiFeatures && (
            <Button
              variant="outline"
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {t("Assistant IA", "AI Assistant")}
            </Button>
          )}
        </div>

        {/* AI Features Panel */}
        {aiFeatures && showAiPanel && (
          <Card className="border-blue-200 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Notes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                      {t("Notes IA", "AI Notes")}
                    </h4>
                    <Button size="sm" variant="outline" onClick={generateAiNotes}>
                      {t("Générer", "Generate")}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {aiNotes.map((note, index) => (
                      <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        {note}
                      </div>
                    ))}
                    {aiNotes.length === 0 && (
                      <p className="text-gray-500 text-sm">
                        {t("Cliquez sur 'Générer' pour obtenir des notes IA", "Click 'Generate' to get AI notes")}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-700 dark:text-green-300">
                      {t("Questions IA", "AI Questions")}
                    </h4>
                    <Button size="sm" variant="outline" onClick={generateAiQuestion}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {t("Poser", "Ask")}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {aiQuestions.map((question, index) => (
                      <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                        {question}
                      </div>
                    ))}
                    {aiQuestions.length === 0 && (
                      <p className="text-gray-500 text-sm">
                        {t("L'IA peut générer des questions sur le contenu", "AI can generate questions about the content")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
