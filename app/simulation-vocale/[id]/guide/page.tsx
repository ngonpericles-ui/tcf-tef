'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mic,
  Video,
  Volume2,
  CheckCircle,
  ArrowRight,
  Headphones,
  Moon,
  Clock,
  AlertCircle,
  Shield,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { motion } from 'framer-motion';

function SimulationGuideContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const simulationId = (params?.id as string | undefined) || undefined;
  const token = (searchParams?.get('token') || null) as string | null;

  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Headphones,
      title: t_('Préparez votre environnement', 'Prepare your environment'),
      items: [
        t_('Trouvez un endroit calme et isolé', 'Find a quiet and isolated place'),
        t_('Éliminez toutes les distractions', 'Eliminate all distractions'),
        t_('Assurez-vous que votre connexion internet est stable', 'Make sure your internet connection is stable'),
        t_('Testez votre microphone et votre caméra avant de commencer', 'Test your microphone and camera before starting')
      ]
    },
    {
      icon: Shield,
      title: t_('Restez calme et naturel', 'Stay calm and natural'),
      items: [
        t_('Respirez profondément et détendez-vous', 'Breathe deeply and relax'),
        t_('Parlez naturellement, comme dans une conversation réelle', 'Speak naturally, like in a real conversation'),
        t_('Ne vous précipitez pas, prenez votre temps pour réfléchir', "Don't rush, take your time to think"),
        t_('Répondez honnêtement, ne mentez jamais', 'Answer honestly, never lie')
      ]
    },
    {
      icon: MessageSquare,
      title: t_('Conseils pour répondre', 'Tips for answering'),
      items: [
        t_('Écoutez attentivement chaque question avant de répondre', 'Listen carefully to each question before answering'),
        t_('Parlez clairement et distinctement', 'Speak clearly and distinctly'),
        t_('Si vous ne comprenez pas, demandez poliment de répéter', "If you don't understand, politely ask to repeat"),
        t_('Donnez des réponses complètes, développez vos idées', 'Give complete answers, develop your ideas')
      ]
    },
    {
      icon: CheckCircle,
      title: t_('Vérifications finales', 'Final checks'),
      items: [
        t_('Votre microphone est activé et fonctionne', 'Your microphone is enabled and working'),
        t_('Votre caméra est activée et fonctionne', 'Your camera is enabled and working'),
        t_('Vous êtes dans un endroit calme', 'You are in a quiet place'),
        t_('Vous êtes prêt à commencer', 'You are ready to start')
      ]
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Marquer que le guide a été vu
      if (simulationId) {
        localStorage.setItem(`guide_seen_${simulationId}`, 'true');
      }
      
      // Check if this is a direct start (from button click)
      const isDirectStart = localStorage.getItem(`direct_start_${simulationId}`) === 'true';
      
      if (isDirectStart) {
        // For direct start: redirect to simulation room with auto-start flag
        // Remove the direct_start flag
        localStorage.removeItem(`direct_start_${simulationId}`);
        const url = token
          ? `/simulation-vocale/${simulationId}?token=${token}&autoStart=true`
          : `/simulation-vocale/${simulationId}?autoStart=true`;
        router.push(url);
      } else {
        // For email/reservation access: normal redirect
        const url = token
          ? `/simulation-vocale/${simulationId}?token=${token}`
          : `/simulation-vocale/${simulationId}`;
        router.push(url);
      }
    }
  };

  const handleSkip = async () => {
    // Marquer que le guide a été vu
    if (simulationId) {
      localStorage.setItem(`guide_seen_${simulationId}`, 'true');
    }
    
    // Check if this is a direct start
    const isDirectStart = localStorage.getItem(`direct_start_${simulationId}`) === 'true';
    
    if (isDirectStart) {
      // For direct start: redirect with auto-start flag
      localStorage.removeItem(`direct_start_${simulationId}`);
      const url = token
        ? `/simulation-vocale/${simulationId}?token=${token}&autoStart=true`
        : `/simulation-vocale/${simulationId}?autoStart=true`;
      router.push(url);
    } else {
      // For email/reservation access: normal redirect
      const url = token
        ? `/simulation-vocale/${simulationId}?token=${token}`
        : `/simulation-vocale/${simulationId}`;
      router.push(url);
    }
  };

  const IconComponent = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl w-full"
      >
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t_('Guide de Préparation', 'Preparation Guide')}
            </h1>
              <p className="text-sm text-gray-600">
                {t_('Suivez ces étapes pour vous préparer à la simulation', 'Follow these steps to prepare for the simulation')}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-900"
            >
              {t_('Passer', 'Skip')}
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex gap-2 mb-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index <= currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 text-center mt-1">
            {t_('Étape', 'Step')} {currentStep + 1} {t_('sur', 'of')} {steps.length}
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="p-8">
            {/* Step Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <IconComponent className="w-10 h-10 text-blue-600" />
                  </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h2>
            </div>

            {/* Items List */}
            <div className="space-y-3 mb-8">
              {steps[currentStep].items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm leading-relaxed flex-1">{item}</p>
                </div>
              ))}
            </div>

            {/* Equipment Icons (Step 1 only) */}
            {currentStep === 0 && (
              <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-3">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{t_('Microphone', 'Microphone')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t_('Vérifiez que votre micro fonctionne', 'Check that your microphone works')}</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-3">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{t_('Caméra', 'Camera')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t_('Vérifiez que votre caméra fonctionne', 'Check that your camera works')}</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="border-gray-300"
              >
                {t_('Précédent', 'Previous')}
              </Button>
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    {t_('Suivant', 'Next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t_('Commencer la simulation', 'Start simulation')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 text-sm bg-gray-50 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <p>{t_('Durée estimée: 5 minutes', 'Estimated duration: 5 minutes')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SimulationGuidePage() {
  return (
    <SharedDataProvider>
      <SimulationGuideContent />
    </SharedDataProvider>
  );
}

