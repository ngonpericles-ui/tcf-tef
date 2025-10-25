'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  X, 
  Download, 
  SkipBack, 
  SkipForward,
  Settings,
  Monitor,
  Smartphone
} from 'lucide-react';
import { useLang } from '@/components/language-provider';

interface EnhancedMediaViewerProps {
  url: string;
  title?: string;
  type: 'video' | 'audio';
  onClose?: () => void;
  className?: string;
  allowDownload?: boolean;
  autoPlay?: boolean;
}

export default function EnhancedMediaViewer({
  url,
  title = 'Media Content',
  type,
  onClose,
  className = '',
  allowDownload = true,
  autoPlay = false
}: EnhancedMediaViewerProps) {
  const { lang } = useLang();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const handlePlayPause = useCallback(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mediaRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      mediaRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handleMute = useCallback(() => {
    if (mediaRef.current) {
      if (isMuted) {
        mediaRef.current.volume = volume;
        setIsMuted(false);
      } else {
        mediaRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handleSkip = useCallback((seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || `media.${type === 'video' ? 'mp4' : 'mp3'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, title, type]);

  const handleFullscreen = useCallback(() => {
    if (mediaRef.current) {
      if (!isFullscreen) {
        if (mediaRef.current.requestFullscreen) {
          mediaRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      setIsLoading(false);
      setError(null);
    }
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError(t('Erreur lors du chargement du média', 'Error loading media'));
  }, [t]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (autoPlay && mediaRef.current) {
      mediaRef.current.play();
      setIsPlaying(true);
    }
  }, [autoPlay]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-black flex flex-col'
    : `relative w-full h-full bg-black rounded-xl shadow-lg overflow-hidden ${className}`;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={containerClass}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-800 dark:to-purple-900 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            {type === 'video' ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold truncate max-w-md">
              {title}
            </h3>
            <p className="text-sm text-purple-100">
              {type === 'video' ? t('Vidéo', 'Video') : t('Audio', 'Audio')} • {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Playback Rate */}
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlaybackRateChange(0.5)}
              className={`text-white hover:bg-white/20 h-8 w-8 p-0 text-xs ${playbackRate === 0.5 ? 'bg-white/20' : ''}`}
            >
              0.5x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlaybackRateChange(1)}
              className={`text-white hover:bg-white/20 h-8 w-8 p-0 text-xs ${playbackRate === 1 ? 'bg-white/20' : ''}`}
            >
              1x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlaybackRateChange(1.5)}
              className={`text-white hover:bg-white/20 h-8 w-8 p-0 text-xs ${playbackRate === 1.5 ? 'bg-white/20' : ''}`}
            >
              1.5x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlaybackRateChange(2)}
              className={`text-white hover:bg-white/20 h-8 w-8 p-0 text-xs ${playbackRate === 2 ? 'bg-white/20' : ''}`}
            >
              2x
            </Button>
          </div>

          {/* Download */}
          {allowDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={t('Télécharger', 'Download')}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            title={t('Plein écran', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Close */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={t('Fermer', 'Close')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Media Content Area */}
      <div 
        className="flex-1 relative bg-black flex items-center justify-center"
        onMouseMove={showControlsTemporarily}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">
                {t('Chargement du média...', 'Loading media...')}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('Erreur de chargement', 'Loading Error')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error}
                </p>
                <Button 
                  onClick={() => window.open(url, '_blank')}
                  className="w-full"
                >
                  {t('Ouvrir dans un nouvel onglet', 'Open in new tab')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {type === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-purple-200">
                {t('Cliquez pour jouer', 'Click to play')}
              </p>
            </div>
          </div>
        )}

        {/* Media Controls Overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end">
            {/* Progress Bar */}
            <div className="px-4 pb-4">
              <div
                ref={progressRef}
                className="w-full h-2 bg-white/30 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-200"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20 h-12 w-12 rounded-full"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </Button>

                  {/* Skip Backward */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(-10)}
                    className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  {/* Skip Forward */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(10)}
                    className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  {/* Time Display */}
                  <div className="text-white text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMute}
                      className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
