'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download, X } from 'lucide-react';
import { useLang } from '@/components/language-provider';

interface AudioPlayerProps {
  url: string;
  title?: string;
  onClose?: () => void;
  className?: string;
  allowDownload?: boolean;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  url,
  title = 'Audio',
  onClose,
  className = '',
  allowDownload = false,
  autoPlay = false
}: AudioPlayerProps) {
  const { lang } = useLang();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().catch(() => console.log('Autoplay prevented'));
      setIsPlaying(true);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay]);

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  }, [currentTime, duration]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, title]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 ${className}`}>
      <audio ref={audioRef} src={url} crossOrigin="anonymous" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            🎵 {title}
          </h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #d1d5db ${(currentTime / duration) * 100}%, #d1d5db 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(-15)}
            title={t('Reculer 15s', 'Skip back 15s')}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="lg"
            onClick={handlePlayPause}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(15)}
            title={t('Avancer 15s', 'Skip forward 15s')}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMuteToggle}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Download */}
        {allowDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            title={t('Télécharger', 'Download')}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

