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
import { SimulationHeader } from '@/components/SimulationHeader';
import { motion } from 'framer-motion';

function DocumentsPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();
  
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

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
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="documents" type="immigration" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
        {/* Hero Section - Matching Image Design */}
        <section className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4"
          >
            <span className="text-black dark:text-white">{t_("Immigration", "Immigration")}</span>{' '}
            <span className="text-[#2ECC71]">{t_("Agents", "Agents")}</span>{' '}
            <span className="text-black dark:text-white">&</span>{' '}
            <span className="text-[#2ECC71]">{t_("Support", "Support")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            {t_(
              "Votre connexion de confiance avec des experts en immigration certifiés pour les nations francophones.",
              "Your trusted connection to certified immigration experts for francophone nations."
            )}
          </motion.p>
        </section>

        {/* Main Content Area - Large Light Green Box */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full h-[400px] md:h-[500px] rounded-2xl bg-gradient-to-br from-[#2ECC71]/20 via-[#2ECC71]/10 to-[#2ECC71]/5 border-2 border-[#2ECC71]/20 overflow-hidden"
          >
            {/* Placeholder Content - Globe Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#2ECC71]/10 border-4 border-[#2ECC71]/30 flex items-center justify-center">
                  <Globe className="w-24 h-24 md:w-32 md:h-32 text-[#2ECC71]" />
                </div>
                {/* Decorative Arrow/S Shape */}
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <svg className="w-64 h-64 md:w-80 md:h-80" viewBox="0 0 200 200" fill="none">
                    <path
                      d="M 50 100 Q 100 50 150 100 Q 100 150 50 100"
                      stroke="#2ECC71"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                    <path
                      d="M 50 100 L 150 100"
                      stroke="#2ECC71"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.3"
                    />
                  </svg>
                </motion.div>
              </div>
            </div>
            {/* Floating AI Assistant Button */}
            <div className="absolute bottom-6 right-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="w-14 h-14 rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-white shadow-lg flex items-center justify-center transition-all"
              >
                <Bot className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Country Selection Section */}
        <section className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-3xl md:text-4xl font-bold mb-8"
          >
            <span className="text-black dark:text-white">{t_("Sélectionnez votre", "Select Your")}</span>{' '}
            <span className="text-[#2ECC71]">{t_("Destination", "Destination")}</span>
          </motion.h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {countries.slice(0, 4).map((country) => (
              <motion.button
                  key={country.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + countries.indexOf(country) * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCountry(country.code)}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all ${
                    selectedCountry === country.code 
                    ? 'bg-[#2ECC71]/20 border-4 border-[#2ECC71] shadow-lg shadow-[#2ECC71]/30'
                    : 'bg-white dark:bg-white/5 border-2 border-transparent hover:border-[#2ECC71]/30'
                  }`}
                >
                <span className="text-4xl md:text-5xl">{country.flag}</span>
                <span className={`font-semibold text-base md:text-lg ${
                  selectedCountry === country.code
                    ? 'text-[#2ECC71]'
                    : 'text-black dark:text-white'
                }`}>
                  {country.name}
                </span>
              </motion.button>
              ))}
            </div>
        </section>

        {/* Agent Status Section */}
        {selectedCountry && (
          <section className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl p-8 md:p-12 border border-white/20"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="text-black dark:text-white">{countries.find(c => c.code === selectedCountry)?.name}</span>{' '}
                <span className="text-black dark:text-white">-</span>{' '}
                <span className="text-black dark:text-white">{t_("Statut de l'Agent", "Agent Status")}</span>
                </h2>
              <p className="text-xl md:text-2xl font-bold text-[#2ECC71] mb-6">
                {t_("Agents bientôt disponibles", "Agents Coming Soon")}
              </p>
              <p className="text-muted-foreground mb-8 max-w-3xl">
                {t_(
                  "Notre réseau d'agents certifiés pour le Canada sera bientôt lancé. Nous travaillons avec diligence pour vous offrir un accompagnement sécurisé et une expertise reconnue pour tous vos besoins d'immigration.",
                  "Our network of certified agents for Canada is launching soon. We are working diligently to provide you with secure support and recognized expertise for all your immigration needs."
                )}
              </p>
              
              {/* Feature List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#2ECC71]/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black dark:text-white mb-1">
                      {t_("Agents Certifiés", "Certified Agents")}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#2ECC71]/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-[#2ECC71]" />
                    </div>
                  <div>
                    <h3 className="font-bold text-black dark:text-white mb-1">
                      {t_("Accompagnement Sécurisé", "Secure Support")}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#2ECC71]/20 flex items-center justify-center flex-shrink-0">
                    <Award className="w-8 h-8 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black dark:text-white mb-1">
                      {t_("Expertise Reconnue", "Recognized Expertise")}
                    </h3>
                  </div>
            </div>
          </div>
            </motion.div>
          </section>
        )}

        {/* Future Enhancements Section */}
        <section className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-3xl md:text-4xl font-bold mb-8"
          >
            <span className="text-black dark:text-white">{t_("Futures", "Future")}</span>{' '}
            <span className="text-[#2ECC71]">{t_("Améliorations", "Enhancements")}</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Document Verification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:-translate-y-1 transition-transform"
            >
              <div className="w-16 h-16 rounded-lg bg-[#2ECC71]/20 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[#2ECC71]" />
                </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                {t_("Vérification de Documents", "Document Verification")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t_(
                  "Vérifications alimentées par l'IA pour garantir que vos documents sont corrects et complets avant la soumission.",
                  "AI-powered checks to ensure your documents are correct and complete before submission."
                )}
                </p>
            </motion.div>

            {/* Application Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:-translate-y-1 transition-transform"
            >
              <div className="w-16 h-16 rounded-lg bg-[#2ECC71]/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-[#2ECC71]" />
                </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                {t_("Suivi de Demande", "Application Tracking")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t_(
                  "Mises à jour en temps réel sur le statut de votre demande directement depuis les sources officielles.",
                  "Real-time updates on your application status directly from official sources."
                )}
                </p>
            </motion.div>

            {/* Visa Consultation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:-translate-y-1 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-[#2ECC71]/20 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-[#2ECC71]" />
                </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                {t_("Consultation Visa", "Visa Consultation")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t_(
                  "Réservez des séances en tête-à-tête avec nos agents certifiés pour discuter de votre cas spécifique.",
                  "Book one-on-one sessions with our certified agents to discuss your specific case."
                )}
                </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAIAssistant(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md h-[500px] flex flex-col border border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#2ECC71]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#2ECC71]" />
                </div>
                <h3 className="font-bold text-black dark:text-white">
                  {t_("Assistant IA", "AI Assistant")}
                </h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIAssistant(false)}
                className="text-muted-foreground hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {aiMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-[#2ECC71] opacity-50" />
                  <p>{t_("Posez votre question sur l'immigration...", "Ask your immigration question...")}</p>
                </div>
              ) : (
                aiMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                  <div className={`max-w-xs p-3 rounded-lg ${
                    message.role === 'user' 
                        ? 'bg-[#2ECC71] text-white' 
                        : 'bg-white/10 dark:bg-white/5 text-black dark:text-white border border-white/20'
                  }`}>
                    {message.content}
                  </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={t_("Posez votre question...", "Ask your question...")}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                />
                <Button 
                  onClick={sendAIMessage} 
                  size="sm" 
                  className="bg-[#2ECC71] hover:bg-[#27c066] text-black font-bold"
                  disabled={!currentMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
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