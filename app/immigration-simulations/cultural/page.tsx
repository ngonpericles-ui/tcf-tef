'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Users,
  Globe,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  Info,
  Lightbulb,
  BookOpen,
  MapPin,
  Flag,
  Star,
  CheckCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Bookmark,
  MessageCircle,
  Phone,
  Mail,
  Building,
  Shield,
  Award,
  TrendingUp,
  Target,
  Zap,
  Crown,
  Brain,
  Search,
  Filter,
  Settings,
  User,
  HelpCircle,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Plane
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';

interface CulturalInfo {
  country: string;
  category: string;
  title: string;
  description: string;
  content: string;
  tips: string[];
  doAndDont: {
    do: string[];
    dont: string[];
  };
  culturalNorms: {
    greeting: string;
    personalSpace: string;
    communication: string;
    business: string;
    social: string;
  };
  importantDates: {
    name: string;
    date: string;
    description: string;
  }[];
  resources: {
    type: 'VIDEO' | 'ARTICLE' | 'BOOK' | 'WEBSITE';
    title: string;
    url: string;
    description: string;
  }[];
}

function CulturalPageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [culturalInfo, setCulturalInfo] = useState<CulturalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const countries = [
    { code: 'CANADA', name: 'Canada', flag: '🇨🇦', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' },
    { code: 'FRANCE', name: 'France', flag: '🇫🇷', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80' },
    { code: 'BELGIUM', name: 'Belgique', flag: '🇧🇪', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' },
    { code: 'SWITZERLAND', name: 'Suisse', flag: '🇨🇭', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' },
    { code: 'LUXEMBOURG', name: 'Luxembourg', flag: '🇱🇺', image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' },
    { code: 'MOROCCO', name: 'Maroc', flag: '🇲🇦', image: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' },
    { code: 'SENEGAL', name: 'Sénégal', flag: '🇸🇳', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?ixlib=rb-4.0.3&auto=format&fit=crop&w=2099&q=80' },
    { code: 'IVORY_COAST', name: 'Côte d\'Ivoire', flag: '🇨🇮', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' }
  ];

  const categories = [
    { code: 'GENERAL', name: 'Culture générale', icon: Globe, color: 'blue' },
    { code: 'SOCIAL', name: 'Vie sociale', icon: Users, color: 'green' },
    { code: 'WORK', name: 'Monde du travail', icon: Briefcase, color: 'purple' },
    { code: 'EDUCATION', name: 'Éducation', icon: GraduationCap, color: 'orange' },
    { code: 'FAMILY', name: 'Vie familiale', icon: Home, color: 'pink' },
    { code: 'HEALTHCARE', name: 'Santé', icon: Heart, color: 'red' },
    { code: 'GOVERNMENT', name: 'Administration', icon: Building, color: 'indigo' },
    { code: 'LEISURE', name: 'Loisirs', icon: Calendar, color: 'yellow' }
  ];

  useEffect(() => {
    if (selectedCountry && selectedCategory) {
      fetchCulturalInfo();
    }
  }, [selectedCountry, selectedCategory]);

  const fetchCulturalInfo = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real implementation, this would fetch from backend
      const mockCulturalInfo: CulturalInfo = {
        country: selectedCountry,
        category: selectedCategory,
        title: `Culture ${categories.find(c => c.code === selectedCategory)?.name} en ${countries.find(c => c.code === selectedCountry)?.name}`,
        description: `Découvrez les nuances culturelles de ${countries.find(c => c.code === selectedCountry)?.name} dans le domaine ${categories.find(c => c.code === selectedCategory)?.name.toLowerCase()}.`,
        content: `La culture ${categories.find(c => c.code === selectedCategory)?.name.toLowerCase()} en ${countries.find(c => c.code === selectedCountry)?.name} est riche et diversifiée. Elle reflète l'histoire, les traditions et les valeurs de cette société.`,
        tips: [
          'Respectez les coutumes locales',
          'Apprenez quelques phrases de base',
          'Observez les comportements des locaux',
          'Soyez ouvert aux différences culturelles'
        ],
        doAndDont: {
          do: [
            'Saluer poliment selon les coutumes locales',
            'Respecter les horaires et les rendez-vous',
            'Être patient et compréhensif',
            'Apprendre la langue locale'
          ],
          dont: [
            'Imposer ses propres valeurs',
            'Critiquer ouvertement les coutumes',
            'Être impatient avec les différences',
            'Ignorer les règles sociales'
          ]
        },
        culturalNorms: {
          greeting: 'Les salutations varient selon le contexte et la relation',
          personalSpace: 'Respectez l\'espace personnel selon les normes locales',
          communication: 'La communication peut être directe ou indirecte selon la culture',
          business: 'Les relations d\'affaires suivent des protocoles spécifiques',
          social: 'Les interactions sociales ont leurs propres règles'
        },
        importantDates: [
          { name: 'Fête nationale', date: '1er janvier', description: 'Jour de célébration nationale' },
          { name: 'Fête du travail', date: '1er mai', description: 'Jour férié pour les travailleurs' }
        ],
        resources: [
          { type: 'VIDEO', title: 'Guide culturel', url: '#', description: 'Vidéo explicative sur la culture' },
          { type: 'ARTICLE', title: 'Conseils pratiques', url: '#', description: 'Article avec des conseils utiles' }
        ]
      };
      setCulturalInfo(mockCulturalInfo);
    } catch (error) {
      console.error('Error fetching cultural info:', error);
      toast.error('Erreur lors du chargement des informations culturelles');
    } finally {
      setLoading(false);
    }
  };

  const sendAIMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: currentMessage };
    setAiMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = { 
        role: 'assistant' as const, 
        content: `Merci pour votre question sur la culture ${categories.find(c => c.code === selectedCategory)?.name.toLowerCase()} en ${countries.find(c => c.code === selectedCountry)?.name}. Voici une réponse détaillée basée sur les informations culturelles disponibles...` 
      };
      setAiMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(c => c.code === category);
    return categoryData?.color || 'gray';
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.code === category);
    return categoryData?.icon || Globe;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-teal-800 dark:from-green-900 dark:via-green-800 dark:to-teal-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
            alt="Airplane in flight"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Contexte Culturel
            </h1>

            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Découvrez la richesse culturelle</strong> des pays francophones.
              Explorez les traditions, les coutumes et les normes sociales pour une intégration réussie dans votre pays de destination.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-green-200 mb-8">
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-green-300" />
                Spécifique par pays
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-green-300" />
                Normes sociales
              </div>
              <div className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-green-300" />
                Conseils pratiques
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Country and Category Selection */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Sélectionnez votre destination et catégorie</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choisissez votre pays de destination et la catégorie culturelle qui vous intéresse
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Sélectionnez votre destination
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {countries.map((country) => (
                    <Button
                      key={country.code}
                      variant={selectedCountry === country.code ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center space-y-2 ${
                        selectedCountry === country.code 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedCountry(country.code)}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-xs font-medium">{country.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Sélectionnez votre catégorie
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <Button
                      key={category.code}
                      variant={selectedCategory === category.code ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center space-y-2 ${
                        selectedCategory === category.code 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedCategory(category.code)}
                    >
                      <category.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cultural Information */}
        {selectedCountry && selectedCategory && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : culturalInfo ? (
              <>
                {/* Cultural Information */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${getColorClasses(getCategoryColor(selectedCategory))} rounded-lg flex items-center justify-center`}>
                          {React.createElement(getCategoryIcon(selectedCategory), { className: "w-6 h-6" })}
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 dark:text-gray-100">{culturalInfo.title}</CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{culturalInfo.description}</p>
                        </div>
                      </div>
                      <Badge className={getColorClasses(getCategoryColor(selectedCategory))}>
                        {categories.find(c => c.code === selectedCategory)?.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 dark:bg-gray-700">
                        <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100">
                          Aperçu
                        </TabsTrigger>
                        <TabsTrigger value="norms" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100">
                          Normes
                        </TabsTrigger>
                        <TabsTrigger value="tips" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100">
                          Conseils
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100">
                          Ressources
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="mt-6">
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {culturalInfo.content}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="norms" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Normes culturelles</h4>
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Salutations</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.greeting}</p>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Espace personnel</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.personalSpace}</p>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Communication</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.communication}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contexte professionnel</h4>
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Monde du travail</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.business}</p>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Vie sociale</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.social}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tips" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              À faire
                            </h4>
                            <ul className="space-y-2">
                              {culturalInfo.doAndDont.do.map((tip, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                              <AlertTriangle className="w-5 h-5 mr-2" />
                              À éviter
                            </h4>
                            <ul className="space-y-2">
                              {culturalInfo.doAndDont.dont.map((tip, index) => (
                                <li key={index} className="flex items-start">
                                  <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="resources" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {culturalInfo.resources.map((resource, index) => (
                            <Card key={index} className="dark:bg-gray-700 dark:border-gray-600">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                    {resource.type === 'VIDEO' && <Play className="w-4 h-4 text-green-600" />}
                                    {resource.type === 'ARTICLE' && <BookOpen className="w-4 h-4 text-green-600" />}
                                    {resource.type === 'BOOK' && <BookOpen className="w-4 h-4 text-green-600" />}
                                    {resource.type === 'WEBSITE' && <Globe className="w-4 h-4 text-green-600" />}
                                  </div>
                                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                    {resource.type}
                                  </Badge>
                                </div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{resource.title}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{resource.description}</p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                  onClick={() => window.open(resource.url, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Consulter
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <Globe className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Aucun contenu culturel disponible</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Aucun contenu culturel n'est disponible pour cette combinaison pays/catégorie.
                  </p>
                  <Button 
                    variant="outline"
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSelectedCountry('');
                      setSelectedCategory('');
                    }}
                  >
                    Changer la sélection
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Help Section */}
        {!selectedCountry && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Interactions sociales</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Apprenez les codes sociaux, les salutations appropriées et les comportements attendus.
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Monde professionnel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Découvrez les normes professionnelles, les attentes au travail et la culture d'entreprise.
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Vie quotidienne</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Comprenez les habitudes de vie, les services publics et l'organisation sociale.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* AI Assistant Floating Button */}
      {selectedCountry && selectedCategory && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 shadow-lg"
          >
            <Bot className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Assistant IA</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIAssistant(false)}
                className="dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {aiMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Posez votre question..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                />
                <Button onClick={sendAIMessage} size="sm" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CulturalPage() {
  return (
    <SharedDataProvider>
      <CulturalPageContent />
    </SharedDataProvider>
  );
}