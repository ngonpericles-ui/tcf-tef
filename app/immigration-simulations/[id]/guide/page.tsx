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
  MessageSquare,
  Plane,
  Globe
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { motion } from 'framer-motion';

function ImmigrationGuideContent() {
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
        t_('Parlez naturellement, comme dans une conversation réelle avec un agent d\'immigration', 'Speak naturally, like in a real conversation with an immigration officer'),
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
        t_('Donnez des réponses complètes, développez vos idées', 'Give complete answers, develop your ideas'),
        t_('Les questions commenceront par des questions personnelles simples', 'Questions will start with simple personal questions'),
        t_('Ensuite, des questions spécifiques sur votre sujet d\'immigration seront posées', 'Then, specific questions about your immigration topic will be asked')
      ]
    },
    {
      icon: CheckCircle,
      title: t_('Vérifications finales', 'Final checks'),
      items: [
        t_('Votre microphone est activé et fonctionne', 'Your microphone is enabled and working'),
        t_('Votre caméra est activée et fonctionne', 'Your camera is enabled and working'),
        t_('Vous êtes dans un endroit calme', 'You are in a quiet place'),
        t_('Vous êtes prêt à commencer votre entretien d\'immigration', 'You are ready to start your immigration interview')
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark guide as seen
      if (simulationId) {
        localStorage.setItem(`guide_seen_immigration_${simulationId}`, 'true');
      }
      // Redirect to simulation interface
      const url = token
        ? `/immigration-simulations/${simulationId}?token=${token}`
        : `/immigration-simulations/${simulationId}`;
      router.push(url);
    }
  };

  const handleSkip = () => {
    // Mark guide as seen
    if (simulationId) {
      localStorage.setItem(`guide_seen_immigration_${simulationId}`, 'true');
    }
    const url = token
      ? `/immigration-simulations/${simulationId}?token=${token}`
      : `/immigration-simulations/${simulationId}`;
    router.push(url);
  };

  const IconComponent = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {t_('Guide de Préparation - Immigration', 'Immigration Preparation Guide')}
            </h1>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {t_('Passer', 'Skip')}
            </Button>
          </div>
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index <= currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main content card */}
        <Card className="shadow-xl border-0 bg-white dark:bg-gray-900/50 dark:border-gray-800">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              {/* Animated 3D icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-500 p-8 rounded-full shadow-2xl transform hover:scale-110 transition-transform">
                    <IconComponent className="w-16 h-16 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.h2
                key={currentStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6"
              >
                {steps[currentStep].title}
              </motion.h2>
            </div>

            {/* Items list with animations */}
            <div className="space-y-4 mb-8">
              {steps[currentStep].items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800"
                >
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 text-lg">{item}</p>
                </motion.div>
              ))}
            </div>

            {/* Icon showcase for current step */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-6 mb-8"
              >
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="inline-block bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl shadow-lg mb-3"
                  >
                    <Mic className="w-12 h-12 text-white" />
                  </motion.div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t_('Microphone', 'Microphone')}</p>
                </div>
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.5
                    }}
                    className="inline-block bg-gradient-to-br from-indigo-400 to-indigo-600 p-6 rounded-2xl shadow-lg mb-3"
                  >
                    <Video className="w-12 h-12 text-white" />
                  </motion.div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t_('Caméra', 'Camera')}</p>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 dark:border-gray-700 dark:text-gray-300"
              >
                {t_('Précédent', 'Previous')}
              </Button>
              <Button
                onClick={handleNext}
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
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

        {/* Footer tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <p>{t_('Durée estimée de la simulation: 5 minutes', 'Estimated simulation duration: 5 minutes')}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ImmigrationGuidePage() {
  return (
    <SharedDataProvider>
      <ImmigrationGuideContent />
    </SharedDataProvider>
  );
}

