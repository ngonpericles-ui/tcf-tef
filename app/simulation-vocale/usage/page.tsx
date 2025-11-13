'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { SimulationHeader } from '@/components/SimulationHeader';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { 
  BarChart3, 
  Package, 
  Calendar, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Timer,
  Mic
} from 'lucide-react';

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

interface MonthlyCountData {
  monthlyCount: number;
  limit: number;
  remaining: number;
  subscriptionTier: string;
}

function UsagePageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyCountData>({
    monthlyCount: 0,
    limit: 2,
    remaining: 2,
    subscriptionTier: 'FREE'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulations();
    fetchMonthlyCount();
  }, []);

  const fetchSimulations = async () => {
    try {
      const response = await apiClient.get('/voice-simulation/history');
      if (response.success && response.data) {
        setSimulations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyCount = async () => {
    try {
      const response = await apiClient.get('/voice-simulation/monthly-count');
      if (response.success && response.data) {
        const data = response.data as MonthlyCountData;
        setMonthlyData({
          monthlyCount: data.monthlyCount || 0,
          limit: data.limit || 2,
          remaining: data.remaining || 0,
          subscriptionTier: data.subscriptionTier || 'FREE'
        });
      }
    } catch (error) {
      console.error('Error fetching monthly count:', error);
    }
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate average interview score
  const getAverageScore = () => {
    const completedWithScores = simulations.filter(s => s.status === 'COMPLETED' && s.overallScore);
    if (completedWithScores.length === 0) return 0;
    const sum = completedWithScores.reduce((acc, s) => acc + (s.overallScore || 0), 0);
    return Math.round(sum / completedWithScores.length);
  };

  // Calculate total practice time in hours
  const getTotalPracticeTime = () => {
    const completed = simulations.filter(s => s.status === 'COMPLETED');
    const totalMinutes = completed.reduce((acc, s) => acc + (s.duration || 0), 0);
    const hours = totalMinutes / 60;
    return hours.toFixed(1);
  };

  // Determine most improved skill
  const getMostImprovedSkill = () => {
    const completed = simulations.filter(s => s.status === 'COMPLETED' && s.overallScore).slice(-5);
    if (completed.length < 2) return t_('N/A', 'N/A');

    const skills = ['fluencyScore', 'grammarScore', 'vocabularyScore', 'pronunciationScore', 'coherenceScore'];
    const skillNames = {
      fluencyScore: { fr: 'Fluidité', en: 'Fluency' },
      grammarScore: { fr: 'Grammaire', en: 'Grammar' },
      vocabularyScore: { fr: 'Vocabulaire', en: 'Vocabulary' },
      pronunciationScore: { fr: 'Prononciation', en: 'Pronunciation' },
      coherenceScore: { fr: 'Cohérence', en: 'Coherence' }
    };

    let maxImprovement = 0;
    let bestSkill = 'pronunciationScore';

    skills.forEach(skill => {
      const firstHalf = completed.slice(0, Math.floor(completed.length / 2));
      const secondHalf = completed.slice(Math.floor(completed.length / 2));
      
      const firstAvg = firstHalf.length > 0 
        ? firstHalf.reduce((acc, s) => acc + ((s as any)[skill] || 0), 0) / firstHalf.length 
        : 0;
      const secondAvg = secondHalf.length > 0
        ? secondHalf.reduce((acc, s) => acc + ((s as any)[skill] || 0), 0) / secondHalf.length
        : 0;
      
      const improvement = secondAvg - firstAvg;
      if (improvement > maxImprovement) {
        maxImprovement = improvement;
        bestSkill = skill;
      }
    });

    return skillNames[bestSkill as keyof typeof skillNames]?.[lang as 'fr' | 'en'] || t_('Prononciation', 'Pronunciation');
  };

  const getVoiceLabel = (simulation: VoiceSimulation) => {
    const voiceName = simulation.questionsData?.voiceName;
    if (voiceName) return voiceName;
    
    if (simulation.voicePreference === 'MALE') {
      return t_('Voix Homme', 'Male Voice');
    } else if (simulation.voicePreference === 'FEMALE') {
      return t_('Voix Femme', 'Female Voice');
    }
    return t_('Non spécifiée', 'Not specified');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f8f7] dark:bg-[#102218]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#10B981] border-t-transparent"></div>
      </div>
    );
  }

  const completedSessions = simulations.filter(s => s.status === 'COMPLETED').length;
  const progressPercentage = monthlyData.limit > 0 
    ? Math.min((monthlyData.monthlyCount / monthlyData.limit) * 100, 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f6f8f7] dark:bg-[#102218]">
      <SimulationHeader currentPage="usage" />
      
      <main className="flex flex-1 justify-center py-5 pt-24">
        <div className="flex flex-col w-full max-w-5xl flex-1 px-4">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-3 p-4 text-center">
            <div className="flex w-full flex-col gap-3">
              <p className="text-[#10B981] text-5xl font-black leading-tight tracking-[-0.033em]">
                {t_("Aperçu de l'Utilisation", "Usage Overview")}
              </p>
              <p className="text-[#6B7280] dark:text-gray-400 text-lg font-normal leading-normal max-w-2xl mx-auto">
                {t_(
                  "Suivez votre progression, votre utilisation et vos tendances de performance en un seul endroit. Améliorez vos compétences d'entretien en français à chaque session.",
                  "Track your progress, usage, and performance trends all in one place. Improve your French interview skills with every session."
                )}
              </p>
        </div>
      </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 mt-8">
            {/* Simulations Used */}
            <div className="flex flex-col gap-4 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                  {t_("Simulations Utilisées", "Simulations Used")}
                </p>
                <BarChart3 className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-[#1F2937] dark:text-white tracking-light text-4xl font-bold leading-tight">
                {monthlyData.monthlyCount}/{monthlyData.limit || 2}
              </p>
              <div className="flex flex-col gap-2">
                <div className="rounded-full bg-[#F3F4F6] dark:bg-gray-700">
                  <div 
                    className="h-2 rounded-full bg-[#10B981]" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
            </div>
                <p className="text-[#6B7280] dark:text-gray-400 text-xs font-normal leading-normal text-right">
                  {Math.round(progressPercentage)}%
                </p>
              </div>
            </div>

            {/* Simulations Remaining */}
            <div className="flex flex-col gap-4 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                  {t_("Simulations Restantes", "Simulations Remaining")}
                </p>
                <Package className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-[#1F2937] dark:text-white tracking-light text-4xl font-bold leading-tight">
                {monthlyData.remaining}
              </p>
              <p className="text-[#6B7280] dark:text-gray-400 text-xs font-normal leading-normal mt-auto pt-2">
                {t_("Votre quota mensuel.", "Your monthly quota.")}
              </p>
            </div>

              {/* Days Until Reset */}
            <div className="flex flex-col gap-4 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                  {t_("Jours Jusqu'au Reset", "Days Until Reset")}
                </p>
                <Calendar className="w-5 h-5 text-[#10B981]" />
                  </div>
              <p className="text-[#1F2937] dark:text-white tracking-light text-4xl font-bold leading-tight">
                  {getDaysUntilReset()}
              </p>
              <p className="text-[#6B7280] dark:text-gray-400 text-xs font-normal leading-normal mt-auto pt-2">
                {t_("Réinitialise le 1er du mois.", "Resets on the 1st of the month.")}
              </p>
            </div>

            {/* Completed Sessions */}
            <div className="flex flex-col gap-4 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                  {t_("Sessions Terminées", "Completed Sessions")}
                </p>
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-[#1F2937] dark:text-white tracking-light text-4xl font-bold leading-tight">
                {completedSessions}
              </p>
              <p className="text-[#6B7280] dark:text-gray-400 text-xs font-normal leading-normal mt-auto pt-2">
                {t_("Total des sessions complétées.", "Total sessions completed.")}
              </p>
            </div>
          </div>

          {/* Simulation History */}
          <div className="mt-12">
            <h2 className="text-[#1F2937] dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              {t_("Historique des Simulations", "Simulation History")}
            </h2>
            <div className="flex flex-col gap-4 p-4">
            {simulations.length === 0 ? (
                <div className="text-center py-12 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl">
                  <p className="text-[#6B7280] dark:text-gray-400">
                    {t_("Aucune simulation pour le moment", "No simulations yet")}
                  </p>
              </div>
            ) : (
                simulations
                  .filter((sim) => {
                    const scheduledDate = sim.scheduledDate ? new Date(sim.scheduledDate) : null;
                    const createdDate = sim.createdAt ? new Date(sim.createdAt) : null;
                    return (scheduledDate && !isNaN(scheduledDate.getTime())) || 
                           (createdDate && !isNaN(createdDate.getTime()));
                  })
                  .slice(0, 10)
                  .map((simulation) => {
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

                    const isCompleted = simulation.status === 'COMPLETED';
                    const durationMinutes = Math.floor((simulation.duration || 0) / 60);

                    return (
                      <div
                        key={simulation.id}
                        className="grid grid-cols-6 items-center gap-4 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg"
                      >
                        {/* Date & Time */}
                        <div className="col-span-6 sm:col-span-2 flex items-center gap-4">
                          <CalendarIcon className={`w-5 h-5 ${isCompleted ? 'text-[#10B981]' : 'text-[#1F2937] dark:text-white'}`} />
                          <div>
                            <p className="font-bold text-[#1F2937] dark:text-white">{formattedDate}</p>
                                {formattedTime && (
                              <p className="text-sm text-[#6B7280] dark:text-gray-400">{formattedTime}</p>
                                )}
                              </div>
                            </div>

                        {/* Voice */}
                        <div className="col-span-3 sm:col-span-1 flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
                          <Mic className="w-4 h-4" />
                          {getVoiceLabel(simulation)}
                        </div>

                        {/* Duration */}
                        <div className="col-span-3 sm:col-span-1 flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
                          <Timer className="w-4 h-4" />
                          {durationMinutes} {t_('min', 'min')}
                          </div>

                        {/* Status */}
                        <div className="col-span-3 sm:col-span-1 flex justify-start sm:justify-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 dark:bg-green-800/50 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                              <svg aria-hidden="true" className="h-1.5 w-1.5 fill-green-500" viewBox="0 0 6 6">
                                <circle cx="3" cy="3" r="3"></circle>
                              </svg>
                              {t_("Terminée", "Completed")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 dark:bg-gray-800/50 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                              {simulation.status === 'SCHEDULED' ? t_("Programmée", "Scheduled") :
                               simulation.status === 'ACTIVE' ? t_("Active", "Active") :
                               simulation.status === 'CANCELLED' ? t_("Annulée", "Cancelled") :
                               t_("Expirée", "Expired")}
                                </span>
                            )}
                          </div>

                        {/* Score */}
                        <div className="col-span-3 sm:col-span-1 flex justify-start sm:justify-end items-center gap-2">
                          {simulation.overallScore ? (
                            <>
                              <p className="text-lg font-bold text-[#1F2937] dark:text-white">
                                {Math.round(simulation.overallScore)}%
                              </p>
                              <p className="text-xs text-[#6B7280] dark:text-gray-400">{t_("Score", "Score")}</p>
                            </>
                          ) : (
                            <p className="text-xs text-[#6B7280] dark:text-gray-400">-</p>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Performance Trends */}
          {simulations.filter(s => s.status === 'COMPLETED' && s.overallScore).length > 0 && (
            <div className="mt-12">
              <h2 className="text-[#10B981] text-3xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                {t_("Tendances de Performance", "Performance Trends")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                {/* Average Interview Score */}
                <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg">
                  <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                    {t_("Score Moyen d'Entretien", "Average Interview Score")}
                  </p>
                  <p className="text-[#10B981] tracking-light text-4xl font-bold leading-tight">
                    {getAverageScore()}%
                  </p>
              </div>

                {/* Total Practice Time */}
                <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg">
                  <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                    {t_("Temps de Pratique Total", "Total Practice Time")}
                  </p>
                  <p className="text-[#1F2937] dark:text-white tracking-light text-4xl font-bold leading-tight">
                    {getTotalPracticeTime()} {t_("Heures", "Hours")}
                  </p>
                </div>

                {/* Most Improved Skill */}
                <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-[#1F2937]/50 backdrop-blur-xl shadow-lg">
                  <p className="text-base font-medium leading-normal text-[#1F2937] dark:text-gray-200">
                    {t_("Compétence la Plus Améliorée", "Most Improved Skill")}
                  </p>
                  <p className="text-[#10B981] tracking-light text-4xl font-bold leading-tight">
                    {getMostImprovedSkill()}
                  </p>
                </div>
              </div>
                  </div>
          )}
              </div>
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
