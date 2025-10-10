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
  RefreshCw
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

function UsagePageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

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
      case 'COMPLETED': return <Target className="h-4 w-4" />;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Data analytics dashboard"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Aperçu de l'utilisation
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Suivez vos progrès</strong> et votre utilisation des simulations vocales.
              Analysez vos performances, consultez votre historique et gérez vos limites mensuelles.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-200 mb-8">
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-blue-300" />
                Statistiques détaillées
              </div>
              <div className="flex items-center">
                <History className="w-4 h-4 mr-2 text-blue-300" />
                Historique complet
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-blue-300" />
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
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Aperçu de l'utilisation</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Suivez votre utilisation des simulations et vos limites</p>
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
                  onClick={handleUpgradePrompt}
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

        {/* Usage Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Aperçu de l'utilisation</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{monthlyCount}/2</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Simulations utilisées</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(monthlyCount / 2) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {2 - monthlyCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Restantes</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {getDaysUntilReset()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Jours jusqu'au reset</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {simulations.filter(s => s.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Terminées</div>
            </div>
          </div>
        </div>

        {/* Usage History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activité récente</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {simulations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Mic className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Aucune simulation pour le moment</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Réservez votre première simulation pour commencer</p>
                <Button 
                  className="mt-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  onClick={() => router.push('/simulation-vocale/booking')}
                >
                  Réserver une simulation
                </Button>
              </div>
            ) : (
              simulations.map((simulation) => (
                <div key={simulation.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Mic className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(simulation.scheduledDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {simulation.voicePreference === 'MALE' ? 'Voix masculine' : 'Voix féminine'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(simulation.status)}`}>
                      {getStatusIcon(simulation.status)}
                      <span className="ml-1">
                        {simulation.status === 'SCHEDULED' ? 'Programmée' : 
                         simulation.status === 'ACTIVE' ? 'Active' :
                         simulation.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
                      </span>
                    </span>
                    {simulation.overallScore && (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {simulation.overallScore}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Trends */}
        {simulations.filter(s => s.overallScore).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mt-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tendances de performance</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {Math.round(simulations.filter(s => s.overallScore).reduce((acc, s) => acc + (s.overallScore || 0), 0) / simulations.filter(s => s.overallScore).length)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Score moyen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {simulations.filter(s => s.overallScore).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Sessions terminées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {simulations.filter(s => s.status === 'SCHEDULED').length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Sessions à venir</div>
                </div>
              </div>
            </div>
          </div>
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
