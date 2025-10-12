'use client';

import React, { useState, useEffect, useRef } from 'react';

// Generate static params for static export
import { useParams, useRouter } from 'next/navigation';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import FloatingAiAssistant from '@/components/FloatingAiAssistant';
import { useFloatingAiAssistant, PAGE_CONTEXTS } from '@/hooks/useFloatingAiAssistant';

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: 'MALE' | 'FEMALE';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  duration: number;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface VapiCall {
  id: string;
  status: 'idle' | 'loading' | 'active' | 'ended';
}

function VoiceSimulationRoom() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useSharedData();
  const simulationId = params.id as string;

  // Floating AI Assistant
  const { context: aiContext, isEnabled: aiEnabled } = useFloatingAiAssistant({
    page: PAGE_CONTEXTS.VOICE_SIMULATION,
    simulationType: 'voice',
    language: 'fr'
  });

  const [simulation, setSimulation] = useState<VoiceSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [vapiConfig, setVapiConfig] = useState<{ publicKey: string } | null>(null);
  const [call, setCall] = useState<VapiCall | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load simulation data
  useEffect(() => {
    const loadSimulation = async () => {
      try {
        const response = await fetch(`/api/voice-simulation/${simulationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSimulation(data.data);
        } else {
          toast.error('Simulation non trouvée');
          router.push('/immigration-simulations');
        }
      } catch (error) {
        console.error('Error loading simulation:', error);
        toast.error('Erreur lors du chargement de la simulation');
        router.push('/immigration-simulations');
      } finally {
        setLoading(false);
      }
    };

    if (simulationId) {
      loadSimulation();
    }
  }, [simulationId, router]);

  // Load VAPI configuration
  useEffect(() => {
    const loadVapiConfig = async () => {
      try {
        const response = await fetch('/api/voice-simulation/vapi-config');
        if (response.ok) {
          const data = await response.json();
          setVapiConfig(data.data);
        }
      } catch (error) {
        console.error('Error loading VAPI config:', error);
      }
    };

    loadVapiConfig();
  }, []);

  // Initialize VAPI
  useEffect(() => {
    if (vapiConfig && typeof window !== 'undefined') {
      const initVapi = async () => {
        try {
          // Dynamically import VAPI
          const { default: Vapi } = await import('@vapi-ai/web');
          
          vapiRef.current = new Vapi(vapiConfig.publicKey);
          
          // Set up event listeners
          vapiRef.current.on('call-start', () => {
            console.log('Call started');
            setIsCallActive(true);
            setCall({ id: 'active', status: 'active' });
            startTimer();
          });

          vapiRef.current.on('call-end', () => {
            console.log('Call ended');
            setIsCallActive(false);
            setCall({ id: 'ended', status: 'ended' });
            stopTimer();
            handleCallEnd();
          });

          vapiRef.current.on('speech-start', () => {
            console.log('User started speaking');
          });

          vapiRef.current.on('speech-end', () => {
            console.log('User stopped speaking');
          });

          vapiRef.current.on('message', (message: any) => {
            console.log('Message received:', message);
            if (message.type === 'transcript' && message.transcript) {
              setTranscript(prev => [...prev, `${message.role === 'user' ? 'Vous' : 'Évaluateur'}: ${message.transcript}`]);
            }
          });

          vapiRef.current.on('volume-level', (level: number) => {
            // Handle volume level for visual feedback
            console.log('Volume level:', level);
          });

          vapiRef.current.on('conversation-update', (update: any) => {
            console.log('Conversation update:', update);
            // Handle conversation updates
          });

          vapiRef.current.on('error', (error: any) => {
            console.error('VAPI error:', error);
            toast.error('Erreur de connexion vocale');
          });

        } catch (error) {
          console.error('Error initializing VAPI:', error);
          toast.error('Erreur d\'initialisation du service vocal');
        }
      };

      initVapi();
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [vapiConfig]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startCall = async () => {
    if (!vapiRef.current || !simulation) return;

    try {
      setCall({ id: 'loading', status: 'loading' });
      
      // Start the simulation on the backend
      const response = await fetch(`/api/voice-simulation/start/${simulationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Start VAPI call with the assistant ID
        console.log('Starting VAPI call with assistant:', data.assistant.id);
        await vapiRef.current.start(data.assistant.id);

        toast.success('Simulation vocale démarrée !');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start simulation');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Erreur lors du démarrage de la simulation');
      setCall(null);
    }
  };

  const endCall = async () => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.stop();
    }
  };

  const handleCallEnd = async () => {
    try {
      // End the simulation on the backend
      const response = await fetch(`/api/voice-simulation/end/${simulationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Simulation terminée ! Vous recevrez vos résultats par email.');
        setTimeout(() => {
          router.push('/immigration-simulations');
        }, 3000);
      }
    } catch (error) {
      console.error('Error ending simulation:', error);
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      if (isMuted) {
        vapiRef.current.setMuted(false);
      } else {
        vapiRef.current.setMuted(true);
      }
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de la simulation...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Simulation non trouvée</h2>
          <Button onClick={() => router.push('/immigration-simulations')}>
            Retour aux simulations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/immigration-simulations')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Simulation Vocale TCF/TEF - Immigration Canada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{simulation.user.firstName} {simulation.user.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Durée: 7 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-gray-500" />
                  <span>Voix: {simulation.voicePreference === 'MALE' ? 'Masculine' : 'Féminine'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Simulation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de la Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Call Status */}
              <div className="text-center">
                <div className="mb-4">
                  {call?.status === 'loading' && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Connexion en cours...</span>
                    </div>
                  )}
                  {call?.status === 'active' && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Simulation active</span>
                    </div>
                  )}
                  {call?.status === 'ended' && (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Simulation terminée</span>
                    </div>
                  )}
                  {!call && (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Phone className="h-5 w-5" />
                      <span>Prêt à commencer</span>
                    </div>
                  )}
                </div>

                {/* Timer */}
                {isCallActive && (
                  <div className="mb-4">
                    <div className="text-2xl font-mono font-bold text-blue-600">
                      {formatTime(callDuration)}
                    </div>
                    <Progress value={(callDuration / 420) * 100} className="mt-2" />
                  </div>
                )}

                {/* Call Buttons */}
                <div className="flex justify-center gap-4">
                  {!isCallActive && !call && (
                    <Button
                      onClick={startCall}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Commencer la Simulation
                    </Button>
                  )}

                  {isCallActive && (
                    <>
                      <Button
                        onClick={toggleMute}
                        variant={isMuted ? "destructive" : "outline"}
                        size="lg"
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        onClick={endCall}
                        variant="destructive"
                        size="lg"
                      >
                        <PhoneOff className="h-5 w-5 mr-2" />
                        Terminer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Transcription en Temps Réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                {transcript.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    La transcription apparaîtra ici pendant la simulation...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transcript.map((text, index) => (
                      <div key={index} className="p-2 bg-white rounded border-l-4 border-blue-500">
                        {text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Avant de commencer:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Assurez-vous d'être dans un endroit calme</li>
                  <li>• Testez votre microphone</li>
                  <li>• Parlez clairement et naturellement</li>
                  <li>• La simulation dure exactement 7 minutes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Pendant la simulation:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Répondez aux questions de l'évaluateur IA</li>
                  <li>• Exprimez-vous en français</li>
                  <li>• Utilisez le bouton muet si nécessaire</li>
                  <li>• Vos résultats seront envoyés par email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating AI Assistant */}
      {aiEnabled && <FloatingAiAssistant context={aiContext} />}
    </div>
  );
}

export default function VoiceSimulationPage() {
  return (
    <SharedDataProvider>
      <VoiceSimulationRoom />
    </SharedDataProvider>
  );
}
