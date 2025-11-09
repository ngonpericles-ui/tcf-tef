'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Settings,
  Volume2,
  Play,
  Pause,
  Mic,
  AlertTriangle,
  Info,
  Crown,
  CheckCircle,
  Star,
  Headphones,
  MessageSquare,
  TrendingUp,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface VoiceOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  accent: 'FRANCE' | 'QUEBEC' | 'BELGIUM';
  description?: string;
  voiceId?: string;
  quality?: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleUrl?: string;
}

function VoicePageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  // Helper function for translations
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voicePreference, setVoicePreference] = useState<string>('TOUS'); // TOUS, MALE, FEMALE
  const [accentPreference, setAccentPreference] = useState<string>('TOUS'); // TOUS, FRANCE, QUEBEC, BELGIUM
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Start with false for immediate UI render
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [loadingPreview, setLoadingPreview] = useState<Set<string>>(new Set());
  const voicesCacheRef = useRef<{ data: VoiceOption[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  useEffect(() => {
    // Load cached data immediately for instant UI
    const cached = voicesCacheRef.current;
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAvailableVoices(cached.data);
      applyFilter(cached.data, accentPreference, voicePreference);
      setLoading(false);
    } else {
      // Show loading only if no cache
      setLoading(true);
    }
    
    // Fetch fresh data in background
    fetchAvailableVoices();
  }, []);

  const fetchAvailableVoices = async () => {
    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await apiClient.get('/voice-simulation/voices');
      clearTimeout(timeoutId);
      
      if (response.success && response.data) {
        const voices = (Array.isArray(response.data) ? response.data : []) as VoiceOption[];
        setAvailableVoices(voices);
        
        // Cache the data
        voicesCacheRef.current = {
          data: voices,
          timestamp: Date.now()
        };
        
        // Load saved preference if exists
        const savedPreference = localStorage.getItem('voicePreference');
        if (savedPreference) {
          try {
            const saved = JSON.parse(savedPreference);
            if (saved.voiceId && voices.find((v: VoiceOption) => v.id === saved.voiceId)) {
              setSelectedVoice(saved.voiceId);
              const voice = voices.find((v: VoiceOption) => v.id === saved.voiceId);
              if (voice) {
                setVoicePreference(voice.gender);
                setAccentPreference(voice.accent);
              }
            }
          } catch (e) {
            console.error('Error parsing saved preference:', e);
          }
        }
        
        // Apply initial filter
        applyFilter(voices, accentPreference, voicePreference);
      } else {
        setAvailableVoices([]);
        setFilteredVoices([]);
      }
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      // Only show error if we don't have cached data
      if (!voicesCacheRef.current) {
        toast.error(t_('Erreur lors du chargement des voix', 'Error loading voices'));
        setAvailableVoices([]);
        setFilteredVoices([]);
      } else {
        // Use cached data if available
        const cached = voicesCacheRef.current;
        setAvailableVoices(cached.data);
        applyFilter(cached.data, accentPreference, voicePreference);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (voices: VoiceOption[], accentFilterValue: string, genderFilter?: string) => {
    let filtered = [...voices];
    
    // Apply accent filter first
    if (accentFilterValue !== 'TOUS') {
      filtered = filtered.filter((voice) => voice.accent === accentFilterValue);
    }
    
    // Apply gender filter from voice preference (if MALE or FEMALE is selected)
    if (genderFilter && genderFilter !== 'TOUS' && (genderFilter === 'MALE' || genderFilter === 'FEMALE')) {
      filtered = filtered.filter((voice) => voice.gender === genderFilter);
    }
    
    console.log('🔍 Applied filters:', {
      totalVoices: voices.length,
      accentFilter: accentFilterValue,
      genderFilter: genderFilter,
      filteredCount: filtered.length,
      filteredVoices: filtered.map(v => ({ 
        id: v.id, 
        name: v.name, 
        gender: v.gender, 
        accent: v.accent,
        elevenlabsId: v.voiceId 
      }))
    });
    
    setFilteredVoices(filtered);
  };

  useEffect(() => {
    if (availableVoices.length > 0) {
      // Use accentPreference and voicePreference from the configuration section
      applyFilter(availableVoices, accentPreference, voicePreference);
    }
  }, [accentPreference, availableVoices, voicePreference]);

  const handleVoicePreview = async (voiceId: string) => {
    // Stop any currently playing audio
    audioRefs.current.forEach((audio, id) => {
      if (id !== voiceId && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // If already playing this voice, stop it
    const currentAudio = audioRefs.current.get(voiceId);
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setPlayingVoice(null);
      return;
    }

    try {
      setLoadingPreview(prev => new Set(prev).add(voiceId));
      setPlayingVoice(voiceId);

      // Find the voice to get its details for debugging
      const voice = availableVoices.find(v => v.id === voiceId);
      console.log('🎤 Previewing voice:', {
        voiceId,
        voiceName: voice?.name,
        gender: voice?.gender,
        accent: voice?.accent,
        elevenlabsVoiceId: voice?.voiceId
      });

      // Call backend to generate preview
      const response = await apiClient.post('/voice-simulation/preview', { voiceId });
      
      if (response.success && response.data) {
        const data = response.data as any;
        const { audioBase64, previewText, useBrowserTTS, voiceId_11labs } = data;
        console.log('✅ Preview response:', {
          voiceId,
          voiceId_11labs,
          hasAudio: !!audioBase64,
          useBrowserTTS
        });

        if (audioBase64) {
          // Play audio from base64 - THIS IS THE CORRECT UNIQUE VOICE FROM 11LABS
          console.log('🎵 Playing audio for voice:', {
            voiceId,
            voiceName: voice?.name,
            gender: voice?.gender,
            accent: voice?.accent,
            elevenlabsVoiceId: voiceId_11labs,
            audioLength: audioBase64.length
          });
          
          const audio = new Audio(audioBase64);
          audioRefs.current.set(voiceId, audio);
          
          audio.onended = () => {
            console.log('✅ Audio playback ended for:', voiceId);
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          audio.onerror = (error) => {
            console.error('❌ Audio playback error for voice:', voiceId, error);
            toast.error(t_('Erreur de lecture audio', 'Audio playback error'));
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          try {
            await audio.play();
            console.log('▶️ Audio playing successfully for voice:', voiceId);
          } catch (playError) {
            console.error('❌ Error starting audio playback:', playError);
            toast.error(t_('Impossible de lire l\'audio. Vérifiez que l\'audio n\'est pas bloqué.', 'Could not play audio. Check that audio is not blocked.'));
          }
        } else if (useBrowserTTS || !audioBase64) {
          // Fallback to browser SpeechSynthesis API (WARNING: This will sound the same!)
          console.warn('⚠️ Using browser TTS fallback - voices will sound similar!', {
            voiceId,
            reason: 'No 11labs audio received. Configure ELEVENLABS_API_KEY for unique voices.'
          });
          
          const utterance = new SpeechSynthesisUtterance(previewText);
          utterance.lang = 'fr-FR';
          utterance.rate = 1.0;
          // Adjust pitch based on gender to at least differentiate
          utterance.pitch = voice?.gender === 'MALE' ? 0.8 : 1.2;
          utterance.volume = 1.0;

          // Try to use a French voice
          const voices = window.speechSynthesis.getVoices();
          const frenchVoice = voices.find(v => v.lang.startsWith('fr')) || voices.find(v => v.lang.includes('FR'));
          if (frenchVoice) {
            utterance.voice = frenchVoice;
          }

          utterance.onend = () => {
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          utterance.onerror = () => {
            toast.error(t_('Erreur de lecture audio', 'Audio playback error'));
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          window.speechSynthesis.speak(utterance);
        }
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error: any) {
      console.error('Error generating voice preview:', error);
      toast.error(t_('Erreur lors de la génération de l\'aperçu', 'Error generating preview'));
      setPlayingVoice(null);
      setLoadingPreview(prev => {
        const newSet = new Set(prev);
        newSet.delete(voiceId);
        return newSet;
      });
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleVoiceSelection = (voiceId: string) => {
    // Toggle selection: if already selected, unselect it
    if (selectedVoice === voiceId) {
      setSelectedVoice('');
      toast.success(t_('Voix désélectionnée', 'Voice deselected'));
    } else {
      setSelectedVoice(voiceId);
      const voice = availableVoices.find(v => v.id === voiceId);
      if (voice) {
        setVoicePreference(voice.gender);
        setAccentPreference(voice.accent);
      }
      toast.success(t_('Voix sélectionnée avec succès', 'Voice selected successfully'));
    }
  };

  const handleSavePreferences = async () => {
    try {
      // If a voice is selected, use it
      // Otherwise, use the preferences (gender + accent) to find a matching voice
      let voiceToSave = selectedVoice;
      
      if (!voiceToSave) {
        // Find a voice matching the current preferences (only if both are not TOUS)
        if (voicePreference !== 'TOUS' && accentPreference !== 'TOUS') {
          const matchingVoice = availableVoices.find(
            v => v.gender === voicePreference && v.accent === accentPreference
          );
          
          if (matchingVoice) {
            voiceToSave = matchingVoice.id;
            setSelectedVoice(matchingVoice.id);
          } else {
            toast.error(t_('Aucune voix ne correspond à vos préférences. Veuillez sélectionner une voix spécifique.', 'No voice matches your preferences. Please select a specific voice.'));
            return;
          }
        } else {
          toast.error(t_('Veuillez sélectionner une voix spécifique ou définir des préférences complètes (genre et accent).', 'Please select a specific voice or set complete preferences (gender and accent).'));
          return;
        }
      }

      const selectedVoiceData = availableVoices.find(v => v.id === voiceToSave);
      if (!selectedVoiceData) {
        toast.error(t_('Voix sélectionnée introuvable', 'Selected voice not found'));
        return;
      }

      console.log('💾 Saving voice preference:', {
        voiceId: voiceToSave,
        voiceName: selectedVoiceData.name,
        gender: selectedVoiceData.gender,
        accent: selectedVoiceData.accent,
        elevenlabsVoiceId: selectedVoiceData.voiceId
      });

      // Save preferences to localStorage
      const preferences = {
        voiceId: voiceToSave, // Store the actual voice ID (e.g., 'france_male_1')
        voiceName: selectedVoiceData.name,
        gender: selectedVoiceData.gender,
        accent: selectedVoiceData.accent,
        elevenlabsVoiceId: selectedVoiceData.voiceId
      };
      localStorage.setItem('voicePreference', JSON.stringify(preferences));
      
      // Save to backend user preferences
      try {
        await apiClient.post('/users/preferences/voice', {
          voiceId: voiceToSave,
          voiceName: selectedVoiceData.name,
          gender: selectedVoiceData.gender,
          accent: selectedVoiceData.accent
        });
        console.log('✅ Voice preference saved to backend');
      } catch (backendError: any) {
        // Log error but continue - localStorage save already happened
        console.warn('Could not save to backend, using localStorage only:', backendError?.message);
      }
      
      toast.success(t_('Préférences vocales sauvegardées', 'Voice preferences saved successfully'));
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(t_('Erreur lors de la sauvegarde', 'Failed to save preferences'));
    }
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'HIGH': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'LOW': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    }
  };

  const getAccentLabel = (accent: string) => {
    switch (accent) {
      case 'FRANCE': return { flag: '🇫🇷', text: t_('France', 'France') };
      case 'QUEBEC': return { flag: '🇨🇦', text: t_('Québec', 'Quebec') };
      case 'BELGIUM': return { flag: '🇧🇪', text: t_('Belgique', 'Belgium') };
      default: return { flag: '🌍', text: accent };
    }
  };

  // Show skeleton loading instead of blocking spinner
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(147,51,234,0.1)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/30 dark:bg-pink-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
              >
                <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {t_("Configuration Vocale", "Voice Settings")}
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                {t_("Paramètres Vocaux", "Voice Settings")}
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                {t_(
                  "Personnalisez votre expérience avec nos voix IA de haute qualité. Écoutez et choisissez parmi différentes voix, accents français (France, Québec, Belgique) pour des simulations réalistes et adaptées à vos besoins.",
                  "Customize your experience with our high-quality AI voices. Listen and choose from different voices, French accents (France, Quebec, Belgium) for realistic and tailored simulations."
                )}
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Volume2, text: t_("Voix Premium", "Premium Voices"), desc: t_("Haute qualité", "High Quality") },
                  { icon: Headphones, text: t_("Aperçu Audio", "Audio Preview"), desc: t_("Écoutez avant", "Listen First") },
                  { icon: Settings, text: t_("Personnalisation", "Customization"), desc: t_("À votre goût", "To Your Taste") }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                  >
                    <feature.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{feature.text}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Visual Illustration - Voice/Sound Waves */}
              <div className="relative w-full max-w-md">
                {/* SVG Illustration */}
                <svg viewBox="0 0 400 300" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="150" r="130" fill="url(#voiceGradient1)" opacity="0.1"/>
                  <circle cx="200" cy="150" r="80" fill="url(#voiceGradient2)" opacity="0.15"/>
                  
                  {/* Microphone */}
                  <rect x="180" y="100" width="40" height="100" rx="20" fill="#EC4899" opacity="0.3"/>
                  <ellipse cx="200" cy="100" rx="25" ry="15" fill="#EC4899" opacity="0.5"/>
                  
                  {/* Sound waves */}
                  <path d="M 240 120 Q 260 100 280 120 Q 260 140 240 120" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.6"/>
                  <path d="M 245 140 Q 270 115 295 140 Q 270 165 245 140" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.6"/>
                  <path d="M 250 160 Q 280 130 310 160 Q 280 190 250 160" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.6"/>
                  
                  {/* Left sound waves */}
                  <path d="M 160 120 Q 140 100 120 120 Q 140 140 160 120" stroke="#EC4899" strokeWidth="3" fill="none" opacity="0.6"/>
                  <path d="M 155 140 Q 130 115 105 140 Q 130 165 155 140" stroke="#EC4899" strokeWidth="3" fill="none" opacity="0.6"/>
                  <path d="M 150 160 Q 120 130 90 160 Q 120 190 150 160" stroke="#EC4899" strokeWidth="3" fill="none" opacity="0.6"/>
                  
                  {/* Voice quality indicators */}
                  <circle cx="120" cy="60" r="20" fill="#10B981" opacity="0.2"/>
                  <circle cx="280" cy="60" r="20" fill="#06B6D4" opacity="0.2"/>
                  <circle cx="280" cy="240" r="20" fill="#F59E0B" opacity="0.2"/>
                  
                  <defs>
                    <linearGradient id="voiceGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6"/>
                      <stop offset="100%" stopColor="#EC4899"/>
                    </linearGradient>
                    <linearGradient id="voiceGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EC4899"/>
                      <stop offset="100%" stopColor="#F59E0B"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Voice Configuration */}
        <Card className="mb-8 shadow-lg border-2 border-purple-100 dark:border-purple-900/50 dark:bg-gray-800/80">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t_("Configuration Vocale", "Voice Configuration")}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t_("Définissez vos préférences par défaut", "Set your default preferences")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t_("Préférence vocale", "Voice Preference")}
                </label>
                <Select 
                  value={voicePreference} 
                  onValueChange={(value) => {
                    setVoicePreference(value);
                    // Clear selected voice when changing gender preference
                    setSelectedVoice('');
                  }}
                >
                  <SelectTrigger className="w-full h-12 dark:bg-gray-700 dark:border-gray-600 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOUS">{t_("Tous", "All")}</SelectItem>
                    <SelectItem value="MALE">{t_("Voix masculine", "Male Voice")}</SelectItem>
                    <SelectItem value="FEMALE">{t_("Voix féminine", "Female Voice")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t_("Préférence d'accent", "Accent Preference")}
                </label>
                <Select 
                  value={accentPreference} 
                  onValueChange={(value) => {
                    setAccentPreference(value);
                    // Clear selected voice when changing accent preference
                    setSelectedVoice('');
                  }}
                >
                  <SelectTrigger className="w-full h-12 dark:bg-gray-700 dark:border-gray-600 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOUS">{t_("Tous", "All")}</SelectItem>
                    <SelectItem value="FRANCE">🇫🇷 {t_("Français (France)", "French (France)")}</SelectItem>
                    <SelectItem value="QUEBEC">🇨🇦 {t_("Français (Québec)", "French (Quebec)")}</SelectItem>
                    <SelectItem value="BELGIUM">🇧🇪 {t_("Français (Belgique)", "French (Belgium)")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSavePreferences}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg w-full md:w-auto"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {t_("Sauvegarder les préférences", "Save Preferences")}
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced Voice Options */}
        <Card className="shadow-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800/80">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t_("Voix Disponibles", "Available Voices")}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t_("Écoutez et sélectionnez votre voix préférée", "Listen and select your preferred voice")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && filteredVoices.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredVoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t_("Aucune voix correspondante", "No matching voices")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {accentPreference !== 'TOUS' || voicePreference !== 'TOUS'
                    ? t_(
                        `Aucune voix ne correspond aux filtres sélectionnés (${accentPreference !== 'TOUS' ? accentPreference : 'Tous'} ${voicePreference !== 'TOUS' ? `• ${voicePreference === 'MALE' ? 'Masculin' : 'Féminin'}` : ''}). Veuillez ajuster vos préférences.`,
                        `No voices match the selected filters (${accentPreference !== 'TOUS' ? accentPreference : 'All'} ${voicePreference !== 'TOUS' ? `• ${voicePreference === 'MALE' ? 'Male' : 'Female'}` : ''}). Please adjust your preferences.`
                      )
                    : t_("Aucune voix disponible pour le moment", "No voices available at the moment")
                  }
                </p>
                {(accentPreference !== 'TOUS' || voicePreference !== 'TOUS') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAccentPreference('TOUS');
                      setVoicePreference('TOUS');
                      setSelectedVoice('');
                    }}
                    className="mt-2"
                  >
                    {t_("Réinitialiser les préférences", "Reset Preferences")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredVoices.map((voice, idx) => {
                  const accentInfo = getAccentLabel(voice.accent);
                  const isSelected = selectedVoice === voice.id;
                  const isPlaying = playingVoice === voice.id;
                  const isLoading = loadingPreview.has(voice.id);

                  return (
                    <motion.div
                      key={voice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`group relative overflow-hidden rounded-xl border-2 ${
                        isSelected
                          ? 'border-purple-500 dark:border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      } bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300`}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
                              isSelected
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                : 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30'
                            }`}>
                              <Volume2 className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                  {voice.name}
                                </h3>
                                <span className="text-2xl">{accentInfo.flag}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {voice.gender === 'MALE' 
                                  ? t_('Voix masculine', 'Male Voice')
                                  : t_('Voix féminine', 'Female Voice')} • {accentInfo.text}
                              </p>
                              {voice.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {voice.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Voice characteristics */}
                        <div className="mb-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {voice.gender === 'MALE' 
                              ? t_('Masculin', 'Male')
                              : t_('Féminin', 'Female')}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {accentInfo.text}
                          </span>
                          {voice.quality && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${getQualityColor(voice.quality)}`}>
                              {voice.quality === 'HIGH' 
                                ? t_('Haute qualité', 'High Quality')
                                : voice.quality === 'MEDIUM'
                                ? t_('Qualité moyenne', 'Medium Quality')
                                : t_('Qualité basique', 'Basic Quality')}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                          <Button
                            size="lg"
                            variant={isPlaying ? "default" : "outline"}
                            onClick={() => handleVoicePreview(voice.id)}
                            disabled={isLoading}
                            className={`flex-1 ${
                              isPlaying
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
                                : 'border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            }`}
                          >
                            {isLoading ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                {t_("Chargement...", "Loading...")}
                              </>
                            ) : isPlaying ? (
                              <>
                                <Pause className="w-5 h-5 mr-2" />
                                {t_("En cours...", "Playing...")}
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                {t_("Écouter", "Preview")}
                              </>
                            )}
                          </Button>
                          <Button
                            size="lg"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => handleVoiceSelection(voice.id)}
                            className={`flex-1 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg'
                                : 'border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/10'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <X className="w-5 h-5 mr-2" />
                                {t_("Désélectionner", "Deselect")}
                              </>
                            ) : (
                              <>
                                <Settings className="w-5 h-5 mr-2" />
                                {t_("Sélectionner", "Select")}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Quality Information */}
        <Card className="mt-8 shadow-lg border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {t_("À Propos des Voix", "About the Voices")}
                </h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong className="text-blue-600 dark:text-blue-400">{t_("Voix Premium:", "Premium Voices:")}</strong>{' '}
                    {t_("Voix IA de haute qualité avec prononciation naturelle, idéales pour des simulations professionnelles.", 
                        "High-quality AI voices with natural pronunciation, ideal for professional simulations.")}
                  </p>
                  <p>
                    <strong className="text-purple-600 dark:text-purple-400">{t_("Accents Disponibles:", "Available Accents:")}</strong>{' '}
                    {t_("France, Québec, et Belgique pour une expérience d'apprentissage complète du français.", 
                        "France, Quebec, and Belgium for a complete French learning experience.")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {t_("💡 Conseil: Écoutez plusieurs voix avant de faire votre choix pour trouver celle qui vous convient le mieux.", 
                        "💡 Tip: Listen to several voices before making your choice to find the one that suits you best.")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function VoicePage() {
  return (
    <SharedDataProvider>
      <VoicePageContent />
    </SharedDataProvider>
  );
}
