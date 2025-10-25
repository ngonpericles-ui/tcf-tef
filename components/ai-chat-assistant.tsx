"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  X,
  Plus,
  MessageSquare,
  Loader2,
  Trash2,
  MoreVertical,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ArrowLeft,
  Home
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api-client"
import { useLang } from "./language-provider"
import { useRouter } from "next/navigation"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  sources?: string[]
  confidence?: number
}

interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
}

export default function AIChatAssistant() {
  const { isAuthenticated, user } = useAuth()
  const { t, lang } = useLang()
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load chat sessions on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadChatSessions()
    }
  }, [isAuthenticated])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const loadChatSessions = async () => {
    try {
      const response = await apiClient.get('/ai-chat/history')
      if (response.success && response.data) {
        // Convert string dates to Date objects
        const sessions = (response.data as ChatSession[]).map(session => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }))
        setSessions(sessions)
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    }
  }

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: lang === "fr" ? "Nouvelle conversation" : "New conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    }
    setCurrentSession(newSession)
    setMessages([])
    setSessions(prev => [newSession, ...prev])
  }

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session)
    // Ensure message timestamps are Date objects
    const messagesWithDates = session.messages?.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp)
    })) || []
    setMessages(messagesWithDates)
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !isAuthenticated) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await apiClient.post('/ai-chat/message', {
        message: input,
        chatId: currentSession?.id,
        context: {
          userLevel: user?.subscriptionTier || 'BASIC',
          language: lang,
          previousMessages: messages.slice(-5)
        }
      })

      if (response.success && response.data) {
        const data = response.data as any
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          sources: data.sources,
          confidence: data.confidence
        }

        const finalMessages = [...updatedMessages, aiMessage]
        setMessages(finalMessages)

        // Update current session
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            messages: finalMessages,
            updatedAt: new Date(),
            title: currentSession.title === (lang === "fr" ? "Nouvelle conversation" : "New conversation") 
              ? input.slice(0, 30) + (input.length > 30 ? "..." : "")
              : currentSession.title
          }
          setCurrentSession(updatedSession)
          setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s))
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === "fr" 
          ? "Désolé, une erreur s'est produite. Veuillez réessayer."
          : "Sorry, an error occurred. Please try again.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/ai-chat/session/${sessionId}`)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSession?.id === sessionId) {
        startNewChat()
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {lang === "fr" ? "Connexion requise" : "Login Required"}
          </h2>
          <p className="text-gray-500">
            {lang === "fr" ? "Veuillez vous connecter pour utiliser l'assistant IA" : "Please login to use the AI assistant"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-900 text-white overflow-hidden`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                Aura.ca AI
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/home')}
                  className="text-gray-400 hover:text-white"
                  title={lang === "fr" ? "Retour à l'accueil" : "Back to Home"}
                >
                  <Home className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={startNewChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {lang === "fr" ? "Nouvelle conversation" : "New chat"}
            </Button>
          </div>

          {/* Chat Sessions */}
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 mx-2 mb-2 rounded-lg cursor-pointer transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                }`}
                onClick={() => selectSession(session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-gray-400">
                      {session.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">
                  {lang === "fr" ? "Étudiant" : "Student"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-gray-600"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentSession?.title || (lang === "fr" ? "Assistant IA Aura" : "Aura AI Assistant")}
                </h2>
                <p className="text-sm text-gray-500">
                  {lang === "fr" ? "Alimenté par Gemini AI" : "Powered by Gemini AI"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">
                {lang === "fr" ? "En ligne" : "Online"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/home')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-4"
                title={lang === "fr" ? "Retour à l'accueil" : "Back to Home"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {lang === "fr" ? "Bonjour ! Je suis votre assistant IA" : "Hello! I'm your AI assistant"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {lang === "fr" 
                    ? "Je suis là pour vous aider avec vos questions sur le français, le TCF/TEF, et bien plus encore. Comment puis-je vous aider aujourd'hui ?"
                    : "I'm here to help you with French questions, TCF/TEF preparation, and much more. How can I help you today?"
                  }
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    lang === "fr" ? "Expliquez-moi la grammaire française" : "Explain French grammar to me",
                    lang === "fr" ? "Préparez-moi pour le TCF" : "Prepare me for the TCF",
                    lang === "fr" ? "Aidez-moi avec la prononciation" : "Help me with pronunciation",
                    lang === "fr" ? "Donnez-moi des exercices" : "Give me exercises"
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.confidence && (
                        <div className="mt-2 text-xs opacity-70">
                          {lang === "fr" ? "Confiance" : "Confidence"}: {Math.round(message.confidence * 100)}%
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-gray-600">
                        {lang === "fr" ? "L'IA réfléchit..." : "AI is thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  placeholder={lang === "fr" ? "Tapez votre message..." : "Type your message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isLoading}
                  className="min-h-[50px] resize-none"
                />
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {lang === "fr" 
                ? "Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne"
                : "Press Enter to send, Shift+Enter for new line"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}