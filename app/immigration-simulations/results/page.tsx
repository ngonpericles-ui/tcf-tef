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
  MapPin,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { SimulationHeader } from '@/components/SimulationHeader';

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
  overallScore?: number;
  finalScore?: number;
  feedback?: string;
  duration: number;
  createdAt: string;
  scheduledDate?: string;
  voicePreference?: string;
  aiFeedbacks?: AIFeedback[];
  // Immigration-specific scores
  relevanceScore?: number;
  completenessScore?: number;
  clarityScore?: number;
  languageScore?: number;
  credibilityScore?: number;
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
      const response = await apiClient.get(`/immigration-simulation/${id}`);

      if (response.success && response.data) {
        const simulation = response.data as ImmigrationSimulation;
        console.log('✅ Simulation fetched:', {
          id: simulation?.id,
          hasFeedback: (simulation?.aiFeedbacks?.length || 0) > 0,
          feedbackCount: simulation?.aiFeedbacks?.length || 0
        });
        setCurrentSimulation(simulation);
        
        // Also fetch all simulations for performance overview
        fetchSimulations();
      } else {
        console.error('❌ Error fetching simulation:', response.error);
        toast.error(response.error?.message || response.message || t_('Simulation non trouvée', 'Simulation not found'));
          router.push('/immigration-simulations');
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
      const response = await apiClient.get('/immigration-simulation/history');

      if (response.success) {
        const data = { data: Array.isArray(response.data) ? response.data : [] };
        const completedSimulations = (data.data || []).filter((s: ImmigrationSimulation) => s.status === 'COMPLETED');
        console.log('✅ Completed simulations fetched:', {
          count: completedSimulations.length,
          withFeedback: completedSimulations.filter((s: ImmigrationSimulation) => s.aiFeedbacks && s.aiFeedbacks.length > 0).length
        });
        setSimulations(completedSimulations);
        calculatePerformanceData(completedSimulations);
      } else {
        console.error('❌ Error loading results:', response.error);
        const errorMessage = response.error?.message || response.message || t_('Erreur lors du chargement', 'Error loading results');
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

    const scores = simulations.map(s => s.overallScore || s.finalScore || s.score || 0).filter(s => s > 0);
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
      const score = simulations[i].overallScore || simulations[i].finalScore || simulations[i].score || 0;
      if (simulations[i].status === 'COMPLETED' && score > 0) {
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2ECC71] mx-auto mb-4"></div>
          <p className="text-foreground">{t_('Chargement des résultats...', 'Loading results...')}</p>
        </div>
      </div>
    );
  }

  const displaySimulation = currentSimulation || (simulations.length > 0 ? simulations[0] : null);
  
  // Format date for display
  const formatSimulationDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="results" type="immigration" />

      <main className="px-4 sm:px-10 lg:px-20 py-5 pt-32">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section - Performance Summary */}
          <div className="mb-8">
            <div className="flex min-h-[400px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-start justify-end px-6 pb-10 md:px-10 bg-gradient-to-br from-[#2ECC71]/20 to-[#2ECC71]/10 dark:from-[#2ECC71]/10 dark:to-[#2ECC71]/5 border border-[#2ECC71]/20">
              <div className="flex flex-col gap-2 text-left">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-black dark:text-white">
                  {t_("Résumé de votre Performance", "Your Performance Summary")}
              </h1>
                <h2 className="text-sm md:text-base text-muted-foreground font-normal leading-normal max-w-2xl">
                  {t_("Examinez vos progrès et obtenez des commentaires détaillés pour maîtriser vos compétences d'entretien d'immigration. \"La belle chose à propos de l'apprentissage est que personne ne peut vous l'enlever.\"", "Review your progress and get detailed feedback to master your immigration interview skills. \"The beautiful thing about learning is that no one can take it away from you.\"")}
                </h2>
              </div>
              <Button 
                className="rounded-lg h-10 md:h-12 px-4 md:px-5 bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold text-sm md:text-base"
                onClick={() => router.push('/immigration-simulations/questions')}
              >
                {t_("Démarrer une Nouvelle Simulation", "Start a New Simulation")}
              </Button>
        </div>
      </div>

        {/* Performance Overview Section */}
        {performanceData && (
            <>
              <h2 className="text-[22px] font-bold leading-tight text-black dark:text-white px-4 pb-3 pt-5">
                {t_("Aperçu des Performances", "Performance Overview")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                {/* Average Score */}
                <div className="flex min-w-[158px] flex-1 flex-col gap-4 rounded-xl p-6 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:-translate-y-1 transition-transform">
                  <Trophy className="w-8 h-8 text-[#2ECC71]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-base font-medium leading-normal">
                      {t_("Score Moyen", "Average Score")}
                    </p>
                    <p className="text-black dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {performanceData.averageScore}%
                    </p>
                  </div>
                </div>

                {/* Completed Sessions */}
                <div className="flex min-w-[158px] flex-1 flex-col gap-4 rounded-xl p-6 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:-translate-y-1 transition-transform">
                  <CheckCircle className="w-8 h-8 text-[#2ECC71]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-base font-medium leading-normal">
                      {t_("Sessions Complétées", "Completed Sessions")}
                    </p>
                    <p className="text-black dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {performanceData.completedSessions}
                    </p>
                      </div>
                    </div>

                {/* Best Score */}
                <div className="flex min-w-[158px] flex-1 flex-col gap-4 rounded-xl p-6 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:-translate-y-1 transition-transform">
                  <Award className="w-8 h-8 text-[#FFD700]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-base font-medium leading-normal">
                      {t_("Meilleur Score", "Best Score")}
                    </p>
                    <p className="text-black dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {performanceData.bestScore}%
                    </p>
                      </div>
                    </div>

                {/* Current Streak */}
                <div className="flex min-w-[158px] flex-1 flex-col gap-4 rounded-xl p-6 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:-translate-y-1 transition-transform">
                  <Flame className="w-8 h-8 text-[#2ECC71]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-base font-medium leading-normal">
                      {t_("Série Actuelle", "Current Streak")}
                    </p>
                    <p className="text-black dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {performanceData.streak}
                    </p>
                    </div>
                </div>
                    </div>
            </>
        )}

          {/* Detailed Breakdown and Simulation History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column: Detailed Breakdown */}
            <div className="lg:col-span-2">
              {displaySimulation && (
                <>
                  <h2 className="text-[22px] font-bold leading-tight text-black dark:text-white px-4 pb-3 pt-5">
                    {t_("Analyse Détaillée", "Detailed Breakdown")}: {formatSimulationDate(displaySimulation.scheduledDate)}
                  </h2>
                  <div className="space-y-6 p-4">
                    {/* Score Breakdown Card */}
                    <div className="flex flex-col gap-4 rounded-xl p-6 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        {t_("Répartition des Scores", "Score Breakdown")}
                      </h3>
                      <div className="space-y-4">
                        {/* Relevance */}
                        {displaySimulation.relevanceScore !== undefined && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <p className="text-muted-foreground col-span-1">{t_("Pertinence", "Relevance")}</p>
                            <div className="col-span-3 flex items-center gap-4">
                              <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] h-2.5 rounded-full" 
                                  style={{ width: `${displaySimulation.relevanceScore || 0}%` }}
                                />
                              </div>
                              <p className="text-black dark:text-white font-semibold w-12 text-right">
                                {displaySimulation.relevanceScore || 0}%
                              </p>
                                  </div>
                                    </div>
                                  )}

                        {/* Completeness */}
                        {displaySimulation.completenessScore !== undefined && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <p className="text-muted-foreground col-span-1">{t_("Complétude", "Completeness")}</p>
                            <div className="col-span-3 flex items-center gap-4">
                              <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] h-2.5 rounded-full" 
                                  style={{ width: `${displaySimulation.completenessScore || 0}%` }}
                                />
                              </div>
                              <p className="text-black dark:text-white font-semibold w-12 text-right">
                                {displaySimulation.completenessScore || 0}%
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Clarity */}
                        {displaySimulation.clarityScore !== undefined && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <p className="text-muted-foreground col-span-1">{t_("Clarté", "Clarity")}</p>
                            <div className="col-span-3 flex items-center gap-4">
                              <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] h-2.5 rounded-full" 
                                  style={{ width: `${displaySimulation.clarityScore || 0}%` }}
                                />
                              </div>
                              <p className="text-black dark:text-white font-semibold w-12 text-right">
                                {displaySimulation.clarityScore || 0}%
                              </p>
                            </div>
                                          </div>
                                        )}

                        {/* Language */}
                        {displaySimulation.languageScore !== undefined && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <p className="text-muted-foreground col-span-1">{t_("Langue", "Language")}</p>
                            <div className="col-span-3 flex items-center gap-4">
                              <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] h-2.5 rounded-full" 
                                  style={{ width: `${displaySimulation.languageScore || 0}%` }}
                                />
                                          </div>
                              <p className="text-black dark:text-white font-semibold w-12 text-right">
                                {displaySimulation.languageScore || 0}%
                              </p>
                                      </div>
                                    </div>
                                  )}

                        {/* Credibility */}
                        {displaySimulation.credibilityScore !== undefined && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <p className="text-muted-foreground col-span-1">{t_("Crédibilité", "Credibility")}</p>
                            <div className="col-span-3 flex items-center gap-4">
                              <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] h-2.5 rounded-full" 
                                  style={{ width: `${displaySimulation.credibilityScore || 0}%` }}
                                />
                              </div>
                              <p className="text-black dark:text-white font-semibold w-12 text-right">
                                {displaySimulation.credibilityScore || 0}%
                              </p>
                                      </div>
                                    </div>
                                  )}

                        {/* Overall Score (if no specific scores) */}
                        {(displaySimulation.overallScore !== undefined || displaySimulation.finalScore !== undefined || displaySimulation.score !== undefined) && 
                         !displaySimulation.relevanceScore && !displaySimulation.completenessScore && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <p className="text-muted-foreground col-span-1">{t_("Score Global", "Overall Score")}</p>
                            <div className="col-span-3 flex items-center gap-4">
                              <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] h-2.5 rounded-full" 
                                  style={{ width: `${displaySimulation.overallScore || displaySimulation.finalScore || displaySimulation.score || 0}%` }}
                                />
                              </div>
                              <p className="text-black dark:text-white font-semibold w-12 text-right">
                                {displaySimulation.overallScore || displaySimulation.finalScore || displaySimulation.score || 0}%
                              </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                    </div>

                    {/* AI Feedback Card */}
                    {displaySimulation.aiFeedbacks && displaySimulation.aiFeedbacks.length > 0 && (
                      <div className="flex flex-col gap-4 rounded-xl p-6 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                          {t_("Commentaires IA", "AI Feedback")}
                        </h3>
                        <div className="space-y-4">
                          {/* Strengths */}
                          {displaySimulation.aiFeedbacks[0]?.strengths && displaySimulation.aiFeedbacks[0].strengths.length > 0 && (
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#2ECC71]/20 border border-[#2ECC71]/50">
                              <CheckCircle className="text-[#2ECC71] mt-1 w-5 h-5" />
                              <div>
                                <h4 className="font-bold text-black dark:text-white">{t_("Points Forts", "Strengths")}</h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {Array.isArray(displaySimulation.aiFeedbacks[0].strengths) 
                                    ? displaySimulation.aiFeedbacks[0].strengths.join('. ')
                                    : displaySimulation.aiFeedbacks[0].strengths}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {displaySimulation.aiFeedbacks[0]?.weaknesses && displaySimulation.aiFeedbacks[0].weaknesses.length > 0 && (
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
                              <AlertTriangle className="text-red-500 mt-1 w-5 h-5" />
                                <div>
                                <h4 className="font-bold text-black dark:text-white">
                                  {t_("Domaines à Améliorer", "Areas for Improvement")}
                                </h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {Array.isArray(displaySimulation.aiFeedbacks[0].weaknesses)
                                    ? displaySimulation.aiFeedbacks[0].weaknesses.join('. ')
                                    : displaySimulation.aiFeedbacks[0].weaknesses}
                                </p>
                                  </div>
                                </div>
                          )}

                          {/* Recommendations */}
                          {displaySimulation.aiFeedbacks[0]?.recommendations && displaySimulation.aiFeedbacks[0].recommendations.length > 0 && (
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-500/20 border border-blue-500/50">
                              <Info className="text-blue-500 mt-1 w-5 h-5" />
                              <div>
                                <h4 className="font-bold text-black dark:text-white">
                                  {t_("Recommandations", "Recommendations")}
                                </h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {Array.isArray(displaySimulation.aiFeedbacks[0].recommendations)
                                    ? displaySimulation.aiFeedbacks[0].recommendations.join('. ')
                                    : displaySimulation.aiFeedbacks[0].recommendations}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Overall Feedback */}
                          {displaySimulation.aiFeedbacks[0]?.overallFeedback && (
                            <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20">
                              <p className="text-muted-foreground text-sm">
                                {displaySimulation.aiFeedbacks[0].overallFeedback}
                              </p>
                                  </div>
                          )}
                                  </div>
                                </div>
                              )}
                            </div>
                </>
              )}
                      </div>

            {/* Right Column: Simulation History */}
            <div className="lg:col-span-1">
              <h2 className="text-[22px] font-bold leading-tight text-black dark:text-white px-4 pb-3 pt-5">
                {t_("Historique des Simulations", "Simulation History")}
              </h2>
              <div className="p-4">
                <div className="flex flex-col gap-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 p-4 max-h-[600px] overflow-y-auto">
                  {simulations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {t_("Aucune simulation complétée", "No completed simulations")}
                    </p>
                  ) : (
                    simulations.map((sim) => {
                      const isSelected = displaySimulation?.id === sim.id;
                      const simDate = formatSimulationDate(sim.scheduledDate);
                      const simScore = sim.overallScore || sim.finalScore || sim.score || 0;
                      
                      return (
                        <button
                          key={sim.id}
                          onClick={() => router.push(`/immigration-simulations/results?id=${sim.id}`)}
                          className={`block p-4 rounded-lg border transition-colors text-left ${
                            isSelected
                              ? 'bg-[#2ECC71]/30 border-[#2ECC71]'
                              : 'hover:bg-white/10 dark:hover:bg-white/5 border-transparent hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <p className={`font-semibold ${isSelected ? 'text-black dark:text-white' : 'text-muted-foreground'}`}>
                              {t_("Simulation", "Simulation")}: {simDate}
                            </p>
                            <p className={`font-bold text-lg ${isSelected ? 'text-black dark:text-white' : 'text-muted-foreground'}`}>
                              {simScore}%
                            </p>
                    </div>
                          <p className={`text-sm mt-1 ${isSelected ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                            {sim.country} • {sim.immigrationType}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
                </div>
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
