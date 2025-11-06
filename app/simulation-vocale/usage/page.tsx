'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  BarChart3,
  History,
  Mic,
  AlertTriangle,
  Info,
  Crown,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  RefreshCw,
  CheckCircle,
  Trophy,
  Volume2,
  ArrowRight
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

function UsagePageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  // Helper function for translations
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upgradePrompt, setUpgradePrompt] = useState(false);

  useEffect(() => {
    fetchSimulations();
    fetchMonthlyCount();
  }, []);

  const fetchSimulations = async () => {
    try {
      const response = await fetch('/api/voice-simulation/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimulations(data.data || []);
      } else {
        toast.error('Error loading simulations');
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error('Connection error');
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

  const handleUpgradePrompt = () => {
    setUpgradePrompt(true);
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
      case 'CANCELLED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced Hero Section */}
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
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {t_("Statistiques et Analyses", "Statistics & Analytics")}
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
                {t_("Aperçu de l'Utilisation", "Usage Overview")}
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                {t_(
                  "Suivez votre progression et votre utilisation des simulations vocales. Analysez vos performances, consultez votre historique complet et gérez efficacement vos limites mensuelles pour optimiser votre apprentissage.",
                  "Track your progress and voice simulation usage. Analyze your performance, view your complete history, and efficiently manage your monthly limits to optimize your learning."
                )}
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: BarChart3, text: t_("Statistiques", "Statistics"), desc: t_("Données détaillées", "Detailed Data") },
                  { icon: History, text: t_("Historique", "History"), desc: t_("Toutes vos sessions", "All Your Sessions") },
                  { icon: Target, text: t_("Objectifs", "Goals"), desc: t_("Suivi de progression", "Progress Tracking") }
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
            </motion.div>

            {/* Right Side: Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Visual Illustration - Analytics/Charts */}
              <div className="relative w-full max-w-md">
                {/* SVG Illustration */}
                <svg viewBox="0 0 400 300" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="150" r="120" fill="url(#usageGradient1)" opacity="0.1"/>
                  <circle cx="200" cy="150" r="80" fill="url(#usageGradient2)" opacity="0.15"/>
                  
                  {/* Chart bars */}
                  <rect x="100" y="100" width="30" height="100" rx="4" fill="#3B82F6" opacity="0.6"/>
                  <rect x="150" y="80" width="30" height="120" rx="4" fill="#6366F1" opacity="0.7"/>
                  <rect x="200" y="60" width="30" height="140" rx="4" fill="#8B5CF6" opacity="0.8"/>
                  <rect x="250" y="90" width="30" height="110" rx="4" fill="#EC4899" opacity="0.6"/>
                  
                  {/* Chart line */}
                  <path d="M 115 170 Q 165 150 185 130 Q 205 110 235 140" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.7"/>
                  <circle cx="115" cy="170" r="4" fill="#10B981"/>
                  <circle cx="185" cy="130" r="4" fill="#10B981"/>
                  <circle cx="235" cy="140" r="4" fill="#10B981"/>
                  
                  {/* Analytics icons */}
                  <circle cx="120" cy="60" r="15" fill="#3B82F6" opacity="0.2"/>
                  <circle cx="280" cy="80" r="15" fill="#EC4899" opacity="0.2"/>
                  <circle cx="280" cy="220" r="15" fill="#10B981" opacity="0.2"/>
                  
                  <defs>
                    <linearGradient id="usageGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6"/>
                      <stop offset="100%" stopColor="#6366F1"/>
                    </linearGradient>
                    <linearGradient id="usageGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1"/>
                      <stop offset="100%" stopColor="#EC4899"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alerts */}
        {monthlyCount >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">{t_("Limite mensuelle atteinte", "Monthly limit reached")}</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {t_("Vous avez utilisé toutes vos 2 simulations ce mois-ci. Passez à la version PRO pour un accès illimité.", 
                      "You have used all 2 of your simulations this month. Upgrade to PRO for unlimited access.")}
                </p>
                <Button 
                  size="sm" 
                  className="mt-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  onClick={() => router.push('/abonnement')}
                >
                  {t_("Passer à PRO", "Upgrade to PRO")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {monthlyCount === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl"
          >
            <div className="flex items-start">
              <Info className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">{t_("1 simulation restante", "1 simulation remaining")}</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t_("Planifiez votre prochaine session avec sagesse.", "Plan your next session wisely.")}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Usage Overview */}
        <Card className="mb-8 shadow-lg border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-800/80">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t_("Aperçu de l'utilisation", "Usage Overview")}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Used Simulations */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-xl border-2 border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                  {monthlyCount}/2
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {t_("Simulations utilisées", "Simulations Used")}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((monthlyCount / 2) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </motion.div>

              {/* Remaining */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-xl border-2 border-green-100 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
                  {2 - monthlyCount}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t_("Restantes", "Remaining")}
                </div>
              </motion.div>

              {/* Days Until Reset */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-xl border-2 border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                  {getDaysUntilReset()}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t_("Jours jusqu'au reset", "Days Until Reset")}
                </div>
              </motion.div>

              {/* Completed */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden rounded-xl border-2 border-yellow-100 dark:border-yellow-900/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
                  {simulations.filter(s => s.status === 'COMPLETED').length}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t_("Terminées", "Completed")}
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Usage History */}
        <Card className="shadow-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800/80">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t_("Historique des Simulations", "Simulation History")}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t_("Toutes vos sessions de simulation", "All your simulation sessions")}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {simulations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t_("Aucune simulation pour le moment", "No simulations yet")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {t_("Commencez votre parcours en réservant votre première simulation vocale", 
                      "Start your journey by booking your first voice simulation")}
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  onClick={() => router.push('/simulation-vocale/booking')}
                  size="lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t_("Réserver une simulation", "Book a Simulation")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {simulations
                  .filter((sim) => {
                    const scheduledDate = sim.scheduledDate ? new Date(sim.scheduledDate) : null;
                    const createdDate = sim.createdAt ? new Date(sim.createdAt) : null;
                    return (scheduledDate && !isNaN(scheduledDate.getTime())) || 
                           (createdDate && !isNaN(createdDate.getTime()));
                  })
                  .map((simulation, idx) => {
                    const dateStr = simulation.scheduledDate || simulation.createdAt;
                    const date = dateStr ? new Date(dateStr) : new Date();
                    const isValidDate = !isNaN(date.getTime());
                    
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
                        transition={{ delay: idx * 0.05 }}
                        className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
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

                          <div className="flex items-center gap-3 ml-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                              getStatusColor(simulation.status)
                            }`}>
                              {getStatusIcon(simulation.status)}
                              {statusLabel}
                            </span>
                            {simulation.overallScore && (
                              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800">
                                <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
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

        {/* Enhanced Performance Trends */}
        {simulations.filter(s => s.overallScore).length > 0 && (
          <Card className="mt-8 shadow-lg border-2 border-purple-100 dark:border-purple-900/50 dark:bg-gray-800/80">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t_("Tendances de Performance", "Performance Trends")}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t_("Analysez votre progression dans le temps", "Analyze your progress over time")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-100 dark:border-green-900/50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
                    {Math.round(simulations.filter(s => s.overallScore).reduce((acc, s) => acc + (s.overallScore || 0), 0) / simulations.filter(s => s.overallScore).length)}%
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t_("Score moyen", "Average Score")}</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-100 dark:border-blue-900/50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
                    {simulations.filter(s => s.overallScore).length}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t_("Sessions terminées", "Completed Sessions")}</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-100 dark:border-purple-900/50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                    {simulations.filter(s => s.status === 'SCHEDULED').length}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t_("Sessions à venir", "Upcoming Sessions")}</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function UsagePage() {
  return (
    <SharedDataProvider>
      <UsagePageContent />
    </SharedDataProvider>
  );
}
