'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Globe,
  Users,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Download,
  Upload,
  Share2,
  Bot,
  MessageCircle,
  Phone,
  Mail,
  Building,
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
  Send,
  X,
  Minimize2,
  Maximize2,
  ArrowLeft,
  Flag,
  MapPin,
  Calendar,
  BookOpen,
  Lightbulb,
  Star,
  Heart,
  Home,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';

function DocumentsPageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

  const sendAIMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: currentMessage };
    setAiMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = { 
        role: 'assistant' as const, 
        content: `Merci pour votre question sur l'immigration vers ${countries.find(c => c.code === selectedCountry)?.name}. Nos agents d'immigration spécialisés vous aideront bientôt avec des conseils personnalisés...` 
      };
      setAiMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
            alt="Immigration agents"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Agents d'Immigration
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Ici vous avez nos partenaires d'immigration</strong> pour différents pays francophones.
              Nos agents spécialisés vous accompagnent dans votre processus d'immigration avec expertise et professionnalisme.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-200 mb-8">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-300" />
                Expertise certifiée
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-300" />
                Accompagnement personnalisé
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-300" />
                Suivi complet
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Country Selection */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Sélectionnez votre pays de destination</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choisissez votre pays de destination pour accéder à nos agents d'immigration spécialisés
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {countries.map((country) => (
                <Button
                  key={country.code}
                  variant={selectedCountry === country.code ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                    selectedCountry === country.code 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedCountry(country.code)}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        {selectedCountry && (
          <div className="space-y-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Agent pas encore disponible
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                  Nos agents d'immigration spécialisés pour <strong>{countries.find(c => c.code === selectedCountry)?.name}</strong> ne sont pas encore disponibles. 
                  Nous travaillons activement pour vous offrir un service d'accompagnement personnalisé de qualité.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Agents certifiés</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Nos agents sont certifiés et spécialisés dans l'immigration
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Accompagnement sécurisé</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Suivi personnalisé et sécurisé de votre dossier
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Expertise reconnue</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Plus de 10 ans d'expérience dans l'immigration
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Que proposeront nos agents ?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Évaluation de votre profil d'immigration
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Conseils personnalisés selon votre situation
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Aide à la préparation des documents
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Suivi de votre dossier jusqu'à l'obtention
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline"
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setSelectedCountry('')}
                  >
                    Changer de pays
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Chat en direct</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Communiquez directement avec votre agent d'immigration via chat sécurisé
                  </p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Gestion de documents</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Upload et suivi de vos documents d'immigration en temps réel
                  </p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Rendez-vous</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Planifiez des consultations avec votre agent d'immigration
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!selectedCountry && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Agents spécialisés</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nos agents sont certifiés et spécialisés dans l'immigration vers les pays francophones.
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Accompagnement sécurisé</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Suivi personnalisé et sécurisé de votre dossier d'immigration.
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Expertise reconnue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Plus de 10 ans d'expérience dans l'accompagnement à l'immigration.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* AI Assistant Floating Button */}
      {selectedCountry && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 shadow-lg"
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
                <Bot className="w-5 h-5 text-blue-600" />
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
                      ? 'bg-blue-600 text-white' 
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                />
                <Button onClick={sendAIMessage} size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
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

export default function DocumentsPage() {
  return (
    <SharedDataProvider>
      <DocumentsPageContent />
    </SharedDataProvider>
  );
}