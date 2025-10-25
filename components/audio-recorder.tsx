'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Play, Trash2, Upload } from 'lucide-react'

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  maxDuration?: number
  disabled?: boolean
}

export default function AudioRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  maxDuration = 300, // 5 minutes default
  disabled = false
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        if (onRecordingComplete) {
          onRecordingComplete(blob)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      if (onRecordingStart) onRecordingStart()

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (onRecordingStop) onRecordingStop()
    }
  }

  const playRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob)
      const audio = new Audio(url)
      audioPlaybackRef.current = audio
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.play()
    }
  }

  const stopPlayback = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause()
      audioPlaybackRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
    audioChunksRef.current = []
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
        {!isRecording && !recordedBlob && (
          <Button
            onClick={startRecording}
            disabled={disabled}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <div className="flex-1 flex items-center gap-2">
              <div className="animate-pulse h-3 w-3 bg-red-600 rounded-full"></div>
              <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground">
                / {formatTime(maxDuration)}
              </span>
            </div>
            <Button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white"
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </>
        )}

        {recordedBlob && !isRecording && (
          <>
            <div className="flex-1 text-sm text-muted-foreground">
              Recording: {formatTime(recordingTime)}
            </div>
            <Button
              onClick={isPlaying ? stopPlayback : playRecording}
              variant="outline"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              {isPlaying ? 'Stop' : 'Play'}
            </Button>
            <Button
              onClick={deleteRecording}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Recording Status */}
      {recordedBlob && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Recording ready to submit
          </p>
        </div>
      )}
    </div>
  )
}

