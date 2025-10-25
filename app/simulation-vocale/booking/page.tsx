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
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';

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
  voicePreference: 'MALE' | 'FEMALE';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  overallScore?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
}

function BookingPageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

  const [bookingType, setBookingType] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [voicePreference, setVoicePreference] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [bookings, setBookings] = useState<VoiceSimulation[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<VoiceSimulation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    generateAvailableSlots();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/voice-simulation/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      } else {
        toast.error('Error loading bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = () => {
    if (!selectedDate) return;
    
    const slots: BookingSlot[] = [];
    const date = selectedDate.toISOString().split('T')[0];
    
    // Generate time slots for the selected date
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: `${date}-${timeString}`,
          date,
          time: timeString,
          available: true, // Will be determined by backend availability
          duration: 30
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
      const bookingData = {
        type: bookingType,
        scheduledDate: bookingType === 'AUTO' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
          : new Date(`${selectedDate?.toISOString().split('T')[0]}T${selectedTime}:00`).toISOString(),
        voicePreference,
        duration: 30
      };

      // TODO: Implement actual booking API
      toast.success('Simulation booked successfully!');
      setShowBookingModal(false);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to book simulation');
    }
  };

  const handleCancelBooking = async (booking: VoiceSimulation) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      // TODO: Implement actual cancellation API
      toast.success('Simulation cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel simulation');
    }
  };

  const handleRescheduleBooking = async (booking: VoiceSimulation) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking || !selectedDate || !selectedTime) return;

    try {
      // TODO: Implement actual reschedule API
      toast.success('Simulation rescheduled successfully');
      setShowRescheduleModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to reschedule simulation');
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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-teal-800 dark:from-green-900 dark:via-green-800 dark:to-teal-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2039&q=80"
            alt="Calendar and scheduling"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Réservation
            </h1>

            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Planifiez vos simulations</strong> selon votre emploi du temps.
              Réservez vos créneaux de simulation vocale et gérez vos rendez-vous en toute simplicité.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-green-200 mb-8">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-green-300" />
                Planification flexible
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-green-300" />
                Créneaux disponibles
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                Confirmation instantanée
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header - Vercel Style */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Réservation</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Planifiez vos simulations vocales</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">PRO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book New Simulation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Book New Simulation</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type</label>
              <Select value={bookingType} onValueChange={(value) => setBookingType(value as 'AUTO' | 'MANUAL')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Auto (Next Available)</SelectItem>
                  <SelectItem value="MANUAL">Manual (Choose Date/Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Voice Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voice Preference</label>
              <Select value={voicePreference} onValueChange={(value) => setVoicePreference(value as 'MALE' | 'FEMALE')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEMALE">Female Voice</SelectItem>
                  <SelectItem value="MALE">Male Voice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Manual Booking Options */}
          {bookingType === 'MANUAL' && (
            <div className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`text-xs ${
                          !slot.available 
                            ? 'opacity-50 cursor-not-allowed' 
                            : selectedTime === slot.time 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : ''
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button 
              onClick={handleBookSimulation}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Simulation
            </Button>
          </div>
        </div>

        {/* Booking History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Booking History</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No bookings yet</h3>
                <p className="text-sm text-gray-500">Book your first simulation to get started</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Mic className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(booking.scheduledDate).toLocaleDateString()} at{' '}
                          {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.voicePreference} Voice • {booking.duration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status}</span>
                      </span>
                      {booking.status === 'SCHEDULED' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRescheduleBooking(booking)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelBooking(booking)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Booking</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium">{bookingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">
                  {bookingType === 'AUTO' 
                    ? 'Next Available' 
                    : selectedDate?.toLocaleDateString()
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Voice:</span>
                <span className="text-sm font-medium">{voicePreference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium">30 minutes</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBookingModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Simulation</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this simulation? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Keep Booking
              </Button>
              <Button 
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Cancel Simulation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reschedule Simulation</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
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
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmReschedule}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Reschedule
              </Button>
            </div>
          </div>
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
