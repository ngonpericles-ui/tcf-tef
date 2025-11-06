'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { motion } from 'framer-motion';
import { SimulationWaitingPage } from '@/components/simulation-waiting-page';

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  duration: number;
}

function SimulationRoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const simulationId = (params?.id as string | undefined) || undefined;
  const token = (searchParams?.get('token') || null) as string | null;

  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [simulation, setSimulation] = useState<VoiceSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données de la simulation
  useEffect(() => {
    const loadSimulation = async () => {
      try {
        const url = `/api/voice-simulation/${simulationId}`;

        let urlWithToken = url;
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          // Ajouter le token dans l'URL pour le middleware
          urlWithToken = `${url}?token=${token}`;
        } else {
          headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }

        const response = await fetch(urlWithToken, { headers });

        if (!response.ok) {
          const errorResponse = await response.json().catch(() => ({ message: 'Erreur serveur' }));
          
          // Check for access control error codes
          if (errorResponse.code === 'TOO_EARLY') {
            setErrorCode('TOO_EARLY');
            setErrorData({
              minutesUntilAccessible: errorResponse.minutesUntilAccessible || 0,
              scheduledDate: errorResponse.scheduledDate
            });
            setError(errorResponse.message || t_('Accès temporairement restreint', 'Access temporarily restricted'));
            return;
          } else if (errorResponse.code === 'SIMULATION_ENDED') {
            setErrorCode('SIMULATION_ENDED');
            setError(errorResponse.message || t_('Cette simulation a pris fin', 'This simulation has ended'));
            return;
          } else if (response.status === 401 || response.status === 403) {
            setError(errorResponse.message || t_('Accès refusé ou simulation non accessible', 'Access denied or simulation not accessible'));
          } else if (response.status === 404) {
            setError(t_('Simulation non trouvée', 'Simulation not found'));
          } else {
            setError(errorResponse.message || t_('Erreur lors du chargement', 'Error loading simulation'));
          }
          return;
        }

        const data = await response.json();
        setSimulation(data.data);

        // Check if simulation has ended more than 2 minutes ago
        if (data.data.status === 'COMPLETED') {
          // For voice simulations, use updatedAt as the end time
          const endedAt = data.data.updatedAt || data.data.endedAt || data.data.completedAt;
          if (endedAt) {
            const endTime = new Date(endedAt);
            const now = new Date();
            const timeSinceEnd = (now.getTime() - endTime.getTime()) / (1000 * 60); // minutes
            
            if (timeSinceEnd > 2) {
              setErrorCode('SIMULATION_ENDED');
              setError(
                t_(
                  'Cette simulation a pris fin. Le lien d\'accès expire 2 minutes après la fin pour des raisons de sécurité.',
                  'This simulation has ended. Access links expire 2 minutes after completion for security reasons.'
                )
              );
              return;
            }
          }
        }

        // Vérifier l'accessibilité de la simulation
        const scheduledDate = new Date(data.data.scheduledDate);
        const now = new Date();
        const timeUntilStart = scheduledDate.getTime() - now.getTime();
        const minutesUntilStart = timeUntilStart / (1000 * 60);

        // Vérifier si la simulation est accessible (5 minutes avant ou moins)
        if (minutesUntilStart > 5) {
          const waitTime = Math.ceil(minutesUntilStart - 5);
          setErrorCode('TOO_EARLY');
          setErrorData({
            minutesUntilAccessible: waitTime,
            scheduledDate: data.data.scheduledDate
          });
          setError(
            t_(
              `Cette simulation n'est pas encore accessible. Elle sera accessible dans ${waitTime} minute${waitTime > 1 ? 's' : ''}.`,
              `This simulation is not yet accessible. It will be accessible in ${waitTime} minute${waitTime > 1 ? 's' : ''}.`
            )
          );
          return;
        } else {
          // Rediriger vers le guide si l'étudiant n'a pas encore vu le guide
          const guideSeen = localStorage.getItem(`guide_seen_${simulationId}`);
          if (!guideSeen) {
            // Ajouter le token dans l'URL du guide si présent
            const guideUrl = token
              ? `/simulation-vocale/${simulationId}/guide?token=${token}`
              : `/simulation-vocale/${simulationId}/guide`;
            router.push(guideUrl);
            return;
          }
          setHasSeenGuide(true);
        }
      } catch (error: any) {
        console.error('Error loading simulation:', error);
        setError(t_('Erreur de connexion', 'Connection error'));
      } finally {
        setLoading(false);
      }
    };

    if (simulationId) {
      loadSimulation();
    }
  }, [simulationId, token, t_]);

  // Activer la caméra au chargement
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error(t_('Impossible d\'accéder à la caméra/microphone', 'Cannot access camera/microphone'));
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [t_]);

  // Timer pour la durée de l'appel
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          // Arrêter après la durée de la simulation (5 minutes = 300 secondes)
          if (newDuration >= (simulation?.duration || 300)) {
            handleEndCall();
            return prev;
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive, simulation?.duration]);

  const handleStartCall = async () => {
    try {
      const startUrl = token
        ? `/api/voice-simulation/start/${simulationId}?token=${token}`
        : `/api/voice-simulation/start/${simulationId}`;
      
      const response = await fetch(startUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {} : { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });

      if (response.ok) {
        setIsCallActive(true);
        toast.success(t_('Simulation démarrée', 'Simulation started'));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || t_('Erreur lors du démarrage', 'Failed to start simulation'));
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    }
  };

  const handleEndCall = async () => {
    try {
      const endUrl = token
        ? `/api/voice-simulation/end/${simulationId}?token=${token}`
        : `/api/voice-simulation/end/${simulationId}`;
      
      const response = await fetch(endUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {} : { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });

      setIsCallActive(false);
      
      if (response.ok) {
        toast.success(t_('Simulation terminée', 'Simulation ended'));
        // Rediriger vers les résultats après un délai
        setTimeout(() => {
          router.push(`/simulation-vocale/results?id=${simulationId}`);
        }, 2000);
      } else {
        toast.error(t_('Erreur lors de la fin', 'Error ending simulation'));
      }
    } catch (error) {
      console.error('Error ending call:', error);
      setIsCallActive(false);
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Composant Timer Circulaire - Pas de chiffres, vert par défaut, rouge à 30s
  const CircularTimer = ({ currentTime, totalTime }: { currentTime: number; totalTime: number }) => {
    const remaining = totalTime - currentTime;
    const percentage = (remaining / totalTime) * 100;
    const isUrgent = remaining <= 30; // Rouge quand il reste 30 secondes ou moins
    const size = 120;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="absolute top-6 right-6"
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isUrgent ? '#ef4444' : '#10b981'} // Rouge si urgent, vert sinon
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "linear" }}
          />
          {/* Glow effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isUrgent ? '#ef4444' : '#10b981'}
            strokeWidth={strokeWidth / 2}
            fill="none"
            opacity={0.3}
            className={isUrgent ? 'animate-pulse' : ''}
          />
        </svg>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t_('Chargement de la simulation...', 'Loading simulation...')}</p>
        </div>
      </div>
    );
  }

  // Show waiting page if access is too early
  if (errorCode === 'TOO_EARLY' && errorData) {
    return (
      <SimulationWaitingPage
        minutesUntilAccessible={errorData.minutesUntilAccessible}
        scheduledDate={errorData.scheduledDate}
        simulationType="voice"
        onRetry={() => {
          setErrorCode(null);
          setError(null);
          setErrorData(null);
          window.location.reload();
        }}
      />
    );
  }

  // Show error page for ended simulations
  if (errorCode === 'SIMULATION_ENDED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full dark:bg-gray-900/50 dark:border-gray-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t_('Simulation Terminée', 'Simulation Ended')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/simulation-vocale/results?id=' + simulationId)} className="mr-2">
              {t_('Voir les Résultats', 'View Results')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/simulation-vocale')}>
              {t_('Retour', 'Back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full dark:bg-gray-900/50 dark:border-gray-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t_('Erreur', 'Error')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/simulation-vocale')}>
              {t_('Retour', 'Back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!simulation) {
    return null;
  }

  const scheduledDate = new Date(simulation.scheduledDate);
  const now = new Date();
  const timeUntilStart = scheduledDate.getTime() - now.getTime();
  const minutesUntilStart = timeUntilStart / (1000 * 60);
  const simulationEnd = new Date(scheduledDate.getTime() + simulation.duration * 1000);
  
  // Accessible si:
  // - 5 minutes ou moins avant le début (minutesUntilStart entre 0 et 5)
  // - Pendant la simulation (après le début mais avant la fin)
  const canStart = (minutesUntilStart <= 5 && minutesUntilStart >= 0) || (now >= scheduledDate && now <= simulationEnd);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="flex flex-col h-screen">
        {/* Interface de l'étudiant - Caméra principale */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
            style={{ transform: isCameraOn ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.3s' }}
          />
          
          {/* Overlay si caméra désactivée */}
          {!isCameraOn && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="h-24 w-24 text-gray-600" />
            </div>
          )}

          {/* Timer circulaire - Pas de chiffres */}
          {isCallActive && (
            <CircularTimer
              currentTime={callDuration}
              totalTime={simulation.duration}
            />
          )}

          {/* Message si pas encore accessible */}
          {!canStart && !isCallActive && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="max-w-md">
                <CardContent className="pt-6 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    {t_('Simulation non accessible', 'Simulation not accessible')}
                  </h2>
                  <p className="text-gray-600">
                    {minutesUntilStart > 5
                      ? t_(
                          `Cette simulation sera accessible dans ${Math.ceil(minutesUntilStart - 5)} minute${Math.ceil(minutesUntilStart - 5) > 1 ? 's' : ''}.`,
                          `This simulation will be accessible in ${Math.ceil(minutesUntilStart - 5)} minute${Math.ceil(minutesUntilStart - 5) > 1 ? 's' : ''}.`
                        )
                      : t_(
                          'Cette simulation n\'est pas encore accessible.',
                          'This simulation is not yet accessible.'
                        )
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Contrôles - Hang Call, Microphone, Caméra */}
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            {/* Microphone */}
            <Button
              onClick={toggleMute}
              size="lg"
              variant={isMuted ? "destructive" : "outline"}
              className="h-16 w-16 rounded-full"
              disabled={!isCallActive && !canStart}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            {/* Caméra */}
            <Button
              onClick={toggleCamera}
              size="lg"
              variant={!isCameraOn ? "destructive" : "outline"}
              className="h-16 w-16 rounded-full"
              disabled={!isCallActive && !canStart}
            >
              {isCameraOn ? (
                <Video className="h-6 w-6" />
              ) : (
                <VideoOff className="h-6 w-6" />
              )}
            </Button>

            {/* Hang Call / Start Call */}
            {!isCallActive ? (
              <Button
                onClick={handleStartCall}
                size="lg"
                className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white"
                disabled={!canStart}
              >
                <PhoneOff className="h-6 w-6 rotate-135" />
              </Button>
            ) : (
              <Button
                onClick={handleEndCall}
                size="lg"
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Instructions */}
          {!isCallActive && canStart && (
            <p className="text-center text-sm text-gray-600 mt-4">
              {t_('Cliquez sur le bouton vert pour démarrer la simulation', 'Click the green button to start the simulation')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimulationRoomPage() {
  return (
    <SharedDataProvider>
      <SimulationRoomContent />
    </SharedDataProvider>
  );
}

