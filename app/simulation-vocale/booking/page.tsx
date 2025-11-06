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
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
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
  const [topics, setTopics] = useState<string[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    fetchBookings();
    generateAvailableSlots();
    fetchAvailableVoices();
    fetchTopics();
    loadVoicePreference(); // Charger la voix préférée sauvegardée
  }, [selectedDate]);

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
        const response = await fetch('/api/users/preferences/voice', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.voiceId) {
            setVoicePreference(data.data.voiceId);
            // Sauvegarder aussi dans localStorage pour rapidité
            localStorage.setItem('voicePreference', JSON.stringify(data.data));
            console.log('✅ Voix préférée chargée depuis backend:', data.data.voiceId);
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
      const response = await fetch('/api/voice-simulation/voices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    }
  };

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const response = await fetch('/api/voice-simulation/question-bank/sujets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTopics(data.data?.sujets || []);
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

      const response = await fetch('/api/voice-simulation/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched bookings:', {
          total: data.data?.length || 0,
          bookings: data.data,
          rawBookings: JSON.stringify(data.data, null, 2)
        });
        
        // Filter out bookings with invalid dates (mock data)
        const validBookings = (data.data || []).filter((booking: VoiceSimulation) => {
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
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error loading bookings:', {
          status: response.status,
          error: errorData
        });
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
    
    // Generate time slots for the selected date - 9 AM to 5:30 PM
    // Start at 9:00, end at 17:30 (5:30 PM)
    for (let hour = 9; hour <= 17; hour++) {
      const maxMinute = hour === 17 ? 30 : 60; // Last slot is 17:30, not 17:60
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

      const response = await fetch('/api/voice-simulation/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      // Vérifier le Content-Type avant de parser JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Si la réponse n'est pas OK, essayer de lire le message d'erreur
        let errorMessage = t_('Erreur lors de la réservation', 'Failed to book simulation');
        
        // Vérifier si c'est une erreur d'authentification
        if (response.status === 401 || response.status === 403) {
          errorMessage = t_('Session expirée. Veuillez vous reconnecter', 'Session expired. Please log in again');
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          toast.error(errorMessage);
          router.push('/login');
          return;
        }
        
        // Lire le texte de la réponse
        const text = await response.text();
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(text);
            // Extract error message from various possible locations
            errorMessage = errorData.message 
              || errorData.error?.message 
              || errorData.error 
              || (typeof errorData.error === 'string' ? errorData.error : null)
              || errorMessage;
            
            // Log detailed error for debugging - check all possible error formats
            const errorMsg = errorData.message 
              || errorData.error?.message 
              || (typeof errorData.error === 'string' ? errorData.error : null)
              || errorData.error?.error?.message
              || 'Unknown error';
            
            console.error('❌ Booking error (JSON):', {
              status: response.status,
              errorData,
              extractedMessage: errorMsg,
              errorDataKeys: Object.keys(errorData),
              bookingData
            });
            
            // Extract message from various possible locations
            errorMessage = errorMsg || errorMessage;
            
            // If still no message found, provide default
            if (!errorMessage || errorMessage === 'Unknown error') {
              console.error('⚠️ No error message found in response:', errorData);
              errorMessage = t_('Erreur lors de la réservation. Veuillez réessayer.', 'Booking error. Please try again.');
            }
          } catch (e) {
            // Si le parsing JSON échoue
            console.error('❌ Erreur serveur (JSON attendu mais invalide):', {
              error: e,
              text: text.substring(0, 500)
            });
            errorMessage = t_('Erreur serveur: réponse invalide', 'Server error: invalid response');
          }
        } else {
          // Réponse HTML ou autre format
          console.error('❌ Réponse non-JSON reçue:', {
            status: response.status,
            contentType,
            text: text.substring(0, 500),
            bookingData
          });
          errorMessage = t_('Erreur serveur: réponse invalide', 'Server error: invalid response');
        }
        
        toast.error(errorMessage);
        return;
      }

      // Réponse OK - parser JSON
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Réponse non-JSON reçue (OK status):', text.substring(0, 200));
        toast.error(t_('Erreur serveur: réponse invalide', 'Server error: invalid response'));
        return;
      }

      const data = await response.json();
      
      if (data.success) {
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
        const errorMsg = data.message || data.error?.message || t_('Échec de la réservation', 'Failed to book simulation');
        console.error('❌ Booking failed:', {
          status: response.status,
          data,
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
      
      const response = await fetch(`/api/voice-simulation/cancel/${selectedBooking.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response from cancel:', text.substring(0, 200));
        throw new Error(t_('Erreur serveur: réponse invalide', 'Server error: invalid response'));
      }

      if (!response.ok) {
        console.error('❌ Cancel failed:', {
          status: response.status,
          data: data
        });
        const errorMessage = data?.message || data?.error?.message || data?.error || t_('Échec de l\'annulation', 'Failed to cancel');
        throw new Error(errorMessage);
      }
      
      if (data.success) {
        toast.success(
          t_('Simulation annulée avec succès', 'Simulation cancelled successfully'),
          { duration: 3000 }
        );
        setShowCancelModal(false);
        setSelectedBooking(null);
        // Refresh bookings without await to prevent blocking
        fetchBookings();
      } else {
        const errorMessage = data?.message || data?.error?.message || data?.error || t_('Échec de l\'annulation', 'Failed to cancel');
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

      const response = await fetch(`/api/voice-simulation/reschedule/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newDate: newDate.toISOString(),
          voicePreference: voicePreference || undefined
        })
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response from reschedule:', text.substring(0, 200));
        throw new Error(t_('Erreur serveur: réponse invalide', 'Server error: invalid response'));
      }

      if (!response.ok) {
        console.error('❌ Reschedule failed:', {
          status: response.status,
          data: data
        });
        const errorMessage = data?.message || data?.error?.message || data?.error || t_('Échec de la reprogrammation', 'Failed to reschedule');
        throw new Error(errorMessage);
      }
      
      if (data.success) {
        toast.success(
          t_('Simulation reprogrammée avec succès', 'Simulation rescheduled successfully'),
          { duration: 3000 }
        );
        setShowRescheduleModal(false);
        setSelectedBooking(null);
        setSelectedDate(new Date());
        setSelectedTime('');
        // Refresh bookings without await to prevent loading loop
        fetchBookings();
      } else {
        const errorMessage = data?.message || data?.error?.message || data?.error || t_('Échec de la reprogrammation', 'Failed to reschedule');
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

  const getStatusColor = (status: string) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-4 w-4" />;
      case 'ACTIVE': return <Mic className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <X className="h-4 w-4" />;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Dribbble Inspired */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-hidden border-b border-gray-200 dark:border-gray-800">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full border border-purple-200 dark:border-purple-800"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {t_("Planification Intelligente", "Smart Scheduling")}
                </span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight"
              >
                {t_("Réservez vos", "Book Your")}{' '}
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  {t_("Simulations", "Simulations")}
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                {t_(
                  "Planifiez vos simulations vocales selon votre emploi du temps. Réservez vos créneaux en toute simplicité et gérez vos rendez-vous facilement.",
                  "Schedule your voice simulations according to your schedule. Book your slots with ease and manage your appointments effortlessly."
                )}
              </motion.p>

              {/* Feature Cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
              >
                <div className="flex flex-col items-start gap-2 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarClock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t_("Planification", "Scheduling")}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t_("Flexible", "Flexible")}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t_("Créneaux", "Time Slots")}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t_("Disponibles", "Available")}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t_("Confirmation", "Confirmation")}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t_("Instantanée", "Instant")}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full max-w-lg mx-auto">
                {/* SVG Calendar Illustration - Dynamic */}
                {(() => {
                  const now = new Date();
                  const currentDay = now.getDate();
                  const currentMonth = now.toLocaleDateString('fr-FR', { month: 'long' });
                  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
                  
                  // Calculate calendar layout positions
                  // Calendar grid: 7 columns (days), ~5 rows
                  // Position calculation: start at x=120, y=225, step 35px horizontally, 40px vertically
                  const getDatePosition = (day: number) => {
                    // Find which week and day of week
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const firstDayWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    // Adjust for Monday start (0 = Monday)
                    const mondayStart = firstDayWeek === 0 ? 6 : firstDayWeek - 1;
                    
                    const week = Math.floor((day - 1 + mondayStart) / 7);
                    const dayOfWeek = (day - 1 + mondayStart) % 7;
                    
                    const x = 120 + (dayOfWeek * 35);
                    const y = 225 + (week * 40);
                    
                    return { x, y, week, dayOfWeek };
                  };
                  
                  const todayPos = getDatePosition(currentDay);
                  
                  // Generate some sample dates around today (for visual interest)
                  const sampleDates = [];
                  for (let i = Math.max(1, currentDay - 2); i <= Math.min(31, currentDay + 4); i++) {
                    if (i !== currentDay) {
                      sampleDates.push(i);
                    }
                  }
                  
                  return (
                    <svg
                      viewBox="0 0 400 400"
                      className="w-full h-auto"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Background Circles */}
                      <circle cx="200" cy="200" r="160" fill="url(#gradient1)" opacity="0.1"/>
                      <circle cx="200" cy="200" r="120" fill="url(#gradient2)" opacity="0.15"/>
                      
                      {/* Calendar Base */}
                      <rect x="100" y="120" width="200" height="220" rx="12" fill="white" stroke="#8B5CF6" strokeWidth="3"/>
                      
                      {/* Calendar Header */}
                      <rect x="100" y="120" width="200" height="50" rx="12" fill="url(#gradient3)"/>
                      <text x="200" y="150" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{capitalizedMonth}</text>
                      
                      {/* Calendar Grid */}
                      {/* Week Days */}
                      <text x="120" y="195" fill="#6B7280" fontSize="11" fontWeight="600">L</text>
                      <text x="155" y="195" fill="#6B7280" fontSize="11" fontWeight="600">M</text>
                      <text x="190" y="195" fill="#6B7280" fontSize="11" fontWeight="600">M</text>
                      <text x="225" y="195" fill="#6B7280" fontSize="11" fontWeight="600">J</text>
                      <text x="260" y="195" fill="#6B7280" fontSize="11" fontWeight="600">V</text>
                      <text x="295" y="195" fill="#6B7280" fontSize="11" fontWeight="600">S</text>
                      
                      {/* Calendar Days - Sample dates with subtle highlights */}
                      {sampleDates.slice(0, 6).map((day, idx) => {
                        const pos = getDatePosition(day);
                        const colors = ['#8B5CF6', '#10B981', '#3B82F6'];
                        const color = colors[idx % colors.length];
                        return (
                          <g key={day}>
                            <circle cx={pos.x} cy={pos.y} r="15" fill={color} opacity="0.2"/>
                            <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="#1F2937" fontSize="12" fontWeight="600">{day}</text>
                          </g>
                        );
                      })}
                      
                      {/* Current Day - Highlighted */}
                      <circle cx={todayPos.x} cy={todayPos.y} r="18" fill="url(#gradient4)" stroke="#8B5CF6" strokeWidth="2"/>
                      <text x={todayPos.x} y={todayPos.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{currentDay}</text>
                      
                      {/* Clock Icon */}
                      <circle cx="320" cy="180" r="30" fill="url(#gradient5)" opacity="0.9"/>
                      <path d="M320 170 L320 180 L325 185" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      
                      {/* Notification Badge */}
                      <circle cx="300" cy="280" r="25" fill="#EF4444" opacity="0.9"/>
                      <path d="M290 280 L310 280 M300 270 L300 290" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      
                      {/* Checkmark */}
                      <circle cx="80" cy="280" r="25" fill="#10B981" opacity="0.9"/>
                      <path d="M72 280 L78 286 L88 276" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6"/>
                          <stop offset="100%" stopColor="#EC4899"/>
                        </linearGradient>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6"/>
                          <stop offset="100%" stopColor="#8B5CF6"/>
                        </linearGradient>
                        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6"/>
                          <stop offset="100%" stopColor="#EC4899"/>
                        </linearGradient>
                        <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6"/>
                          <stop offset="100%" stopColor="#EC4899"/>
                        </linearGradient>
                        <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6"/>
                          <stop offset="100%" stopColor="#8B5CF6"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  );
                })()}

                {/* Floating Elements */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-xl"
                >
                  <CalendarCheck className="w-8 h-8 text-white" />
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-20 left-10 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Zap className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book New Simulation - Modern Redesign */}
        <Card className="mb-8 shadow-lg border-2 border-purple-100 dark:border-purple-900/50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-200 dark:border-purple-800">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              {t_("Réserver une Simulation", "Book a Simulation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Booking Type Selection - Card Based */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t_("Type de Réservation", "Booking Type")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => setBookingType('AUTO')}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      bookingType === 'AUTO'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        bookingType === 'AUTO'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Zap className={`w-6 h-6 ${bookingType === 'AUTO' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {t_("Automatique", "Automatic")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t_("Nous planifierons automatiquement le prochain créneau disponible", "We will automatically schedule the next available slot")}
                        </p>
                      </div>
                      {bookingType === 'AUTO' && (
                        <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => setBookingType('MANUAL')}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      bookingType === 'MANUAL'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        bookingType === 'MANUAL'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <CalendarIcon className={`w-6 h-6 ${bookingType === 'MANUAL' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {t_("Manuelle", "Manual")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t_("Choisissez votre date et heure préférées", "Choose your preferred date and time")}
                        </p>
                      </div>
                      {bookingType === 'MANUAL' && (
                        <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Simulation Topics Explanation - Always Visible */}
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-gray-700 dark:text-gray-300">
                <strong className="font-semibold text-gray-900 dark:text-white">
                  {t_("À propos de la simulation:", "About the simulation:")}
                </strong>
                <p className="mt-2">
                  {t_(
                    "Vous serez interrogé sur plusieurs sujets variés pour évaluer votre niveau de français. Les questions porteront sur différents thèmes pour tester votre compréhension, expression orale, et capacité à communiquer en français dans des situations variées.",
                    "You will be questioned on several varied topics to assess your French level. Questions will cover different themes to test your comprehension, oral expression, and ability to communicate in French in various situations."
                  )}
                </p>
                {topics.length > 0 && (
                  <>
                    <p className="mt-3 font-medium text-gray-900 dark:text-white">
                      {t_("Exemples de thèmes abordés:", "Example themes covered:")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {topics.slice(0, 6).map((topic, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {topic}
                        </Badge>
                      ))}
                      {topics.length > 6 && (
                        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          +{topics.length - 6} {t_("autres", "more")}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Manual Booking Options */}
            {bookingType === 'MANUAL' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
              >
                {/* Calendar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {t_("Sélectionner la Date", "Select Date")}
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

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {t_("Sélectionner l'Heure", "Select Time")}
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`text-xs transition-all ${
                          !slot.available 
                            ? 'opacity-40 cursor-not-allowed grayscale' 
                            : selectedTime === slot.time 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0' 
                              : 'hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Voice Preference Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t_("Préférence Vocale", "Voice Preference")}
              </label>
              {loadingVoices ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t_("Chargement des voix...", "Loading voices...")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {availableVoices.map((voice) => {
                    const isSelected = voicePreference === voice.id;
                    const accentFlags: Record<string, string> = {
                      'FRANCE': '🇫🇷',
                      'QUEBEC': '🇨🇦',
                      'BELGIUM': '🇧🇪'
                    };
                    return (
                      <motion.div
                        key={voice.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          onClick={() => setVoicePreference(voice.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{accentFlags[voice.accent]}</span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {voice.accent}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            {voice.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {voice.description}
                          </p>
                          <Badge variant={voice.gender === 'MALE' ? 'default' : 'secondary'} className="text-xs">
                            {voice.gender === 'MALE' ? t_("Masculin", "Male") : t_("Féminin", "Female")}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Book Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={handleBookSimulation}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t_("Réserver la Simulation", "Book Simulation")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking History - Modern Redesign */}
        <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-900/50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-200 dark:border-purple-800">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              {t_("Historique des Réservations", "Booking History")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t_("Chargement...", "Loading...")}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t_("Aucune réservation", "No bookings yet")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t_("Réservez votre première simulation pour commencer", "Book your first simulation to get started")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const scheduledDate = booking.scheduledDate ? new Date(booking.scheduledDate) : null;
                  const isValidDate = scheduledDate && !isNaN(scheduledDate.getTime());
                  
                  // Get voice ID from questionsData if available, otherwise try voicePreference
                  let voiceId: string | undefined;
                  if (booking.questionsData && typeof booking.questionsData === 'object') {
                    voiceId = (booking.questionsData as any).voiceId;
                  }
                  if (!voiceId && booking.voicePreference && typeof booking.voicePreference === 'string' && booking.voicePreference.includes('_')) {
                    voiceId = booking.voicePreference;
                  }
                  
                  const selectedVoice = voiceId ? availableVoices.find(v => v.id === voiceId) : undefined;
                  
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all bg-white dark:bg-gray-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mic className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            {isValidDate ? (
                              <>
                                <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                  {scheduledDate.toLocaleDateString('fr-FR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {t_("à", "at")} {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </>
                            ) : (
                              <div className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {t_("Date non disponible", "Date not available")}
                              </div>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              {selectedVoice ? (
                                <Badge variant="secondary" className="text-xs">
                                  {selectedVoice.name} • {selectedVoice.accent}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {t_("Voix sélectionnée", "Selected voice")}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {booking.duration ? Math.floor(booking.duration / 60) : 5} {t_("minutes", "minutes")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-2">{t_(booking.status, booking.status)}</span>
                          </span>
                          {booking.status === 'SCHEDULED' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRescheduleBooking(booking)}
                                className="hover:border-blue-300"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                {t_("Reporter", "Reschedule")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelBooking(booking)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {t_("Annuler", "Cancel")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
                <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
