'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plane,
  Globe,
  FileText,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Crown,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Award,
  Target,
  BookOpen,
  Brain,
  Shield,
  MapPin,
  Building2,
  Briefcase,
  Info,
  BarChart3,
  Trophy,
  History,
  Settings,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface ImmigrationSimulation {
  id: string;
  country: string;
  category: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  score?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
  culturalContext?: string;
  requirements?: string[];
  documents?: string[];
}

function ImmigrationPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();

  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [simulations, setSimulations] = useState<ImmigrationSimulation[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('FREE');
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (userProfile) {
      checkSubscriptionAccess();
      setHasCheckedAccess(true);
    }
  }, [userProfile]);

  useEffect(() => {
    if (hasCheckedAccess && accessGranted) {
      fetchSimulations();
      fetchMonthlyCount();
    } else {
      setLoading(false);
    }
  }, [hasCheckedAccess, accessGranted]);

  const checkSubscriptionAccess = async () => {
    try {
      const freeAttemptsResponse = await fetch('http://localhost:3001/api/simulations/free-attempts/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`
        }
      });
      
      if (freeAttemptsResponse.ok) {
        const freeAttemptsData = await freeAttemptsResponse.json();
        
        if (freeAttemptsData.success && freeAttemptsData.data.remainingFreeAttempts > 0) {
          console.log('✅ Access granted: User has free attempts remaining');
          setSubscriptionTier('FREE_WITH_ATTEMPTS');
          setAccessGranted(true);
          return;
        }
      }
      
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
          
          if (tier === 'PRO') {
            console.log('✅ Access granted: User has PRO subscription');
            setAccessGranted(true);
            return;
          }
        }
      }
      
      console.log('❌ Access denied: No free attempts and no PRO subscription');
      setAccessGranted(false);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setAccessGranted(false);
    }
  };

  const fetchSimulations = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ No valid token found');
        toast.error(t_('Veuillez vous connecter', 'Please log in'));
        router.push('/login');
        return;
      }

      const response = await fetch('/api/immigration-simulation/history/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimulations(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.message || errorData?.error || t_('Erreur lors du chargement des simulations', 'Error loading simulations'));
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyCount = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) return;

      const response = await fetch('/api/immigration-simulation/monthly-count/user', {
        headers: {
          'Authorization': `Bearer ${token}`
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
      'SCHEDULED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'ACTIVE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-4 w-4" />;
      case 'ACTIVE': return <Target className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
      {/* Enhanced Hero Section - Matching Voice Simulation Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
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
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
              >
                <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {t_("Simulation d'Immigration", "Immigration Simulation")}
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
                {t_("Simulations d'Immigration", "Immigration Simulations")}
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                {t_(
                  "Préparez-vous pour votre nouvelle vie avec nos simulations d'immigration réalistes. Maîtrisez les questions spécifiques à chaque pays, comprenez les exigences culturelles, et naviguez dans les processus d'immigration avec confiance.",
                  "Prepare for your new life with our realistic immigration simulations. Master country-specific questions, understand cultural requirements, and navigate immigration processes with confidence."
                )}
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Globe, text: t_("Questions par pays", "Country Questions"), desc: t_("Adaptées à chaque pays", "Adapted to each country") },
                  { icon: Brain, text: t_("Adaptation culturelle", "Cultural Adaptation"), desc: t_("Compréhension approfondie", "Deep understanding") },
                  { icon: Shield, text: t_("Processus sécurisé", "Secure Process"), desc: t_("Guide complet", "Complete guide") }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                  >
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                    onClick={() => router.push('/immigration-simulations/questions')}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {t_("Commencer la simulation", "Start Simulation")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/immigration-simulations/cultural')}
                    className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    size="lg"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    {t_("Explorer les pays", "Explore Countries")}
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
              {/* Visual Illustration - Airplane/Globe */}
              <div className="relative w-full max-w-md">
                {/* SVG Illustration */}
                <svg viewBox="0 0 400 350" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="175" r="130" fill="url(#gradient1)" opacity="0.1"/>
                  <circle cx="200" cy="175" r="90" fill="url(#gradient2)" opacity="0.15"/>
                  
                  {/* Globe/World Map */}
                  <circle cx="200" cy="150" r="80" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.3"/>
                  <circle cx="200" cy="150" r="70" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.2"/>
                  
                  {/* Continents/Regions */}
                  <path d="M 160 130 Q 180 120 200 130 Q 220 120 240 130 Q 230 140 220 150 Q 210 155 200 150 Q 190 155 180 150 Q 170 140 160 130" fill="#60A5FA" opacity="0.3"/>
                  <path d="M 140 170 Q 160 160 180 170 Q 200 175 220 170 Q 240 160 260 170 Q 250 190 230 200 Q 210 195 200 190 Q 190 195 170 200 Q 150 190 140 170" fill="#3B82F6" opacity="0.3"/>
                  <path d="M 180 210 Q 200 205 220 210 Q 230 220 220 230 Q 210 235 200 230 Q 190 235 180 230 Q 170 220 180 210" fill="#2563EB" opacity="0.3"/>
                  
                  {/* Airplane */}
                  <g transform="translate(200, 200) rotate(45)">
                    {/* Plane body */}
                    <ellipse cx="0" cy="0" rx="50" ry="15" fill="#3B82F6" opacity="0.9"/>
                    {/* Plane wings */}
                    <ellipse cx="-20" cy="8" rx="30" ry="12" fill="#2563EB" opacity="0.8"/>
                    <ellipse cx="-20" cy="-8" rx="30" ry="12" fill="#2563EB" opacity="0.8"/>
                    {/* Plane tail */}
                    <path d="M -40 -3 L -50 -10 L -40 -18 Z" fill="#1E40AF" opacity="0.9"/>
                    {/* Windows */}
                    <circle cx="-15" cy="0" r="2" fill="#E0F2FE"/>
                    <circle cx="-5" cy="0" r="2" fill="#E0F2FE"/>
                    <circle cx="5" cy="0" r="2" fill="#E0F2FE"/>
                  </g>
                  
                  {/* Flight path/route */}
                  <path d="M 150 120 Q 180 140 210 160 Q 230 175 250 190" stroke="#10B981" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" fill="none"/>
                  
                  {/* Country markers */}
                  <circle cx="150" cy="120" r="4" fill="#10B981"/>
                  <circle cx="250" cy="190" r="4" fill="#10B981"/>
                  <circle cx="180" cy="140" r="3" fill="#F59E0B"/>
                  <circle cx="220" cy="170" r="3" fill="#F59E0B"/>
                  
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

              {/* How It Works - Simplified */}
              <div className="mt-8 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border-2 border-blue-100 dark:border-blue-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  {t_("Comment commencer", "How to Start")}
                </h3>
                <div className="space-y-3">
                  {[
                    { step: "1", icon: BookOpen, text: t_("Choisissez votre pays", "Choose your country") },
                    { step: "2", icon: Brain, text: t_("Répondez aux questions", "Answer questions") },
                    { step: "3", icon: Trophy, text: t_("Recevez vos résultats", "Get your results") }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

        {/* Free Attempts Info */}
        {accessGranted && subscriptionTier === 'FREE_WITH_ATTEMPTS' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">{t_('Accès avec simulations gratuites', 'Access with free simulations')}</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t_('Vous utilisez actuellement vos simulations gratuites. Passez à Premium ou Pro pour un accès illimité.', 'You are currently using your free simulations. Upgrade to Premium or Pro for unlimited access.')}
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
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">{t_('Limite mensuelle atteinte', 'Monthly limit reached')}</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {t_('Vous avez utilisé toutes vos 2 simulations ce mois-ci. Passez à la version PRO pour un accès illimité.', 'You have used all your 2 simulations this month. Upgrade to PRO for unlimited access.')}
                </p>
                <Button
                  size="sm" 
                  className="mt-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  onClick={() => router.push('/abonnement')}
                >
                  {t_('Passer à PRO', 'Upgrade to PRO')}
                </Button>
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

        {/* Enhanced Stats Cards - Single Blue Accent */}
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
                    <Plane className="w-7 h-7 text-white" />
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Terminées", "Completed")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {simulations.filter(s => s.status === 'COMPLETED').length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t_("simulations terminées", "simulations completed")}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Countries Explored Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Pays explorés", "Countries Explored")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {new Set(simulations.map(s => s.country)).size}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t_("pays différents", "different countries")}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-7 h-7 text-white" />
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
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t_("Score moyen", "Average Score")}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {simulations.filter(s => s.score).length > 0 
                        ? `${Math.round(simulations.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / simulations.filter(s => s.score).length)}%`
                        : '--'
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {simulations.filter(s => s.score).length > 0 
                        ? t_("basé sur vos résultats", "based on your results")
                        : t_("aucun score disponible", "no scores available")
                      }
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-7 h-7 text-white" />
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
            {t_("Gérez vos simulations et explorez les fonctionnalités", "Manage your simulations and explore features")}
          </p>
        </div>

        {/* Enhanced Navigation Cards - Single Blue Accent */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Questions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/immigration-simulations/questions')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t_("Questions d'immigration", "Immigration Questions")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Pratiquez avec des questions spécifiques à chaque pays et adaptées à votre situation", "Practice with country-specific questions adapted to your situation")}
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                  {t_("Commencer", "Start")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cultural Context Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/immigration-simulations/cultural')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t_("Contexte culturel", "Cultural Context")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Apprenez les nuances culturelles et les attentes sociales de votre pays de destination", "Learn cultural nuances and social expectations of your destination country")}
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                  {t_("Explorer", "Explore")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Documents Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/immigration-simulations/documents')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t_("Agents d'immigration", "Immigration Agents")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Vérifiez et organisez tous les documents nécessaires pour votre dossier d'immigration", "Check and organize all necessary documents for your immigration file")}
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                  {t_("Vérifier", "Check")}
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
              className="relative overflow-hidden cursor-pointer group border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80 h-full" 
              onClick={() => router.push('/immigration-simulations/results')}
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
                  {t_("Résultats et Performance", "Results and Performance")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                  {t_("Consultez vos résultats détaillés, analysez vos performances et suivez vos progrès", "Review your detailed results, analyze your performance and track your progress")}
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                  {t_("Voir les résultats", "View Results")}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity - Matching Voice Simulation Style */}
        <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-100 dark:border-blue-900">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>{t_("Activité récente", "Recent Activity")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {simulations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-100 dark:border-blue-900">
                  <Plane className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t_("Aucune simulation pour le moment", "No simulations yet")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {t_("Commencez votre première simulation d'immigration pour explorer votre nouveau pays", "Start your first immigration simulation to explore your new country")}
                </p>
                {accessGranted && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => router.push('/immigration-simulations/questions')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t_("Commencer une simulation", "Start a Simulation")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {simulations
                  .filter((sim) => {
                    const dateStr = sim.createdAt;
                    const createdDate = new Date(dateStr);
                    return dateStr && !isNaN(createdDate.getTime());
                  })
                  .slice(0, 5)
                  .map((simulation, idx) => {
                    const dateStr = simulation.createdAt;
                    const createdDate = new Date(dateStr);
                    const formattedDate = createdDate.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    const formattedTime = createdDate.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <motion.div
                        key={simulation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => router.push(`/immigration-simulations/${simulation.id}`)}
                      >
                        <div className="p-5 flex items-center justify-between">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ${
                            simulation.status === 'COMPLETED' 
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                              : simulation.status === 'SCHEDULED'
                              ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                              : simulation.status === 'ACTIVE'
                              ? 'bg-gradient-to-br from-amber-400 to-amber-500'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {simulation.status === 'COMPLETED' ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : simulation.status === 'SCHEDULED' ? (
                              <Clock className="w-6 h-6 text-white" />
                            ) : simulation.status === 'ACTIVE' ? (
                              <Target className="w-6 h-6 text-white" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-white" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 ml-4">
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
                                <Globe className="w-4 h-4" />
                                <span>{simulation.country} - {simulation.category}</span>
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

                          {/* Status and Score */}
                          <div className="flex items-center gap-3 ml-4">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(simulation.status)} flex items-center gap-1.5`}
                            >
                              {getStatusIcon(simulation.status)}
                              <span>
                                {simulation.status === 'SCHEDULED' ? t_('Programmée', 'Scheduled') : 
                                 simulation.status === 'ACTIVE' ? t_('Active', 'Active') :
                                 simulation.status === 'COMPLETED' ? t_('Terminée', 'Completed') : t_('Annulée', 'Cancelled')}
                              </span>
                            </Badge>
                            {simulation.score && (
                              <div className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {simulation.score}%
                                </span>
                              </div>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                {simulations.length > 5 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Button
                      variant="ghost"
                      className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      onClick={() => router.push('/immigration-simulations/history')}
                    >
                      {t_("Voir toute l'activité", "View All Activity")}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ImmigrationPage() {
  return (
    <SharedDataProvider>
      <ImmigrationPageContent />
    </SharedDataProvider>
  );
}
