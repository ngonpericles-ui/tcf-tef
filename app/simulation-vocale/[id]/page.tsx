'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
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

interface StartSimulationData {
  simulation: VoiceSimulation;
  call: { id: string };
  assistant: { id: string };
  questions: any[];
  message: string;
}

function SimulationRoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  const [vapiConfig, setVapiConfig] = useState<VapiConfig | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [isInitializingVapi, setIsInitializingVapi] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasFatalError, setHasFatalError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const vapiRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intentionallyEndedRef = useRef<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both in parallel for faster initialization
        const [vapiResponse, simulationResponse] = await Promise.allSettled([
          apiClient.get('/voice-simulation/vapi-config').then(r => r.success ? r.data : null).catch(() => null),
          simulationId ? apiClient.get(`/voice-simulation/${simulationId}${token ? `?token=${token}` : ''}`).catch((err) => {
            // Handle timeout errors specifically
            if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
              console.error('⏱️ Simulation data request timed out');
              return { success: false, error: { message: 'Request timed out. The server may be slow. Please refresh the page.', code: 'TIMEOUT' } };
            }
            return null;
          }) : Promise.resolve(null)
        ]);

        // Set VAPI config immediately
        if (vapiResponse.status === 'fulfilled' && vapiResponse.value) {
          const configData = vapiResponse.value as any;
          if (configData?.publicKey && typeof configData.publicKey === 'string') {
            setVapiConfig({ publicKey: configData.publicKey });
          }
        }

        // Set simulation data immediately
        if (simulationResponse.status === 'fulfilled' && simulationResponse.value) {
          const response = simulationResponse.value as any;
          if (response.success && response.data) {
            setSimulation(response.data);
            const guideSeen = localStorage.getItem(`guide_seen_${simulationId}`);
            if (response.data.status !== 'ACTIVE' && !guideSeen) {
              const guideUrl = token
                ? `/simulation-vocale/${simulationId}/guide?token=${token}`
                : `/simulation-vocale/${simulationId}/guide`;
              router.push(guideUrl);
              return;
            }
            setHasSeenGuide(true);
          } else if (!response.success) {
            if (response.error?.code === 'TIMEOUT') {
              setError(response.error.message || t_('Le chargement a pris trop de temps. Veuillez rafraîchir la page.', 'Loading took too long. Please refresh the page.'));
            } else if (response.code === 'TOO_EARLY') {
              setErrorCode('TOO_EARLY');
              setErrorData({
                minutesUntilAccessible: response.minutesUntilAccessible || 0,
                scheduledDate: response.scheduledDate
              });
              setError(response.message || t_('Accès temporairement restreint', 'Access temporarily restricted'));
            } else if (response.code === 'SIMULATION_ENDED') {
              setErrorCode('SIMULATION_ENDED');
              setError(response.message || t_('Cette simulation a pris fin', 'This simulation has ended'));
            } else {
              setError(response.message || response.error?.message || t_('Erreur lors du chargement', 'Error loading simulation'));
            }
          }
        } else if (simulationResponse.status === 'rejected') {
          // Handle promise rejection
          const error = simulationResponse.reason;
          if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
            setError(t_('Le chargement a pris trop de temps. Veuillez rafraîchir la page.', 'Loading took too long. Please refresh the page.'));
          } else {
            setError(t_('Erreur lors du chargement de la simulation', 'Error loading simulation'));
          }
        }
      } catch (error: any) {
        console.error('Error loading simulation data:', error);
        setError(t_('Erreur lors du chargement', 'Error loading simulation'));
      } finally {
        // Always stop loading
        setLoading(false);
      }
    };

    if (simulationId) {
      loadData();
    } else {
      // If no simulationId, stop loading immediately
      setLoading(false);
    }
  }, [simulationId, token, t_, router]);

  useEffect(() => {
    if (vapiConfig && typeof window !== 'undefined' && !vapiRef.current) {
      const initVapi = async () => {
        try {
          setIsInitializingVapi(true);
          const { default: Vapi } = await import('@vapi-ai/web');
          vapiRef.current = new Vapi(vapiConfig.publicKey);
          
          vapiRef.current.on('call-start', () => {
            setIsCallActive(true);
            if (!timerStarted) {
              setTimeRemaining(300);
              setTimerStarted(true);
              timerIntervalRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                  if (prev <= 1) {
                    if (timerIntervalRef.current) {
                      clearInterval(timerIntervalRef.current);
                      timerIntervalRef.current = null;
                    }
                    intentionallyEndedRef.current = true;
                    setTimeout(() => handleEndCall(), 100);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
          });

          vapiRef.current.on('call-end', () => {
            const wasIntentionallyEnded = intentionallyEndedRef.current;
            if (!wasIntentionallyEnded && isCallActive) {
              handleEndCall();
            }
            intentionallyEndedRef.current = false;
            setIsCallActive(false);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimerStarted(false);
            setTimeRemaining(300);
          });

          vapiRef.current.on('assistant-speech-start', () => {
            toast.success(t_('L\'IA commence à parler...', 'AI is starting to speak...'));
          });

          vapiRef.current.on('error', (error: any) => {
            let errorMessage = t_('Erreur de connexion vocale', 'Voice connection error');
            if (error?.message) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            }
            if (isCallActive) {
              setIsCallActive(false);
            }
            toast.error(errorMessage);
          });
        } catch (error) {
          console.error('Error initializing VAPI:', error);
          toast.error(t_('Erreur d\'initialisation du service vocal', 'Voice service initialization error'));
        } finally {
          setIsInitializingVapi(false);
        }
      };

      initVapi();
    }

    return () => {
      if (vapiRef.current) {
        intentionallyEndedRef.current = true;
        vapiRef.current.stop().catch(() => {});
        if (typeof vapiRef.current.removeAllListeners === 'function') {
          vapiRef.current.removeAllListeners();
        }
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [vapiConfig, t_, isCallActive, timerStarted]);

  useEffect(() => {
    const requestMediaAccess = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicPermissionGranted(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100 }
        });
        setMicPermissionGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (error) {
        setMicPermissionGranted(false);
      }
    };

    if (simulation && !loading) {
      requestMediaAccess();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [simulation, loading]);

  const handleStartCall = useCallback(async () => {
    console.log('handleStartCall called', { isStarting, hasFatalError, hasVapiRef: !!vapiRef.current });
    if (isStarting || hasFatalError || !vapiRef.current) {
      console.log('handleStartCall blocked:', { isStarting, hasFatalError, hasVapiRef: !!vapiRef.current });
      return;
    }
    
    setIsStarting(true);
    
    let loadingToastId: string | number | undefined;
    
    try {
      console.log('Starting simulation on backend...', { simulationId, token });
      // Show loading toast with estimated time
      loadingToastId = toast.loading(t_('Démarrage de la simulation... (10-15 secondes)', 'Starting simulation... (10-15 seconds)'));
      const startUrl = token
        ? `/voice-simulation/start/${simulationId}?token=${token}`
        : `/voice-simulation/start/${simulationId}`;
      
      console.log('POST request to:', startUrl);
      console.log('Making API call now...');
      
      // Optimized timeout: First request takes 10-15s (with caching), subsequent requests are < 2s
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('API call timed out after 20 seconds');
          reject(new Error('Request timeout after 20 seconds. Please try again.'));
        }, 20000);
      });
      
      const startTime = Date.now();
      const apiCallPromise = apiClient.post<StartSimulationData>(startUrl, {}).then(response => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ API call completed successfully in ${duration}s`, response);
        return response;
      }).catch(error => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`❌ API call failed after ${duration}s:`, {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          data: error?.response?.data,
          stack: error?.stack
        });
        throw error;
      });
      
      console.log('Starting Promise.race with timeout...');
      
      const response = await Promise.race([
        apiCallPromise,
        timeoutPromise
      ]) as any;
      
      console.log('Backend response received:', { 
        success: response.success, 
        hasData: !!response.data, 
        hasAssistant: !!response.data?.assistant,
        assistantId: response.data?.assistant?.id,
        fullResponse: JSON.stringify(response, null, 2)
      });

      // Always dismiss loading toast first
      toast.dismiss(loadingToastId);

      if (!response.success) {
        const errorMessage = response.error?.message || 
                           response.message || 
                           (response as any).providerMessage ||
                           t_('Erreur lors du démarrage', 'Failed to start simulation');
        const errorCode = response.error?.code || (response as any).code;
        
        console.error('❌ Backend returned error:', { errorMessage, errorCode, response });
        
        if (errorCode === 'VAPI_ERROR' || 
            errorMessage.includes('Authentication failed') || 
            errorMessage.includes('Invalid API Key')) {
          setHasFatalError(true);
          toast.error(t_(
            'Erreur de configuration VAPI. Veuillez contacter le support.',
            'VAPI configuration error. Please contact support.'
          ));
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      if (!response.data?.assistant?.id) {
        console.error('❌ Assistant ID missing in response:', {
          hasData: !!response.data,
          hasAssistant: !!response.data?.assistant,
          dataKeys: response.data ? Object.keys(response.data) : [],
          fullData: JSON.stringify(response.data, null, 2)
        });
        toast.error(t_('ID assistant non trouvé dans la réponse du serveur', 'Assistant ID not found in server response'));
        return;
      }

      const assistantId = response.data.assistant.id.trim();
      
      if (!assistantId || assistantId === '') {
        toast.dismiss();
        toast.error(t_('ID assistant invalide', 'Invalid assistant ID'));
        return;
      }

      try {
        console.log('🎤 Starting VAPI call with assistant ID:', assistantId);
        console.log('📞 VAPI ref available:', !!vapiRef.current);
        
        if (!vapiRef.current) {
          throw new Error('VAPI not initialized. Please refresh the page.');
        }
        
        await vapiRef.current.start(assistantId);
        console.log('✅ VAPI call started successfully');
        
        setIsCallActive(true);
        setTimeRemaining(300);
        setTimerStarted(true);
        
        timerIntervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              intentionallyEndedRef.current = true;
              setTimeout(() => handleEndCall(), 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Loading toast already dismissed above
        toast.success(t_('Simulation démarrée! L\'IA va commencer à parler...', 'Simulation started! AI will begin speaking...'));
        
        if (simulation) {
          setSimulation({ ...simulation, status: 'ACTIVE' });
        }
      } catch (vapiError: any) {
        console.error('❌ VAPI start error:', {
          message: vapiError?.message,
          stack: vapiError?.stack,
          name: vapiError?.name,
          assistantId: assistantId
        });
        setIsCallActive(false);
        const errorMessage = vapiError?.message || 
                           t_('Erreur lors du démarrage de l\'appel vocal. Veuillez réessayer.', 'Error starting voice call. Please try again.');
        toast.dismiss(loadingToastId);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        response: error?.response,
        isTimeout: error?.message?.includes('timeout')
      });
      
      // Always reset button state on error
      setIsCallActive(false);
      setIsStarting(false);
      toast.dismiss(loadingToastId);
      
      if (error?.message?.includes('timeout')) {
        toast.error(t_('La requête a pris trop de temps. Le serveur peut être occupé. Réessayez dans quelques secondes.', 'Request timed out. Server may be busy. Please try again in a few seconds.'));
      } else {
        const errorMsg = error?.message || error?.response?.data?.message || t_('Erreur de connexion', 'Connection error');
        toast.error(errorMsg);
      }
    } finally {
      setIsStarting(false);
    }
  }, [simulationId, token, isStarting, hasFatalError, t_, simulation]);

  const handleEndCall = async () => {
    try {
      intentionallyEndedRef.current = true;
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerStarted(false);
      setTimeRemaining(300);
      
      if (vapiRef.current) {
        try {
          await vapiRef.current.stop();
        } catch (e) {
          console.warn('Error stopping VAPI call:', e);
        }
      }

      setIsCallActive(false);
      toast.dismiss();
      
      const endUrl = token
        ? `/voice-simulation/end/${simulationId}?token=${token}`
        : `/voice-simulation/end/${simulationId}`;
      
      const response = await apiClient.post(endUrl, {});
      
      if (response.success) {
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
      setTimerStarted(false);
      toast.dismiss();
      toast.error(t_('Erreur lors de la fin', 'Error ending simulation'));
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

  const timerPercentage = (timeRemaining / 300) * 100;

  // Only show loading screen if we don't have simulation data yet
  // Once simulation is loaded, show the room even if VAPI is still initializing
  if (loading && !simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {t_('Chargement de la simulation...', 'Loading simulation...')}
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

  const canStart = simulation.status === 'ACTIVE' || simulation.status === 'SCHEDULED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="flex flex-col h-screen">
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
            <div className="absolute top-6 right-6 z-50">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - timerPercentage / 100)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <div className="relative">
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
              {!micPermissionGranted && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="relative">
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
              {!micPermissionGranted && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {!isCallActive ? (
              <Button
                onClick={handleStartCall}
                size="lg"
                className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                disabled={!canStart || !vapiRef.current || isStarting}
              >
                {isStarting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <PhoneOff className="h-6 w-6 rotate-135" />
                )}
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
