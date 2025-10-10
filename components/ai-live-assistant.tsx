"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Users,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Brain,
  Eye,
  EyeOff,
  Settings,
  RefreshCw
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { aiChatService, type ChatMessage } from "@/lib/services/aiChatService"

interface AILiveAssistantProps {
  sessionId: string
  sessionData?: any
  participants?: any[]
  isHost?: boolean
  isVisible?: boolean
  onToggleVisibility?: () => void
  className?: string
}

interface LiveSessionContext {
  sessionTitle: string
  sessionLevel: string
  sessionCategory: string
  participantCount: number
  sessionDuration: number
  currentTopic?: string
  recentMessages?: string[]
  engagementLevel?: 'low' | 'medium' | 'high'
}

interface AIInsight {
  id: string
  type: 'suggestion' | 'warning' | 'tip' | 'question'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  timestamp: Date
  actionable?: boolean
  action?: () => void
}

export default function AILiveAssistant({
  sessionId,
  sessionData,
  participants = [],
  isHost = false,
  isVisible = true,
  onToggleVisibility,
  className = ""
}: AILiveAssistantProps) {
  const { lang } = useLang()
  const { user } = useAuth()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [sessionContext, setSessionContext] = useState<LiveSessionContext | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'suggestions'>('chat')
  const [autoSuggestions, setAutoSuggestions] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Initialize session context
  useEffect(() => {
    if (sessionData) {
      setSessionContext({
        sessionTitle: sessionData.title,
        sessionLevel: sessionData.level,
        sessionCategory: sessionData.category,
        participantCount: participants.length,
        sessionDuration: sessionData.duration,
        engagementLevel: 'medium' // TODO: Calculate based on real data
      })
    }
  }, [sessionData, participants])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate AI insights periodically
  useEffect(() => {
    if (sessionContext && autoSuggestions) {
      const interval = setInterval(() => {
        generateAIInsights()
      }, 30000) // Every 30 seconds

      return () => clearInterval(interval)
    }
  }, [sessionContext, autoSuggestions])

  // Initialize with welcome message
  useEffect(() => {
    if (sessionContext && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: t(
          `Bonjour ! Je suis Aura.CA, votre assistante IA pour cette session "${sessionContext.sessionTitle}". Je suis là pour vous aider avec des suggestions pédagogiques, répondre à vos questions et améliorer l'expérience d'apprentissage. Comment puis-je vous aider ?`,
          `Hello! I'm Aura.CA, your AI assistant for this "${sessionContext.sessionTitle}" session. I'm here to help with teaching suggestions, answer your questions, and improve the learning experience. How can I help you?`
        ),
        timestamp: new Date(),
        suggestions: [
          t("Suggérer des activités", "Suggest activities"),
          t("Analyser l'engagement", "Analyze engagement"),
          t("Conseils pédagogiques", "Teaching tips"),
          t("Questions de révision", "Review questions")
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [sessionContext])

  const generateAIInsights = async () => {
    if (!sessionContext) return

    try {
      // Generate contextual insights based on session data
      const newInsights: AIInsight[] = []

      // Engagement insight
      if (sessionContext.engagementLevel === 'low') {
        newInsights.push({
          id: `insight-${Date.now()}-1`,
          type: 'suggestion',
          title: t('Engagement faible détecté', 'Low engagement detected'),
          content: t(
            'Essayez une activité interactive comme un jeu de rôle ou une discussion en petits groupes pour relancer l\'engagement.',
            'Try an interactive activity like role-playing or small group discussions to boost engagement.'
          ),
          priority: 'high',
          timestamp: new Date(),
          actionable: true
        })
      }

      // Participation insight
      if (sessionContext.participantCount > 8) {
        newInsights.push({
          id: `insight-${Date.now()}-2`,
          type: 'tip',
          title: t('Groupe nombreux', 'Large group'),
          content: t(
            'Avec ${sessionContext.participantCount} participants, pensez à utiliser des salles de discussion pour favoriser la participation de tous.',
            `With ${sessionContext.participantCount} participants, consider using breakout rooms to encourage everyone's participation.`
          ),
          priority: 'medium',
          timestamp: new Date()
        })
      }

      // Time-based insight
      const sessionProgress = (Date.now() - new Date().getTime()) / (sessionContext.sessionDuration * 60 * 1000)
      if (sessionProgress > 0.7) {
        newInsights.push({
          id: `insight-${Date.now()}-3`,
          type: 'warning',
          title: t('Fin de session approche', 'Session ending soon'),
          content: t(
            'Il reste environ 30% du temps. Pensez à faire un récapitulatif et à donner les devoirs.',
            'About 30% of time remaining. Consider doing a recap and assigning homework.'
          ),
          priority: 'medium',
          timestamp: new Date()
        })
      }

      if (newInsights.length > 0) {
        setInsights(prev => [...newInsights, ...prev].slice(0, 10)) // Keep only last 10 insights
      }
    } catch (error) {
      console.error('Error generating AI insights:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Add session context to the message
      const contextualMessage = `Session: ${sessionContext?.sessionTitle} (${sessionContext?.sessionLevel}, ${sessionContext?.sessionCategory}). Participants: ${sessionContext?.participantCount}. Question: ${inputValue.trim()}`
      
      const response = await aiChatService.sendMessage(contextualMessage)
      setMessages(prev => [...prev, response])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: t(
          "Désolée, je rencontre un problème technique. Pouvez-vous réessayer ?",
          "Sorry, I'm experiencing a technical issue. Can you try again?"
        ),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case 'warning':
        return <Clock className="h-4 w-4 text-red-500" />
      case 'tip':
        return <Target className="h-4 w-4 text-blue-500" />
      case 'question':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      default:
        return <Brain className="h-4 w-4 text-purple-500" />
    }
  }

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg"
      >
        <Bot className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>Aura.CA</span>
            <Badge variant="secondary" className="text-xs">
              {t("Assistant IA", "AI Assistant")}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoSuggestions(!autoSuggestions)}
              className="h-8 w-8 p-0"
            >
              {autoSuggestions ? <Zap className="h-4 w-4 text-yellow-500" /> : <Zap className="h-4 w-4 text-gray-400" />}
            </Button>
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="h-8 w-8 p-0"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chat')}
            className="flex-1 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {t("Chat", "Chat")}
          </Button>
          <Button
            variant={activeTab === 'insights' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('insights')}
            className="flex-1 text-xs"
          >
            <Brain className="h-3 w-3 mr-1" />
            {t("Insights", "Insights")}
            {insights.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0 flex items-center justify-center">
                {insights.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'suggestions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('suggestions')}
            className="flex-1 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {t("Suggestions", "Suggestions")}
          </Button>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs h-6"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-secondary-foreground rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("Posez votre question à Aura.CA...", "Ask Aura.CA a question...")}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("Aucun insight pour le moment", "No insights yet")}</p>
                  <p className="text-xs">{t("Les suggestions apparaîtront pendant la session", "Suggestions will appear during the session")}</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`border-l-4 rounded-lg p-3 ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium mb-1">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{insight.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {insight.timestamp.toLocaleTimeString()}
                          </span>
                          {insight.actionable && (
                            <Button variant="outline" size="sm" className="text-xs h-6">
                              {t("Appliquer", "Apply")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: BookOpen, title: t("Activités interactives", "Interactive activities"), desc: t("Jeux de rôle, débats", "Role-plays, debates") },
                  { icon: Users, title: t("Gestion de groupe", "Group management"), desc: t("Salles de discussion", "Breakout rooms") },
                  { icon: Target, title: t("Questions ciblées", "Targeted questions"), desc: t("Selon le niveau", "Based on level") },
                  { icon: TrendingUp, title: t("Suivi des progrès", "Progress tracking"), desc: t("Évaluation continue", "Continuous assessment") }
                ].map((item, index) => (
                  <Card key={index} className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
