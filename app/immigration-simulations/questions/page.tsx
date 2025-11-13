'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plane,
  Globe,
  CalendarIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Mic,
  Volume2,
  Search,
  X,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  Briefcase,
  Home,
  MapPin,
  Zap
} from 'lucide-react';
import { SimulationHeader } from '@/components/SimulationHeader';
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
  avatar?: string;
  flag?: string;
}

interface ImmigrationSimulation {
  id: string;
  scheduledDate: string | null;
  country: string;
  immigrationType: string;
  voicePreference: string;
  questionsData?: any;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  overallScore?: number;
  finalScore?: number | null;
  feedback?: string;
  duration: number;
  createdAt: string;
}

function QuestionsPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  // Configuration state
  const [selectedCountry, setSelectedCountry] = useState<string>(''); // CANADA, FRANCE, BELGIUM
  const [selectedTopic, setSelectedTopic] = useState<string>('immigration'); // immigration, school, work, relocation
  const [voicePreference, setVoicePreference] = useState<string>(''); // Store voice ID like 'france_male_1'
  
  // Booking state
  const [bookingType, setBookingType] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [bookings, setBookings] = useState<ImmigrationSimulation[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ImmigrationSimulation | null>(null);
  
  // Data state
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all-statuses');
  const [filterVoice, setFilterVoice] = useState<string>('all-voices');
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  // Calendar navigation
  const [calendarMonth, setCalendarMonth] = useState(selectedDate || new Date());

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

  // All 8 voices with profile images and flags (matching voice simulation booking page)
  const allVoices = [
    {
      id: 'france_male_1',
      name: 'Pierre',
      gender: 'MALE',
      accent: 'FRANCE',
      flag: '🇫🇷',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix masculine française professionnelle'
    },
    {
      id: 'france_male_2',
      name: 'Antoine',
      gender: 'MALE',
      accent: 'FRANCE',
      flag: '🇫🇷',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix masculine française claire'
    },
    {
      id: 'france_female_1',
      name: 'Marie',
      gender: 'FEMALE',
      accent: 'FRANCE',
      flag: '🇫🇷',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix féminine française élégante'
    },
    {
      id: 'quebec_male_1',
      name: 'Jean-Baptiste',
      gender: 'MALE',
      accent: 'QUEBEC',
      flag: '🇨🇦',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix masculine québécoise authentique'
    },
    {
      id: 'quebec_male_2',
      name: 'François',
      gender: 'MALE',
      accent: 'QUEBEC',
      flag: '🇨🇦',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix masculine québécoise expressive'
    },
    {
      id: 'quebec_female_1',
      name: 'Céline',
      gender: 'FEMALE',
      accent: 'QUEBEC',
      flag: '🇨🇦',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix féminine québécoise chaleureuse'
    },
    {
      id: 'belgium_male_1',
      name: 'Thomas',
      gender: 'MALE',
      accent: 'BELGIUM',
      flag: '🇧🇪',
      avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix masculine belge professionnelle'
    },
    {
      id: 'belgium_female_1',
      name: 'Sophie',
      gender: 'FEMALE',
      accent: 'BELGIUM',
      flag: '🇧🇪',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      description: 'Voix féminine belge élégante'
    }
  ];
  
  // Merge backend voices with allVoices data
  const voicesWithDetails = availableVoices.length > 0 
    ? availableVoices.map((voice: any) => {
        const voiceDetail = allVoices.find((v: any) => v.id === voice.id);
        if (voiceDetail) {
          const merged = { ...voiceDetail, ...voice };
          merged.voiceId = voice.voiceId || merged.voiceId;
          return merged;
        }
        return voice;
      })
    : allVoices.map((voice: any) => {
        const voiceIdMap: Record<string, string> = {
          'france_male_1': 'pNInz6obpgDQGcFmaJgB',
          'france_male_2': 'VR6AewLTigWG4xSOukaG',
          'france_female_1': 'EXAVITQu4vr4xnSDxMaL',
          'quebec_male_1': 'cjVigY5qzO86Huf0OWal',
          'quebec_male_2': 'JBFqnCBsd6RMkjVDRZzb',
          'quebec_female_1': 'FGY2WhTYpPnrIDTdsKH5',
          'belgium_male_1': 'CwhRBWXzGAHq8TQ4Fs17',
          'belgium_female_1': 'XB0fDUnXU5powFXDhCwa'
        };
        return { ...voice, voiceId: voiceIdMap[voice.id] || '' };
      });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
      generateAvailableSlots();
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailableVoices();
    loadVoicePreference();
    
    // Cleanup audio refs on unmount
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioRefs.current.clear();
      window.speechSynthesis.cancel();
    };
  }, []);

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

  // Sync calendar month with selected date
  useEffect(() => {
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    }
  }, [selectedDate]);

  const loadVoicePreference = async () => {
    try {
      const savedPreference = localStorage.getItem('voicePreference');
      if (savedPreference) {
        try {
          const saved = JSON.parse(savedPreference);
          if (saved.voiceId) {
            setVoicePreference(saved.voiceId);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved preference:', e);
        }
      }
      
      try {
        const response = await apiClient.get('/users/preferences/voice');
        if (response.success && response.data) {
          const voiceData = response.data as any;
          if (voiceData.voiceId) {
            setVoicePreference(voiceData.voiceId);
            localStorage.setItem('voicePreference', JSON.stringify(voiceData));
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
      const response = await apiClient.get('/voice-simulation/voices');
      if (response.success && response.data) {
        const voicesData = Array.isArray(response.data) ? response.data : [];
        setAvailableVoices(voicesData);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoadingVoices(false);
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/immigration-simulation/history');
      if (response.success && response.data) {
        const bookingsData = Array.isArray(response.data) ? response.data : [];
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t_('Erreur lors du chargement des réservations', 'Error loading bookings'));
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = () => {
    if (!selectedDate) return;
    
    const slots: BookingSlot[] = [];
    const date = selectedDate.toISOString().split('T')[0];
    
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDateOnly.getTime() === today.getTime();
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Generate time slots - 9 AM to 7:00 PM
    for (let hour = 9; hour <= 19; hour++) {
      const maxMinute = hour === 19 ? 0 : 60;
      for (let minute = 0; minute < maxMinute; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotTimeInMinutes = hour * 60 + minute;
        
        const isAvailable = !isToday || slotTimeInMinutes > currentTimeInMinutes;
        
        slots.push({
          id: `${date}-${timeString}`,
          date,
          time: timeString,
          available: isAvailable,
          duration: 5
        });
      }
    }
    
    setAvailableSlots(slots);
  };

  // Voice preview handler (matching booking page)
  const handlePreviewVoice = async (voiceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Stop any currently playing audio
    audioRefs.current.forEach((audio, id) => {
      if (id !== voiceId) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      const audio = audioRefs.current.get(voiceId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      setPlayingVoice(null);
      }
      window.speechSynthesis.cancel();
      return;
    }

      setLoadingPreview(prev => new Set(prev).add(voiceId));
    setPlayingVoice(voiceId);

    try {
      const response = await apiClient.post('/voice-simulation/preview', { voiceId });
      
      if (response.success && response.data) {
        const data = response.data as any;
        const { audioBase64, previewText, useBrowserTTS, error } = data;

        if (audioBase64 && !useBrowserTTS) {
          const audioSrc = audioBase64.startsWith('data:') ? audioBase64 : `data:audio/mpeg;base64,${audioBase64}`;
          const audio = new Audio(audioSrc);
          audioRefs.current.set(voiceId, audio);
          
          audio.onended = () => {
            setPlayingVoice(null);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          audio.onerror = () => {
            // Fallback to browser TTS
            const previewText = t_('Bonjour, je suis votre agent d\'immigration. Prêt à commencer votre entretien ?', 'Hello, I am your immigration officer. Ready to start your interview?');
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

            window.speechSynthesis.speak(utterance);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          };

          try {
          await audio.play();
          } catch (playError) {
          // Fallback to browser TTS
            const previewText = t_('Bonjour, je suis votre agent d\'immigration. Prêt à commencer votre entretien ?', 'Hello, I am your immigration officer. Ready to start your interview?');
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

            window.speechSynthesis.speak(utterance);
            setLoadingPreview(prev => {
              const newSet = new Set(prev);
              newSet.delete(voiceId);
              return newSet;
            });
          }
        } else {
          // Fallback to browser TTS
          const previewText = t_('Bonjour, je suis votre agent d\'immigration. Prêt à commencer votre entretien ?', 'Hello, I am your immigration officer. Ready to start your interview?');
          const utterance = new SpeechSynthesisUtterance(previewText);
          utterance.lang = 'fr-FR';
          utterance.rate = 1.0;
          const voice = (voicesWithDetails || availableVoices).find((v: any) => v.id === voiceId);
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
      }
    } catch (error: any) {
      const is401Error = error?.response?.status === 401 || error?.message?.includes('401');
      
      if (!is401Error) {
        console.error('Error previewing voice:', error);
      }
      
      // Silently fall back to browser TTS
      const previewText = t_('Bonjour, je suis votre agent d\'immigration. Prêt à commencer votre entretien ?', 'Hello, I am your immigration officer. Ready to start your interview?');
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
      
      window.speechSynthesis.speak(utterance);
      setLoadingPreview(prev => {
        const newSet = new Set(prev);
        newSet.delete(voiceId);
        return newSet;
      });
    }
  };

  const handleBookSimulation = async () => {
    if (bookingType === 'MANUAL' && (!selectedDate || !selectedTime)) {
      toast.error(t_('Veuillez sélectionner une date et une heure', 'Please select a date and time'));
      return;
    }

    if (!selectedCountry) {
      toast.error(t_('Veuillez sélectionner un pays', 'Please select a country'));
      return;
    }

    if (!selectedTopic) {
      toast.error(t_('Veuillez sélectionner un sujet', 'Please select a topic'));
      return;
    }

    if (!voicePreference) {
      toast.error(t_('Veuillez sélectionner une voix', 'Please select a voice'));
      return;
    }

    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    try {
      const bookingData: any = {
        bookingType: bookingType === 'AUTO' ? 'AUTO' : 'MANUAL',
        voicePreference: voicePreference || undefined,
        country: selectedCountry.toLowerCase(),
        immigrationType: selectedTopic,
        level: 'B1',
        personalInfo: {},
        questionsData: {
          voiceId: voicePreference,
          country: selectedCountry,
          topic: selectedTopic
        }
      };

      if (bookingType === 'MANUAL' && selectedDate && selectedTime) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}T${selectedTime}:00`;
        const scheduledDateTime = new Date(dateString);
        
        if (scheduledDateTime < new Date()) {
          toast.error(t_('La date et l\'heure sélectionnées sont dans le passé', 'Selected date and time are in the past'));
          return;
        }
        
        bookingData.preferredDates = [scheduledDateTime.toISOString()];
      } else if (bookingType === 'AUTO') {
        bookingData.preferredDates = [];
      }

      const response = await apiClient.post('/immigration-simulation/book', bookingData);

      if (response.success) {
        toast.success(
          t_(
            'Simulation réservée avec succès! Vous allez recevoir un email de confirmation avec tous les détails.',
            'Simulation booked successfully! You will receive a confirmation email with all the details.'
          ),
          { duration: 5000 }
        );
        setShowBookingModal(false);
        setSelectedDate(new Date());
        setSelectedTime('');
        
        setTimeout(async () => {
          await fetchBookings();
        }, 1000);
      } else {
        const errorMsg = (response as any).error?.message || (response as any).message || t_('Échec de la réservation', 'Failed to book simulation');
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error booking simulation:', error);
      toast.error(t_('Erreur lors de la réservation', 'Failed to book simulation'));
    }
  };

  const handleCancelBooking = async (booking: ImmigrationSimulation) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      const response = await apiClient.delete(`/immigration-simulation/cancel/${selectedBooking.id}`);
      
      if (response.success) {
        toast.success(
          t_('Simulation annulée avec succès', 'Simulation cancelled successfully'),
          { duration: 3000 }
        );
        setShowCancelModal(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const errorMessage = (response as any).error?.message || (response as any).message || t_('Échec de l\'annulation', 'Failed to cancel');
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error canceling simulation:', error);
      toast.error(
        error.message || t_('Erreur lors de l\'annulation', 'Error canceling simulation')
      );
      setShowCancelModal(false);
      setSelectedBooking(null);
    }
  };

  const handleRescheduleBooking = async (booking: ImmigrationSimulation) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking || !selectedDate || !selectedTime) {
      toast.error(t_('Veuillez sélectionner une date et une heure', 'Please select a date and time'));
      return;
    }

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T${selectedTime}:00`;
      const newDate = new Date(dateString);
      
      if (newDate < new Date()) {
        toast.error(t_('La date et l\'heure sélectionnées sont dans le passé', 'Selected date and time are in the past'));
        return;
      }

      const response = await apiClient.put(`/immigration-simulation/reschedule/${selectedBooking.id}`, {
        newDate: newDate.toISOString(),
        voicePreference: voicePreference || undefined
      });

      if (response.success) {
        toast.success(
          t_('Simulation reprogrammée avec succès', 'Simulation rescheduled successfully'),
          { duration: 3000 }
        );
        setShowRescheduleModal(false);
        setSelectedBooking(null);
        setSelectedDate(new Date());
        setSelectedTime('');
        await fetchBookings();
      } else {
        const errorMessage = (response as any).error?.message || (response as any).message || t_('Échec de la reprogrammation', 'Failed to reschedule');
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error rescheduling simulation:', error);
      toast.error(
        error.message || t_('Erreur lors de la reprogrammation', 'Error rescheduling simulation')
      );
      setShowRescheduleModal(false);
      setSelectedBooking(null);
    }
  };

  // Filter voices by selected country
  const filteredVoicesByCountry = selectedCountry 
    ? (voicesWithDetails || availableVoices).filter((voice: any) => {
        const countryAccentMap: { [key: string]: string } = {
          'CANADA': 'QUEBEC',
          'FRANCE': 'FRANCE',
          'BELGIUM': 'BELGIUM'
        };
        const countryAccent = countryAccentMap[selectedCountry];
        return countryAccent ? voice.accent === countryAccent : true;
      })
    : (voicesWithDetails || availableVoices);

  // Calendar helpers
  const currentMonth = calendarMonth.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCalendarMonth(newDate);
  };
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };
  
  const calendarDays = getDaysInMonth(calendarMonth);
  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           calendarMonth.getMonth() === today.getMonth() && 
           calendarMonth.getFullYear() === today.getFullYear();
  };
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           calendarMonth.getMonth() === selectedDate.getMonth() && 
           calendarMonth.getFullYear() === selectedDate.getFullYear();
  };
  const isPast = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'ACTIVE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'EXPIRED': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-4 w-4" />;
      case 'ACTIVE': return <Mic className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <X className="h-4 w-4" />;
      case 'EXPIRED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2ECC71]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="questions" type="immigration" />

      {/* Hero Section with Liquid Glass Background - Matching Booking Page */}
      <section className="relative pt-32 pb-16 bg-white dark:bg-black overflow-hidden">
        {/* Liquid Glass Background Image */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&h=1080&fit=crop&q=80)',
              filter: 'blur(80px) brightness(0.8)',
              transform: 'scale(1.2)'
            }}
          />
          {/* Enhanced Liquid Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/80 dark:from-black/80 dark:via-black/60 dark:to-black/80 backdrop-blur-md" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent backdrop-blur-sm" />
          {/* Animated Glass Orbs */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#2ECC71]/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#2ECC71]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2ECC71]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" style={{ backdropFilter: 'blur(1px)' }} />
              </div>
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col gap-6 px-4 py-10 text-center items-center">
            <div className="flex flex-col gap-4 max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-black dark:text-white">
                {t_("Planification Intelligente pour un Entretien d'Immigration Réussi", "Smart Scheduling for Successful Immigration Interview")}
              </h1>
              <h2 className="text-base md:text-lg text-muted-foreground font-normal leading-normal">
                {t_("Maîtrisez vos compétences d'entretien d'immigration avec une planification alimentée par l'IA et des sessions de pratique réalistes. Obtenez des commentaires instantanés pour parler en toute confiance.", "Master your immigration interview skills with AI-powered scheduling and realistic practice sessions. Get instant feedback to speak with confidence.")}
              </h2>
        </div>
            <Button 
              className="rounded-full h-12 px-6 bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold text-base"
              onClick={() => {
                const bookingSection = document.getElementById('booking-section');
                bookingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t_("Réserver votre Première Simulation", "Book Your First Simulation")}
            </Button>
      </div>
        </div>
      </section>

      <main className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-16" id="booking-section">
        {/* Liquid Glass Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#2ECC71]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
              </div>
        
        {/* Book a Simulation Section */}
        <section className="flex flex-col gap-8 mb-16">
          <div className="px-4">
            <h2 className="text-lg font-bold leading-tight text-black dark:text-white mb-1">
              {t_("Réserver une Simulation", "Book a Simulation")}
            </h2>
            <p className="text-muted-foreground">
              {t_("Choisissez votre pays, sujet, voix et méthode de réservation pour planifier votre prochaine session.", "Choose your country, topic, voice, and booking method to schedule your next session.")}
            </p>
          </div>

          {/* Country and Topic Selection - New Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            {/* Country Selection Card */}
            <div className="flex flex-col gap-4 p-6 rounded-lg bg-white/5 dark:bg-white/5 backdrop-blur-2xl border-2 border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-bold text-black dark:text-white">
                {t_("Pays de destination", "Destination Country")} <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all border-2 ${
                        selectedCountry === country.code
                        ? 'bg-white/20 dark:bg-white/10 border-[#2ECC71] shadow-lg shadow-[#2ECC71]/20'
                        : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border-white/20 dark:border-white/10 hover:border-[#2ECC71]/50'
                    }`}
                  >
                        <div className="text-3xl">{country.flag}</div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-black dark:text-white">{country.name}</p>
                    </div>
                          {selectedCountry === country.code && (
                      <div className="size-6 flex items-center justify-center rounded-full bg-[#2ECC71] text-black shadow-md">
                        <CheckCircle className="w-4 h-4" />
                        </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Selection Card */}
            <div className="flex flex-col gap-4 p-6 rounded-lg bg-white/5 dark:bg-white/5 backdrop-blur-2xl border-2 border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-bold text-black dark:text-white">
                {t_("Sujet de l'immigration", "Immigration Topic")} <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {topics.map((topic) => {
                  const IconComponent = topic.icon;
                  return (
                    <button
                      key={topic.code}
                      onClick={() => setSelectedTopic(topic.code)}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all border-2 ${
                          selectedTopic === topic.code
                          ? 'bg-white/20 dark:bg-white/10 border-[#2ECC71] shadow-lg shadow-[#2ECC71]/20'
                          : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border-white/20 dark:border-white/10 hover:border-[#2ECC71]/50'
                        }`}
                      >
                      <div className={`size-10 rounded-lg flex items-center justify-center ${
                              selectedTopic === topic.code
                          ? 'bg-[#2ECC71] text-black'
                          : 'bg-white/10 dark:bg-white/5 text-[#2ECC71]'
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-black dark:text-white">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">{topic.desc}</p>
                      </div>
                              {selectedTopic === topic.code && (
                        <div className="size-6 flex items-center justify-center rounded-full bg-[#2ECC71] text-black shadow-md">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                              )}
                    </button>
                  );
                })}
                            </div>
                          </div>
          </div>

          {/* Booking Method Toggle */}
          <div className="flex px-4 py-3 justify-center">
            <div className="flex h-12 w-full max-w-md items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm p-1.5 border border-white/20">
              <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 transition-all ${
                bookingType === 'AUTO'
                  ? 'bg-[#2ECC71] text-black shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
                <span className="truncate text-sm font-medium">{t_("Réservation Automatique", "Automatic Booking")}</span>
                <input 
                  className="invisible w-0" 
                  name="booking-method" 
                  type="radio" 
                  value="AUTO"
                  checked={bookingType === 'AUTO'}
                  onChange={() => setBookingType('AUTO')}
                />
              </label>
              <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 transition-all ${
                bookingType === 'MANUAL'
                  ? 'bg-[#2ECC71] text-black shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
                <span className="truncate text-sm font-medium">{t_("Réservation Manuelle", "Manual Booking")}</span>
                <input 
                  className="invisible w-0" 
                  name="booking-method" 
                  type="radio" 
                  value="MANUAL"
                  checked={bookingType === 'MANUAL'}
                  onChange={() => setBookingType('MANUAL')}
                />
              </label>
            </div>
          </div>

          {/* Two Column Layout: Date/Time Selection and Voice Selection */}
          {bookingType === 'MANUAL' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-4">
              {/* Left Card: Select Date & Time */}
              <div className="lg:col-span-3 flex flex-col gap-6 p-6 rounded-lg bg-white/5 dark:bg-white/5 backdrop-blur-2xl border-2 border-white/20 dark:border-white/10 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-black dark:text-white">
                    {t_("Sélectionner la Date et l'Heure", "Select Date & Time")}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>UTC-5 (EST)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center p-1 justify-between mb-2">
                      <button 
                        onClick={() => navigateMonth('prev')}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronLeft className="w-10 h-10 flex items-center justify-center" />
                      </button>
                      <p className="text-base font-bold leading-tight flex-1 text-center text-black dark:text-white">
                        {capitalizedMonth}
                      </p>
                      <button 
                        onClick={() => navigateMonth('next')}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="w-10 h-10 flex items-center justify-center" />
                      </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 text-center mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <p key={idx} className="text-xs font-bold leading-normal text-muted-foreground flex h-10 w-full items-center justify-center">
                          {day}
                        </p>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-0">
                      {calendarDays.map((day, idx) => {
                        if (day === null) {
                          return <div key={idx} className="h-10 w-full" />;
                        }
                        const dayIsPast = isPast(day);
                        const dayIsSelected = isSelected(day);
                        const dayIsToday = isToday(day);
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!dayIsPast) {
                                const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                setSelectedDate(newDate);
                                setSelectedTime('');
                              }
                            }}
                            disabled={dayIsPast}
                            className={`h-10 w-full text-sm font-medium leading-normal transition-all ${
                              dayIsPast
                                ? 'text-muted-foreground opacity-50 cursor-not-allowed'
                                : dayIsSelected
                                  ? 'text-black bg-[#2ECC71] rounded-full'
                                  : 'text-muted-foreground hover:bg-white/10 dark:hover:bg-white/5 rounded-full'
                            }`}
                          >
                            <div className="flex size-full items-center justify-center rounded-full">
                              {day}
                            </div>
                          </button>
                  );
                })}
              </div>
            </div>

                  {/* Available Time Slots */}
                  <div className="flex flex-col gap-3">
                    <p className="text-base font-bold text-black dark:text-white">
                      {t_("Créneaux Disponibles", "Available Slots")}
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#2ECC71]/30 scrollbar-track-transparent">
                      {availableSlots.map((slot) => {
                        const isSelectedSlot = selectedTime === slot.time;
                        const isDisabled = !slot.available;
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => !isDisabled && setSelectedTime(slot.time)}
                            disabled={isDisabled}
                            className={`rounded-full h-10 text-sm transition-all border-2 ${
                              isSelectedSlot
                                ? 'bg-[#2ECC71] border-[#2ECC71] text-black font-bold'
                                : isDisabled
                                  ? 'bg-white/5 dark:bg-white/5 cursor-not-allowed text-muted-foreground border-transparent'
                                  : 'bg-white/10 dark:bg-white/5 hover:border-[#2ECC71] border-transparent text-black dark:text-white'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                </div>
                  </div>
                </div>
              </div>

              {/* Right Card: Select Your Interviewer */}
              <div className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-lg bg-white/5 dark:bg-white/5 backdrop-blur-2xl border-2 border-white/20 dark:border-white/10 shadow-xl">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  {t_("Sélectionner votre Intervieweur", "Select Your Interviewer")}
                </h3>
                
                <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#2ECC71]/30 scrollbar-track-transparent">
              {loadingVoices ? (
                <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#2ECC71] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t_("Chargement des voix...", "Loading voices...")}</p>
                </div>
                  ) : (
                    filteredVoicesByCountry.map((voice: any) => {
                      const isSelected = voicePreference === voice.id;
                      const voiceName = voice.name || voice.id;
                      const voiceAccent = voice.accent || '';
                      const voiceGender = voice.gender === 'MALE' ? t_('Masculin', 'Male') : t_('Féminin', 'Female');
                      const flag = voice.flag || '';
                      const avatar = voice.avatar || (voice.gender === 'MALE' 
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
                        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces');
                    
                    return (
                        <div
                        key={voice.id}
                          onClick={() => setVoicePreference(voice.id)}
                          className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                            isSelected
                              ? 'bg-white/20 dark:bg-white/10 border-[#2ECC71] shadow-lg shadow-[#2ECC71]/20'
                              : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border-white/20 dark:border-white/10 hover:border-[#2ECC71]/50'
                          }`}
                        >
                          <div className="relative">
                            <div 
                              className="size-14 rounded-full bg-cover bg-center ring-2 ring-white/20"
                              style={{
                                backgroundImage: `url(${avatar})`,
                                backgroundColor: '#2ECC71'
                              }}
                            />
                            {flag && (
                              <div className="absolute -bottom-1 -right-1 text-2xl bg-white rounded-full p-0.5 shadow-md">
                                {flag}
                                </div>
                            )}
                                  </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-black dark:text-white truncate">{voiceName}</p>
                            <p className="text-sm text-muted-foreground truncate">{voiceAccent} • {voiceGender}</p>
                                </div>
                          <button
                            onClick={(e) => handlePreviewVoice(voice.id, e)}
                            disabled={loadingPreview.has(voice.id)}
                            className="flex items-center justify-center size-10 rounded-full bg-[#2ECC71] text-black hover:bg-[#27c066] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t_("Aperçu de la voix", "Preview voice")}
                          >
                            {loadingPreview.has(voice.id) ? (
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : playingVoice === voice.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                              {isSelected && (
                            <div className="size-6 flex items-center justify-center rounded-full bg-[#2ECC71] text-black shadow-md">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                              )}
                            </div>
                            
                            <Button
                  className="mt-auto w-full rounded-full h-12 px-6 bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold text-base"
                  onClick={handleBookSimulation}
                  disabled={!selectedCountry || !selectedTopic || !voicePreference || !selectedDate || !selectedTime}
                >
                  {t_("Confirmer la Réservation", "Confirm Booking")}
                </Button>
              </div>
            </div>
          )}

          {/* Automatic Booking - Simplified */}
          {bookingType === 'AUTO' && (
            <div className="p-6 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl">
              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#2ECC71]/30 scrollbar-track-transparent">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  {t_("Sélectionner votre Intervieweur", "Select Your Interviewer")}
                </h3>
                
                {loadingVoices ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-[#2ECC71] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t_("Chargement des voix...", "Loading voices...")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredVoicesByCountry.map((voice: any) => {
                      const isSelected = voicePreference === voice.id;
                      const voiceName = voice.name || voice.id;
                      const voiceAccent = voice.accent || '';
                      const voiceGender = voice.gender === 'MALE' ? t_('Masculin', 'Male') : t_('Féminin', 'Female');
                      const flag = voice.flag || '';
                      const avatar = voice.avatar || (voice.gender === 'MALE' 
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
                        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces');
                      
                      return (
                        <div
                          key={voice.id}
                          onClick={() => setVoicePreference(voice.id)}
                          className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                            isSelected
                              ? 'bg-white/20 dark:bg-white/10 border-[#2ECC71]'
                              : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border-transparent'
                          }`}
                        >
                          <div className="relative">
                            <div 
                              className="size-12 rounded-full bg-cover bg-center ring-2 ring-white/20"
                              style={{
                                backgroundImage: `url(${avatar})`,
                                backgroundColor: '#2ECC71'
                              }}
                            />
                            {flag && (
                              <div className="absolute -bottom-1 -right-1 text-xl bg-white rounded-full p-0.5 shadow-md">
                                {flag}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-black dark:text-white">{voiceName}</p>
                            <p className="text-sm text-muted-foreground">{voiceAccent} ({voiceGender})</p>
                          </div>
                          <button
                            onClick={(e) => handlePreviewVoice(voice.id, e)}
                              disabled={loadingPreview.has(voice.id)}
                            className="flex items-center justify-center size-10 rounded-full bg-[#2ECC71] text-black hover:bg-[#27c066] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t_("Aperçu de la voix", "Preview voice")}
                          >
                            {loadingPreview.has(voice.id) ? (
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : playingVoice === voice.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                          {isSelected && (
                            <div className="size-6 flex items-center justify-center rounded-full bg-[#2ECC71] text-black">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button 
                  className="w-full rounded-full h-12 px-6 bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold text-base"
                  onClick={handleBookSimulation}
                  disabled={!selectedCountry || !selectedTopic || !voicePreference}
                >
                  {t_("Confirmer la Réservation", "Confirm Booking")}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Booking History Section */}
        <section className="flex flex-col gap-6 px-4">
          <h2 className="text-2xl font-bold leading-tight text-black dark:text-white">
            {t_("Historique des Réservations", "Booking History")}
          </h2>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Search className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <input 
                className="w-full h-12 pl-10 pr-4 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm text-black dark:text-white placeholder:text-muted-foreground border-2 border-white/20 dark:border-white/10 focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20 text-sm shadow-md"
                placeholder={t_("Rechercher par date, pays, sujet, statut...", "Search by date, country, topic, status...")}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-auto h-12 px-4 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border-2 border-white/20 dark:border-white/10 focus:border-[#2ECC71] text-sm shadow-md">
                  <SelectValue>{t_("Tous les Statuts", "All Statuses")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">{t_("Tous les Statuts", "All Statuses")}</SelectItem>
                  <SelectItem value="scheduled">{t_("Programmée", "Scheduled")}</SelectItem>
                  <SelectItem value="completed">{t_("Terminée", "Completed")}</SelectItem>
                  <SelectItem value="cancelled">{t_("Annulée", "Cancelled")}</SelectItem>
                  <SelectItem value="expired">{t_("Expirée", "Expired")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVoice} onValueChange={setFilterVoice}>
                <SelectTrigger className="w-full md:w-auto h-12 px-4 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border-2 border-white/20 dark:border-white/10 focus:border-[#2ECC71] text-sm shadow-md">
                  <SelectValue>{t_("Toutes les Voix", "All Voices")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-voices">{t_("Toutes les Voix", "All Voices")}</SelectItem>
                  <SelectItem value="male">{t_("Masculin", "Male")}</SelectItem>
                  <SelectItem value="female">{t_("Féminin", "Female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booking History Cards */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#2ECC71] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t_("Chargement...", "Loading...")}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 p-4 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-xl border-2 border-white/20 dark:border-white/10 shadow-lg">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{t_("Aucune réservation pour le moment", "No bookings yet")}</p>
              </div>
            ) : (
              bookings
                .filter((booking) => {
                  // Search filter
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const dateStr = booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : '';
                    const country = booking.country || '';
                    const topic = booking.immigrationType || '';
                    const status = booking.status.toLowerCase();
                    const searchText = `${dateStr} ${country} ${topic} ${status}`.toLowerCase();
                    if (!searchText.includes(query)) return false;
                  }
                  
                  // Status filter
                  if (filterStatus !== 'all-statuses') {
                    const statusMap: Record<string, string> = {
                      'scheduled': 'SCHEDULED',
                      'completed': 'COMPLETED',
                      'cancelled': 'CANCELLED',
                      'expired': 'EXPIRED'
                    };
                    if (booking.status !== statusMap[filterStatus]) return false;
                  }
                  
                  // Voice filter
                  if (filterVoice !== 'all-voices') {
                    const selectedVoice = availableVoices.find(v => v.id === booking.voicePreference || booking.questionsData?.voiceId === v.id);
                    if (!selectedVoice) return false;
                    if (filterVoice === 'male' && selectedVoice.gender !== 'MALE') return false;
                    if (filterVoice === 'female' && selectedVoice.gender !== 'FEMALE') return false;
                  }
                  
                  return true;
                })
                .slice(0, 10)
                .map((booking) => {
                  const scheduledDate = booking.scheduledDate ? new Date(booking.scheduledDate) : null;
                  const isValidDate = scheduledDate && !isNaN(scheduledDate.getTime());
                  const selectedVoice = availableVoices.find(v => v.id === booking.voicePreference || booking.questionsData?.voiceId === v.id);
                  
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-6 p-4 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-xl border-2 border-white/20 dark:border-white/10 shadow-lg"
                    >
                      {/* Date and Time */}
                      <div className="min-w-[140px]">
                        {isValidDate && scheduledDate ? (
                          <>
                            <p className="font-bold text-black dark:text-white text-sm">
                              {scheduledDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {scheduledDate.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                                </>
                              ) : (
                          <p className="text-xs text-muted-foreground">{t_("Date non disponible", "Date not available")}</p>
                        )}
                      </div>
                      {/* Country */}
                      <div className="min-w-[120px]">
                        <p className="text-xs text-muted-foreground mb-0.5">{t_("Pays", "Country")}</p>
                        <p className="font-bold text-black dark:text-white text-sm">
                          {booking.country || t_("Non spécifié", "Not specified")}
                        </p>
                      </div>
                      {/* Topic */}
                      <div className="min-w-[120px]">
                        <p className="text-xs text-muted-foreground mb-0.5">{t_("Sujet", "Topic")}</p>
                        <p className="font-bold text-black dark:text-white text-sm">
                          {booking.immigrationType || t_("Non spécifié", "Not specified")}
                        </p>
                      </div>
                      {/* Voice */}
                      <div className="min-w-[180px]">
                        <p className="text-xs text-muted-foreground mb-0.5">{t_("Voix", "Voice")}</p>
                        <p className="font-bold text-black dark:text-white text-sm">
                          {selectedVoice?.name || t_("Non spécifiée", "Not specified")}
                          {selectedVoice?.accent && (
                            <span className="text-muted-foreground font-normal"> ({selectedVoice.accent})</span>
                          )}
                        </p>
                      </div>
                      {/* Status */}
                      <div className="min-w-[120px]">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span>{booking.status}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-auto">
                        {booking.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/immigration-simulations/room/${booking.id}`)}
                              className="h-8 px-3 text-xs border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71] hover:text-black"
                            >
                              {t_("Démarrer", "Start")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRescheduleBooking(booking)}
                              className="h-8 px-3 text-xs"
                            >
                              {t_("Reprogrammer", "Reschedule")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking)}
                              className="h-8 px-3 text-xs text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                            >
                              {t_("Annuler", "Cancel")}
                            </Button>
                                </>
                              )}
                        {booking.status === 'COMPLETED' && booking.finalScore !== null && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/immigration-simulations/results/${booking.id}`)}
                            className="h-8 px-3 text-xs border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71] hover:text-black"
                          >
                            {t_("Voir Résultats", "View Results")}
                            </Button>
                        )}
                </div>
                    </div>
                  );
                })
              )}
            </div>
        </section>
      </main>

      {/* Booking Confirmation Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t_("Confirmer la Réservation", "Confirm Booking")}</DialogTitle>
            <DialogDescription>
              {t_("Voulez-vous confirmer cette réservation ?", "Do you want to confirm this booking?")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCountry && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t_("Pays", "Country")}:</span>
                <span className="text-sm font-medium">{countries.find(c => c.code === selectedCountry)?.name}</span>
                        </div>
            )}
            {selectedTopic && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t_("Sujet", "Topic")}:</span>
                <span className="text-sm font-medium">{topics.find(t => t.code === selectedTopic)?.name}</span>
                  </div>
            )}
            {voicePreference && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t_("Voix", "Voice")}:</span>
                <span className="text-sm font-medium">
                  {filteredVoicesByCountry.find((v: any) => v.id === voicePreference)?.name || voicePreference}
                </span>
                        </div>
            )}
            {bookingType === 'MANUAL' && selectedDate && selectedTime && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t_("Date", "Date")}:</span>
                  <span className="text-sm font-medium">
                    {selectedDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                  </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t_("Heure", "Time")}:</span>
                  <span className="text-sm font-medium">{selectedTime}</span>
                </div>
              </>
            )}
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              {t_("Annuler", "Cancel")}
            </Button>
            <Button onClick={handleConfirmBooking} className="bg-[#2ECC71] hover:bg-[#27c066] text-black">
              {t_("Confirmer", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t_("Annuler la Réservation", "Cancel Booking")}</DialogTitle>
            <DialogDescription>
              {t_("Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.", "Are you sure you want to cancel this booking? This action is irreversible.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              {t_("Non", "No")}
            </Button>
            <Button onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700 text-white">
              {t_("Oui, Annuler", "Yes, Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t_("Reprogrammer la Réservation", "Reschedule Booking")}</DialogTitle>
            <DialogDescription>
              {t_("Sélectionnez une nouvelle date et heure pour cette réservation.", "Select a new date and time for this booking.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label>{t_("Date", "Date")}</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-lg border"
                  />
                </div>
                <div>
                <Label>{t_("Heure", "Time")}</Label>
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        className={`
                        ${selectedTime === slot.time ? 'bg-[#2ECC71] text-black' : ''}
                        ${!slot.available ? 'opacity-40 grayscale cursor-not-allowed' : ''}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
              {t_("Annuler", "Cancel")}
              </Button>
            <Button onClick={handleConfirmReschedule} className="bg-[#2ECC71] hover:bg-[#27c066] text-black">
              {t_("Confirmer", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
