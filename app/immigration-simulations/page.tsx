'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Plane,
  Globe,
  FileText,
  Calendar,
  Users,
  MapPin,
  Flag,
  BookOpen,
  Brain,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Crown,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Shield,
  Briefcase,
  GraduationCap,
  Home,
  Building,
  Heart,
  Star,
  Zap,
  Lightbulb,
  Search,
  Filter,
  Download,
  Share2,
  Settings,
  User,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  const { t } = useLanguage();
  const router = useRouter();

  const [simulations, setSimulations] = useState<ImmigrationSimulation[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulations();
    fetchMonthlyCount();
  }, []);

  const fetchSimulations = async () => {
    try {
      const response = await fetch('/api/immigration-simulation/history/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimulations(data.data || []);
      } else {
        toast.error('Erreur lors du chargement des simulations');
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyCount = async () => {
    try {
      const response = await fetch('/api/immigration-simulation/monthly-count/user', {
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

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'CANADA': '🇨🇦',
      'FRANCE': '🇫🇷',
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'AUSTRALIA': '🇦🇺',
      'GERMANY': '🇩🇪',
      'SPAIN': '🇪🇸',
      'ITALY': '🇮🇹'
    };
    return flags[country] || '🌍';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Real Airplane Background */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 overflow-hidden">
        {/* Real Airplane Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
            alt="Airplane in flight"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Plane className="w-8 h-8 text-white" />
              </div>
          </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Simulations d'Immigration
          </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Préparez-vous pour votre nouvelle vie</strong> avec nos simulations d'immigration réalistes. 
              Maîtrisez les questions spécifiques à chaque pays, comprenez les exigences culturelles, 
              et naviguez dans les processus d'immigration avec confiance.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-200 mb-8">
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-300" />
                Questions spécifiques par pays
              </div>
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2 text-blue-300" />
                Adaptation culturelle
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-300" />
                Vérification de documents
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                Suivi des processus
            </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg"
                onClick={() => router.push('/immigration-simulations/questions')}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Commencer la simulation
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 text-lg bg-white/10 backdrop-blur-sm"
                onClick={() => router.push('/immigration-simulations/cultural')}
              >
                <Globe className="w-5 h-5 mr-2" />
                Explorer les pays
              </Button>
            </div>
          </div>
        </div>
                  </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Alerts */}
                  {monthlyCount >= 2 && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 mr-4" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Limite mensuelle atteinte</h3>
                <p className="text-red-700 dark:text-red-300 mt-2">
                  Vous avez utilisé toutes vos 2 simulations ce mois-ci. Passez à la version PRO pour un accès illimité.
                </p>
                <Button 
                  size="sm" 
                  className="mt-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  Passer à PRO
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisation mensuelle</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{monthlyCount}/2</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
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

          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminées</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {simulations.filter(s => s.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pays explorés</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {new Set(simulations.map(s => s.country)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score moyen</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {simulations.filter(s => s.score).length > 0 
                      ? Math.round(simulations.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / simulations.filter(s => s.score).length)
                      : '--'
                    }%
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Questions Card */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/immigration-simulations/questions')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Questions d'immigration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Pratiquez avec des questions spécifiques à chaque pays et adaptées à votre situation</p>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                Commencer
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>

          {/* Cultural Context Card */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/immigration-simulations/cultural')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Contexte culturel</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Apprenez les nuances culturelles et les attentes sociales de votre pays de destination</p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                Explorer
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-gray-800 dark:border-gray-700" onClick={() => router.push('/immigration-simulations/documents')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Agents d'immigration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Vérifiez et organisez tous les documents nécessaires pour votre dossier d'immigration</p>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                Vérifier
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <Clock className="w-5 h-5 mr-2" />
              Activité récente
                </CardTitle>
              </CardHeader>
          <CardContent>
            {simulations.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Aucune simulation pour le moment</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Commencez votre première simulation d'immigration pour explorer votre nouveau pays</p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  onClick={() => router.push('/immigration-simulations/questions')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Commencer une simulation
                </Button>
                  </div>
                ) : (
              <div className="space-y-4">
                {simulations.slice(0, 5).map((simulation) => (
                  <div key={simulation.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getCountryFlag(simulation.country)}</span>
                      </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {simulation.country} - {simulation.category}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(simulation.createdAt).toLocaleDateString('fr-FR')}
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
                      {simulation.score && (
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {simulation.score}%
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
                      onClick={() => router.push('/immigration-simulations/history')}
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

export default function ImmigrationPage() {
  return (
    <SharedDataProvider>
      <ImmigrationPageContent />
    </SharedDataProvider>
  );
}