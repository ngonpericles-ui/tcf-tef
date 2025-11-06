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
  Mic,
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
  Plus
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

interface VoiceSimulation {
  id: string;
  scheduledDate: string;
  voicePreference: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  overallScore?: number;
  fluencyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  pronunciationScore?: number;
  coherenceScore?: number;
  feedback?: string;
  resultsData?: any;
  duration: number;
  createdAt: string;
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

  const [currentSimulation, setCurrentSimulation] = useState<VoiceSimulation | null>(null);
  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
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
      
      const response = await fetch(`/api/voice-simulation/${id}`, {
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
          router.push('/simulation-vocale');
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
      
      const response = await fetch('/api/voice-simulation/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const completedSimulations = (data.data || []).filter((s: VoiceSimulation) => s.status === 'COMPLETED');
        console.log('✅ Completed simulations fetched:', {
          count: completedSimulations.length,
          withFeedback: completedSimulations.filter((s: VoiceSimulation) => s.aiFeedbacks && s.aiFeedbacks.length > 0).length
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

  const calculatePerformanceData = (simulations: VoiceSimulation[]) => {
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

    const scores = simulations.map(s => s.overallScore || 0).filter(s => s > 0);
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
      if (simulations[i].status === 'COMPLETED' && (simulations[i].overallScore || 0) > 0) {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t_('Chargement des résultats...', 'Loading results...')}</p>
        </div>
      </div>
    );
  }

  const displaySimulation = currentSimulation || (simulations.length > 0 ? simulations[0] : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
                {t_('Résultats et Performance', 'Results and Performance')}
              </h1>

              <p className="text-xl md:text-2xl text-purple-100 mb-8 leading-relaxed">
                {t_(
                  'Analysez vos performances et suivez vos progrès en temps réel. Consultez vos scores détaillés, identifiez vos points d\'amélioration et célébrez vos réussites.',
                  'Analyze your performance and track your progress in real-time. Review your detailed scores, identify areas for improvement, and celebrate your achievements.'
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
                  <span>{t_('Objectifs personnalisés', 'Personalized goals')}</span>
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
              {/* Visual Illustration - Trophy/Chart */}
              <div className="relative w-full max-w-md">
                <svg viewBox="0 0 400 350" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="175" r="130" fill="url(#gradient1)" opacity="0.1"/>
                  <circle cx="200" cy="175" r="90" fill="url(#gradient2)" opacity="0.15"/>
                  
                  {/* Trophy */}
                  <ellipse cx="200" cy="120" rx="40" ry="50" fill="#FBBF24" opacity="0.8"/>
                  <rect x="180" y="170" width="40" height="60" rx="5" fill="#FBBF24" opacity="0.8"/>
                  <rect x="175" y="230" width="50" height="15" rx="7" fill="#F59E0B" opacity="0.9"/>
                  <rect x="165" y="245" width="70" height="30" rx="15" fill="#D97706" opacity="0.9"/>
                  
                  {/* Chart bars */}
                  <rect x="100" y="180" width="25" height="80" rx="5" fill="#8B5CF6" opacity="0.6"/>
                  <rect x="135" y="160" width="25" height="100" rx="5" fill="#3B82F6" opacity="0.6"/>
                  <rect x="265" y="140" width="25" height="120" rx="5" fill="#10B981" opacity="0.6"/>
                  <rect x="300" y="150" width="25" height="110" rx="5" fill="#EC4899" opacity="0.6"/>
                  
                  {/* Sparkles */}
                  <circle cx="120" cy="100" r="4" fill="#FBBF24" opacity="0.8" className="animate-pulse"/>
                  <circle cx="280" cy="90" r="3" fill="#3B82F6" opacity="0.8" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
                  <circle cx="160" cy="260" r="3" fill="#EC4899" opacity="0.8" className="animate-pulse" style={{animationDelay: '1s'}}/>
                  
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#F59E0B" />
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
                    <BarChart3 className="w-6 h-6 text-purple-600" />
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
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8 opacity-80" />
                        <Sparkles className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{performanceData.averageScore}%</div>
                      <div className="text-purple-100 text-sm">{t_('Score Moyen', 'Average Score')}</div>
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
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <CheckCircle className="w-8 h-8 opacity-80" />
                        <Zap className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{performanceData.completedSessions}</div>
                      <div className="text-blue-100 text-sm">{t_('Simulations Complétées', 'Completed Sessions')}</div>
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
                    className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
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
                <MessageSquare className="w-6 h-6 text-purple-600" />
                {t_('Résultats Détaillés', 'Detailed Results')}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t_('Consultez vos simulations et scores détaillés', 'Review your simulations and detailed scores')}
              </p>
            </CardHeader>
            <CardContent>
              {displaySimulation ? (
                <div className="space-y-6">
                  {/* Current/Latest Simulation Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${displaySimulation.overallScore ? getScoreGradient(displaySimulation.overallScore) : 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-lg`}>
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {t_('Simulation Vocale', 'Voice Simulation')}
                            </h3>
                            <Badge className={displaySimulation.overallScore ? getScoreBadgeColor(displaySimulation.overallScore) : ''}>
                              {displaySimulation.overallScore ? `${displaySimulation.overallScore}%` : t_('En attente', 'Pending')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                            <div className="flex items-center gap-1">
                              <Mic className="w-4 h-4" />
                              {displaySimulation.voicePreference || t_('Non spécifiée', 'Not specified')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {displaySimulation.overallScore && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {[
                          { label: t_('Fluidité', 'Fluency'), score: displaySimulation.fluencyScore, icon: Zap },
                          { label: t_('Grammaire', 'Grammar'), score: displaySimulation.grammarScore, icon: BookOpen },
                          { label: t_('Vocabulaire', 'Vocabulary'), score: displaySimulation.vocabularyScore, icon: Brain },
                          { label: t_('Prononciation', 'Pronunciation'), score: displaySimulation.pronunciationScore, icon: Mic },
                          { label: t_('Cohérence', 'Coherence'), score: displaySimulation.coherenceScore, icon: MessageSquare }
                        ].map((item, index) => (
                          item.score !== undefined && (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <item.icon className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                              <div className={`text-2xl font-bold mb-1 ${getScoreColor(item.score)}`}>
                                {item.score}%
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{item.label}</div>
                              <Progress value={item.score} className="mt-2 h-1" />
                            </motion.div>
                          )
                        ))}
                      </div>
                    )}

                    {/* Overall Score Visual */}
                    {displaySimulation.overallScore && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t_('Score Global', 'Overall Score')}
                          </span>
                          <span className={`text-2xl font-bold ${getScoreColor(displaySimulation.overallScore)}`}>
                            {displaySimulation.overallScore}%
                          </span>
                        </div>
                        <Progress 
                          value={displaySimulation.overallScore} 
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
                          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          {t_('Retour IA', 'AI Feedback')}
                        </h4>
                        {displaySimulation.aiFeedbacks.map((feedback: AIFeedback, idx: number) => (
                          <div key={feedback.id || idx} className="space-y-4">
                            {feedback.overallFeedback && (
                              <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <AlertDescription className="text-gray-800 dark:text-gray-200">
                                  <div className="font-semibold mb-2">{t_('Analyse Globale', 'Overall Analysis')}:</div>
                                  <div className="whitespace-pre-wrap">{feedback.overallFeedback || t_('Aucun commentaire disponible', 'No feedback available')}</div>
                                  {feedback.aiConfidence && (
                                    <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                                      {t_('Confiance IA', 'AI Confidence')}: {Math.round((feedback.aiConfidence || 0) * 100)}%
                                    </div>
                                  )}
                                  {feedback.aiScore !== null && feedback.aiScore !== undefined && (
                                    <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                                      {t_('Score IA', 'AI Score')}: {Math.round(feedback.aiScore)}
                                    </div>
                                  )}
                                  {feedback.humanScore !== null && feedback.humanScore !== undefined && (
                                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                      {t_('Score Expert', 'Expert Score')}: {Math.round(feedback.humanScore)}
                                    </div>
                                  )}
                                  {feedback.humanFeedback && (
                                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                                      <div className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-1">
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

                    {/* Detailed Analysis from resultsData */}
                    {displaySimulation.resultsData?.detailedAnalysis && (
                      <div className="mt-6 space-y-4">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {t_('Analyse Détaillée', 'Detailed Analysis')}
                        </h4>
                        
                        {displaySimulation.resultsData.detailedAnalysis.strengths && (
                          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-green-800 dark:text-green-300">
                                {t_('Points Forts', 'Strengths')}
                              </span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
                              {(Array.isArray(displaySimulation.resultsData.detailedAnalysis.strengths)
                                ? displaySimulation.resultsData.detailedAnalysis.strengths
                                : [displaySimulation.resultsData.detailedAnalysis.strengths]
                              ).map((strength: string, idx: number) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {displaySimulation.resultsData.detailedAnalysis.weaknesses && (
                          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                                {t_('Points à Améliorer', 'Areas for Improvement')}
                              </span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                              {(Array.isArray(displaySimulation.resultsData.detailedAnalysis.weaknesses)
                                ? displaySimulation.resultsData.detailedAnalysis.weaknesses
                                : [displaySimulation.resultsData.detailedAnalysis.weaknesses]
                              ).map((weakness: string, idx: number) => (
                                <li key={idx}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {displaySimulation.resultsData.detailedAnalysis.recommendations && (
                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span className="font-semibold text-blue-800 dark:text-blue-300">
                                {t_('Recommandations', 'Recommendations')}
                              </span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                              {(Array.isArray(displaySimulation.resultsData.detailedAnalysis.recommendations)
                                ? displaySimulation.resultsData.detailedAnalysis.recommendations
                                : [displaySimulation.resultsData.detailedAnalysis.recommendations]
                              ).map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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
                            onClick={() => router.push(`/simulation-vocale/results?id=${simulation.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${simulation.overallScore ? getScoreGradient(simulation.overallScore) : 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                                  <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {new Date(simulation.scheduledDate).toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {simulation.voicePreference || t_('Voix non spécifiée', 'Voice not specified')}
                                  </div>
                                </div>
                              </div>
                              {simulation.overallScore && (
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${getScoreColor(simulation.overallScore)}`}>
                                    {simulation.overallScore}%
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
                    {t_('Complétez votre première simulation pour voir vos résultats', 'Complete your first simulation to see results')}
                  </p>
                  <Button
                    onClick={() => router.push('/simulation-vocale/booking')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t_('Réserver une Simulation', 'Book a Simulation')}
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

export default function ResultsPage() {
  return (
    <SharedDataProvider>
      <ResultsPageContent />
    </SharedDataProvider>
  );
}
