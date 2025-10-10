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
  Crown
} from 'lucide-react';
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
  const { t } = useLanguage();
  const router = useRouter();

  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulations();
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
        const completedSimulations = (data.data || []).filter((s: VoiceSimulation) => s.status === 'COMPLETED');
        setSimulations(completedSimulations);
        calculatePerformanceData(completedSimulations);
      } else {
        toast.error('Error loading results');
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error('Connection error');
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

    const scores = simulations.map(s => s.overallScore || 0);
    const averageScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // Calculate improvement (compare first half vs second half)
    const midPoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midPoint);
    const secondHalf = scores.slice(midPoint);
    const firstHalfAvg = firstHalf.reduce((acc, score) => acc + score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((acc, score) => acc + score, 0) / secondHalf.length;
    const improvement = secondHalfAvg - firstHalfAvg;

    // Calculate streak (consecutive completed sessions)
    let streak = 0;
    for (let i = simulations.length - 1; i >= 0; i--) {
      if (simulations[i].status === 'COMPLETED') {
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

  const handleDownloadResults = () => {
    // TODO: Implement download functionality
    toast.info('Download feature coming soon');
  };

  const handleShareResults = () => {
    // TODO: Implement share functionality
    toast.info('Share feature coming soon');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (improvement < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-gray-600" />;
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
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-700 to-red-800 dark:from-orange-900 dark:via-orange-800 dark:to-red-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Analytics and performance charts"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Résultats et performance
            </h1>

            <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Analysez vos performances</strong> et suivez vos progrès.
              Consultez vos scores détaillés, identifiez vos points d'amélioration et célébrez vos réussites.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-orange-200 mb-8">
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-orange-300" />
                Scores détaillés
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-orange-300" />
                Progrès visuels
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-orange-300" />
                Objectifs personnalisés
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
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Résultats et performance</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analysez vos performances et progrès</p>
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
        {/* Performance Overview */}
        {performanceData && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDownloadResults}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleShareResults}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {performanceData.averageScore}%
                </div>
                <div className="text-sm text-gray-500 mb-2">Average Score</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${performanceData.averageScore}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {performanceData.completedSessions}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {performanceData.scheduledSessions}
                </div>
                <div className="text-sm text-gray-500">Scheduled</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {performanceData.streak}
                </div>
                <div className="text-sm text-gray-500">Current Streak</div>
              </div>
            </div>

            {/* Improvement Indicator */}
            {performanceData.improvement !== 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  {getImprovementIcon(performanceData.improvement)}
                  <span className="ml-2 text-sm font-medium text-blue-800">
                    {performanceData.improvement > 0 ? 'Improving' : 'Declining'} by {Math.abs(performanceData.improvement)}% 
                    {performanceData.improvement > 0 ? ' 🎉' : ' 📉'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Results */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Results</h2>
            <p className="text-sm text-gray-500 mt-1">View your simulation history and scores</p>
          </div>
          <div className="divide-y divide-gray-200">
            {simulations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No results yet</h3>
                <p className="text-sm text-gray-500">Complete your first simulation to see results</p>
                <Button 
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => router.push('/simulation-vocale/booking')}
                >
                  Book Simulation
                </Button>
              </div>
            ) : (
              simulations.map((simulation) => (
                <div key={simulation.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(simulation.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {simulation.voicePreference} Voice • {simulation.duration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {simulation.overallScore && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(simulation.overallScore)}`}>
                            {simulation.overallScore}%
                          </div>
                          <div className="text-xs text-gray-500">Overall Score</div>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDownloadResults}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleShareResults}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {simulation.overallScore && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                      {simulation.fluencyScore && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{simulation.fluencyScore}%</div>
                          <div className="text-xs text-gray-500">Fluency</div>
                        </div>
                      )}
                      {simulation.grammarScore && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{simulation.grammarScore}%</div>
                          <div className="text-xs text-gray-500">Grammar</div>
                        </div>
                      )}
                      {simulation.vocabularyScore && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{simulation.vocabularyScore}%</div>
                          <div className="text-xs text-gray-500">Vocabulary</div>
                        </div>
                      )}
                      {simulation.pronunciationScore && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{simulation.pronunciationScore}%</div>
                          <div className="text-xs text-gray-500">Pronunciation</div>
                        </div>
                      )}
                      {simulation.coherenceScore && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{simulation.coherenceScore}%</div>
                          <div className="text-xs text-gray-500">Coherence</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback */}
                  {simulation.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-1">Feedback</div>
                      <div className="text-sm text-gray-700">{simulation.feedback}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Trends */}
        {simulations.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
              <p className="text-sm text-gray-500 mt-1">Track your progress over time</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {performanceData?.bestScore}%
                  </div>
                  <div className="text-sm text-gray-500">Best Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {performanceData?.averageScore}%
                  </div>
                  <div className="text-sm text-gray-500">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {performanceData?.streak}
                  </div>
                  <div className="text-sm text-gray-500">Current Streak</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {performanceData && performanceData.completedSessions > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
              <p className="text-sm text-gray-500 mt-1">Your learning milestones</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceData.completedSessions >= 1 && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-800">First Simulation</div>
                      <div className="text-xs text-green-600">Completed your first simulation</div>
                    </div>
                  </div>
                )}
                {performanceData.streak >= 3 && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Star className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-blue-800">Consistent Learner</div>
                      <div className="text-xs text-blue-600">3+ simulation streak</div>
                    </div>
                  </div>
                )}
                {performanceData.averageScore >= 80 && (
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Crown className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-purple-800">High Performer</div>
                      <div className="text-xs text-purple-600">80%+ average score</div>
                    </div>
                  </div>
                )}
                {performanceData.completedSessions >= 5 && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <div>
                      <div className="text-sm font-medium text-yellow-800">Dedicated Learner</div>
                      <div className="text-xs text-yellow-600">5+ simulations completed</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
