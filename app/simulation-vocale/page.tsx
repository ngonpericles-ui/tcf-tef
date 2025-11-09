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
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/components/theme-provider';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getComprehensiveProfilePictureUrl } from '@/lib/utils/profilePicture';
import GlobeAnimation from '@/components/GlobeAnimation';

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: 'MALE' | 'FEMALE';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  overallScore?: number;
  fluencyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  pronunciationScore?: number;
  coherenceScore?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
}

function SimulationPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  // Helper function for translations
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;
  
  // Get profile picture URL
  const profileImageUrl = userProfile?.avatar
    ? getComprehensiveProfilePictureUrl(userProfile.email || '', userProfile.avatar)
    : userProfile?.email
      ? getComprehensiveProfilePictureUrl(userProfile.email, '')
      : '';
  
  // Get user initials from name or email
  const userInitials = userProfile?.name
    ? userProfile.name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) || userProfile.email?.charAt(0).toUpperCase() || 'U'
    : userProfile?.email
      ? userProfile.email.charAt(0).toUpperCase()
      : 'U';

  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('FREE');
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

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
      case 'ACTIVE': return <Target className="h-4 w-4" />;
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Rounded Dark Container with Liquid Glass Effect - Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-6xl">
        <div className="bg-slate-900/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Sound Wave Icon and Title */}
            <div className="flex items-center gap-3">
              {/* Sound Wave Icon - Green */}
              <div className="flex items-end gap-1 h-6">
                <div className="w-1 bg-[#2ECC71] rounded-full" style={{ height: '12px', animation: 'pulse 1s ease-in-out infinite' }} />
                <div className="w-1 bg-[#2ECC71] rounded-full" style={{ height: '18px', animation: 'pulse 1s ease-in-out infinite 0.2s' }} />
                <div className="w-1 bg-[#2ECC71] rounded-full" style={{ height: '24px', animation: 'pulse 1s ease-in-out infinite 0.4s' }} />
                <div className="w-1 bg-[#2ECC71] rounded-full" style={{ height: '18px', animation: 'pulse 1s ease-in-out infinite 0.6s' }} />
                <div className="w-1 bg-[#2ECC71] rounded-full" style={{ height: '12px', animation: 'pulse 1s ease-in-out infinite 0.8s' }} />
              </div>
              <span className="text-lg md:text-xl text-white font-normal">
                {t_("Pratique d'Entretien IA", "AI Interview Practice")}
              </span>
            </div>
            
            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 md:gap-8 text-base md:text-lg text-white font-normal">
              <Link href="/simulation-vocale/booking" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t_("Nouvelle Simulation", "New Simulation")}
              </Link>
              <Link href="/simulation-vocale/usage" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t_("Historique", "History")}
              </Link>
              <Link href="/simulation-vocale/results" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t_("Feedback", "Feedback")}
              </Link>
              <Link href="/settings" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t_("Paramètres", "Settings")}
              </Link>
            </nav>
            
            {/* Right: Bell and Profile Picture */}
            <div className="flex items-center gap-4">
              <button
                aria-label="Notifications"
                className="relative p-2 text-white hover:text-[#2ECC71] transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>
              <Avatar className="w-10 h-10 border-2 border-[#2ECC71]/50">
                <AvatarImage 
                  src={profileImageUrl}
                  alt={userProfile?.name || 'User'}
                />
                <AvatarFallback className="bg-[#2ECC71] text-white font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - White Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-black pt-32">
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2ECC71]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="container relative mx-auto max-w-screen-2xl px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left space-y-6"
            >
              {/* Main Title - Green with Globe Animation */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <h1 
                  className="text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '-0.02em' }}
                >
                  <span className="text-[#2ECC71]">
                    {t_("Pratiquez votre", "Practice Your")}
                  </span>
                  <br />
                  <span className="text-[#2ECC71]">
                    {t_("Entretien en Français", "French Interview")}
                  </span>
                </h1>
                <div className="hidden lg:block w-20 h-20">
                  <GlobeAnimation className="w-full h-full" />
                </div>
              </div>

              {/* Description - White/Black based on theme */}
              <p 
                className="text-xl md:text-2xl text-foreground font-medium leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                {t_(
                  "Améliorez votre fluidité et développez votre confiance pour votre prochain entretien avec notre IA avancée.",
                  "Improve your fluency and build confidence for your next interview with our advanced AI."
                )}
              </p>

              {/* CTA Button - Green */}
              {accessGranted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center lg:justify-start"
                >
                  <Button
                    onClick={() => router.push('/simulation-vocale/booking')}
                    className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-8 py-4 text-lg relative overflow-hidden group transition-all duration-300 hover:scale-105"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    <span className="relative z-10">{t_("Démarrer une Simulation", "Start Simulation")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Right Side: Calendar with Green Icons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Calendar Card */}
              <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border-2 border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4 text-center" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {t_("Comment commencer", "How to Start")}
                </h3>
                <div className="space-y-3">
                  {[
                    { step: "1", icon: CalendarIcon, text: t_("Réservez votre session", "Book your session") },
                    { step: "2", icon: Mic, text: t_("Pratiquez à l'oral", "Practice speaking") },
                    { step: "3", icon: Trophy, text: t_("Recevez vos résultats", "Get your results") }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="w-8 h-8 rounded-full bg-[#2ECC71] text-white flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <item.icon className="w-5 h-5 text-[#2ECC71]" />
                      <span className="text-sm font-medium text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Utilisation mensuelle", "Monthly Usage")}
                    </p>
                    <p className="text-3xl font-bold text-[#2ECC71]">
                      {monthlyCount}/2
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t_("simulations utilisées", "simulations used")}
                    </p>
                </div>
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-7 h-7 text-white" />
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t_("Terminées", "Completed")}
                    </p>
                    <p className="text-3xl font-bold text-[#2ECC71]">
                      {simulations.filter(s => s.status === 'COMPLETED').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t_("simulations terminées", "simulations completed")}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-7 h-7 text-white" />
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t_("Programmées", "Scheduled")}
                    </p>
                    <p className="text-3xl font-bold text-[#2ECC71]">
                    {simulations.filter(s => s.status === 'SCHEDULED').length}
                  </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t_("en attente", "pending")}
                    </p>
                </div>
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-7 h-7 text-white" />
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t_("Score moyen", "Average Score")}
                    </p>
                    <p className="text-3xl font-bold text-[#2ECC71]">
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
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t_("Actions Rapides", "Quick Actions")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
              className="relative overflow-hidden cursor-pointer group bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/usage')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Aperçu de l'utilisation", "Usage Overview")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  {t_("Surveillez votre utilisation mensuelle des simulations, suivez vos progrès et consultez des analyses détaillées", 
                      "Monitor your monthly simulation usage, track your progress, and view detailed analytics")}
                </p>
                <div className="flex items-center text-sm text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Voir les détails", "View Details")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
              className="relative overflow-hidden cursor-pointer group bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/voice')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Paramètres vocaux", "Voice Settings")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  {t_("Choisissez votre voix préférée, accent et prévisualisez différentes options pour vos simulations", 
                      "Choose your preferred voice, accent, and preview different options for your simulations")}
                </p>
                <div className="flex items-center text-sm text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Configurer", "Configure")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
              className="relative overflow-hidden cursor-pointer group bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/booking')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Réserver une simulation", "Book a Simulation")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  {t_("Planifiez votre prochaine session de simulation vocale avec des options de réservation flexibles et des créneaux horaires", 
                      "Schedule your next voice simulation session with flexible booking options and time slots")}
                </p>
                <div className="flex items-center text-sm text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Réserver maintenant", "Book Now")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
              className="relative overflow-hidden cursor-pointer group bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-[#2ECC71]/50 dark:hover:border-[#2ECC71]/50 h-full transition-all duration-300 hover:shadow-xl" 
              onClick={() => router.push('/simulation-vocale/results')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/5 to-[#27c066]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#2ECC71] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-[#2ECC71] transition-colors">
                  {t_("Résultats et performance", "Results & Performance")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  {t_("Analysez vos résultats de simulation, suivez les tendances d'amélioration et consultez des métriques de performance détaillées", 
                      "Analyze your simulation results, track improvement trends, and view detailed performance metrics")}
                </p>
                <div className="flex items-center text-sm text-[#2ECC71] font-semibold group-hover:gap-2 transition-all">
                  {t_("Voir les résultats", "View Results")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>


        {/* Recent Activity - Blue Transparent Liquid Glass */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="text-[#2ECC71]">{t_("Activité", "Activity")}</span>{' '}
            <span className="text-black dark:text-white">{t_("récente", "Recent")}</span>
          </h2>
          <p className="text-muted-foreground mb-4">
            {t_("Vos dernières simulations", "Your latest simulations")}
          </p>
        </div>
        
        <div className="bg-blue-500/10 dark:bg-blue-500/5 backdrop-blur-xl rounded-2xl border border-blue-200/30 dark:border-blue-700/30 shadow-xl p-6">
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
                      'CANCELLED': { fr: 'Annulée', en: 'Cancelled' }
                    };

                    const statusLabel = statusLabels[simulation.status as keyof typeof statusLabels]?.[lang as 'fr' | 'en'] || simulation.status;

                    return (
                      <motion.div
                        key={simulation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative overflow-hidden rounded-xl bg-blue-500/20 dark:bg-blue-500/10 backdrop-blur-sm border border-blue-200/40 dark:border-blue-700/40 hover:border-blue-300/60 dark:hover:border-blue-600/60 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ${
                              simulation.status === 'COMPLETED' 
                                ? 'bg-[#2ECC71]' 
                                : simulation.status === 'SCHEDULED'
                                ? 'bg-blue-500'
                                : simulation.status === 'ACTIVE'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                            }`}>
                              {simulation.status === 'COMPLETED' ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                              ) : (
                                <Mic className="w-6 h-6 text-white" />
                              )}
                      </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-base font-semibold text-foreground">
                                  {formattedDate}
                        </div>
                                {formattedTime && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                        <div className="text-sm text-muted-foreground">
                                      {formattedTime}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Volume2 className="w-4 h-4 text-[#2ECC71]" />
                                  <span>
                                    {simulation.voicePreference === 'MALE' 
                                      ? t_('Voix masculine', 'Male voice')
                                      : t_('Voix féminine', 'Female voice')}
                                  </span>
                                </div>
                                {simulation.duration && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                      <Clock className="w-4 h-4 text-[#2ECC71]" />
                                      <span>{Math.floor(simulation.duration / 60)} {t_('min', 'min')}</span>
                                    </div>
                                  </>
                                )}
                        </div>
                      </div>
                    </div>

                          {/* Status and Score */}
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                              getStatusColor(simulation.status)
                            }`}>
                        {getStatusIcon(simulation.status)}
                              {statusLabel}
                      </span>
                      {simulation.overallScore && (
                              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2ECC71]/10 border border-[#2ECC71]/30">
                                <Trophy className="w-4 h-4 text-[#2ECC71]" />
                                <span className="text-sm font-bold text-[#2ECC71]">
                            {simulation.overallScore}%
                          </span>
                              </div>
                      )}
                    </div>
                  </div>
                      </motion.div>
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