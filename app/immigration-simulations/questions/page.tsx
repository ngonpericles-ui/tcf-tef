'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  Plane,
  Globe,
  FileText,
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Crown,
  ChevronRight,
  Play,
  Pause,
  Mic,
  Volume2,
  Headphones,
  Settings,
  BookOpen,
  GraduationCap,
  Briefcase,
  Home,
  MapPin,
  Building2,
  Shield,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface BookingSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  duration: number;
}

interface VoiceOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  accent: 'FRANCE' | 'QUEBEC' | 'BELGIUM';
  description?: string;
  voiceId?: string;
  sampleUrl?: string;
}

function QuestionsPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  // Configuration state
  const [selectedCountry, setSelectedCountry] = useState<string>(''); // CANADA, FRANCE, BELGIUM
  const [selectedTopic, setSelectedTopic] = useState<string>('immigration'); // immigration, school, work, relocation
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voicePreference, setVoicePreference] = useState<string>('TOUS'); // TOUS, MALE, FEMALE
  const [accentPreference, setAccentPreference] = useState<string>('TOUS'); // TOUS, FRANCE, QUEBEC, BELGIUM
  
  // Booking state
  const [bookingType, setBookingType] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  
  // Data state
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [creating, setCreating] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<Set<string>>(new Set());

  const countries = [
    { code: 'CANADA', name: t_('Canada', 'Canada'), flag: '🇨🇦' },
    { code: 'FRANCE', name: t_('France', 'France'), flag: '🇫🇷' },
    { code: 'BELGIUM', name: t_('Belgique', 'Belgium'), flag: '🇧🇪' }
  ];

  const topics = [
    { code: 'immigration', name: t_('Immigration générale', 'General Immigration'), icon: Plane, desc: t_('Questions générales sur l\'immigration', 'General immigration questions') },
    { code: 'school', name: t_('École / Études', 'School / Studies'), icon: GraduationCap, desc: t_('Immigration pour études', 'Immigration for studies') },
    { code: 'work', name: t_('Travail / Professionnel', 'Work / Professional'), icon: Briefcase, desc: t_('Immigration pour travail', 'Immigration for work') },
    { code: 'relocation', name: t_('Déménagement / Famille', 'Relocation / Family'), icon: Home, desc: t_('Immigration pour regroupement familial', 'Immigration for family reunification') }
  ];

  useEffect(() => {
    fetchAvailableVoices();
    loadVoicePreference();
    generateAvailableSlots();
  }, []);

  useEffect(() => {
    if (availableVoices.length > 0) {
      applyFilter(availableVoices, accentPreference, voicePreference);
    }
  }, [accentPreference, availableVoices, voicePreference, selectedCountry]);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableSlots();
    }
  }, [selectedDate]);

  // Refresh slots every minute if today is selected
  useEffect(() => {
    if (!selectedDate) return;
    
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDateOnly.getTime() === today.getTime();
    
    if (isToday) {
      const interval = setInterval(() => {
        generateAvailableSlots();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  const loadVoicePreference = async () => {
    try {
      const savedPreference = localStorage.getItem('voicePreference');
      if (savedPreference) {
        try {
          const saved = JSON.parse(savedPreference);
          if (saved.voiceId) {
            setSelectedVoice(saved.voiceId);
            setVoicePreference(saved.gender || 'TOUS');
            setAccentPreference(saved.accent || 'TOUS');
            return;
          }
        } catch (e) {
          console.error('Error parsing saved preference:', e);
        }
      }
      
      try {
        const response = await fetch('/api/users/preferences/voice', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('access_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.voiceId) {
            setSelectedVoice(data.data.voiceId);
            setVoicePreference(data.data.gender || 'TOUS');
            setAccentPreference(data.data.accent || 'TOUS');
          }
        }
      } catch (backendError) {
        console.warn('Could not load voice preference from backend:', backendError);
      }
    } catch (error) {
      console.error('Error loading voice preference:', error);
    }
  };

  const fetchAvailableVoices = async () => {
    try {
      setLoadingVoices(true);
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/voice-simulation/voices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoadingVoices(false);
      setLoading(false);
    }
  };

  const applyFilter = (voices: VoiceOption[], accentFilterValue: string, genderFilter?: string) => {
    let filtered = [...voices];
    
    // Filter by country accent if country is selected
    if (selectedCountry) {
      const countryAccentMap: { [key: string]: string } = {
        'CANADA': 'QUEBEC',
        'FRANCE': 'FRANCE',
        'BELGIUM': 'BELGIUM'
      };
      
      const countryAccent = countryAccentMap[selectedCountry];
      if (countryAccent) {
        filtered = filtered.filter((voice) => voice.accent === countryAccent);
      }
    }
    
    // Apply accent filter
    if (accentFilterValue !== 'TOUS') {
      filtered = filtered.filter((voice) => voice.accent === accentFilterValue);
    }
    
    // Apply gender filter
    if (genderFilter && genderFilter !== 'TOUS' && (genderFilter === 'MALE' || genderFilter === 'FEMALE')) {
      filtered = filtered.filter((voice) => voice.gender === genderFilter);
    }
    
    setFilteredVoices(filtered);
  };

  const generateAvailableSlots = () => {
    if (!selectedDate) return;
    
    const slots: BookingSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    const startMinute = 30;
    const slotDuration = 30; // minutes
    
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDateOnly.getTime() === today.getTime();
    const now = new Date();
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += slotDuration) {
        if (hour === endHour && minute >= startMinute) break;
        
        const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hour, minute, 0, 0);
        
        let available = true;
        if (isToday && slotDateTime <= now) {
          available = false;
        }
        
        slots.push({
          id: `${slotTime}`,
          date: selectedDate.toISOString().split('T')[0],
          time: slotTime,
          available,
          duration: slotDuration
        });
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleVoicePreview = async (voiceId: string) => {
    if (playingVoice === voiceId) {
      // Stop playback
      window.speechSynthesis.cancel();
      setPlayingVoice(null);
      return;
    }

    try {
      setPlayingVoice(voiceId);
      setLoadingPreview(prev => new Set(prev).add(voiceId));

      const previewText = t_(
        'Bonjour, je suis votre agent d\'immigration. Prêt à commencer votre entretien ?',
        'Hello, I am your immigration officer. Ready to start your interview?'
      );

      const response = await fetch('/api/voice-simulation/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ 
          voiceId, 
          text: previewText 
        })
      });

      if (response.ok) {
        const data = await response.json();
        const audioBase64 = data.data?.audioBase64 || data.data?.audio;
        const useBrowserTTS = data.data?.useBrowserTTS;

        if (audioBase64) {
          // Use ElevenLabs audio
          const audio = new Audio(audioBase64);
          audio.onended = () => {
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          audio.onerror = () => {
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          await audio.play();
        } else if (useBrowserTTS || !audioBase64) {
          // Fallback to browser TTS
          const utterance = new SpeechSynthesisUtterance(previewText);
          utterance.lang = 'fr-FR';
          utterance.rate = 1.0;
          
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
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
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

  const handleVoiceSelection = (voiceId: string) => {
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

  const handleCreateSimulation = async () => {
    // Validation
    if (!selectedCountry) {
      toast.error(t_('Veuillez sélectionner un pays', 'Please select a country'));
      return;
    }

    if (!selectedTopic) {
      toast.error(t_('Veuillez sélectionner un sujet', 'Please select a topic'));
      return;
    }

    if (bookingType === 'MANUAL' && (!selectedDate || !selectedTime)) {
      toast.error(t_('Veuillez sélectionner une date et une heure', 'Please select a date and time'));
      return;
    }

    if (!selectedVoice) {
      toast.error(t_('Veuillez sélectionner une voix', 'Please select a voice'));
      return;
    }

    try {
      setCreating(true);

      // Prepare booking data
      const scheduledDateTime = bookingType === 'MANUAL' && selectedDate && selectedTime
        ? new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`)
        : null;

      const simulationData = {
        country: selectedCountry.toLowerCase(),
        immigrationType: selectedTopic,
        level: 'B1', // Default level
        personalInfo: {},
        voicePreference: selectedVoice,
        bookingType,
        scheduledDate: scheduledDateTime?.toISOString(),
        questionsData: {
          voiceId: selectedVoice,
          country: selectedCountry,
          topic: selectedTopic
        }
      };

      // Create immigration simulation (similar to voice simulation booking)
      const response = await fetch('/api/immigration-simulation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(simulationData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(t_('Simulation d\'immigration créée avec succès', 'Immigration simulation created successfully'));
        
        // Redirect to simulation guide or room
        if (data.data?.id) {
          router.push(`/immigration-simulations/${data.data.id}/guide`);
        } else {
          router.push('/immigration-simulations');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.message || t_('Erreur lors de la création', 'Error creating simulation'));
      }
    } catch (error) {
      console.error('Error creating simulation:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    } finally {
      setCreating(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t_('Chargement...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section - Matching Voice Simulation Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
            >
              <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {t_("Configuration de la Simulation", "Simulation Configuration")}
              </span>
            </motion.div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
              {t_("Simulations d'Immigration", "Immigration Simulations")}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              {t_(
                "Configurez votre simulation d'immigration : choisissez votre pays de destination, votre sujet d'intérêt, et votre voix préférée pour un entretien réaliste avec un agent d'immigration.",
                "Configure your immigration simulation: choose your destination country, your topic of interest, and your preferred voice for a realistic interview with an immigration officer."
              )}
            </p>

            {/* SVG Illustration - Like Voice Simulation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center mt-8"
            >
              <div className="relative w-full max-w-2xl">
                <svg viewBox="0 0 600 400" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="300" cy="200" r="180" fill="url(#gradient1)" opacity="0.1"/>
                  <circle cx="300" cy="200" r="130" fill="url(#gradient2)" opacity="0.15"/>
                  
                  {/* Globe/World Map */}
                  <circle cx="300" cy="180" r="100" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.3"/>
                  <circle cx="300" cy="180" r="85" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.2"/>
                  
                  {/* Continents/Regions */}
                  <path d="M 240 140 Q 270 130 300 140 Q 330 130 360 140 Q 350 150 340 160 Q 330 165 300 160 Q 270 165 250 160 Q 240 150 240 140" fill="#60A5FA" opacity="0.3"/>
                  <path d="M 200 200 Q 240 190 280 200 Q 320 205 360 200 Q 380 220 360 240 Q 340 245 300 240 Q 260 245 220 240 Q 200 220 200 200" fill="#3B82F6" opacity="0.3"/>
                  <path d="M 260 280 Q 300 275 340 280 Q 350 290 340 300 Q 330 305 300 300 Q 270 305 260 300 Q 250 290 260 280" fill="#2563EB" opacity="0.3"/>
                  
                  {/* Airplane */}
                  <g transform="translate(300, 240) rotate(45)">
                    <ellipse cx="0" cy="0" rx="60" ry="18" fill="#3B82F6" opacity="0.9"/>
                    <ellipse cx="-25" cy="10" rx="35" ry="14" fill="#2563EB" opacity="0.8"/>
                    <ellipse cx="-25" cy="-10" rx="35" ry="14" fill="#2563EB" opacity="0.8"/>
                    <path d="M -50 -5 L -60 -12 L -50 -22 Z" fill="#1E40AF" opacity="0.9"/>
                    <circle cx="-18" cy="0" r="2.5" fill="#E0F2FE"/>
                    <circle cx="-6" cy="0" r="2.5" fill="#E0F2FE"/>
                    <circle cx="6" cy="0" r="2.5" fill="#E0F2FE"/>
                  </g>
                  
                  {/* Flight path */}
                  <path d="M 180 140 Q 240 170 300 200 Q 350 225 400 260" stroke="#10B981" strokeWidth="3" strokeDasharray="8,5" opacity="0.5" fill="none"/>
                  
                  {/* Country markers */}
                  <circle cx="180" cy="140" r="5" fill="#10B981"/>
                  <circle cx="400" cy="260" r="5" fill="#10B981"/>
                  <circle cx="250" cy="170" r="4" fill="#F59E0B"/>
                  <circle cx="350" cy="230" r="4" fill="#F59E0B"/>
                  
                  {/* Immigration officer (left) */}
                  <circle cx="150" cy="300" r="30" fill="#8B5CF6" opacity="0.3"/>
                  <rect x="120" y="330" width="60" height="70" rx="30" fill="#8B5CF6" opacity="0.4"/>
                  
                  {/* Document/File icon */}
                  <rect x="450" y="120" width="60" height="80" rx="8" fill="white" stroke="#3B82F6" strokeWidth="2"/>
                  <rect x="460" y="140" width="40" height="3" rx="1.5" fill="#3B82F6" opacity="0.5"/>
                  <rect x="460" y="150" width="35" height="3" rx="1.5" fill="#3B82F6" opacity="0.5"/>
                  <rect x="460" y="160" width="40" height="3" rx="1.5" fill="#3B82F6" opacity="0.5"/>
                  <circle cx="480" cy="180" r="8" fill="#10B981"/>
                  <path d="M 476 180 L 479 183 L 484 178" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  
                  {/* Speech bubbles */}
                  <path d="M 120 250 Q 90 240 70 260 L 85 270 Q 100 265 120 270 Z" fill="#8B5CF6" opacity="0.2"/>
                  <circle cx="80" cy="235" r="10" fill="#8B5CF6" opacity="0.3"/>
                  
                  <path d="M 480 250 Q 510 240 530 260 L 515 270 Q 500 265 480 270 Z" fill="#06B6D4" opacity="0.2"/>
                  <circle cx="520" cy="235" r="10" fill="#06B6D4" opacity="0.3"/>
                  
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6"/>
                      <stop offset="100%" stopColor="#2563EB"/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60A5FA"/>
                      <stop offset="100%" stopColor="#3B82F6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuration Card */}
        <Card className="mb-8 border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-100 dark:border-blue-900">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>{t_("Configuration de la simulation", "Simulation Configuration")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Country Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                {t_("Pays de destination", "Destination Country")} <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {countries.map((country) => (
                  <motion.div
                    key={country.code}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedCountry === country.code
                          ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                          : 'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                      onClick={() => {
                        setSelectedCountry(country.code);
                        // Auto-filter voices by country accent
                        const countryAccentMap: { [key: string]: string } = {
                          'CANADA': 'QUEBEC',
                          'FRANCE': 'FRANCE',
                          'BELGIUM': 'BELGIUM'
                        };
                        const accent = countryAccentMap[country.code];
                        if (accent) {
                          setAccentPreference(accent);
                          applyFilter(availableVoices, accent, voicePreference);
                        }
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="text-3xl">{country.flag}</div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{country.name}</div>
                          {selectedCountry === country.code && (
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Topic Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                {t_("Sujet de l'immigration", "Immigration Topic")} <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topics.map((topic) => {
                  const IconComponent = topic.icon;
                  return (
                    <motion.div
                      key={topic.code}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-300 h-full ${
                          selectedTopic === topic.code
                            ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                            : 'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                        onClick={() => setSelectedTopic(topic.code)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedTopic === topic.code
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{topic.name}</div>
                              {selectedTopic === topic.code && (
                                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{topic.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                {t_("Sélection de la voix", "Voice Selection")} <span className="text-red-500">*</span>
              </Label>
              
              {/* Voice Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                    {t_("Préférence vocale", "Voice Preference")}
                  </Label>
                  <Select value={voicePreference} onValueChange={(value) => {
                    setVoicePreference(value);
                    applyFilter(availableVoices, accentPreference, value);
                  }}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUS">{t_("Tous", "All")}</SelectItem>
                      <SelectItem value="MALE">{t_("Masculin", "Male")}</SelectItem>
                      <SelectItem value="FEMALE">{t_("Féminin", "Female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                    {t_("Préférence d'accent", "Accent Preference")}
                  </Label>
                  <Select value={accentPreference} onValueChange={(value) => {
                    setAccentPreference(value);
                    applyFilter(availableVoices, value, voicePreference);
                  }}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUS">{t_("Tous", "All")}</SelectItem>
                      <SelectItem value="FRANCE">{t_("France", "France")} 🇫🇷</SelectItem>
                      <SelectItem value="QUEBEC">{t_("Québec", "Quebec")} 🇨🇦</SelectItem>
                      <SelectItem value="BELGIUM">{t_("Belgique", "Belgium")} 🇧🇪</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice Cards */}
              {loadingVoices ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                </div>
              ) : filteredVoices.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t_("Aucune voix disponible avec ces filtres", "No voices available with these filters")}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredVoices.map((voice) => {
                    const accentLabel = getAccentLabel(voice.accent);
                    const isSelected = selectedVoice === voice.id;
                    const isPlaying = playingVoice === voice.id;
                    
                    return (
                      <motion.div
                        key={voice.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                              : 'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                          onClick={() => handleVoiceSelection(voice.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                  <Mic className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{voice.name}</div>
                                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span>{accentLabel.flag}</span>
                                    <span>{accentLabel.text}</span>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoicePreview(voice.id);
                              }}
                              disabled={loadingPreview.has(voice.id)}
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  {t_("Arrêter", "Stop")}
                                </>
                              ) : loadingPreview.has(voice.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                  {t_("Chargement...", "Loading...")}
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  {t_("Écouter", "Listen")}
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking Type Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                {t_("Type de réservation", "Booking Type")} <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={bookingType} onValueChange={(value: 'AUTO' | 'MANUAL') => setBookingType(value)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        bookingType === 'AUTO'
                          ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setBookingType('AUTO')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="AUTO" id="auto" />
                          <Label htmlFor="auto" className="cursor-pointer flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{t_("Immédiat", "Immediate")}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{t_("Commencer maintenant", "Start now")}</div>
                          </Label>
                          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        bookingType === 'MANUAL'
                          ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setBookingType('MANUAL')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="MANUAL" id="manual" />
                          <Label htmlFor="manual" className="cursor-pointer flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{t_("Planifier", "Schedule")}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{t_("Choisir une date et heure", "Choose date and time")}</div>
                          </Label>
                          <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Manual Booking: Date & Time Selection */}
            {bookingType === 'MANUAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    {t_("Date", "Date")} <span className="text-red-500">*</span>
                  </Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    {t_("Heure", "Time")} <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        className={`
                          ${selectedTime === slot.time ? 'bg-blue-600 text-white' : ''}
                          ${!slot.available ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'}
                        `}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleCreateSimulation}
                disabled={creating || !selectedCountry || !selectedTopic || !selectedVoice || (bookingType === 'MANUAL' && (!selectedDate || !selectedTime))}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all py-6 text-lg font-semibold"
                size="lg"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    {t_("Création en cours...", "Creating...")}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {t_("Créer la simulation", "Create Simulation")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{t_("Note importante :", "Important note:")}</strong> {t_(
              "Les questions d'immigration seront adaptées à votre pays et sujet sélectionnés. L'entretien commencera par des questions personnelles simples, puis progressera vers des questions spécifiques à votre sujet d'immigration.",
              "Immigration questions will be adapted to your selected country and topic. The interview will start with simple personal questions, then progress to topic-specific immigration questions."
            )}
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <SharedDataProvider>
      <QuestionsPageContent />
    </SharedDataProvider>
  );
}
