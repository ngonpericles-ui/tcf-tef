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
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Download,
  Share2,
  Star,
  Award,
  Clock,
  AlertTriangle,
  Info,
  Crown,
  CheckCircle,
  Sparkles,
  Zap,
  MessageSquare,
  BookOpen,
  Brain,
  Users,
  Plus,
  Plane,
  Globe,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface AIFeedback {
  id: string;
  aiScore: number | null;
  aiConfidence: number | null;
  overallFeedback: string | null;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  status: string;
  createdAt: string;
  humanScore?: number | null;
  humanFeedback?: string | null;
}

interface ImmigrationSimulation {
  id: string;
  country: string;
  immigrationType: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  score?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
  scheduledDate?: string;
  voicePreference?: string;
  aiFeedbacks?: AIFeedback[];
}

interface PerformanceData {
  averageScore: number;
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  improvement: number;
  bestScore: number;
  worstScore: number;
  streak: number;
}

function ResultsPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationId = searchParams?.get('id');

  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [currentSimulation, setCurrentSimulation] = useState<ImmigrationSimulation | null>(null);
  const [simulations, setSimulations] = useState<ImmigrationSimulation[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (simulationId) {
      fetchSpecificSimulation(simulationId);
    } else {
      fetchSimulations();
    }
  }, [simulationId]);

  const fetchSpecificSimulation = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ No valid token found in localStorage');
        toast.error(t_('Veuillez vous connecter', 'Please log in'));
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/immigration-simulation/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Simulation fetched:', {
          id: data.data?.id,
          hasFeedback: data.data?.aiFeedbacks?.length > 0,
          feedbackCount: data.data?.aiFeedbacks?.length || 0
        });
        setCurrentSimulation(data.data);
        
        // Also fetch all simulations for performance overview
        fetchSimulations();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error fetching simulation:', {
          status: response.status,
          error: errorData
        });
        toast.error(errorData?.message || errorData?.error || t_('Simulation non trouvée', 'Simulation not found'));
        if (response.status === 404) {
          router.push('/immigration-simulations');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching simulation:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSimulations = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ No valid token found in localStorage');
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
        const completedSimulations = (data.data || []).filter((s: ImmigrationSimulation) => s.status === 'COMPLETED');
        console.log('✅ Completed simulations fetched:', {
          count: completedSimulations.length,
          withFeedback: completedSimulations.filter((s: ImmigrationSimulation) => s.aiFeedbacks && s.aiFeedbacks.length > 0).length
        });
        setSimulations(completedSimulations);
        calculatePerformanceData(completedSimulations);
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
        
        console.error('❌ Error loading results:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        const errorMessage = errorData?.message || errorData?.error?.message || errorData?.error || t_('Erreur lors du chargement', 'Error loading results');
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error fetching simulations:', error);
      toast.error(t_('Erreur de connexion', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceData = (simulations: ImmigrationSimulation[]) => {
    if (simulations.length === 0) {
      setPerformanceData({
        averageScore: 0,
        totalSessions: 0,
        completedSessions: 0,
        scheduledSessions: 0,
        improvement: 0,
        bestScore: 0,
        worstScore: 0,
        streak: 0
      });
      return;
    }

    const scores = simulations.map(s => s.score || 0).filter(s => s > 0);
    if (scores.length === 0) {
      setPerformanceData({
        averageScore: 0,
        totalSessions: simulations.length,
        completedSessions: simulations.length,
        scheduledSessions: 0,
        improvement: 0,
        bestScore: 0,
        worstScore: 0,
        streak: 0
      });
      return;
    }

    const averageScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // Calculate improvement (compare first half vs second half)
    const midPoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midPoint);
    const secondHalf = scores.slice(midPoint);
    const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((acc, score) => acc + score, 0) / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((acc, score) => acc + score, 0) / secondHalf.length : 0;
    const improvement = secondHalfAvg - firstHalfAvg;

    // Calculate streak (consecutive completed sessions)
    let streak = 0;
    for (let i = simulations.length - 1; i >= 0; i--) {
      if (simulations[i].status === 'COMPLETED' && (simulations[i].score || 0) > 0) {
        streak++;
      } else {
        break;
      }
    }

    setPerformanceData({
      averageScore: Math.round(averageScore),
      totalSessions: simulations.length,
      completedSessions: simulations.filter(s => s.status === 'COMPLETED').length,
      scheduledSessions: simulations.filter(s => s.status === 'SCHEDULED').length,
      improvement: Math.round(improvement),
      bestScore,
      worstScore,
      streak
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t_('Chargement des résultats...', 'Loading results...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section - Adapted from Voice Simulation */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm mb-6"
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                {t_('Résultats d\'Immigration', 'Immigration Results')}
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                {t_(
                  'Analysez vos performances et suivez vos progrès en temps réel. Consultez vos scores détaillés, identifiez vos points d\'amélioration et célébrez vos réussites pour votre entretien d\'immigration.',
                  'Analyze your performance and track your progress in real-time. Review your detailed scores, identify areas for improvement, and celebrate your achievements for your immigration interview.'
                )}
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <BarChart3 className="w-4 h-4" />
                  <span>{t_('Scores détaillés', 'Detailed scores')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t_('Progrès visuels', 'Visual progress')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Target className="w-4 h-4" />
                  <span>{t_('Analyse par pays', 'Country analysis')}</span>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Visual Illustration - Immigration themed */}
              <div className="relative w-full max-w-md">
                <svg viewBox="0 0 400 350" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="175" r="130" fill="url(#gradientImmigration1)" opacity="0.1"/>
                  <circle cx="200" cy="175" r="90" fill="url(#gradientImmigration2)" opacity="0.15"/>
                  
                  {/* Globe with countries */}
                  <circle cx="200" cy="140" r="80" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.4"/>
                  <path d="M 120 140 Q 160 120 200 140 Q 240 120 280 140 Q 270 160 250 180 Q 200 170 150 180 Q 130 160 120 140" fill="#3B82F6" opacity="0.3"/>
                  
                  {/* Airplane */}
                  <g transform="translate(200, 200) rotate(30)">
                    <ellipse cx="0" cy="0" rx="50" ry="15" fill="#60A5FA" opacity="0.9"/>
                    <ellipse cx="-20" cy="8" rx="30" ry="12" fill="#3B82F6" opacity="0.8"/>
                    <ellipse cx="-20" cy="-8" rx="30" ry="12" fill="#3B82F6" opacity="0.8"/>
                    <path d="M -40 -5 L -50 -10 L -40 -18 Z" fill="#2563EB" opacity="0.9"/>
                    <circle cx="-15" cy="0" r="2" fill="#E0F2FE"/>
                    <circle cx="-5" cy="0" r="2" fill="#E0F2FE"/>
                    <circle cx="5" cy="0" r="2" fill="#E0F2FE"/>
                  </g>
                  
                  {/* Chart/Trophy */}
                  <rect x="100" y="250" width="30" height="60" rx="5" fill="#FBBF24" opacity="0.8"/>
                  <ellipse cx="115" cy="250" rx="20" ry="25" fill="#FBBF24" opacity="0.8"/>
                  <rect x="280" y="230" width="25" height="80" rx="5" fill="#10B981" opacity="0.6"/>
                  <rect x="320" y="240" width="25" height="70" rx="5" fill="#3B82F6" opacity="0.6"/>
                  <rect x="360" y="250" width="25" height="60" rx="5" fill="#EC4899" opacity="0.6"/>
                  
                  {/* Checkmark/Document */}
                  <rect x="80" y="280" width="40" height="50" rx="8" fill="white" stroke="#3B82F6" strokeWidth="2" opacity="0.9"/>
                  <circle cx="100" cy="305" r="8" fill="#10B981"/>
                  <path d="M 96 305 L 99 308 L 104 303" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  
                  {/* Sparkles */}
                  <circle cx="150" cy="100" r="4" fill="#FBBF24" opacity="0.8" className="animate-pulse"/>
                  <circle cx="280" cy="110" r="3" fill="#3B82F6" opacity="0.8" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
                  <circle cx="140" cy="280" r="3" fill="#EC4899" opacity="0.8" className="animate-pulse" style={{animationDelay: '1s'}}/>
                  
                  <defs>
                    <linearGradient id="gradientImmigration1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                    <linearGradient id="gradientImmigration2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Performance Overview Section */}
        {performanceData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    {t_('Aperçu des Performances', 'Performance Overview')}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(t_('Fonctionnalité à venir', 'Feature coming soon'))}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t_('Télécharger', 'Download')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(t_('Fonctionnalité à venir', 'Feature coming soon'))}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {t_('Partager', 'Share')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Average Score Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8 opacity-80" />
                        <Sparkles className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{performanceData.averageScore}%</div>
                      <div className="text-blue-100 text-sm">{t_('Score Moyen', 'Average Score')}</div>
                      <Progress 
                        value={performanceData.averageScore} 
                        className="mt-4 h-2 bg-white/20"
                      />
                    </div>
                  </motion.div>

                  {/* Completed Sessions Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <CheckCircle className="w-8 h-8 opacity-80" />
                        <Zap className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{performanceData.completedSessions}</div>
                      <div className="text-indigo-100 text-sm">{t_('Simulations Complétées', 'Completed Sessions')}</div>
                    </div>
                  </motion.div>

                  {/* Best Score Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <Trophy className="w-8 h-8 opacity-80" />
                        <Star className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{performanceData.bestScore}%</div>
                      <div className="text-green-100 text-sm">{t_('Meilleur Score', 'Best Score')}</div>
                    </div>
                  </motion.div>

                  {/* Current Streak Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 p-6 text-white shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <Award className="w-8 h-8 opacity-80" />
                        <Sparkles className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{performanceData.streak}</div>
                      <div className="text-orange-100 text-sm">{t_('Série Actuelle', 'Current Streak')}</div>
                    </div>
                  </motion.div>
                </div>

                {/* Improvement Indicator */}
                {performanceData.improvement !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-3">
                      {performanceData.improvement > 0 ? (
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {performanceData.improvement > 0 
                          ? t_(
                              `Amélioration de ${Math.abs(performanceData.improvement)}% 🎉`,
                              `Improving by ${Math.abs(performanceData.improvement)}% 🎉`
                            )
                          : t_(
                              `Diminution de ${Math.abs(performanceData.improvement)}% 📉`,
                              `Declining by ${Math.abs(performanceData.improvement)}% 📉`
                            )
                        }
                      </span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Detailed Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                {t_('Résultats Détaillés', 'Detailed Results')}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t_('Consultez vos simulations d\'immigration et scores détaillés', 'Review your immigration simulations and detailed scores')}
              </p>
            </CardHeader>
            <CardContent>
              {currentSimulation || (simulations.length > 0 ? simulations[0] : null) ? (
                <div className="space-y-6">
                  {/* Current/Latest Simulation Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800"
                  >
                    {(() => {
                      const displaySimulation = currentSimulation || simulations[0];
                      
                      return (
                        <>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${displaySimulation.score ? 'from-blue-500 to-indigo-600' : 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-lg`}>
                                <Trophy className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t_('Simulation d\'Immigration', 'Immigration Simulation')}
                                  </h3>
                                  {displaySimulation.score && (
                                    <Badge className={displaySimulation.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : displaySimulation.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}>
                                      {displaySimulation.score}%
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {displaySimulation.country || t_('Non spécifié', 'Not specified')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    {displaySimulation.immigrationType || t_('Non spécifié', 'Not specified')}
                                  </div>
                                  {displaySimulation.scheduledDate && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {new Date(displaySimulation.scheduledDate).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                  {displaySimulation.duration && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {Math.floor(displaySimulation.duration / 60)} {t_('minutes', 'minutes')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Overall Score Visual */}
                          {displaySimulation.score && (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t_('Score Global', 'Overall Score')}
                                </span>
                                <span className={`text-2xl font-bold ${displaySimulation.score >= 80 ? 'text-green-600 dark:text-green-400' : displaySimulation.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {displaySimulation.score}%
                                </span>
                              </div>
                              <Progress 
                                value={displaySimulation.score} 
                                className="h-3"
                              />
                            </div>
                          )}

                          {/* Feedback */}
                          {displaySimulation.feedback && (
                            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <AlertDescription className="text-gray-800 dark:text-gray-200">
                                <div className="font-semibold mb-2">{t_('Commentaires', 'Feedback')}:</div>
                                <div className="whitespace-pre-wrap">{displaySimulation.feedback}</div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* AI Feedback */}
                          {displaySimulation.aiFeedbacks && displaySimulation.aiFeedbacks.length > 0 && (
                            <div className="mt-6 space-y-4">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                {t_('Retour IA', 'AI Feedback')}
                              </h4>
                              {displaySimulation.aiFeedbacks.map((feedback: AIFeedback, idx: number) => (
                                <div key={feedback.id || idx} className="space-y-4">
                                  {feedback.overallFeedback && (
                                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <AlertDescription className="text-gray-800 dark:text-gray-200">
                                        <div className="font-semibold mb-2">{t_('Analyse Globale', 'Overall Analysis')}:</div>
                                        <div className="whitespace-pre-wrap">{feedback.overallFeedback || t_('Aucun commentaire disponible', 'No feedback available')}</div>
                                        {feedback.aiConfidence !== null && feedback.aiConfidence !== undefined && (
                                          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                            {t_('Confiance IA', 'AI Confidence')}: {Math.round((feedback.aiConfidence || 0) * 100)}%
                                          </div>
                                        )}
                                        {feedback.aiScore !== null && feedback.aiScore !== undefined && (
                                          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                            {t_('Score IA', 'AI Score')}: {Math.round(feedback.aiScore)}
                                          </div>
                                        )}
                                        {feedback.humanScore !== null && feedback.humanScore !== undefined && (
                                          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                            {t_('Score Expert', 'Expert Score')}: {Math.round(feedback.humanScore)}
                                          </div>
                                        )}
                                        {feedback.humanFeedback && (
                                          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                            <div className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                                              {t_('Feedback Expert', 'Expert Feedback')}:
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">{feedback.humanFeedback}</div>
                                          </div>
                                        )}
                                      </AlertDescription>
                                    </Alert>
                                  )}

                                  {feedback.strengths && feedback.strengths.length > 0 && (
                                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <span className="font-semibold text-green-800 dark:text-green-300">
                                          {t_('Points Forts', 'Strengths')}
                                        </span>
                                      </div>
                                      <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
                                        {(Array.isArray(feedback.strengths) ? feedback.strengths : [feedback.strengths]).map((strength: string, sIdx: number) => (
                                          <li key={sIdx}>{strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                                          {t_('Points à Améliorer', 'Areas for Improvement')}
                                        </span>
                                      </div>
                                      <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                                        {(Array.isArray(feedback.weaknesses) ? feedback.weaknesses : [feedback.weaknesses]).map((weakness: string, wIdx: number) => (
                                          <li key={wIdx}>{weakness}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {feedback.recommendations && feedback.recommendations.length > 0 && (
                                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span className="font-semibold text-blue-800 dark:text-blue-300">
                                          {t_('Recommandations', 'Recommendations')}
                                        </span>
                                      </div>
                                      <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                                        {(Array.isArray(feedback.recommendations) ? feedback.recommendations : [feedback.recommendations]).map((rec: string, rIdx: number) => (
                                          <li key={rIdx}>{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </motion.div>

                  {/* Other Simulations List */}
                  {simulations.length > 1 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        {t_('Historique des Simulations', 'Simulation History')}
                      </h3>
                      <div className="space-y-4">
                        {simulations.slice(1).map((simulation, index) => (
                          <motion.div
                            key={simulation.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/immigration-simulations/results?id=${simulation.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${simulation.score ? 'from-blue-500 to-indigo-600' : 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                                  <Plane className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {simulation.scheduledDate 
                                      ? new Date(simulation.scheduledDate).toLocaleDateString('fr-FR', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })
                                      : simulation.createdAt
                                      ? new Date(simulation.createdAt).toLocaleDateString('fr-FR', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })
                                      : t_('Date inconnue', 'Unknown date')
                                    }
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    {simulation.country || t_('Pays non spécifié', 'Country not specified')}
                                    <span className="text-gray-400">•</span>
                                    <BookOpen className="w-3 h-3" />
                                    {simulation.immigrationType || t_('Type non spécifié', 'Type not specified')}
                                  </div>
                                </div>
                              </div>
                              {simulation.score && (
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${simulation.score >= 80 ? 'text-green-600 dark:text-green-400' : simulation.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {simulation.score}%
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {t_('Score global', 'Overall score')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t_('Aucun résultat', 'No results yet')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t_('Complétez votre première simulation d\'immigration pour voir vos résultats', 'Complete your first immigration simulation to see results')}
                  </p>
                  <Button
                    onClick={() => router.push('/immigration-simulations/questions')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t_('Commencer une Simulation', 'Start a Simulation')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function ImmigrationResultsPage() {
  return (
    <SharedDataProvider>
      <ResultsPageContent />
    </SharedDataProvider>
  );
}
