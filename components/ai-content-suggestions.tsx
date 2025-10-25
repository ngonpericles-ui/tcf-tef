"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Sparkles,
  BookOpen,
  MessageSquare,
  Users,
  Play,
  Clock,
  Target,
  Lightbulb,
  Zap,
  RefreshCw,
  Plus,
  CheckCircle,
  ArrowRight,
  Brain,
  Gamepad2,
  PenTool,
  Mic
} from "lucide-react"
import { useLang } from "@/components/language-provider"

interface AIContentSuggestionsProps {
  sessionData?: any
  currentTopic?: string
  participantLevel?: string
  sessionProgress?: number // 0-100
  engagementLevel?: 'low' | 'medium' | 'high'
  className?: string
}

interface ContentSuggestion {
  id: string
  type: 'activity' | 'question' | 'exercise' | 'game' | 'discussion' | 'assessment'
  title: string
  description: string
  duration: number // minutes
  difficulty: 'easy' | 'medium' | 'hard'
  materials?: string[]
  instructions: string[]
  learningObjectives: string[]
  adaptedFor: string[]
  aiConfidence: number // 0-100
  popularity: number // 0-100
}

interface TopicSuggestion {
  topic: string
  subtopics: string[]
  relevanceScore: number
  difficulty: string
  estimatedTime: number
}

export default function AIContentSuggestions({
  sessionData,
  currentTopic,
  participantLevel = 'B1',
  sessionProgress = 0,
  engagementLevel = 'medium',
  className = ""
}: AIContentSuggestionsProps) {
  const { lang } = useLang()
  
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([])
  const [selectedType, setSelectedType] = useState<'all' | 'activity' | 'question' | 'exercise' | 'game'>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([])

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Generate suggestions based on context
  useEffect(() => {
    generateSuggestions()
  }, [sessionData, currentTopic, participantLevel, sessionProgress, engagementLevel])

  const generateSuggestions = async () => {
    setIsGenerating(true)
    
    try {
      // Simulate AI-powered content generation
      const newSuggestions: ContentSuggestion[] = []
      
      // Context-aware suggestions based on engagement level
      if (engagementLevel === 'low') {
        newSuggestions.push({
          id: 'engagement-booster-1',
          type: 'game',
          title: t('Jeu de vocabulaire rapide', 'Quick Vocabulary Game'),
          description: t('Un jeu interactif pour relancer l\'engagement avec le vocabulaire du jour', 'An interactive game to boost engagement with today\'s vocabulary'),
          duration: 5,
          difficulty: 'easy',
          materials: [t('Tableau blanc', 'Whiteboard'), t('Timer', 'Timer')],
          instructions: [
            t('Divisez les participants en équipes', 'Divide participants into teams'),
            t('Donnez un mot, les équipes trouvent des synonymes', 'Give a word, teams find synonyms'),
            t('1 point par synonyme correct', '1 point per correct synonym')
          ],
          learningObjectives: [
            t('Réviser le vocabulaire', 'Review vocabulary'),
            t('Encourager la participation', 'Encourage participation'),
            t('Créer une dynamique de groupe', 'Create group dynamics')
          ],
          adaptedFor: [t('Tous niveaux', 'All levels'), t('Groupes nombreux', 'Large groups')],
          aiConfidence: 92,
          popularity: 88
        })

        newSuggestions.push({
          id: 'engagement-booster-2',
          type: 'activity',
          title: t('Débat express', 'Express Debate'),
          description: t('Un mini-débat de 10 minutes sur un sujet d\'actualité', 'A 10-minute mini-debate on a current topic'),
          duration: 10,
          difficulty: 'medium',
          materials: [t('Sujets préparés', 'Prepared topics')],
          instructions: [
            t('Présentez un sujet controversé simple', 'Present a simple controversial topic'),
            t('Divisez en deux camps', 'Divide into two camps'),
            t('Chaque camp a 3 minutes pour argumenter', 'Each camp has 3 minutes to argue'),
            t('Vote final du groupe', 'Final group vote')
          ],
          learningObjectives: [
            t('Pratiquer l\'argumentation', 'Practice argumentation'),
            t('Utiliser le vocabulaire de l\'opinion', 'Use opinion vocabulary'),
            t('Améliorer la fluidité', 'Improve fluency')
          ],
          adaptedFor: [participantLevel, t('Participants timides', 'Shy participants')],
          aiConfidence: 87,
          popularity: 91
        })
      }

      // Level-specific suggestions
      if (participantLevel === 'B1' || participantLevel === 'B2') {
        newSuggestions.push({
          id: 'intermediate-exercise-1',
          type: 'exercise',
          title: t('Correction collaborative', 'Collaborative Correction'),
          description: t('Les participants corrigent ensemble des phrases avec erreurs typiques', 'Participants correct sentences with typical errors together'),
          duration: 15,
          difficulty: 'medium',
          materials: [t('Phrases préparées', 'Prepared sentences'), t('Tableau partagé', 'Shared board')],
          instructions: [
            t('Affichez une phrase avec erreur', 'Display a sentence with error'),
            t('Les participants identifient l\'erreur', 'Participants identify the error'),
            t('Discussion sur la règle grammaticale', 'Discussion about the grammar rule'),
            t('Proposez des phrases similaires', 'Suggest similar sentences')
          ],
          learningObjectives: [
            t('Identifier les erreurs communes', 'Identify common errors'),
            t('Réviser la grammaire', 'Review grammar'),
            t('Développer l\'autocorrection', 'Develop self-correction')
          ],
          adaptedFor: [participantLevel, t('Apprentissage collaboratif', 'Collaborative learning')],
          aiConfidence: 94,
          popularity: 85
        })
      }

      // Progress-based suggestions
      if (sessionProgress > 70) {
        newSuggestions.push({
          id: 'wrap-up-activity',
          type: 'assessment',
          title: t('Récapitulatif interactif', 'Interactive Recap'),
          description: t('Une activité de synthèse pour consolider les apprentissages', 'A synthesis activity to consolidate learning'),
          duration: 10,
          difficulty: 'easy',
          materials: [t('Questions préparées', 'Prepared questions')],
          instructions: [
            t('Posez 3 questions clés de la session', 'Ask 3 key questions from the session'),
            t('Les participants répondent à tour de rôle', 'Participants answer in turn'),
            t('Complétez les réponses si nécessaire', 'Complete answers if necessary'),
            t('Donnez les devoirs pour la prochaine fois', 'Give homework for next time')
          ],
          learningObjectives: [
            t('Consolider les acquis', 'Consolidate learning'),
            t('Identifier les points à revoir', 'Identify points to review'),
            t('Préparer la suite', 'Prepare for next session')
          ],
          adaptedFor: [t('Fin de session', 'End of session'), t('Tous niveaux', 'All levels')],
          aiConfidence: 96,
          popularity: 92
        })
      }

      // Topic-specific suggestions
      if (currentTopic) {
        newSuggestions.push({
          id: 'topic-specific-1',
          type: 'question',
          title: t(`Questions sur "${currentTopic}"`, `Questions about "${currentTopic}"`),
          description: t('Questions ciblées pour approfondir le sujet actuel', 'Targeted questions to deepen the current topic'),
          duration: 8,
          difficulty: 'medium',
          materials: [],
          instructions: [
            t('Posez une question ouverte sur le sujet', 'Ask an open question about the topic'),
            t('Laissez 30 secondes de réflexion', 'Allow 30 seconds for reflection'),
            t('Recueillez plusieurs réponses', 'Collect multiple answers'),
            t('Synthétisez les points clés', 'Synthesize key points')
          ],
          learningObjectives: [
            t('Approfondir la compréhension', 'Deepen understanding'),
            t('Encourager la réflexion critique', 'Encourage critical thinking'),
            t('Vérifier la compréhension', 'Check understanding')
          ],
          adaptedFor: [currentTopic, participantLevel],
          aiConfidence: 89,
          popularity: 87
        })
      }

      // Generate topic suggestions
      const newTopicSuggestions: TopicSuggestion[] = [
        {
          topic: t('Les expressions idiomatiques', 'Idiomatic expressions'),
          subtopics: [
            t('Expressions avec les animaux', 'Animal expressions'),
            t('Expressions de temps', 'Time expressions'),
            t('Expressions familières', 'Colloquial expressions')
          ],
          relevanceScore: 85,
          difficulty: participantLevel,
          estimatedTime: 20
        },
        {
          topic: t('La culture française contemporaine', 'Contemporary French culture'),
          subtopics: [
            t('Les réseaux sociaux en France', 'Social media in France'),
            t('Les habitudes alimentaires', 'Eating habits'),
            t('Les loisirs des jeunes', 'Youth leisure activities')
          ],
          relevanceScore: 92,
          difficulty: participantLevel,
          estimatedTime: 25
        }
      ]

      setSuggestions(newSuggestions)
      setTopicSuggestions(newTopicSuggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const applySuggestion = (suggestionId: string) => {
    setAppliedSuggestions(prev => [...prev, suggestionId])
    // TODO: Implement actual application logic
    console.log('Applying suggestion:', suggestionId)
  }

  const getTypeIcon = (type: ContentSuggestion['type']) => {
    switch (type) {
      case 'activity':
        return <Users className="h-4 w-4" />
      case 'question':
        return <MessageSquare className="h-4 w-4" />
      case 'exercise':
        return <PenTool className="h-4 w-4" />
      case 'game':
        return <Gamepad2 className="h-4 w-4" />
      case 'discussion':
        return <Mic className="h-4 w-4" />
      case 'assessment':
        return <Target className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const filteredSuggestions = selectedType === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === selectedType)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("Suggestions de contenu IA", "AI Content Suggestions")}
              {isGenerating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={generateSuggestions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'activity', 'question', 'exercise', 'game'].map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type as any)}
                className="text-xs"
              >
                {type === 'all' && t('Tout', 'All')}
                {type === 'activity' && t('Activités', 'Activities')}
                {type === 'question' && t('Questions', 'Questions')}
                {type === 'exercise' && t('Exercices', 'Exercises')}
                {type === 'game' && t('Jeux', 'Games')}
              </Button>
            ))}
          </div>

          {/* Context Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium">{t("Niveau", "Level")}</div>
              <Badge variant="outline">{participantLevel}</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{t("Progrès", "Progress")}</div>
              <Badge variant="outline">{sessionProgress}%</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{t("Engagement", "Engagement")}</div>
              <Badge variant={engagementLevel === 'high' ? 'default' : engagementLevel === 'medium' ? 'secondary' : 'destructive'}>
                {engagementLevel}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{t("Suggestions", "Suggestions")}</div>
              <Badge variant="outline">{filteredSuggestions.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredSuggestions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {t("Génération de suggestions...", "Generating suggestions...")}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(suggestion.type)}
                      <h3 className="font-medium text-sm">{suggestion.title}</h3>
                      {appliedSuggestions.includes(suggestion.id) && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {suggestion.duration}min
                      </Badge>
                      <Badge className={`text-xs ${getDifficultyColor(suggestion.difficulty)}`}>
                        {suggestion.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>

                  <div className="space-y-2 mb-3">
                    <div>
                      <h4 className="text-xs font-medium mb-1">{t("Instructions:", "Instructions:")}</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {suggestion.instructions.slice(0, 2).map((instruction, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium mb-1">{t("Objectifs:", "Objectives:")}</h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.learningObjectives.slice(0, 2).map((objective, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {objective}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        IA: {suggestion.aiConfidence}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ⭐ {suggestion.popularity}%
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion.id)}
                      disabled={appliedSuggestions.includes(suggestion.id)}
                      className="text-xs"
                    >
                      {appliedSuggestions.includes(suggestion.id) ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("Appliqué", "Applied")}
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          {t("Appliquer", "Apply")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Topic Suggestions */}
      {topicSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {t("Sujets suggérés", "Suggested Topics")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topicSuggestions.map((topic, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{topic.topic}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {topic.estimatedTime}min
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {topic.relevanceScore}% pertinent
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topic.subtopics.map((subtopic, subIndex) => (
                      <Badge key={subIndex} variant="outline" className="text-xs">
                        {subtopic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
