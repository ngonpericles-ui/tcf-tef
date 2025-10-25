'use client';

import React, { useState, useEffect } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Settings,
  Volume2,
  Play,
  Pause,
  Mic,
  AlertTriangle,
  Info,
  Crown,
  CheckCircle,
  Star,
  Headphones
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';

interface VoiceOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  accent: 'FRANCE' | 'QUEBEC' | 'BELGIUM';
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleUrl?: string;
}

function VoicePageContent() {
  const { userProfile } = useSharedData();
  const { t } = useLanguage();
  const router = useRouter();

  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voicePreference, setVoicePreference] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [accentPreference, setAccentPreference] = useState<string>('FRANCE');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableVoices();
  }, []);

  const fetchAvailableVoices = async () => {
    try {
      const response = await fetch('/api/voice-simulation/voices');
      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.data || []);
      } else {
        setAvailableVoices([]);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePreview = async (voiceId: string) => {
    setPlayingVoice(voiceId);
    // TODO: Implement actual voice preview
    toast.info('Voice preview feature coming soon');
    setTimeout(() => setPlayingVoice(null), 2000);
  };

  const handleVoiceSelection = (voiceId: string) => {
    setSelectedVoice(voiceId);
    toast.success('Voice selected successfully');
  };

  const handleSavePreferences = async () => {
    try {
      // TODO: Implement save preferences API
      toast.success('Voice preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'HIGH': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccentFlag = (accent: string) => {
    switch (accent) {
      case 'FRANCE': return '🇫🇷';
      case 'QUEBEC': return '🇨🇦';
      case 'BELGIUM': return '🇧🇪';
      default: return '🌍';
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
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 dark:from-purple-900 dark:via-purple-800 dark:to-pink-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Voice and sound waves"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Paramètres vocaux
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Personnalisez votre expérience</strong> avec nos voix IA de haute qualité.
              Choisissez parmi différentes voix, accents et styles pour des simulations réalistes.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-200 mb-8">
              <div className="flex items-center">
                <Volume2 className="w-4 h-4 mr-2 text-purple-300" />
                Voix haute qualité
              </div>
              <div className="flex items-center">
                <Headphones className="w-4 h-4 mr-2 text-purple-300" />
                Aperçu audio
              </div>
              <div className="flex items-center">
                <Settings className="w-4 h-4 mr-2 text-purple-300" />
                Personnalisation
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
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Paramètres vocaux</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configurez vos préférences vocales</p>
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
        {/* Voice Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Configuration vocale</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Préférence vocale</label>
              <Select value={voicePreference} onValueChange={(value) => setVoicePreference(value as 'MALE' | 'FEMALE')}>
                <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Voix masculine</SelectItem>
                  <SelectItem value="FEMALE">Voix féminine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Préférence d'accent</label>
              <Select value={accentPreference} onValueChange={setAccentPreference}>
                <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRANCE">🇫🇷 Français (France)</SelectItem>
                  <SelectItem value="QUEBEC">🇨🇦 Français (Québec)</SelectItem>
                  <SelectItem value="BELGIUM">🇧🇪 Français (Belgique)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleSavePreferences}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Sauvegarder les préférences
            </Button>
          </div>
        </div>

        {/* Voice Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Voix disponibles</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Prévisualisez et sélectionnez votre voix préférée</p>
          </div>
          <div className="p-6">
            {availableVoices.length === 0 ? (
              <div className="text-center py-8">
                <Volume2 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Aucune voix disponible</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Les options vocales apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableVoices.map((voice) => (
                  <div key={voice.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <Headphones className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{voice.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {voice.gender === 'MALE' ? 'Masculin' : 'Féminin'} • {voice.accent}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(voice.quality)}`}>
                          {voice.quality === 'HIGH' ? 'Élevée' : voice.quality === 'MEDIUM' ? 'Moyenne' : 'Faible'}
                        </span>
                        <span className="text-lg">{getAccentFlag(voice.accent)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Caractéristiques vocales :</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                          {voice.gender === 'MALE' ? 'Masculin' : 'Féminin'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                          {voice.accent}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                          Qualité {voice.quality === 'HIGH' ? 'élevée' : voice.quality === 'MEDIUM' ? 'moyenne' : 'faible'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVoicePreview(voice.id)}
                        disabled={playingVoice === voice.id}
                        className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {playingVoice === voice.id ? (
                          <>
                            <Pause className="w-4 h-4 mr-1" />
                            Lecture...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Aperçu
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedVoice === voice.id ? "default" : "outline"}
                        onClick={() => handleVoiceSelection(voice.id)}
                        className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {selectedVoice === voice.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Sélectionnée
                          </>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 mr-1" />
                            Sélectionner
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Voice Comparison */}
        {availableVoices.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Voice Comparison</h2>
              <p className="text-sm text-gray-500 mt-1">Compare different voice options</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableVoices.slice(0, 2).map((voice) => (
                  <div key={voice.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-gray-900">{voice.name}</div>
                      <span className="text-lg">{getAccentFlag(voice.accent)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{voice.gender} • {voice.accent} • {voice.quality} Quality</div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVoicePreview(voice.id)}
                        className="flex-1"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVoiceSelection(voice.id)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voice Quality Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Voice Quality Information</h3>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <div>• <strong>High Quality:</strong> Premium voices with natural pronunciation</div>
                <div>• <strong>Medium Quality:</strong> Good voices with clear speech</div>
                <div>• <strong>Low Quality:</strong> Basic voices for testing purposes</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VoicePage() {
  return (
    <SharedDataProvider>
      <VoicePageContent />
    </SharedDataProvider>
  );
}
