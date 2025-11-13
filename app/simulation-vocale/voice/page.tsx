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
  X,
  Globe,
  Bell
} from 'lucide-react';
import { SimulationHeader } from '@/components/SimulationHeader';
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
        const { audioBase64, previewText, useBrowserTTS, voiceId_11labs, error } = data;
        console.log('✅ Preview response:', {
          voiceId,
          voiceId_11labs,
          hasAudio: !!audioBase64,
          useBrowserTTS,
          error,
          gender: data.gender,
          accent: data.accent
        });

        if (audioBase64 && !useBrowserTTS) {
          // Play audio from base64 - THIS IS THE CORRECT UNIQUE VOICE FROM 11LABS
          console.log('🎵 Playing ElevenLabs audio for voice:', {
            voiceId,
            voiceName: voice?.name,
            gender: voice?.gender,
            accent: voice?.accent,
            elevenlabsVoiceId: voiceId_11labs,
            audioLength: audioBase64.length
          });
          
          // Ensure audioBase64 is a valid data URL
          const audioSrc = audioBase64.startsWith('data:') ? audioBase64 : `data:audio/mpeg;base64,${audioBase64}`;
          const audio = new Audio(audioSrc);
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
            console.warn('⚠️ Audio playback error, falling back to browser TTS:', error);
            // Silently fall back to browser TTS
            const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
            const utterance = new SpeechSynthesisUtterance(previewText);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = voice?.gender === 'MALE' ? 0.8 : 1.2;
            
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
            
            window.speechSynthesis.speak(utterance);
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
            console.warn('⚠️ Error starting audio playback, falling back to browser TTS:', playError);
            // Silently fall back to browser TTS
            const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
            const utterance = new SpeechSynthesisUtterance(previewText);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = voice?.gender === 'MALE' ? 0.8 : 1.2;
            
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
            
            window.speechSynthesis.speak(utterance);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          }
        } else {
          // Fallback to browser SpeechSynthesis API (silently, no error toast)
          console.log('⚠️ Using browser TTS fallback - voices will sound similar!', {
            voiceId,
            voiceName: voice?.name,
            reason: error || 'No 11labs audio received. Configure ELEVENLABS_API_KEY for unique voices.',
            useBrowserTTS
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
            console.warn('Browser TTS error, stopping playback');
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
      // Don't show error for 401 - it's expected to fall back to browser TTS
      const is401Error = error?.response?.status === 401 || error?.message?.includes('401');
      
      if (!is401Error) {
      console.error('Error generating voice preview:', error);
      toast.error(t_('Erreur lors de la génération de l\'aperçu', 'Error generating preview'));
      } else {
        // Silently fall back to browser TTS for 401 errors
        console.log('⚠️ ElevenLabs API returned 401, using browser TTS fallback');
        const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
        const utterance = new SpeechSynthesisUtterance(previewText);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.0;
        
        const voice = availableVoices.find(v => v.id === voiceId);
        utterance.pitch = voice?.gender === 'MALE' ? 0.8 : 1.2;
        
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
        
        window.speechSynthesis.speak(utterance);
        setLoadingPreview(prev => {
          const newSet = new Set(prev);
          newSet.delete(voiceId);
          return newSet;
        });
        return; // Early return to prevent error state
      }
      
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
    <div className="animate-pulse rounded-xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="voice" />

      <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col w-full max-w-[960px] flex-1">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-3 p-4 text-center items-center my-8 md:my-12">
            <div className="flex w-full flex-col gap-3">
              <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECC71] to-[#27c066] text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-[-0.033em]">
                {t_("Paramètres Vocaux", "Voice Settings")}
              </h1>
              <p className="text-muted-foreground text-sm font-normal leading-normal max-w-xl mx-auto">
                {t_(
                  "Personnalisez votre partenaire d'entretien IA. Choisissez la voix et l'accent qui conviennent le mieux à votre session de pratique.",
                  "Customize your AI interview partner. Choose the voice and accent that best suits your practice session."
                )}
              </p>
            </div>
          </div>

          {/* Voice Configuration Section */}
          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-2xl rounded-xl p-4 sm:p-6 mb-12 border border-white/10">
            <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-5">
              {t_("Configuration Vocale", "Voice Configuration")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="relative w-full md:col-span-1">
                <label className="block text-black dark:text-white text-sm font-medium leading-normal pb-2" htmlFor="voice-preference">
                  {t_("Préférence Vocale", "Voice Preference")}
                </label>
                <Select 
                  value={voicePreference} 
                  onValueChange={(value) => {
                    setVoicePreference(value);
                    setSelectedVoice('');
                  }}
                >
                  <SelectTrigger className="w-full rounded-lg text-black dark:text-white border border-[#3b5445] dark:border-white/20 bg-white/5 dark:bg-white/5 backdrop-blur-2xl focus:border-[#2ECC71] h-12 p-3 text-sm font-normal leading-normal ring-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOUS">{t_("Tous", "Any")}</SelectItem>
                    <SelectItem value="MALE">{t_("Masculin", "Male")}</SelectItem>
                    <SelectItem value="FEMALE">{t_("Féminin", "Female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full md:col-span-1">
                <label className="block text-black dark:text-white text-sm font-medium leading-normal pb-2" htmlFor="accent-preference">
                  {t_("Préférence d'Accent", "Accent Preference")}
                </label>
                <Select 
                  value={accentPreference} 
                  onValueChange={(value) => {
                    setAccentPreference(value);
                    setSelectedVoice('');
                  }}
                >
                  <SelectTrigger className="w-full rounded-lg text-black dark:text-white border border-[#3b5445] dark:border-white/20 bg-white/5 dark:bg-white/5 backdrop-blur-2xl focus:border-[#2ECC71] h-12 p-3 text-sm font-normal leading-normal ring-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOUS">{t_("Tous", "All")}</SelectItem>
                    <SelectItem value="FRANCE">🇫🇷 {t_("France", "France")}</SelectItem>
                    <SelectItem value="QUEBEC">🇨🇦 {t_("Québec", "Quebec")}</SelectItem>
                    <SelectItem value="BELGIUM">🇧🇪 {t_("Belgique", "Belgium")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <Button 
                  onClick={handleSavePreferences}
                  className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#2ECC71] hover:bg-[#27c066] text-black text-sm font-bold leading-normal tracking-[0.015em] transition-opacity"
                >
                  <span className="truncate">{t_("Sauvegarder les Préférences", "Save Preferences")}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Available Voices Section */}
          <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            {t_("Voix Disponibles", "Available Voices")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {loading && filteredVoices.length === 0 ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))
            ) : filteredVoices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Volume2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  {t_("Aucune voix correspondante", "No matching voices")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t_("Aucune voix disponible pour le moment", "No voices available at the moment")}
                </p>
              </div>
            ) : (
              filteredVoices.map((voice, idx) => {
                const accentInfo = getAccentLabel(voice.accent);
                const isSelected = selectedVoice === voice.id;
                const isPlaying = playingVoice === voice.id;
                const isLoading = loadingPreview.has(voice.id);
                const isPremium = voice.quality === 'HIGH';

                return (
                  <div
                    key={voice.id}
                    className={`bg-white/5 dark:bg-white/5 backdrop-blur-2xl rounded-xl p-5 flex flex-col border-2 ${
                      isSelected 
                        ? 'border-[#2ECC71] ring-2 ring-[#2ECC71]/20 shadow-lg' 
                        : 'border-gray-300/30 dark:border-white/20 shadow-sm'
                    } transition-all hover:border-[#2ECC71]/50 hover:shadow-md`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-black dark:text-white text-lg font-bold">{voice.name}</h3>
                        <p className="text-muted-foreground text-xs">
                          {voice.gender === 'MALE' 
                            ? t_('Masculin', 'Male') 
                            : t_('Féminin', 'Female')}, {accentInfo.text} {accentInfo.flag}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 ${
                        isPremium 
                          ? 'bg-[#2ECC71]/20 text-[#2ECC71]' 
                          : 'bg-[#3b5445] dark:bg-white/10 text-muted-foreground'
                      } text-xs font-semibold px-2 py-1 rounded-full`}>
                        {isPremium && <Star className="w-3 h-3" />}
                        <span>{isPremium ? t_('Premium', 'Premium') : t_('Standard', 'Standard')}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs font-normal leading-normal mb-4 flex-grow">
                      {voice.description || t_('Une voix claire et professionnelle.', 'A clear, professional, and friendly voice.')}
                    </p>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => handleVoicePreview(voice.id)}
                        disabled={isLoading}
                        className={`flex items-center justify-center h-12 w-12 rounded-full ${
                          isPlaying
                            ? 'bg-[#2ECC71] text-black hover:opacity-90'
                            : 'bg-[#3b5445] dark:bg-white/10 text-white hover:bg-[#4a6956] dark:hover:bg-white/20'
                        } transition-opacity`}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleVoiceSelection(voice.id)}
                        className={`flex-1 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 ${
                          isSelected
                            ? 'bg-[#2ECC71] text-black font-bold'
                            : 'bg-[#3b5445] dark:bg-white/10 text-white hover:bg-[#4a6956] dark:hover:bg-white/20'
                        } text-sm font-bold leading-normal tracking-[0.015em] transition-colors`}
                      >
                        <span className="truncate">
                          {isSelected ? t_('Sélectionné', 'Selected') : t_('Sélectionner la Voix', 'Select Voice')}
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* About Our Voices Section */}
          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-2xl rounded-xl p-4 sm:p-6 my-12 border border-white/10">
            <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-5">
              {t_("À Propos de Nos Voix", "About Our Voices")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#2ECC71]/20 flex items-center justify-center mt-1">
                  <Star className="text-[#2ECC71] text-lg" />
                </div>
                <div>
                  <h4 className="text-black dark:text-white text-sm font-bold">{t_("Voix Premium", "Premium Voices")}</h4>
                  <p className="text-muted-foreground text-xs mt-1">
                    {t_(
                      "Nos voix premium utilisent les dernières technologies IA pour offrir des conversations les plus naturelles et humaines, offrant une expérience d'entretien exceptionnellement réaliste.",
                      "Our premium voices leverage the latest AI for the most natural and human-like conversations, providing an exceptionally realistic interview experience."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#2ECC71]/20 flex items-center justify-center mt-1">
                  <Globe className="text-[#2ECC71] text-lg" />
                </div>
                <div>
                  <h4 className="text-black dark:text-white text-sm font-bold">{t_("Diversité des Accents", "Accent Diversity")}</h4>
                  <p className="text-muted-foreground text-xs mt-1">
                    {t_(
                      "Pratiquez avec une variété d'accents français authentiques de France, Québec et Belgique pour élargir votre compréhension et votre adaptabilité.",
                      "Practice with a variety of authentic French accents from France, Quebec, and Belgium to broaden your comprehension and adaptability."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
