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
import { apiClient } from '@/lib/api-client';
import { SimulationWaitingPage } from '@/components/simulation-waiting-page';

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  duration: number;
  assistantId?: string;
}

interface VapiConfig {
  publicKey: string;
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
  const [vapiConfig, setVapiConfig] = useState<VapiConfig | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [isInitializingVapi, setIsInitializingVapi] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vapiRef = useRef<any>(null);

  // Load VAPI configuration
  useEffect(() => {
    const loadVapiConfig = async () => {
      try {
        const response = await fetch('/api/voice-simulation/vapi-config');
        if (response.ok) {
          const data = await response.json();
          setVapiConfig(data.data);
          console.log('✅ VAPI config loaded');
        } else {
          console.error('❌ Failed to load VAPI config');
        }
      } catch (error) {
        console.error('Error loading VAPI config:', error);
      }
    };

    loadVapiConfig();
  }, []);

  // Initialize VAPI SDK
  useEffect(() => {
    console.log('🔍 VAPI init check:', {
      hasVapiConfig: !!vapiConfig,
      isClient: typeof window !== 'undefined',
      hasVapiRef: !!vapiRef.current,
      publicKey: vapiConfig?.publicKey
    });
    
    if (vapiConfig && typeof window !== 'undefined' && !vapiRef.current) {
      console.log('🚀 Starting VAPI initialization...');
      const initVapi = async () => {
        try {
          setIsInitializingVapi(true);
          // Dynamically import VAPI
          const { default: Vapi } = await import('@vapi-ai/web');
          
          vapiRef.current = new Vapi(vapiConfig.publicKey);
          
          // Set up event listeners
          vapiRef.current.on('call-start', () => {
            console.log('✅ VAPI call started');
            setIsCallActive(true);
            toast.success(t_('Appel démarré', 'Call started'));
          });

          vapiRef.current.on('call-end', () => {
            console.log('✅ VAPI call ended');
            setIsCallActive(false);
            handleEndCall();
          });

          vapiRef.current.on('speech-start', () => {
            console.log('🎤 User started speaking');
          });

          vapiRef.current.on('speech-end', () => {
            console.log('🎤 User stopped speaking');
          });

          vapiRef.current.on('message', (message: any) => {
            console.log('💬 Message received:', message);
            if (message.type === 'transcript' && message.transcript) {
              console.log(`${message.role === 'user' ? 'Vous' : 'Évaluateur'}: ${message.transcript}`);
            }
          });

          vapiRef.current.on('assistant-speech-start', () => {
            console.log('🎙️ AI assistant started speaking');
            // AI is now talking - this confirms the greeting/flow is working
          });

          vapiRef.current.on('assistant-speech-end', () => {
            console.log('🎙️ AI assistant finished speaking');
          });

          vapiRef.current.on('error', (error: any) => {
            console.error('❌ VAPI error:', error);
            toast.error(t_('Erreur de connexion vocale', 'Voice connection error'));
            setIsCallActive(false);
          });

          console.log('✅ VAPI initialized successfully - Button should now be enabled!', !!vapiRef.current);
        } catch (error) {
          console.error('❌ Error initializing VAPI:', error);
          toast.error(t_('Erreur d\'initialisation du service vocal', 'Voice service initialization error'));
        } finally {
          setIsInitializingVapi(false);
        }
      };

      initVapi();
    }

    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          console.warn('Error stopping VAPI:', e);
        }
      }
    };
  }, [vapiConfig, t_]);

  // Load simulation data
  useEffect(() => {
    const loadSimulation = async () => {
      try {
        console.log('🔄 Loading simulation:', simulationId);
        
        // Use apiClient which handles authentication automatically
        const response = await apiClient.get(`/voice-simulation/${simulationId}`);

        if (!response.success) {
          console.error('❌ Failed to load simulation:', response);
          
          // Backend error response comes directly in response object, not nested in error
          const errorResponse = response as any;
          
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
          } else {
            // Generic error handling
            setError(errorResponse.message || errorResponse.error?.message || t_('Erreur lors du chargement', 'Error loading simulation'));
          }
          return;
        }

        console.log('✅ Simulation loaded successfully:', response.data);
        const simulationData = response.data as VoiceSimulation;
        setSimulation(simulationData);

        if (simulationData.status === 'ACTIVE') {
          setIsCallActive(true);
          console.log('✅ Simulation is already ACTIVE');
        }

        if (simulationData.status === 'COMPLETED') {
          // For completed simulations, we'll let the backend handle timing restrictions
          // The simulation access is managed server-side
          console.log('✅ Simulation is COMPLETED - access controlled by backend');
        }

        const scheduledDate = new Date(simulationData.scheduledDate);
        const now = new Date();
        const timeUntilStart = scheduledDate.getTime() - now.getTime();
        const minutesUntilStart = timeUntilStart / (1000 * 60);

        if (simulationData.status === 'ACTIVE') {
          setHasSeenGuide(true);
          console.log('✅ Simulation is ACTIVE, skipping guide');
        } else {
          // Allow immediate access to simulations - no time restrictions
          // Users can access simulations as soon as they are created
          const guideSeen = localStorage.getItem(`guide_seen_${simulationId}`);
          if (!guideSeen) {
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
  }, [simulationId, token, t_, router]);

  // Request microphone and camera access (OPTIONAL - not required for simulation to work)
  useEffect(() => {
    const requestMediaAccess = async () => {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ Browser does not support getUserMedia - simulation will still work');
        setMicPermissionGranted(false);
        setMicPermissionError(null); // Don't show error, just continue
        return;
      }

      try {
        console.log('🎤 Attempting to request microphone and camera access (optional)...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });

        console.log('✅ Microphone and camera access granted');
        setMicPermissionGranted(true);
        setMicPermissionError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (error: any) {
        console.warn('⚠️ Could not access microphone/camera - simulation will still work:', error);
        setMicPermissionGranted(false);
        
        // Don't show error toast - just log it
        // The simulation can work without camera/mic (VAPI handles audio internally)
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.log('ℹ️ Microphone/camera permission denied - continuing without them');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          console.log('ℹ️ No microphone/camera detected - continuing without them');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          console.log('ℹ️ Microphone/camera in use - continuing without them');
        }
        
        // Don't set error message - allow simulation to proceed
        setMicPermissionError(null);
      }
    };

    // Only request access if we have simulation data and can start
    // But don't block if it fails - simulation can work without it
    if (simulation && !loading) {
      requestMediaAccess();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [simulation, loading, t_]);

  // Timer for call duration
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
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
      // Check if VAPI is initialized
      if (!vapiRef.current) {
        toast.error(t_(
          'Le service vocal n\'est pas encore initialisé. Veuillez patienter...',
          'Voice service is not yet initialized. Please wait...'
        ));
        return;
      }

      // Note: Microphone/camera are optional - VAPI will handle audio internally
      // Even if browser mic/cam are not available, the simulation can still work
      if (!micPermissionGranted) {
        console.log('ℹ️ Starting simulation without browser microphone/camera - VAPI will handle audio');
      }

      // Check if simulation is already ACTIVE
      if (simulation?.status === 'ACTIVE') {
        console.log('✅ Simulation is already ACTIVE');
        setIsCallActive(true);
        return;
      }

      toast.loading(t_('Démarrage de la simulation...', 'Starting simulation...'));

      // Step 1: Start simulation on backend using apiClient for proper auth
      const startUrl = token
        ? `/voice-simulation/start/${simulationId}?token=${token}`
        : `/voice-simulation/start/${simulationId}`;
      
      console.log('🚀 Starting simulation on backend:', startUrl);
      const response = await apiClient.post(startUrl, {});

      if (!response.success) {
        toast.dismiss();
        const errorMessage = response.error?.message || response.message || t_('Erreur lors du démarrage', 'Failed to start simulation');
        console.error('❌ Failed to start simulation on backend:', response);
        toast.error(errorMessage);
        return;
      }

      const startData = response;
      console.log('🎯 Backend response structure:', startData);
      
      // Handle different response structures safely
      const assistantId = (startData as any).data?.assistant?.id || 
                         (startData as any).data?.assistantId || 
                         (startData as any).assistant?.id ||
                         simulation?.assistantId;

      if (!assistantId) {
        toast.dismiss();
        toast.error(t_('ID assistant non trouvé', 'Assistant ID not found'));
        return;
      }

      // Step 2: Start VAPI call with assistant
      try {
        console.log('🎤 Starting VAPI call with assistant:', assistantId);
        console.log('🎤 VAPI client status:', {
          isInitialized: !!vapiRef.current,
          config: vapiConfig
        });
        
        await vapiRef.current.start({
          assistantId: assistantId
        });
        
        toast.dismiss();
        toast.success(t_('Simulation démarrée! L\'IA va commencer à parler...', 'Simulation started! AI will begin speaking...'));
        setIsCallActive(true);
        if (simulation) {
          setSimulation({ ...simulation, status: 'ACTIVE' });
        }
        console.log('✅ VAPI call started successfully - AI should now be talking!');
      } catch (vapiError: any) {
        console.error('❌ VAPI call start error:', vapiError);
        toast.dismiss();
        toast.error(t_(
          'Erreur lors du démarrage de l\'appel vocal. Veuillez réessayer.',
          'Error starting voice call. Please try again.'
        ));
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.dismiss();
      toast.error(t_('Erreur de connexion', 'Connection error'));
    }
  };

  const handleEndCall = async () => {
    try {
      // Stop VAPI call first
      if (vapiRef.current) {
        try {
          await vapiRef.current.stop();
          console.log('✅ VAPI call stopped');
        } catch (e) {
          console.warn('Error stopping VAPI call:', e);
        }
      }

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

  // Circular Timer Component
  const CircularTimer = ({ currentTime, totalTime }: { currentTime: number; totalTime: number }) => {
    const remaining = totalTime - currentTime;
    const percentage = (remaining / totalTime) * 100;
    const isUrgent = remaining <= 30;
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isUrgent ? '#ef4444' : '#10b981'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "linear" }}
          />
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

  if (loading || isInitializingVapi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {loading 
              ? t_('Chargement de la simulation...', 'Loading simulation...')
              : t_('Initialisation du service vocal...', 'Initializing voice service...')
            }
          </p>
        </div>
      </div>
    );
  }

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
  
  // Allow immediate access to simulations - no time restrictions
  const canStart = simulation.status === 'ACTIVE' || simulation.status === 'SCHEDULED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="flex flex-col h-screen">
        {/* Main video area */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
            style={{ transform: isCameraOn ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.3s' }}
          />
          
          {!isCameraOn && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="h-24 w-24 text-gray-600" />
            </div>
          )}

          {isCallActive && (
            <CircularTimer
              currentTime={callDuration}
              totalTime={simulation.duration}
            />
          )}

          {/* Microphone permission error overlay */}
          {micPermissionError && !micPermissionGranted && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
              <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {t_('Accès Microphone/Caméra Requis', 'Microphone/Camera Access Required')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{micPermissionError}</p>
                  <Button onClick={() => window.location.reload()}>
                    {t_('Réessayer', 'Retry')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Removed time restriction overlay - simulations now start immediately */}
        </div>

        {/* Controls */}
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
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

            {!isCallActive ? (
              <>
                {console.log('🔍 Button state check:', {
                  canStart,
                  hasVapiRef: !!vapiRef.current,
                  isDisabled: !canStart || !vapiRef.current,
                  simulationStatus: simulation?.status
                })}
                <Button
                  onClick={handleStartCall}
                  size="lg"
                  className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  disabled={!canStart || !vapiRef.current}
                >
                  <PhoneOff className="h-6 w-6 rotate-135" />
                </Button>
              </>
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

          {!isCallActive && canStart && (
            <p className="text-center text-sm text-gray-600 mt-4">
              {!vapiRef.current
                ? t_('Initialisation du service vocal...', 'Initializing voice service...')
                : t_('Cliquez sur le bouton vert pour démarrer la simulation', 'Click the green button to start the simulation')
              }
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
