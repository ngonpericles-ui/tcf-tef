'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Mic,
  AlertTriangle,
  Info,
  Crown,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Plus,
  MapPin,
  User,
  CalendarCheck,
  CalendarDays,
  CalendarClock,
  Sparkles,
  Zap,
  Bell,
  Search,
  Globe,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Pause
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

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: 'MALE' | 'FEMALE' | string; // Can be enum or voice ID string
  questionsData?: any; // May contain voiceId
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  overallScore?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
}

function BookingPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  // Helper function for translations
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [bookingType, setBookingType] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [voicePreference, setVoicePreference] = useState<string>(''); // Store voice ID like 'france_male_1'
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [bookings, setBookings] = useState<VoiceSimulation[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<VoiceSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all-statuses');
  const [filterVoice, setFilterVoice] = useState<string>('all-voices');

  // All 8 voices with profile images and flags
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
  // Backend voices have the correct IDs and voiceId (ElevenLabs ID)
  // allVoices has UI details (avatar, flag, etc.)
  // IMPORTANT: Preserve voiceId from backend (it's the ElevenLabs ID needed for preview)
  const voicesWithDetails = availableVoices.length > 0 
    ? availableVoices.map((voice: any) => {
        const voiceDetail = allVoices.find((v: any) => v.id === voice.id);
        // Merge: backend voice data (with voiceId) takes priority, then add UI details
        // But preserve the voiceId from backend as it's critical for preview
        if (voiceDetail) {
          const merged = { ...voiceDetail, ...voice }; // Backend voice overwrites UI details
          // Ensure voiceId from backend is always preserved (it's the ElevenLabs ID)
          merged.voiceId = voice.voiceId || merged.voiceId;
          return merged;
        }
        return voice; // If no match, use backend voice as-is
      })
    : allVoices.map((voice: any) => {
        // Fallback: map voice IDs to ElevenLabs voiceIds if backend voices not loaded
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
  
  const [topics, setTopics] = useState<string[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<Set<string>>(new Set());
  const audioRefs = React.useRef<Map<string, HTMLAudioElement>>(new Map());
  // Calendar navigation - sync with selectedDate (must be declared before any conditional logic)
  const [calendarMonth, setCalendarMonth] = useState(selectedDate || new Date());

  useEffect(() => {
    fetchBookings();
  }, []); // Only fetch bookings on mount

  useEffect(() => {
    // Generate slots when date changes, but don't reload other data
    generateAvailableSlots();
  }, [selectedDate]); // Only regenerate slots when date changes
  
  // Use ref to track current voice preference without causing re-renders
  const voicePreferenceRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    voicePreferenceRef.current = voicePreference;
  }, [voicePreference]);
  
  useEffect(() => {
    fetchAvailableVoices();
    fetchTopics();
    loadVoicePreference();
    
    // Listen for voice preference changes from voice page (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'voicePreference' && e.newValue) {
        try {
          const saved = JSON.parse(e.newValue);
          if (saved.voiceId && saved.voiceId !== voicePreferenceRef.current) {
            setVoicePreference(saved.voiceId);
            voicePreferenceRef.current = saved.voiceId;
            console.log('✅ Voix préférée mise à jour depuis localStorage:', saved.voiceId);
          }
        } catch (e) {
          console.error('Erreur parsing updated preference:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage periodically (for same-tab updates)
    const checkInterval = setInterval(() => {
      const savedPreference = localStorage.getItem('voicePreference');
      if (savedPreference) {
        try {
          const saved = JSON.parse(savedPreference);
          if (saved.voiceId && saved.voiceId !== voicePreferenceRef.current) {
            setVoicePreference(saved.voiceId);
            voicePreferenceRef.current = saved.voiceId;
            console.log('✅ Voix préférée mise à jour (polling):', saved.voiceId);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }, 2000); // Check every 2 seconds
    
    // Cleanup audio refs on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioRefs.current.clear();
      window.speechSynthesis.cancel();
    };
  }, []); // Empty dependency array - only run once on mount

  // Refresh slots every minute if today is selected (to update availability)
  useEffect(() => {
    if (!selectedDate) return;
    
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDateOnly.getTime() === today.getTime();
    
    if (isToday) {
      // Refresh slots every minute to update availability as time passes
      const interval = setInterval(() => {
        generateAvailableSlots();
      }, 60000); // Every 60 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  // Sync calendar month with selected date (MUST be before any early returns)
  useEffect(() => {
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    }
  }, [selectedDate]);

  // Charger la voix préférée depuis localStorage ou backend
  const loadVoicePreference = async () => {
    try {
      // D'abord, vérifier localStorage
      const savedPreference = localStorage.getItem('voicePreference');
      if (savedPreference) {
        try {
          const saved = JSON.parse(savedPreference);
          if (saved.voiceId) {
            setVoicePreference(saved.voiceId);
            console.log('✅ Voix préférée chargée depuis localStorage:', saved.voiceId);
            return;
          }
        } catch (e) {
          console.error('Erreur parsing saved preference:', e);
        }
      }
      
      // Si pas dans localStorage, vérifier backend
      try {
        const response = await apiClient.get('/users/preferences/voice');
        
        if (response.success && response.data) {
          const voiceData = response.data as any;
          if (voiceData.voiceId) {
            setVoicePreference(voiceData.voiceId);
            // Sauvegarder aussi dans localStorage pour rapidité
            localStorage.setItem('voicePreference', JSON.stringify(voiceData));
            console.log('✅ Voix préférée chargée depuis backend:', voiceData.voiceId);
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
    }
  };

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const response = await apiClient.get('/voice-simulation/question-bank/sujets');
      if (response.success && response.data) {
        const topicsData = response.data as any;
        setTopics(topicsData?.sujets || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('No token available for fetching bookings');
        return;
      }

      const response = await apiClient.get('/voice-simulation/history');

      if (response.success && response.data) {
        const bookingsData = Array.isArray(response.data) ? response.data : [];
        console.log('📋 Fetched bookings:', {
          total: bookingsData.length || 0,
          bookings: bookingsData,
          rawBookings: JSON.stringify(bookingsData, null, 2)
        });
        
        // Filter out bookings with invalid dates (mock data)
        const validBookings = bookingsData.filter((booking: VoiceSimulation) => {
          console.log('🔍 Checking booking:', {
            id: booking.id,
            scheduledDate: booking.scheduledDate,
            scheduledDateType: typeof booking.scheduledDate,
            hasScheduledDate: !!booking.scheduledDate
          });
          
          if (!booking.scheduledDate) {
            console.log('⚠️ Booking filtered out (no scheduledDate):', booking.id);
            return false;
          }
          
          const date = new Date(booking.scheduledDate);
          const isValid = !isNaN(date.getTime());
          
          if (!isValid) {
            console.log('⚠️ Booking filtered out (invalid date):', {
              id: booking.id,
              scheduledDate: booking.scheduledDate,
              parsedDate: date.toString()
            });
          } else {
            console.log('✅ Booking is valid:', {
              id: booking.id,
              scheduledDate: booking.scheduledDate,
              parsedDate: date.toISOString()
            });
          }
          
          return isValid;
        });
        
        console.log('✅ Valid bookings:', validBookings.length, validBookings);
        setBookings(validBookings);
      } else {
        console.error('❌ Error loading bookings:', response.error);
        toast.error(t_('Erreur lors du chargement des réservations', 'Error loading bookings'));
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = () => {
    if (!selectedDate) return;
    
    const slots: BookingSlot[] = [];
    const date = selectedDate.toISOString().split('T')[0];
    
    // Check if selected date is today
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDateOnly.getTime() === today.getTime();
    
    // Get current time if today
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Generate time slots for the selected date - 9 AM to 7:00 PM
    // Start at 9:00, end at 19:00 (7:00 PM)
    for (let hour = 9; hour <= 19; hour++) {
      const maxMinute = hour === 19 ? 0 : 60; // Last slot is 19:00 (7:00 PM)
      for (let minute = 0; minute < maxMinute; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotTimeInMinutes = hour * 60 + minute;
        
        // If today, check if time has passed
        const isAvailable = !isToday || slotTimeInMinutes > currentTimeInMinutes;
        
        slots.push({
          id: `${date}-${timeString}`,
          date,
          time: timeString,
          available: isAvailable, // Unavailable if time has passed today
          duration: 5
        });
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleBookSimulation = async () => {
    if (bookingType === 'MANUAL' && (!selectedDate || !selectedTime)) {
      toast.error('Please select a date and time');
      return;
    }

    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    try {
      // Préparer les données selon le format attendu par le backend
      const bookingData: any = {
        bookingType: bookingType === 'AUTO' ? 'AUTO' : 'MANUAL',
        voicePreference: voicePreference || undefined
      };

      // Pour MANUAL, on envoie preferredDates (tableau)
      if (bookingType === 'MANUAL' && selectedDate && selectedTime) {
        // Format date properly: YYYY-MM-DDTHH:mm:ss
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}T${selectedTime}:00`;
        
        // Create date object and ensure it's in ISO format
        const scheduledDateTime = new Date(dateString);
        
        // Validate date is not in the past
        if (scheduledDateTime < new Date()) {
          toast.error(t_('La date et l\'heure sélectionnées sont dans le passé', 'Selected date and time are in the past'));
          return;
        }
        
        bookingData.preferredDates = [scheduledDateTime.toISOString()];
        console.log('📅 Booking date prepared:', {
          originalDate: selectedDate,
          time: selectedTime,
          scheduledDateTime,
          isoString: scheduledDateTime.toISOString()
        });
      } else if (bookingType === 'AUTO') {
        // Pour AUTO, le backend gère automatiquement la date
        bookingData.preferredDates = [];
      }

      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        toast.error(t_('Veuillez vous connecter', 'Please log in'));
        router.push('/login');
        return;
      }

      const response = await apiClient.post('/voice-simulation/book', bookingData);

      if (response.success) {
        // Success message with email confirmation info
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
        // Ne pas réinitialiser voicePreference - garder la préférence
        
        // Refresh bookings immediately after successful booking
        // Add a small delay to ensure backend has processed the booking
        console.log('🔄 Refreshing bookings after successful booking...');
        setTimeout(async () => {
          await fetchBookings();
          console.log('✅ Bookings refreshed');
        }, 1000); // Wait 1 second for backend to process
      } else {
        // Better error message
        const errorMsg = response.error?.message || response.message || t_('Échec de la réservation', 'Failed to book simulation');
        console.error('❌ Booking failed:', {
          error: response.error,
          bookingData
        });
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error booking simulation:', error);
      toast.error(t_('Erreur lors de la réservation', 'Failed to book simulation'));
    }
  };

  const handleCancelBooking = async (booking: VoiceSimulation) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        toast.error(t_('Veuillez vous connecter', 'Please log in'));
        router.push('/login');
        return;
      }

      console.log('🗑️ Canceling simulation:', {
        bookingId: selectedBooking.id,
        bookingObject: selectedBooking
      });
      
      if (!selectedBooking.id) {
        throw new Error(t_('ID de simulation manquant', 'Simulation ID missing'));
      }
      
      const response = await apiClient.delete(`/voice-simulation/cancel/${selectedBooking.id}`);
      
      if (response.success) {
        toast.success(
          t_('Simulation annulée avec succès', 'Simulation cancelled successfully'),
          { duration: 3000 }
        );
        setShowCancelModal(false);
        setSelectedBooking(null);
        // Refresh bookings without await to prevent blocking
        fetchBookings();
      } else {
        const errorMessage = response.error?.message || response.message || t_('Échec de l\'annulation', 'Failed to cancel');
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

  const handleRescheduleBooking = async (booking: VoiceSimulation) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking || !selectedDate || !selectedTime) {
      toast.error(t_('Veuillez sélectionner une date et une heure', 'Please select a date and time'));
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        toast.error(t_('Veuillez vous connecter', 'Please log in'));
        router.push('/login');
        return;
      }

      // Format the new date and time
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T${selectedTime}:00`;
      const newDate = new Date(dateString);
      
      // Validate date is not in the past
      if (newDate < new Date()) {
        toast.error(t_('La date et l\'heure sélectionnées sont dans le passé', 'Selected date and time are in the past'));
        return;
      }

      console.log('📅 Rescheduling simulation:', {
        bookingId: selectedBooking.id,
        bookingObject: selectedBooking,
        newDate: newDate.toISOString(),
        newDateString: dateString
      });
      
      if (!selectedBooking.id) {
        throw new Error(t_('ID de simulation manquant', 'Simulation ID missing'));
      }

      const response = await apiClient.put(`/voice-simulation/reschedule/${selectedBooking.id}`, {
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
        // Refresh bookings immediately to show updated data
        await fetchBookings();
      } else {
        const errorMessage = response.error?.message || response.message || t_('Échec de la reprogrammation', 'Failed to reschedule');
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

  // Voice preview handler
  const handlePreviewVoice = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking preview
    
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
      // Also stop speech synthesis if active
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

          audio.onerror = (e) => {
            console.warn('Audio playback error, falling back to browser TTS:', e);
            // Silently fall back to browser TTS
            const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
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
            console.warn('Error playing audio, falling back to browser TTS:', playError);
            // Silently fall back to browser TTS
            const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
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
          // Fallback to browser TTS (silently, no error toast)
          const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
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
      // Don't show error for 401 - it's expected to fall back to browser TTS
      const is401Error = error?.response?.status === 401 || error?.message?.includes('401');
      
      if (!is401Error) {
      console.error('Error previewing voice:', error);
      toast.error(t_('Erreur lors de l\'aperçu', 'Error previewing voice'));
      } else {
        // Silently fall back to browser TTS for 401 errors
        console.log('⚠️ ElevenLabs API returned 401, using browser TTS fallback');
        const previewText = 'Bonjour, je suis votre intervieweur. Prêt à commencer notre conversation ?';
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

  const getStatusColor = (status: string) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'EXPIRED': 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  // Get current month/year for calendar display
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
  
  // Get days of month for calendar display
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
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
    
    // Only disable dates that are in the past (before today)
    // Allow today to be selectable regardless of time
    return checkDate < today;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="booking" />

      {/* Hero Section with Liquid Glass Background */}
      <section className="relative pt-32 pb-16 bg-white dark:bg-black overflow-hidden">
        {/* Liquid Glass Background Image - Booking/Calendar Theme */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&h=1080&fit=crop&q=80)',
              filter: 'blur(80px) brightness(0.8)',
              transform: 'scale(1.2)'
            }}
          />
          {/* Enhanced Liquid Glass Overlay with multiple layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/80 dark:from-black/80 dark:via-black/60 dark:to-black/80 backdrop-blur-md" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent backdrop-blur-sm" />
          {/* Animated Glass Orbs with enhanced effects */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#2ECC71]/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#2ECC71]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2ECC71]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          {/* Additional glass refraction effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" style={{ backdropFilter: 'blur(1px)' }} />
        </div>
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col gap-6 px-4 py-10 text-center items-center">
            <div className="flex flex-col gap-4 max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-black dark:text-white">
                {t_("Planification Intelligente pour un Français Impeccable", "Smart Scheduling for Flawless French")}
              </h1>
              <h2 className="text-base md:text-lg text-muted-foreground font-normal leading-normal">
                {t_("Maîtrisez vos compétences d'entretien avec une planification alimentée par l'IA et des sessions de pratique réalistes. Obtenez des commentaires instantanés pour parler en toute confiance.", "Master your interview skills with AI-powered scheduling and realistic practice sessions. Get instant feedback to speak with confidence.")}
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
              {t_("Choisissez votre méthode préférée pour planifier votre prochaine session.", "Choose your preferred method to schedule your next session.")}
            </p>
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

          {/* Two Column Layout: Date/Time Selection and Interviewer Selection */}
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
                    (voicesWithDetails || availableVoices).map((voice: any) => {
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
                  disabled={!selectedDate || !selectedTime}
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
                    {(voicesWithDetails || availableVoices).map((voice: any) => {
                      const isSelected = voicePreference === voice.id;
                      const voiceName = voice.name || voice.id;
                      const voiceAccent = voice.accent || '';
                      const voiceGender = voice.gender === 'MALE' ? t_('Masculin', 'Male') : t_('Féminin', 'Female');
                      
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
                          <div 
                            className="size-12 rounded-full bg-cover bg-center"
                            style={{
                              backgroundImage: voice.avatar ? `url(${voice.avatar})` : 'none',
                              backgroundColor: voice.avatar ? 'transparent' : '#2ECC71'
                            }}
                          />
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
                placeholder={t_("Rechercher par date, voix, statut...", "Search by date, voice, status...")}
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
                    const voiceName = availableVoices.find(v => v.id === booking.voicePreference || booking.questionsData?.voiceId === v.id)?.name || '';
                    const status = booking.status.toLowerCase();
                    const searchText = `${dateStr} ${voiceName} ${status}`.toLowerCase();
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
                .slice(0, 5)
                .map((booking) => {
                const scheduledDate = booking.scheduledDate ? new Date(booking.scheduledDate) : null;
                const isValidDate = scheduledDate && !isNaN(scheduledDate.getTime());
                const selectedVoice = availableVoices.find(v => v.id === booking.voicePreference || booking.questionsData?.voiceId === v.id);
                
                  return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
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
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {scheduledDate.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {new Date(scheduledDate.getTime() + 30 * 60000).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t_("Date non disponible", "Date not available")}</p>
                      )}
                    </div>
                    {/* Voice */}
                    <div className="min-w-[180px]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t_("Voix", "Voice")}</p>
                      <p className="font-bold text-black dark:text-white text-sm">
                        {selectedVoice?.name || t_("Non spécifiée", "Not specified")}
                        {selectedVoice?.accent && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal"> ({selectedVoice.accent})</span>
                        )}
                      </p>
                    </div>
                    {/* Status */}
                    <div className="min-w-[120px]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t_("Statut", "Status")}</p>
                      <div className="flex items-center gap-2">
                        {booking.status === 'SCHEDULED' && (
                          <>
                            <div className="size-2 rounded-full bg-[#2ECC71]"></div>
                            <p className="text-[#2ECC71] font-bold text-sm">{t_("Programmée", "Scheduled")}</p>
                          </>
                        )}
                        {booking.status === 'COMPLETED' && (
                          <>
                            <div className="size-2 rounded-full bg-[#2ECC71]"></div>
                            <p className="text-[#2ECC71] font-bold text-sm">{t_("Terminée", "Completed")}</p>
                          </>
                        )}
                        {booking.status === 'CANCELLED' && (
                          <>
                            <div className="size-2 rounded-full bg-red-500"></div>
                            <p className="text-red-500 font-bold text-sm">{t_("Annulée", "Cancelled")}</p>
                          </>
                        )}
                        {booking.status === 'EXPIRED' && (
                          <>
                            <div className="size-2 rounded-full bg-orange-500"></div>
                            <p className="text-orange-500 font-bold text-sm">{t_("Expirée", "Expired")}</p>
                          </>
                        )}
                        {booking.status === 'ACTIVE' && (
                          <>
                            <div className="relative flex h-2 w-2">
                              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                      </div>
                            <p className="text-yellow-500 font-bold text-sm">{t_("Active", "Active")}</p>
                          </>
                        )}
                    </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3 ml-auto">
                      {booking.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => handleRescheduleBooking(booking)}
                            className="text-sm font-medium text-black dark:text-white hover:text-[#2ECC71] transition-colors"
                          >
                            {t_("Reporter", "Reschedule")}
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="text-sm font-medium text-black dark:text-white hover:text-red-500 transition-colors"
                          >
                            {t_("Annuler", "Cancel")}
                          </button>
                        </>
                      )}
                      {booking.status === 'EXPIRED' && (
                        <button
                          onClick={() => handleRescheduleBooking(booking)}
                          className="text-sm font-medium text-black dark:text-white hover:text-[#2ECC71] transition-colors"
                        >
                          {t_("Reporter", "Reschedule")}
                        </button>
                      )}
                      {booking.status === 'CANCELLED' && (
                        <button
                          onClick={async () => {
                            if (!confirm(t_("Êtes-vous sûr de vouloir supprimer cette simulation ?", "Are you sure you want to delete this simulation?"))) {
                              return;
                            }
                            try {
                              const response = await apiClient.delete(`/voice-simulation/delete/${booking.id}`);
                              if (response.success) {
                                toast.success(t_('Simulation supprimée avec succès', 'Simulation deleted successfully'));
                                fetchBookings();
                              }
                            } catch (error: any) {
                              toast.error(error.message || t_('Erreur lors de la suppression', 'Error deleting simulation'));
                            }
                          }}
                          className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                        >
                          {t_("Supprimer", "Delete")}
                        </button>
                      )}
                      {booking.status === 'COMPLETED' && (
                        <button
                          onClick={() => router.push(`/simulation-vocale/results?id=${booking.id}`)}
                          className="text-sm font-medium text-[#2ECC71] hover:text-[#27c066] transition-colors"
                        >
                          {t_("Voir les Résultats", "View Results")}
                        </button>
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
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {t_("Confirmer la Réservation", "Confirm Booking")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t_("Type:", "Type:")}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {bookingType === 'AUTO' ? t_("Automatique", "Automatic") : t_("Manuelle", "Manual")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t_("Date:", "Date:")}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {bookingType === 'AUTO' 
                      ? t_("Prochain créneau disponible", "Next Available") 
                      : selectedDate?.toLocaleDateString('fr-FR', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                    }
                  </span>
                </div>
                {bookingType === 'MANUAL' && selectedTime && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t_("Heure:", "Time:")}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedTime}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t_("Voix:", "Voice:")}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {voicePreference 
                      ? (availableVoices.find(v => v.id === voicePreference)?.name || t_("Sélectionnée", "Selected"))
                      : t_("Aléatoire", "Random")
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t_("Durée:", "Duration:")}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    5 {t_("minutes", "minutes")}
                  </span>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBookingModal(false)}
                className="flex-1"
              >
                {t_("Annuler", "Cancel")}
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                className="flex-1 bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold"
              >
                {t_("Confirmer", "Confirm")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                {t_("Annuler la Simulation", "Cancel Simulation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                {t_(
                  "Êtes-vous sûr de vouloir annuler cette simulation ? Cette action est irréversible.",
                  "Are you sure you want to cancel this simulation? This action cannot be undone."
                )}
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1"
                >
                  {t_("Conserver", "Keep Booking")}
                </Button>
                <Button 
                  onClick={handleConfirmCancel}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {t_("Annuler la Simulation", "Cancel Simulation")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#2ECC71]" />
                {t_("Reporter la Simulation", "Reschedule Simulation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t_("Nouvelle Date", "New Date")}
                </label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  disabled={(date) => {
                    // Only disable past dates (before today)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate < today;
                  }}
                  fromDate={new Date()} // Allow booking from today onwards
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t_("Nouvelle Heure", "New Time")}
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t_("Sélectionner l'heure", "Select time")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.time} disabled={!slot.available}>
                        {slot.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1"
                >
                  {t_("Annuler", "Cancel")}
                </Button>
                <Button 
                  onClick={handleConfirmReschedule}
                  className="flex-1 bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold"
                >
                  {t_("Reporter", "Reschedule")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <SharedDataProvider>
      <BookingPageContent />
    </SharedDataProvider>
  );
}
