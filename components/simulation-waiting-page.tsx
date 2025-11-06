'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Lock, Shield, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Simple language hook (can be replaced with useLanguage from language-provider if available)
function useLanguage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  return { t: (fr: string, en: string) => lang === 'fr' ? fr : en, lang, setLang };
}

interface SimulationWaitingPageProps {
  minutesUntilAccessible: number;
  scheduledDate?: string;
  simulationType?: 'voice' | 'immigration';
  onRetry?: () => void;
}

export function SimulationWaitingPage({
  minutesUntilAccessible,
  scheduledDate,
  simulationType = 'voice',
  onRetry
}: SimulationWaitingPageProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [minutesLeft, setMinutesLeft] = useState(minutesUntilAccessible);

  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  useEffect(() => {
    // Update countdown every minute
    const interval = setInterval(() => {
      if (scheduledDate) {
        const now = new Date();
        const scheduled = new Date(scheduledDate);
        const timeUntilStart = (scheduled.getTime() - now.getTime()) / (1000 * 60);
        const newMinutesLeft = Math.max(0, Math.ceil(timeUntilStart - 5));
        setMinutesLeft(newMinutesLeft);
        
        // If time is up, try to reload
        if (newMinutesLeft <= 0) {
          if (onRetry) {
            onRetry();
          }
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [scheduledDate, onRetry]);

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    return `${minutes} ${t_('minute', 'minute')}${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900/50 dark:border-gray-800">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="text-center">
              {/* Animated SVG Icon - Lock with Clock */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2
                }}
                className="mb-8"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-500 p-10 rounded-full shadow-2xl">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-32 h-32 text-white"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Lock base */}
                      <rect x="70" y="90" width="60" height="50" rx="5" fill="white" opacity="0.9"/>
                      <path d="M 70 90 L 70 75 Q 70 55 90 55 L 110 55 Q 130 55 130 75 L 130 90" stroke="white" strokeWidth="8" strokeLinecap="round" fill="none"/>
                      
                      {/* Clock face */}
                      <circle cx="100" cy="115" r="15" fill="white" opacity="0.3"/>
                      <circle cx="100" cy="115" r="12" stroke="white" strokeWidth="2" fill="none"/>
                      {/* Clock hands */}
                      <line x1="100" y1="115" x2="100" y2="108" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="100" y1="115" x2="105" y2="115" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      
                      {/* Shield icon overlay */}
                      <path d="M 100 40 L 115 50 L 115 75 Q 115 85 110 90 Q 100 95 90 90 Q 85 85 85 75 L 85 50 Z" fill="white" opacity="0.8"/>
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
              >
                {t_('Accès Temporairement Restreint', 'Access Temporarily Restricted')}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
              >
                {t_(
                  'Pour des raisons de sécurité, ce lien sera accessible 5 minutes avant le début de votre simulation.',
                  'For security reasons, this link will be accessible 5 minutes before your simulation starts.'
                )}
              </motion.p>

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-4 px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
                  <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
                  <div className="text-left">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t_('Accès dans', 'Access in')}
                    </div>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {formatTime(minutesLeft)}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Security Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8 p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div className="text-left text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-semibold mb-2 text-blue-800 dark:text-blue-300">
                      {t_('Pourquoi cette restriction ?', 'Why this restriction?')}
                    </div>
                    <p>
                      {t_(
                        'Cette mesure de sécurité garantit que seul vous pouvez accéder à votre simulation au bon moment et protège vos données personnelles.',
                        'This security measure ensures that only you can access your simulation at the right time and protects your personal data.'
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                {onRetry && minutesLeft <= 0 && (
                  <Button
                    onClick={onRetry}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    size="lg"
                  >
                    {t_('Réessayer', 'Try Again')}
                  </Button>
                )}
                <Button
                  onClick={() => router.push(simulationType === 'voice' ? '/simulation-vocale' : '/immigration-simulations')}
                  variant="outline"
                  className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  size="lg"
                >
                  {t_('Retour', 'Back')}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

