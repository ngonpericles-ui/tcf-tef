'use client';

import React, { useState } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface VoiceRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onSendVoiceMessage, disabled = false }: VoiceRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    playRecording,
    pausePlayback,
  } = useVoiceRecording();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayRecording = () => {
    if (isPlaying) {
      pausePlayback();
      setIsPlaying(false);
    } else {
      playRecording();
      setIsPlaying(true);
    }
  };

  const handleSendRecording = () => {
    if (audioBlob) {
      onSendVoiceMessage(audioBlob);
      clearRecording();
      setIsPlaying(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={clearRecording}
          className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayRecording}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            disabled={disabled}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Voice message ({formatTime(recordingTime)})
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={clearRecording}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleSendRecording}
            className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            disabled={disabled}
          >
            <Square className="h-4 w-4" />
          </button>
          
          <div className="text-sm text-red-600 dark:text-red-400">
            Recording... {formatTime(recordingTime)}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
            disabled={disabled}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartRecording}
      className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
