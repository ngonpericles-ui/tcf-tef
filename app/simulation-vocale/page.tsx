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
      const freeAttemptsResponse = await fetch('http://localhost:3001/api/simulations/free-attempts/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`
        }
      });
      
      if (freeAttemptsResponse.ok) {
        const freeAttemptsData = await freeAttemptsResponse.json();
        
        if (freeAttemptsData.success && freeAttemptsData.data.remainingFreeAttempts > 0) {
          // User has free attempts - ALLOW ACCESS
          console.log('✅ Access granted: User has free attempts remaining', freeAttemptsData.data.remainingFreeAttempts);
          setSubscriptionTier('FREE_WITH_ATTEMPTS');
          setAccessGranted(true);
          setLoading(false);
          return;
        }
      }
      
      // STEP 2: If no free attempts, check REAL subscription from API (not userProfile)
      const subscriptionResponse = await fetch('http://localhost:3001/api/subscriptions/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`
        }
      });
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        
        if (subscriptionData.success && subscriptionData.data?.subscription) {
          const tier = subscriptionData.data.subscription.tier;
          setSubscriptionTier(tier);
          
          // Voice simulations require PREMIUM or PRO subscription
          if (tier === 'PREMIUM' || tier === 'PRO') {
            console.log('✅ Access granted: User has valid subscription', tier);
            setAccessGranted(true);
            setLoading(false);
            return;
          }
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
      
      const response = await fetch('/api/voice-simulation/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Simulations fetched:', {
          count: data.data?.length || 0,
          scheduled: (data.data || []).filter((s: VoiceSimulation) => s.status === 'SCHEDULED').length,
          completed: (data.data || []).filter((s: VoiceSimulation) => s.status === 'COMPLETED').length
        });
        setSimulations(data.data || []);
      } else {
        const contentType = response.headers.get('content-type');
        let errorData: any = {};
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            console.error('❌ Non-JSON error response:', text.substring(0, 200));
            errorData = { message: text.substring(0, 100) || 'Backend error' };
          }
        } catch (parseError) {
          console.error('❌ Error parsing error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ Error loading simulations:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        const errorMessage = errorData?.message || errorData?.error?.message || errorData?.error || t_('Erreur lors du chargement des simulations', 'Error loading simulations');
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
      const response = await fetch('/api/voice-simulation/monthly-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyCount(data.count || 0);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(147,51,234,0.1)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

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
                <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {t_("Simulation Orale", "Oral Simulation")}
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 dark:from-purple-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                {t_("Simulation Vocale avec IA", "AI Voice Simulation")}
            </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                  {t_(
                    "Pratiquez vos entretiens en français avec notre IA avancée. Entraînez-vous à parler, améliorez votre prononciation et recevez des retours détaillés pour exceller lors de vos examens et entretiens professionnels.",
                    "Practice your French interviews with our advanced AI. Train your speaking skills, improve your pronunciation, and receive detailed feedback to excel in your exams and professional interviews."
                  )}
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Mic, text: t_("Pratique Orale", "Speaking Practice"), desc: t_("Entretiens réalistes", "Realistic Interviews") },
                  { icon: MessageSquare, text: t_("Feedback IA", "AI Feedback"), desc: t_("Analyse détaillée", "Detailed Analysis") },
                  { icon: TrendingUp, text: t_("Progression", "Progress"), desc: t_("Suivi continu", "Continuous Tracking") }
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

              {/* CTA Button */}
              {accessGranted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <Button
                    onClick={() => router.push('/simulation-vocale/booking')}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {t_("Réserver une Simulation", "Book a Simulation")}
                  </Button>
            <Button
                    variant="outline"
                    onClick={() => router.push('/simulation-vocale/results')}
                    className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    size="lg"
            >
                    <Trophy className="w-5 h-5 mr-2" />
                    {t_("Voir les Résultats", "View Results")}
            </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Right Side: Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Visual Illustration - Interview/Conversation */}
              <div className="relative w-full max-w-md">
                {/* SVG Illustration */}
                <svg viewBox="0 0 400 350" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="175" r="130" fill="url(#gradient1)" opacity="0.1"/>
                  <circle cx="200" cy="175" r="90" fill="url(#gradient2)" opacity="0.15"/>
                  
                  {/* Person on left (Interviewer) */}
                  <circle cx="120" cy="140" r="25" fill="#8B5CF6" opacity="0.2"/>
                  <rect x="95" y="165" width="50" height="60" rx="25" fill="#8B5CF6" opacity="0.3"/>
                  
                  {/* Speech bubble left */}
                  <path d="M 80 100 Q 60 90 50 110 L 60 120 Q 70 115 80 120 Z" fill="#8B5CF6" opacity="0.2"/>
                  <circle cx="65" cy="85" r="8" fill="#8B5CF6" opacity="0.3"/>
                  <circle cx="55" cy="75" r="6" fill="#8B5CF6" opacity="0.3"/>
                  
                  {/* Microphone center */}
                  <rect x="185" y="120" width="8" height="50" rx="4" fill="#EC4899"/>
                  <ellipse cx="189" cy="120" rx="12" ry="8" fill="#EC4899"/>
                  <line x1="175" y1="130" x2="203" y2="130" stroke="#EC4899" strokeWidth="2" opacity="0.5"/>
                  <line x1="175" y1="140" x2="203" y2="140" stroke="#EC4899" strokeWidth="2" opacity="0.5"/>
                  
                  {/* Person on right (Student) */}
                  <circle cx="280" cy="140" r="25" fill="#06B6D4" opacity="0.2"/>
                  <rect x="255" y="165" width="50" height="60" rx="25" fill="#06B6D4" opacity="0.3"/>
                  
                  {/* Speech bubble right */}
                  <path d="M 320 100 Q 340 90 350 110 L 340 120 Q 330 115 320 120 Z" fill="#06B6D4" opacity="0.2"/>
                  <circle cx="335" cy="85" r="8" fill="#06B6D4" opacity="0.3"/>
                  <circle cx="345" cy="75" r="6" fill="#06B6D4" opacity="0.3"/>
                  
                  {/* Sound waves */}
                  <path d="M 200 100 Q 210 90 220 100 Q 210 110 200 100" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.4"/>
                  <path d="M 200 110 Q 215 95 230 110 Q 215 125 200 110" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.4"/>
                  <path d="M 200 120 Q 220 100 240 120 Q 220 140 200 120" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.4"/>
                  
                  {/* Conversation line */}
                  <line x1="150" y1="175" x2="250" y2="175" stroke="#6366F1" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"/>
                  
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6"/>
                      <stop offset="100%" stopColor="#EC4899"/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EC4899"/>
                      <stop offset="100%" stopColor="#06B6D4"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* How It Works - Simplified */}
              <div className="mt-8 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border-2 border-purple-100 dark:border-purple-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  {t_("Comment commencer", "How to Start")}
                </h3>
                <div className="space-y-3">
                  {[
                    { step: "1", icon: CalendarIcon, text: t_("Réservez votre session", "Book your session") },
                    { step: "2", icon: Mic, text: t_("Pratiquez à l'oral", "Practice speaking") },
                    { step: "3", icon: Trophy, text: t_("Recevez vos résultats", "Get your results") }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        {item.step}
          </div>
                      <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</span>
            </div>
                  ))}
            </div>
            </div>
            </motion.div>
          </div>
        </div>
      </div>

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

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t_("Vos Statistiques", "Your Statistics")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Utilisation mensuelle", "Monthly Usage")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {monthlyCount}/2
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t_("simulations utilisées", "simulations used")}
                    </p>
                </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full"
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-green-100 dark:border-green-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Terminées", "Completed")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      {simulations.filter(s => s.status === 'COMPLETED').length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t_("simulations terminées", "simulations completed")}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-yellow-100 dark:border-yellow-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Programmées", "Scheduled")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                    {simulations.filter(s => s.status === 'SCHEDULED').length}
                  </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t_("en attente", "pending")}
                    </p>
                </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-purple-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Score moyen", "Average Score")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {simulations.filter(s => s.overallScore).length > 0 
                        ? `${Math.round(simulations.filter(s => s.overallScore).reduce((acc, s) => acc + (s.overallScore || 0), 0) / simulations.filter(s => s.overallScore).length)}%`
                      : '--'
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {simulations.filter(s => s.overallScore).length > 0 
                        ? t_("basé sur vos résultats", "based on your results")
                        : t_("aucun score disponible", "no scores available")
                      }
                  </p>
                </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
              className="relative overflow-hidden cursor-pointer group border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/simulation-vocale/usage')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t_("Aperçu de l'utilisation", "Usage Overview")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Surveillez votre utilisation mensuelle des simulations, suivez vos progrès et consultez des analyses détaillées", 
                      "Monitor your monthly simulation usage, track your progress, and view detailed analytics")}
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
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
              className="relative overflow-hidden cursor-pointer group border-2 border-green-100 dark:border-green-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/simulation-vocale/voice')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {t_("Paramètres vocaux", "Voice Settings")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Choisissez votre voix préférée, accent et prévisualisez différentes options pour vos simulations", 
                      "Choose your preferred voice, accent, and preview different options for your simulations")}
                </p>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-semibold group-hover:gap-2 transition-all">
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
              className="relative overflow-hidden cursor-pointer group border-2 border-yellow-100 dark:border-yellow-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/simulation-vocale/booking')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  {t_("Réserver une simulation", "Book a Simulation")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Planifiez votre prochaine session de simulation vocale avec des options de réservation flexibles et des créneaux horaires", 
                      "Schedule your next voice simulation session with flexible booking options and time slots")}
                </p>
                <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 font-semibold group-hover:gap-2 transition-all">
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
              className="relative overflow-hidden cursor-pointer group border-2 border-purple-100 dark:border-purple-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/simulation-vocale/results')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {t_("Résultats et performance", "Results & Performance")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Analysez vos résultats de simulation, suivez les tendances d'amélioration et consultez des métriques de performance détaillées", 
                      "Analyze your simulation results, track improvement trends, and view detailed performance metrics")}
                </p>
                <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-2 transition-all">
                  {t_("Voir les résultats", "View Results")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>


        {/* Recent Activity - Enhanced */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center text-gray-900 dark:text-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t_("Activité récente", "Recent Activity")}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t_("Vos dernières simulations", "Your latest simulations")}
                  </p>
                </div>
              </div>
              {simulations.length > 5 && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  onClick={() => router.push('/simulation-vocale/usage')}
                >
                  {t_("Voir tout", "View All")}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
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
                        className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ${
                              simulation.status === 'COMPLETED' 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                                : simulation.status === 'SCHEDULED'
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                : simulation.status === 'ACTIVE'
                                ? 'bg-gradient-to-br from-yellow-500 to-amber-500'
                                : 'bg-gradient-to-br from-gray-400 to-gray-500'
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
                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  {formattedDate}
                        </div>
                                {formattedTime && (
                                  <>
                                    <span className="text-gray-400">•</span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {formattedTime}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                  <Volume2 className="w-4 h-4" />
                                  <span>
                                    {simulation.voicePreference === 'MALE' 
                                      ? t_('Voix masculine', 'Male voice')
                                      : t_('Voix féminine', 'Female voice')}
                                  </span>
                                </div>
                                {simulation.duration && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                      <Clock className="w-4 h-4" />
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
                              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
                                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
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
          </CardContent>
        </Card>
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