'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  BookOpen,
  Globe,
  Brain,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Flag,
  Users,
  FileText,
  Calendar,
  Award,
  TrendingUp,
  Lightbulb,
  Search,
  Filter,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  HelpCircle,
  Zap,
  Star,
  Crown,
  Shield,
  Briefcase,
  GraduationCap,
  Home,
  Building,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  culturalContext?: string;
  country: string;
}

interface SimulationSession {
  id: string;
  country: string;
  category: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: string };
  score: number;
  startTime: Date;
  endTime?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

function QuestionsPageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<SimulationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const countries = [
    { code: 'CANADA', name: 'Canada', flag: '🇨🇦' },
    { code: 'FRANCE', name: 'France', flag: '🇫🇷' },
    { code: 'USA', name: 'États-Unis', flag: '🇺🇸' },
    { code: 'UK', name: 'Royaume-Uni', flag: '🇬🇧' },
    { code: 'AUSTRALIA', name: 'Australie', flag: '🇦🇺' },
    { code: 'GERMANY', name: 'Allemagne', flag: '🇩🇪' },
    { code: 'SPAIN', name: 'Espagne', flag: '🇪🇸' },
    { code: 'ITALY', name: 'Italie', flag: '🇮🇹' }
  ];

  const categories = [
    { code: 'GENERAL', name: 'Questions générales', icon: Globe },
    { code: 'CULTURAL', name: 'Culture et société', icon: Users },
    { code: 'LEGAL', name: 'Aspects légaux', icon: FileText },
    { code: 'ECONOMIC', name: 'Économie et emploi', icon: Briefcase },
    { code: 'EDUCATION', name: 'Éducation', icon: GraduationCap },
    { code: 'HEALTHCARE', name: 'Santé', icon: Heart },
    { code: 'HOUSING', name: 'Logement', icon: Home },
    { code: 'TRANSPORT', name: 'Transport', icon: Building }
  ];

  useEffect(() => {
    fetchAvailableOptions();
  }, []);

  const fetchAvailableOptions = async () => {
    try {
      const response = await fetch('/api/immigration-simulation/countries');
      if (response.ok) {
        const data = await response.json();
        setAvailableCountries(data.countries || []);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const startSimulation = async () => {
    if (!selectedCountry || !selectedCategory) {
      toast.error('Veuillez sélectionner un pays et une catégorie');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/immigration-simulation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          country: selectedCountry,
          category: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
        toast.success('Simulation démarrée avec succès');
      } else {
        toast.error('Erreur lors du démarrage de la simulation');
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (questionId: string, answer: string) => {
    if (!currentSession) return;

    const updatedAnswers = {
      ...currentSession.answers,
      [questionId]: answer
    };

    setCurrentSession({
      ...currentSession,
      answers: updatedAnswers
    });
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    const nextIndex = currentSession.currentQuestionIndex + 1;
    if (nextIndex < currentSession.questions.length) {
      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: nextIndex
      });
    } else {
      finishSimulation();
    }
  };

  const previousQuestion = () => {
    if (!currentSession || currentSession.currentQuestionIndex === 0) return;

    setCurrentSession({
      ...currentSession,
      currentQuestionIndex: currentSession.currentQuestionIndex - 1
    });
  };

  const finishSimulation = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      const response = await fetch('/api/immigration-simulation/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          answers: currentSession.answers
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession({
          ...currentSession,
          score: data.score,
          endTime: new Date(),
          status: 'COMPLETED'
        });
        setShowResults(true);
        toast.success('Simulation terminée avec succès');
      } else {
        toast.error('Erreur lors de la finalisation');
      }
    } catch (error) {
      console.error('Error finishing simulation:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'HARD': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Facile';
      case 'MEDIUM': return 'Moyen';
      case 'HARD': return 'Difficile';
      default: return 'Inconnu';
    }
  };

  if (currentSession && !showResults) {
    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    const progress = ((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
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
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Simulation en cours</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {countries.find(c => c.code === currentSession.country)?.flag} {currentSession.country} - {categories.find(c => c.code === currentSession.category)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">EN COURS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Question {currentSession.currentQuestionIndex + 1} sur {currentSession.questions.length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% complété
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                    {getDifficultyText(currentQuestion.difficulty)}
                  </Badge>
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    {currentQuestion.category}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)} min
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {currentQuestion.text}
                </h2>
                
                {currentQuestion.culturalContext && (
                  <Alert className="mb-6 dark:bg-gray-700 dark:border-gray-600">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      <strong>Contexte culturel :</strong> {currentQuestion.culturalContext}
                    </AlertDescription>
                  </Alert>
                )}

                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <RadioGroup
                    value={currentSession.answers[currentQuestion.id] || ''}
                    onValueChange={(value) => submitAnswer(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-gray-900 dark:text-gray-100">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'TRUE_FALSE' && (
                  <RadioGroup
                    value={currentSession.answers[currentQuestion.id] || ''}
                    onValueChange={(value) => submitAnswer(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true" className="flex-1 cursor-pointer text-gray-900 dark:text-gray-100">
                        Vrai
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false" className="flex-1 cursor-pointer text-gray-900 dark:text-gray-100">
                        Faux
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.type === 'OPEN_ENDED' && (
                  <div className="space-y-3">
                    <textarea
                      value={currentSession.answers[currentQuestion.id] || ''}
                      onChange={(e) => submitAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Tapez votre réponse ici..."
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentSession.currentQuestionIndex === 0}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                <div className="flex items-center space-x-3">
                  {currentSession.currentQuestionIndex < currentSession.questions.length - 1 ? (
                    <Button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                      Suivant
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={finishSimulation} 
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Finalisation...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Terminer
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (showResults && currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
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
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Résultats de la simulation</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {countries.find(c => c.code === currentSession.country)?.flag} {currentSession.country}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Summary */}
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Félicitations !
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Vous avez terminé la simulation avec un score de
              </p>
              <div className="text-6xl font-bold text-green-600 mb-6">
                {currentSession.score}%
              </div>
              <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {currentSession.questions.length}
                  </div>
                  <div>Questions</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {Math.floor((currentSession.endTime!.getTime() - currentSession.startTime.getTime()) / 60000)} min
                  </div>
                  <div>Durée</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {currentSession.country}
                  </div>
                  <div>Pays</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => {
                setCurrentSession(null);
                setShowResults(false);
              }}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Nouvelle simulation
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => router.push('/immigration-simulations/history')}
            >
              <Eye className="w-5 h-5 mr-2" />
              Voir l'historique
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Questions d'Immigration
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Testez vos connaissances</strong> avec nos simulations d'immigration réalistes. 
              Pratiquez avec des questions spécifiques à chaque pays et adaptées à votre situation d'immigration.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-200 mb-8">
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2 text-blue-300" />
                Questions adaptatives
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-300" />
                Spécifique par pays
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-blue-300" />
                Feedback détaillé
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuration */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Configuration de la simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Pays de destination
                </Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center">
                          <span className="mr-2">{country.flag}</span>
                          {country.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Catégorie
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.code} value={category.code}>
                        <div className="flex items-center">
                          <category.icon className="w-4 h-4 mr-2" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                onClick={startSimulation}
                disabled={!selectedCountry || !selectedCategory || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Démarrage...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Commencer la simulation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Questions adaptatives</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Les questions s'adaptent à votre niveau et à vos réponses précédentes pour une expérience personnalisée.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Spécifique par pays</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Chaque pays a ses propres questions et contextes culturels pour une préparation réaliste.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Feedback détaillé</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Recevez des explications détaillées pour chaque question et des conseils d'amélioration.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <SharedDataProvider>
      <QuestionsPageContent />
    </SharedDataProvider>
  );
}
