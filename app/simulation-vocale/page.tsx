'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  BarChart3,
  Settings,
  CalendarIcon,
  Trophy,
  Mic,
  Volume2,
  Play,
  Pause,
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
  Clock,
  Target,
  TrendingUp,
  Download,
  Share2,
  Star,
  Award,
  Headphones,
  ArrowRight,
  Zap,
  BookOpen,
  Brain,
  Users,
  Timer,
  RefreshCw,
  ChevronRight,
  History,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/components/theme-provider';
import Link from 'next/link';
import Image from 'next/image';
import { SimulationHeader } from '@/components/SimulationHeader';

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: 'MALE' | 'FEMALE' | string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  overallScore?: number;
  fluencyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  pronunciationScore?: number;
  coherenceScore?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
  questionsData?: any;
}

function SimulationPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  // Helper function for translations
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;
  
  // Get profile picture URL
  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('FREE');
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isStartingSimulation, setIsStartingSimulation] = useState(false);

  useEffect(() => {
    // Only check access when userProfile is loaded and haven't checked yet
    if (userProfile && !hasCheckedAccess) {
      checkSubscriptionAccess();
    }
  }, [userProfile, hasCheckedAccess]);

  useEffect(() => {
    // Fetch data if access is granted (either through free attempts or subscription)
    if (accessGranted) {
      fetchSimulations();
      fetchMonthlyCount();
    }
  }, [accessGranted]);

  const checkSubscriptionAccess = async () => {
    try {
      setLoading(true);
      setHasCheckedAccess(true);

      // STEP 1: Check free attempts FIRST (all users get 5 free simulations)
      const freeAttemptsResponse = await apiClient.get('/simulations/free-attempts/count');
      
      if (freeAttemptsResponse.success && freeAttemptsResponse.data) {
        const freeAttemptsData = freeAttemptsResponse.data as any;
        if (freeAttemptsData.remainingFreeAttempts > 0) {
          // User has free attempts - ALLOW ACCESS
          console.log('✅ Access granted: User has free attempts remaining', freeAttemptsData.remainingFreeAttempts);
          setSubscriptionTier('FREE_WITH_ATTEMPTS');
          setAccessGranted(true);
          setLoading(false);
          return;
        }
      }
      
      // STEP 2: If no free attempts, check REAL subscription from API (not userProfile)
      const subscriptionResponse = await apiClient.get('/subscriptions/active');
      
      if (subscriptionResponse.success && subscriptionResponse.data) {
        const subscriptionData = subscriptionResponse.data as any;
        const tier = subscriptionData.subscription?.tier;
        setSubscriptionTier(tier);
        
        // Voice simulations require PREMIUM or PRO subscription
        if (tier === 'PREMIUM' || tier === 'PRO') {
          console.log('✅ Access granted: User has valid subscription', tier);
          setAccessGranted(true);
          setLoading(false);
          return;
        }
      }
      
      // STEP 3: No free attempts and no valid subscription - redirect
      console.log('❌ Access denied: No free attempts and no valid subscription');
      setSubscriptionTier('FREE');
      setAccessGranted(false);
      setLoading(false);
      toast.error('Les simulations vocales nécessitent un abonnement Premium ou Pro');
      router.push('/abonnement');
    } catch (error) {
      console.error('Error checking subscription:', error);
      setLoading(false);
      setHasCheckedAccess(true);
      // On error, show error but don't redirect (fail gracefully)
      toast.error('Erreur lors de la vérification de l\'accès');
    }
  };

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ No valid token found in localStorage');
        toast.error(t_('Veuillez vous connecter', 'Please log in'));
        router.push('/login');
        return;
      }
      
      const response = await apiClient.get('/voice-simulation/history');

      if (response.success && response.data) {
        const simulationsData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Simulations fetched:', {
          count: simulationsData.length || 0,
          scheduled: simulationsData.filter((s: VoiceSimulation) => s.status === 'SCHEDULED').length,
          completed: simulationsData.filter((s: VoiceSimulation) => s.status === 'COMPLETED').length
        });
        setSimulations(simulationsData);
      } else {
        console.error('❌ Error loading simulations:', response.error);
        const errorMessage = response.error?.message || t_('Erreur lors du chargement des simulations', 'Error loading simulations');
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error fetching simulations:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyCount = async () => {
    try {
      const response = await apiClient.get('/voice-simulation/monthly-count');

      if (response.success && response.data) {
        const monthlyData = response.data as any;
        setMonthlyCount(monthlyData.monthlyCount || 0);
      }
    } catch (error) {
      console.error('Error fetching monthly count:', error);
    }
  };

  const handleStartVapiSimulation = async () => {
    try {
      setIsStartingSimulation(true);
      toast.loading(t_('Création de la simulation...', 'Creating simulation...'));

      // Step 1: Get user's voice preference
      let voicePreference: string | undefined;
      try {
        const savedPreference = localStorage.getItem('voicePreference');
        if (savedPreference) {
          const saved = JSON.parse(savedPreference);
          if (saved.voiceId) {
            voicePreference = saved.voiceId;
          }
        }
      } catch (e) {
        console.warn('Could not load voice preference from localStorage:', e);
      }

      // If no preference in localStorage, try to get from backend
      if (!voicePreference) {
        try {
          const response = await apiClient.get('/users/preferences/voice');
          if (response.success && response.data) {
            const voiceData = response.data as any;
            if (voiceData.voiceId) {
              voicePreference = voiceData.voiceId;
            }
          }
        } catch (e) {
          console.warn('Could not load voice preference from backend:', e);
        }
      }

      // Step 2: Create simulation with AUTO booking type and immediate date (now + 5 seconds for instant start)
      const now = new Date();
      const scheduledDate = new Date(now.getTime() + 5 * 1000); // 5 seconds from now for instant start

      const bookingResponse = await apiClient.post('/voice-simulation/book', {
        bookingType: 'AUTO',
        preferredDates: [scheduledDate.toISOString()],
        voicePreference: voicePreference
      });

      if (!bookingResponse.success || !bookingResponse.data) {
        throw new Error(bookingResponse.error?.message || t_('Échec de la création de la simulation', 'Failed to create simulation'));
      }

      const simulationId = bookingResponse.data.simulation?.id || bookingResponse.data.id;
      if (!simulationId) {
        throw new Error(t_('ID de simulation non trouvé', 'Simulation ID not found'));
      }

      toast.dismiss();
      toast.success(t_('Simulation créée avec succès', 'Simulation created successfully'));

      // Step 3: Redirect to simulation room - let the room page handle starting
      // The simulation room will check if it's accessible and allow the user to start it
      // This supports both immediate start (user clicks start button) and scheduled access (via email link)
      router.push(`/simulation-vocale/${simulationId}`);
    } catch (error: any) {
      console.error('Error starting VAPI simulation:', error);
      toast.dismiss();
      toast.error(error.message || t_('Erreur lors du démarrage de la simulation', 'Error starting simulation'));
    } finally {
      setIsStartingSimulation(false);
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
      case 'ACTIVE': return <Target className="h-4 w-4" />;
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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="dashboard" />

      {/* Hero Section - Enhanced with Image and Better Design */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-black pt-32 pb-16">
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2ECC71]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="container relative mx-auto max-w-screen-2xl px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Image with Liquid Glass Effect */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center lg:justify-start"
            >
              <div className="relative w-full max-w-lg">
                {/* Liquid Glass Container */}
                <div className="relative bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-3xl p-6 md:p-8 border-2 border-white/20 dark:border-white/10 shadow-2xl">
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/10 via-transparent to-[#2ECC71]/5 rounded-3xl" />
                  
                  {/* Image Container */}
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/images/simution.png"
                      alt={t_("Simulation vocale", "Voice Simulation")}
                      width={600}
                      height={800}
                      className="w-full h-auto object-contain"
                      priority
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2ECC71]/5 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Text Content and Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Main Title - Enhanced Typography */}
              <div className="text-center lg:text-left space-y-4">
                <h1 
                  className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '-0.03em' }}
                >
                  <span className="text-[#2ECC71]">
                    {t_("Pratiquez votre", "Practice Your")}
                  </span>
                  <br />
                  <span className="text-black dark:text-white">
                    {t_("Entretien en Français", "French Interview")}
                  </span>
                </h1>

                {/* Enhanced Description */}
                <p 
                  className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-medium leading-relaxed max-w-2xl"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.7' }}
                >
                  {t_(
                    "Améliorez votre fluidité et développez votre confiance pour votre prochain entretien avec notre IA avancée. Recevez des corrections en temps réel et progressez rapidement.",
                    "Improve your fluency and build confidence for your next interview with our advanced AI. Receive real-time corrections and progress quickly."
                  )}
                </p>
              </div>

              {/* Centered CTA Button */}
              {accessGranted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center lg:justify-start"
                >
                  <Button
                    onClick={handleStartVapiSimulation}
                    disabled={isStartingSimulation}
                    className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold px-8 py-4 text-lg relative overflow-hidden group transition-all duration-300 hover:scale-105 shadow-lg shadow-[#2ECC71]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isStartingSimulation ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        <span className="relative z-10">{t_("Démarrage...", "Starting...")}</span>
                      </>
                    ) : (
                      <>
                    <Play className="w-5 h-5 mr-2" />
                    <span className="relative z-10">{t_("Démarrer une Simulation", "Start Simulation")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Bigger Calendar Card - Liquid Glass */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <div className="bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-3xl p-8 md:p-10 border-2 border-white/20 dark:border-white/10 shadow-2xl">
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/10 via-transparent to-[#2ECC71]/5 rounded-3xl pointer-events-none" />
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-6 text-center relative z-10" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    {t_("Comment commencer", "How to Start")}
                  </h3>
                  <div className="space-y-4 relative z-10">
                    {[
                      { step: "1", icon: CalendarIcon, text: t_("Réservez votre session", "Book your session"), desc: t_("Choisissez votre date et heure", "Choose your date and time") },
                      { step: "2", icon: Mic, text: t_("Pratiquez à l'oral", "Practice speaking"), desc: t_("Entraînez-vous avec notre IA", "Train with our AI") },
                      { step: "3", icon: Trophy, text: t_("Recevez vos résultats", "Get your results"), desc: t_("Analysez vos performances", "Analyze your performance") }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27c066] text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-[#2ECC71]/30 flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <item.icon className="w-5 h-5 text-[#2ECC71]" />
                            <span className="text-base md:text-lg font-bold text-black dark:text-white">{item.text}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Subscription Access Alert */}
        {!accessGranted && hasCheckedAccess && (subscriptionTier === 'FREE' || subscriptionTier === 'ESSENTIAL') && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <Crown className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Abonnement requis</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Les simulations vocales sont réservées aux abonnés Premium et Pro. 
                  <Button
                    size="sm" 
                    className="ml-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    onClick={() => router.push('/abonnement')}
                  >
                    Passer à Premium
                  </Button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Free Attempts Info */}
        {accessGranted && subscriptionTier === 'FREE_WITH_ATTEMPTS' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">Accès avec simulations gratuites</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Vous utilisez actuellement vos simulations gratuites. Passez à Premium ou Pro pour un accès illimité.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {monthlyCount >= 2 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Limite mensuelle atteinte</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Vous avez utilisé toutes vos 2 simulations ce mois-ci. Passez à la version PRO pour un accès illimité.
                </p>
                <Button
                  size="sm" 
                  className="mt-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  Passer à PRO
                </Button>
              </div>
            </div>
          </div>
        )}

        {monthlyCount === 1 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-amber-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">1 simulation restante</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Planifiez votre prochaine session avec sagesse.</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Header - Green & Black */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="text-[#2ECC71]">{t_("Vos", "Your")}</span>{' '}
            <span className="text-black dark:text-white">{t_("Statistiques", "Statistics")}</span>
          </h2>
          <p className="text-muted-foreground">
            {t_("Un aperçu de votre activité et de vos performances", "An overview of your activity and performance")}
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Monthly Usage Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t_("Utilisation mensuelle", "Monthly Usage")}
                    </p>
                    <p className="text-2xl font-bold text-[#2ECC71]">
                      {monthlyCount}/2
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t_("simulations utilisées", "simulations used")}
                    </p>
                </div>
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-[#2ECC71] h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((monthlyCount / 2) * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {monthlyCount < 2 
                      ? t_(`${2 - monthlyCount} simulation${2 - monthlyCount !== 1 ? 's' : ''} restante${2 - monthlyCount !== 1 ? 's' : ''}`, 
                          `${2 - monthlyCount} simulation${2 - monthlyCount !== 1 ? 's' : ''} remaining`)
                      : t_("Limite atteinte", "Limit reached")
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completed Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t_("Terminées", "Completed")}
                    </p>
                    <p className="text-2xl font-bold text-[#2ECC71]">
                      {simulations.filter(s => s.status === 'COMPLETED').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t_("simulations terminées", "simulations completed")}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Scheduled Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t_("Programmées", "Scheduled")}
                    </p>
                    <p className="text-2xl font-bold text-[#2ECC71]">
                    {simulations.filter(s => s.status === 'SCHEDULED').length}
                  </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t_("en attente", "pending")}
                    </p>
                </div>
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Average Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t_("Score moyen", "Average Score")}
                    </p>
                    <p className="text-2xl font-bold text-[#2ECC71]">
                    {simulations.filter(s => s.overallScore).length > 0 
                        ? `${Math.round(simulations.filter(s => s.overallScore).reduce((acc, s) => acc + (s.overallScore || 0), 0) / simulations.filter(s => s.overallScore).length)}%`
                      : '--'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {simulations.filter(s => s.overallScore).length > 0 
                        ? t_("basé sur vos résultats", "based on your results")
                        : t_("aucun score disponible", "no scores available")
                      }
                  </p>
                </div>
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t_("Actions Rapides", "Quick Actions")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t_("Gérez vos simulations et consultez vos résultats", "Manage your simulations and view your results")}
          </p>
        </div>

        {/* Enhanced Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Usage Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/usage')}
            >
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Aperçu de l'utilisation", "Usage Overview")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-grow">
                  {t_("Surveillez votre utilisation mensuelle des simulations, suivez vos progrès et consultez des analyses détaillées", 
                      "Monitor your monthly simulation usage, track your progress, and view detailed analytics")}
                </p>
                <div className="flex items-center text-xs text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Voir les détails", "View Details")}
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Voice Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/voice')}
            >
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Paramètres vocaux", "Voice Settings")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-grow">
                  {t_("Choisissez votre voix préférée, accent et prévisualisez différentes options pour vos simulations", 
                      "Choose your preferred voice, accent, and preview different options for your simulations")}
                </p>
                <div className="flex items-center text-xs text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Configurer", "Configure")}
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Booking Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/booking')}
            >
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Réserver une simulation", "Book a Simulation")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-grow">
                  {t_("Planifiez votre prochaine session de simulation vocale avec des options de réservation flexibles et des créneaux horaires", 
                      "Schedule your next voice simulation session with flexible booking options and time slots")}
                </p>
                <div className="flex items-center text-xs text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Réserver maintenant", "Book Now")}
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Results Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/results')}
            >
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Résultats et performance", "Results & Performance")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-grow">
                  {t_("Analysez vos résultats de simulation, suivez les tendances d'amélioration et consultez des métriques de performance détaillées", 
                      "Analyze your simulation results, track improvement trends, and view detailed performance metrics")}
                </p>
                <div className="flex items-center text-xs text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Voir les résultats", "View Results")}
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>


        {/* Recent Activity - Liquid Glass */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">
            <span className="text-[#2ECC71]">{t_("Activité", "Activity")}</span>{' '}
            <span className="text-black dark:text-white">{t_("récente", "Recent")}</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t_("Vos dernières simulations", "Your latest simulations")}
          </p>
        </div>
        
        <div className="bg-white/5 dark:bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-xl p-6">
          <div className="space-y-3">
            {simulations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t_("Aucune simulation pour le moment", "No simulations yet")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {t_("Commencez votre parcours en réservant votre première simulation vocale", 
                      "Start your journey by booking your first voice simulation")}
                </p>
                <Button 
                  className="bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold shadow-lg"
                  onClick={() => router.push('/simulation-vocale/booking')}
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t_("Réserver une simulation", "Book a Simulation")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {simulations
                  .filter((sim) => {
                    // Only show simulations with valid dates and real data
                    const scheduledDate = sim.scheduledDate ? new Date(sim.scheduledDate) : null;
                    const createdDate = sim.createdAt ? new Date(sim.createdAt) : null;
                    return (scheduledDate && !isNaN(scheduledDate.getTime())) || 
                           (createdDate && !isNaN(createdDate.getTime()));
                  })
                  .slice(0, 5)
                  .map((simulation) => {
                    // Use scheduledDate if valid, otherwise fallback to createdAt
                    const dateStr = simulation.scheduledDate || simulation.createdAt;
                    const date = dateStr ? new Date(dateStr) : new Date();
                    const isValidDate = !isNaN(date.getTime());
                    
                    // Format date properly
                    const formattedDate = isValidDate 
                      ? date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '';
                    
                    const formattedTime = isValidDate && simulation.scheduledDate
                      ? date.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '';

                    const statusLabels = {
                      'SCHEDULED': { fr: 'Programmée', en: 'Scheduled' },
                      'ACTIVE': { fr: 'Active', en: 'Active' },
                      'COMPLETED': { fr: 'Terminée', en: 'Completed' },
                      'CANCELLED': { fr: 'Annulée', en: 'Cancelled' },
                      'EXPIRED': { fr: 'Expirée', en: 'Expired' }
                    };

                    // Check if simulation should be EXPIRED (scheduledDate has passed and status is SCHEDULED)
                    const scheduledDateObj = simulation.scheduledDate ? new Date(simulation.scheduledDate) : null;
                    const now = new Date();
                    const isExpired = scheduledDateObj && 
                                     simulation.status === 'SCHEDULED' && 
                                     scheduledDateObj < now;
                    const displayStatus = isExpired ? 'EXPIRED' : simulation.status;
                    
                    const statusLabel = statusLabels[displayStatus as keyof typeof statusLabels]?.[lang as 'fr' | 'en'] || displayStatus;
                    
                    // Get voice name from questionsData if available
                    const voiceName = simulation.questionsData?.voiceName || 
                      (simulation.voicePreference === 'MALE' ? t_('Voix masculine', 'Male voice') : t_('Voix féminine', 'Female voice'));

                    return (
                      <div
                        key={simulation.id}
                        className="flex items-center gap-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
                      >
                        {/* Date and Time */}
                        <div className="min-w-[140px]">
                          {isValidDate ? (
                            <>
                              <p className="font-bold text-black dark:text-white text-sm">
                                  {formattedDate}
                              </p>
                                {formattedTime && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {formattedTime}
                                </p>
                              )}
                                  </>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t_("Date non disponible", "Date not available")}</p>
                                )}
                              </div>
                        {/* Voice */}
                        <div className="min-w-[180px]">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t_("Voix", "Voice")}</p>
                          <p className="font-bold text-black dark:text-white text-sm">
                            {voiceName}
                          </p>
                                </div>
                        {/* Status */}
                        <div className="min-w-[120px]">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t_("Statut", "Status")}</p>
                          <div className="flex items-center gap-2">
                            {displayStatus === 'SCHEDULED' && (
                              <>
                                <div className="size-2 rounded-full bg-[#2ECC71]"></div>
                                <p className="text-[#2ECC71] font-bold text-sm">{statusLabel}</p>
                              </>
                            )}
                            {displayStatus === 'COMPLETED' && (
                              <>
                                <div className="size-2 rounded-full bg-[#2ECC71]"></div>
                                <p className="text-[#2ECC71] font-bold text-sm">{statusLabel}</p>
                              </>
                            )}
                            {displayStatus === 'CANCELLED' && (
                              <>
                                <div className="size-2 rounded-full bg-red-500"></div>
                                <p className="text-red-500 font-bold text-sm">{statusLabel}</p>
                              </>
                            )}
                            {displayStatus === 'EXPIRED' && (
                              <>
                                <div className="size-2 rounded-full bg-orange-500"></div>
                                <p className="text-orange-500 font-bold text-sm">{statusLabel}</p>
                              </>
                            )}
                            {displayStatus === 'ACTIVE' && (
                              <>
                                <div className="relative flex h-2 w-2">
                                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </div>
                                <p className="text-yellow-500 font-bold text-sm">{statusLabel}</p>
                                  </>
                                )}
                        </div>
                      </div>
                        {/* Actions */}
                        <div className="flex items-center gap-3 ml-auto">
                          {displayStatus === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => router.push(`/simulation-vocale/booking?reschedule=${simulation.id}`)}
                                className="text-sm font-medium text-black dark:text-white hover:text-[#2ECC71] transition-colors"
                              >
                                {t_("Reporter", "Reschedule")}
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(t_("Êtes-vous sûr de vouloir annuler cette simulation ?", "Are you sure you want to cancel this simulation?"))) {
                                    return;
                                  }
                                  try {
                                    const response = await fetch(`/api/voice-simulation/cancel/${simulation.id}`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                      }
                                    });
                                    if (response.ok) {
                                      window.location.reload();
                                    }
                                  } catch (error) {
                                    console.error('Error cancelling simulation:', error);
                                  }
                                }}
                                className="text-sm font-medium text-black dark:text-white hover:text-red-500 transition-colors"
                              >
                                {t_("Annuler", "Cancel")}
                              </button>
                            </>
                          )}
                          {displayStatus === 'COMPLETED' && simulation.overallScore && (
                            <button
                              onClick={() => router.push(`/simulation-vocale/results?id=${simulation.id}`)}
                              className="text-sm font-medium text-[#2ECC71] hover:text-[#27c066] transition-colors"
                            >
                              {t_("Voir les Résultats", "View Results")}
                            </button>
                          )}
                          {displayStatus === 'EXPIRED' && (
                            <button
                              onClick={() => router.push(`/simulation-vocale/booking?reschedule=${simulation.id}`)}
                              className="text-sm font-medium text-black dark:text-white hover:text-[#2ECC71] transition-colors"
                            >
                              {t_("Reporter", "Reschedule")}
                            </button>
                      )}
                    </div>
                  </div>
                    );
                  })}
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SimulationPage() {
  return (
    <SharedDataProvider>
      <SimulationPageContent />
    </SharedDataProvider>
  );
}
