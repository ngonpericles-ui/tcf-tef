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
  History
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

function SimulationPageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

  const [simulations, setSimulations] = useState<VoiceSimulation[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-indigo-900 dark:via-indigo-800 dark:to-purple-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Voice simulation and microphone"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Mic className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Simulation vocale
            </h1>

            <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Maîtrisez votre expression orale</strong> en français avec nos simulations vocales IA.
              Pratiquez, améliorez votre prononciation et gagnez en confiance pour vos entretiens et examens.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-indigo-200 mb-8">
              <div className="flex items-center">
                <Mic className="w-4 h-4 mr-2 text-indigo-300" />
                Simulations réalistes
              </div>
              <div className="flex items-center">
                <Volume2 className="w-4 h-4 mr-2 text-indigo-300" />
                Feedback instantané
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-indigo-300" />
                Progrès personnalisés
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
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Simulation Vocale</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pratique de conversation avec IA</p>
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
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Pratiquez le français avec des simulations vocales alimentées par l'IA
          </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Engagez-vous dans des conversations réalistes avec notre système vocal IA avancé. 
              Perfectionnez votre prononciation, fluidité et confiance en français grâce à 
              des sessions de simulation interactives.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Mic className="w-4 h-4 mr-2 text-green-600" />
                Pratique de conversation en temps réel
                  </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-green-600" />
                Retour instantané et notation
                </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-green-600" />
                Suivez vos progrès
              </div>
            </div>
          </div>
        </div>

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisation mensuelle</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{monthlyCount}/2</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(monthlyCount / 2) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminées</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {simulations.filter(s => s.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Programmées</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {simulations.filter(s => s.status === 'SCHEDULED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score moyen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {simulations.filter(s => s.overallScore).length > 0 
                      ? Math.round(simulations.filter(s => s.overallScore).reduce((acc, s) => acc + (s.overallScore || 0), 0) / simulations.filter(s => s.overallScore).length)
                      : '--'
                    }%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Usage Card */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/simulation-vocale/usage')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Aperçu de l'utilisation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Surveillez votre utilisation mensuelle des simulations, suivez vos progrès et consultez des analyses détaillées</p>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                Voir les détails
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings Card */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/simulation-vocale/voice')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Paramètres vocaux</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Choisissez votre voix préférée, accent et prévisualisez différentes options pour vos simulations</p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                Configurer
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>

          {/* Booking Card */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/simulation-vocale/booking')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/30 transition-colors">
                  <CalendarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Réserver une simulation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Planifiez votre prochaine session de simulation vocale avec des options de réservation flexibles et des créneaux horaires</p>
              <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Réserver maintenant
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/simulation-vocale/results')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Résultats et performance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Analysez vos résultats de simulation, suivez les tendances d'amélioration et consultez des métriques de performance détaillées</p>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                Voir les résultats
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <Brain className="w-5 h-5 mr-2" />
              Comment fonctionne la simulation vocale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Réservez votre session</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Planifiez un moment convenable pour votre session de simulation vocale</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">2. Pratiquez la parole</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Engagez-vous dans des conversations réalistes avec notre système vocal IA</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Recevez des commentaires</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Recevez des scores détaillés et des commentaires pour améliorer votre français</p>
              </div>
            </div>
              </CardContent>
            </Card>

        {/* Recent Activity */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <History className="w-5 h-5 mr-2" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simulations.length === 0 ? (
              <div className="text-center py-8">
                <Mic className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Aucune simulation pour le moment</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Réservez votre première simulation pour commencer</p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  onClick={() => router.push('/simulation-vocale/booking')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Réserver une simulation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {simulations.slice(0, 5).map((simulation) => (
                  <div key={simulation.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700">
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
                ))}
                {simulations.length > 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => router.push('/simulation-vocale/usage')}
                    >
                      Voir toute l'activité
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

export default function SimulationPage() {
  return (
    <SharedDataProvider>
      <SimulationPageContent />
    </SharedDataProvider>
  );
}