'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AssistantContext {
  page: string;
  userLevel?: string;
  simulationType?: 'voice' | 'immigration';
  country?: string;
  immigrationType?: string;
  language: 'fr' | 'en';
}

interface UseFloatingAiAssistantProps {
  page: string;
  simulationType?: 'voice' | 'immigration';
  country?: string;
  immigrationType?: string;
  language?: 'fr' | 'en';
}

export function useFloatingAiAssistant({
  page,
  simulationType,
  country,
  immigrationType,
  language = 'fr'
}: UseFloatingAiAssistantProps) {
  const { user } = useAuth();
  const [context, setContext] = useState<AssistantContext>({
    page,
    language
  });

  useEffect(() => {
    // Update context when props change
    setContext({
      page,
      userLevel: user?.currentLevel || undefined,
      simulationType,
      country,
      immigrationType,
      language
    });
  }, [page, user?.currentLevel, simulationType, country, immigrationType, language]);

  // Helper function to update context dynamically
  const updateContext = (updates: Partial<AssistantContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  return {
    context,
    updateContext,
    isEnabled: !!user // Only show for authenticated users
  };
}

// Predefined page contexts for common pages
export const PAGE_CONTEXTS = {
  VOICE_SIMULATION: 'voice-simulation',
  IMMIGRATION_SIMULATION: 'immigration-simulation',
  TCF_TEF_SIMULATION: 'tcf-tef-simulation',
  MARKETPLACE: 'marketplace',
  PROFILE: 'profile',
  RESULTS: 'results',
  EXPERTISE: 'expertise'
} as const;

// Helper function to get context for specific simulation pages
export function getSimulationContext(
  simulationType: 'voice' | 'immigration',
  country?: string,
  immigrationType?: string
): Partial<UseFloatingAiAssistantProps> {
  if (simulationType === 'voice') {
    return {
      page: PAGE_CONTEXTS.VOICE_SIMULATION,
      simulationType: 'voice'
    };
  }

  return {
    page: PAGE_CONTEXTS.IMMIGRATION_SIMULATION,
    simulationType: 'immigration',
    country,
    immigrationType
  };
}
