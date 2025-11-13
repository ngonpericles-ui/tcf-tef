"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/components/language-provider"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Send, Search, History, Bookmark, Home, Plus, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getComprehensiveProfilePictureUrl } from "@/lib/utils/profilePicture"

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  chatId?: string
}

interface Conversation {
  id: string
  title: string
  lastMessage: string
  lastMessageRole: 'user' | 'assistant'
  timestamp: string
  createdAt?: string
  updatedAt?: string
}

export default function AIChatPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState<'history' | 'saved'>('history')
  const [apiStatus, setApiStatus] = useState<{
    modelName?: string
    hasApiKeys?: boolean
    availableKeys?: number
    totalKeys?: number
    status?: string
    apiTest?: {
      working?: boolean
      error?: string
      status?: number
      details?: any
    }
    usageStatus?: Array<{
      keyIndex: number
      usage: string
      available: boolean
      hoursUntilReset: string
    }>
  } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Fetch API status
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchApiStatus = async () => {
      try {
        const response = await apiClient.get('/ai-chat/api-status')
        if (response.success && response.data) {
          setApiStatus(response.data)
          console.log('🔑 API Status:', response.data)
        }
      } catch (error: any) {
        console.error('Error fetching API status:', error)
      }
    }

    fetchApiStatus()
  }, [isAuthenticated, authLoading])

  // Fetch conversation history and restore active conversation
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/ai-chat/history', { limit: 20 })
        
        if (response.success && response.data) {
          const historyData = Array.isArray(response.data) ? response.data : (response.data as any)?.conversations || []
          
          const transformedConversations: Conversation[] = historyData.map((conv: any) => {
            const lastMessage = conv.lastMessage || conv.messages?.[conv.messages.length - 1]?.content || ''
            const lastMessageRole = conv.lastMessageRole || conv.messages?.[conv.messages.length - 1]?.role || 'assistant'
            
            return {
              id: conv.id || conv.chatId || '',
              title: conv.title || lastMessage.substring(0, 50) || t("Nouvelle conversation", "New conversation"),
              lastMessage: lastMessage,
              lastMessageRole: lastMessageRole,
              timestamp: conv.updatedAt || conv.createdAt || new Date().toISOString(),
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt
            }
          })
          
          setConversations(transformedConversations)
          
          // Restore active conversation from URL parameter or load most recent
          const chatIdFromUrl = searchParams.get('chatId')
          if (chatIdFromUrl) {
            const savedConversation = transformedConversations.find(c => c.id === chatIdFromUrl)
            if (savedConversation) {
              // Load the conversation from URL
              loadConversation(chatIdFromUrl)
            }
          } else if (transformedConversations.length > 0 && !currentChatId) {
            // If no chatId in URL and no current chat, load the most recent conversation
            const mostRecent = transformedConversations.sort((a, b) => {
              const dateA = new Date(a.timestamp).getTime()
              const dateB = new Date(b.timestamp).getTime()
              return dateB - dateA
            })[0]
            if (mostRecent) {
              loadConversation(mostRecent.id)
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching chat history:', error)
      }
    }

    fetchHistory()
  }, [isAuthenticated, authLoading])

  // Load messages for selected conversation
  const loadConversation = async (chatId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/ai-chat/session/${chatId}`)
      
      if (response.success && response.data) {
        const chatData = response.data as any
        const chatMessages = chatData.messages || []
        
        const transformedMessages: ChatMessage[] = chatMessages.map((msg: any) => {
          // Fix role mapping: backend uses 'USER'/'ASSISTANT', frontend uses 'user'/'assistant'
          let role: 'user' | 'assistant' = 'assistant'
          if (msg.role === 'USER' || msg.role === 'user' || msg.sender === 'user') {
            role = 'user'
          } else if (msg.role === 'ASSISTANT' || msg.role === 'assistant' || msg.sender === 'assistant') {
            role = 'assistant'
          }
          
          return {
            id: msg.id,
            role: role,
            content: msg.content || msg.message || '',
            timestamp: msg.timestamp || msg.createdAt,
            chatId: chatId
          }
        })
        
        setMessages(transformedMessages)
        setCurrentChatId(chatId)
        // Update URL with chatId for persistence
        router.replace(`/ai-chat?chatId=${chatId}`, { scroll: false })
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error)
      toast.error(t("Erreur lors du chargement de la conversation", "Error loading conversation"))
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!currentMessage.trim() || loading || isTyping) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = currentMessage.trim()
    setCurrentMessage("")
    setIsTyping(true)
    setLoading(true)

    try {
      // Always use currentChatId if it exists, don't create new chat
      // Include context with user level and language
      const response = await apiClient.post('/ai-chat/message', {
        message: messageToSend,
        chatId: currentChatId || null, // Use null instead of undefined to explicitly keep existing chat
        context: {
          userLevel: (user as any)?.currentLevel || 'BASIC',
          language: lang || 'fr',
          previousMessages: []
        }
      })

      if (response.success && response.data) {
        const aiResponse = response.data as any
        
        // Check for rate limit or monthly limit errors
        if (aiResponse.error) {
          const errorMessage = aiResponse.error.message || aiResponse.error
          if (errorMessage.includes('limit') || errorMessage.includes('limite')) {
            toast.error(t(
              "Vous avez atteint la limite mensuelle de messages IA. Veuillez réessayer le mois prochain ou upgradez votre abonnement.",
              "You have reached the monthly AI message limit. Please try again next month or upgrade your subscription."
            ))
            setIsTyping(false)
            setLoading(false)
            return
          }
        }
        
             // Always update chatId if provided (for both new and existing chats)
             if (aiResponse.chatId) {
               setCurrentChatId(aiResponse.chatId)
               // Update URL with chatId for persistence
               router.replace(`/ai-chat?chatId=${aiResponse.chatId}`, { scroll: false })
             }

        // Get message content - check multiple possible fields
        const messageContent = aiResponse.message || aiResponse.content || aiResponse.response || aiResponse.text || ''
        
        if (!messageContent || messageContent.trim() === '') {
          throw new Error(t(
            "La réponse de l'IA est vide. Veuillez réessayer.",
            "AI response is empty. Please try again."
          ))
        }

        const assistantMessage: ChatMessage = {
          id: aiResponse.id,
          role: 'assistant',
          content: messageContent,
          timestamp: aiResponse.timestamp || new Date().toISOString(),
          chatId: aiResponse.chatId || currentChatId || undefined
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Only refresh conversation history if this is a new chat, otherwise just update the current one
        if (!currentChatId && aiResponse.chatId) {
          // This is a new chat, refresh the history list
          const historyResponse = await apiClient.get('/ai-chat/history', { limit: 20 })
          if (historyResponse.success && historyResponse.data) {
            const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : (historyResponse.data as any)?.conversations || []
            const transformedConversations: Conversation[] = historyData.map((conv: any) => {
              const lastMessage = conv.lastMessage || conv.messages?.[conv.messages.length - 1]?.content || ''
              const lastMessageRole = conv.lastMessageRole || conv.messages?.[conv.messages.length - 1]?.role || 'assistant'
              
              return {
                id: conv.id || conv.chatId || '',
                title: conv.title || lastMessage.substring(0, 50) || t("Nouvelle conversation", "New conversation"),
                lastMessage: lastMessage,
                lastMessageRole: lastMessageRole,
                timestamp: conv.updatedAt || conv.createdAt || new Date().toISOString(),
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt
              }
            })
            setConversations(transformedConversations)
          }
        }
      } else {
        throw new Error(response.error?.message || 'Failed to get AI response')
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      
      // Check for rate limit or monthly limit errors
      const errorMessage = error?.response?.data?.error?.message || error?.message || error?.toString() || ''
      
      if (errorMessage.includes('limit') || errorMessage.includes('limite') || errorMessage.includes('rate limit')) {
        toast.error(t(
          "Vous avez atteint la limite mensuelle de messages IA. Veuillez réessayer le mois prochain ou upgradez votre abonnement.",
          "You have reached the monthly AI message limit. Please try again next month or upgrade your subscription."
        ))
      } else if (error?.response?.status === 429) {
        toast.error(t(
          "Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.",
          "Too many requests. Please wait a few moments before trying again."
        ))
      } else if (errorMessage.includes('AUTH_ERROR') || errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        toast.error(t(
          "Erreur d'authentification avec le service IA. Veuillez contacter le support technique.",
          "Authentication error with AI service. Please contact technical support."
        ))
      } else if (errorMessage.includes('AI_SERVICE_ERROR')) {
        // Only show error if it's a specific service error, not generic technical problems
        const cleanMessage = errorMessage.replace('AI_SERVICE_ERROR: ', '')
        toast.error(cleanMessage || t(
          "Erreur lors de l'envoi du message. Veuillez réessayer.",
          "Error sending message. Please try again."
        ))
      } else {
        // For generic errors, don't show error message - just log it
        console.error('Silent error (not showing to user):', errorMessage)
      }
      
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsTyping(false)
      setLoading(false)
    }
  }

  // Start new conversation
  const startNewChat = () => {
    setMessages([])
    setCurrentChatId(null)
    setCurrentMessage("")
    // Clear URL parameter
    router.replace('/ai-chat', { scroll: false })
  }

  // Delete current chat
  const deleteCurrentChat = async () => {
    if (!currentChatId) return

    if (!confirm(t(
      "Êtes-vous sûr de vouloir supprimer cette conversation?",
      "Are you sure you want to delete this conversation?"
    ))) {
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.delete(`/ai-chat/session/${currentChatId}`)
      
      if (response.success) {
        toast.success(t("Conversation supprimée avec succès", "Conversation deleted successfully"))
        setMessages([])
        setCurrentChatId(null)
        setCurrentMessage("")
        // Clear URL parameter
        router.replace('/ai-chat', { scroll: false })
        
        // Refresh conversation history
        const historyResponse = await apiClient.get('/ai-chat/history', { limit: 20 })
        if (historyResponse.success && historyResponse.data) {
          const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : (historyResponse.data as any)?.conversations || []
          const transformedConversations: Conversation[] = historyData.map((conv: any) => {
            const lastMessage = conv.lastMessage || conv.messages?.[conv.messages.length - 1]?.content || ''
            const lastMessageRole = conv.lastMessageRole || conv.messages?.[conv.messages.length - 1]?.role || 'assistant'
            
            return {
              id: conv.id || conv.chatId || '',
              title: conv.title || lastMessage.substring(0, 50) || t("Nouvelle conversation", "New conversation"),
              lastMessage: lastMessage,
              lastMessageRole: lastMessageRole,
              timestamp: conv.updatedAt || conv.createdAt || new Date().toISOString(),
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt
            }
          })
          setConversations(transformedConversations)
        }
      } else {
        throw new Error(response.error?.message || 'Failed to delete conversation')
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      toast.error(t("Erreur lors de la suppression de la conversation", "Error deleting conversation"))
    } finally {
      setLoading(false)
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}${t("m", "m")} ${t("ago", "ago")}`
    } else if (diffHours < 24) {
      return `${diffHours}${t("h", "h")} ${t("ago", "ago")}`
    } else if (diffDays < 7) {
      return `${diffDays}${t("d", "d")} ${t("ago", "ago")}`
    } else {
      return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: 'numeric', month: 'short' })
    }
  }

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show welcome message if no messages with time-based greeting
  useEffect(() => {
    if (messages.length === 0 && !loading && !authLoading) {
      const currentHour = new Date().getHours()
      let greeting = ''
      
      if (currentHour >= 5 && currentHour < 12) {
        greeting = t("Salut ! Comment puis-je t'aider avec ton français ce matin ?", "Hi! How can I help you with your French this morning?")
      } else if (currentHour >= 12 && currentHour < 17) {
        greeting = t("Salut ! Comment puis-je t'aider avec ton français cet après-midi ?", "Hi! How can I help you with your French this afternoon?")
      } else if (currentHour >= 17 && currentHour < 21) {
        greeting = t("Salut ! Comment puis-je t'aider avec ton français ce soir ?", "Hi! How can I help you with your French this evening?")
      } else {
        greeting = t("Salut ! Comment puis-je t'aider avec ton français ?", "Hi! How can I help you with your French?")
      }
      
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `${greeting} ${t("Je peux t'aider avec les traductions, la grammaire ou simplement pratiquer la conversation.", "I can help you with translations, grammar, or simply practice conversation.")}`,
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-[#2ECC71]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/connexion')
    return null
  }

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Global Styles */}
      <style jsx global>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.25);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .dark .glassmorphism {
          background: rgba(15, 35, 22, 0.25);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(15, 35, 22, 0.18);
        }
        :root {
          --primary: #06f957;
          --background-light: #f5f8f6;
          --background-dark: #0f2316;
        }
      `}</style>

      {/* Font Import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

      <div className="flex h-full w-full p-4 gap-4">
        {/* Sidebar */}
        <aside className="flex flex-col w-full max-w-xs h-full rounded-xl glassmorphism">
          <div className="flex flex-col h-full p-4 gap-6">
            {/* Student Profile */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <Avatar className="size-12 shrink-0 border-2 border-[#06f957]/30">
                    <AvatarImage 
                      src={getComprehensiveProfilePictureUrl(
                        user.email || '', 
                        (user as any).profileImage || (user as any).profilePicture || ''
                      )}
                      alt={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'User'}
                      className="rounded-full"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#06f957] to-green-400 text-white text-lg font-bold">
                      {user.firstName && user.lastName
                        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                        : user.email
                          ? user.email.charAt(0).toUpperCase()
                          : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <h1 className="text-[#111111] dark:text-white text-base font-medium leading-normal truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email
                          ? user.email.split('@')[0]
                          : t("Utilisateur", "User")}
                    </h1>
                    <p className="text-[#5f8c6e] dark:text-gray-400 text-sm font-normal leading-normal truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {user.email || t("Étudiant", "Student")}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Search Bar */}
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-full h-full glassmorphism">
                <div className="text-[#5f8c6e] dark:text-gray-400 flex border-none items-center justify-center pl-4 rounded-l-full border-r-0">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-[#111111] dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent focus:border-none h-full placeholder:text-[#5f8c6e] dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal"
                  placeholder={t("Rechercher des conversations", "Search conversations")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </label>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveSection('history')}
                className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors ${
                  activeSection === 'history'
                    ? 'bg-[#06f957]/20 dark:bg-[#06f957]/30'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <History className="w-5 h-5 text-[#111111] dark:text-white" />
                <p className="text-[#111111] dark:text-white text-sm font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t("Historique des Conversations", "Conversation History")}
                </p>
              </button>
              <button
                onClick={() => setActiveSection('saved')}
                className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors ${
                  activeSection === 'saved'
                    ? 'bg-[#06f957]/20 dark:bg-[#06f957]/30'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Bookmark className="w-5 h-5 text-[#111111] dark:text-white" />
                <p className="text-[#111111] dark:text-white text-sm font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t("Chats Enregistrés", "Saved Chats")}
                </p>
              </button>
            </nav>

            {/* Conversations List */}
            <div className="flex flex-col gap-1 overflow-y-auto flex-1">
              <AnimatePresence>
                {filteredConversations.map((conv, index) => {
                  const isActive = currentChatId === conv.id
                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between rounded-lg glassmorphism transition-colors group ${
                        isActive
                          ? 'bg-[#06f957]/20 dark:bg-[#06f957]/30'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div 
                        onClick={() => loadConversation(conv.id)}
                        className="flex items-center gap-4 overflow-hidden flex-1 cursor-pointer"
                      >
                        <div className="flex flex-col justify-center overflow-hidden flex-1">
                          <p className="text-[#111111] dark:text-white text-sm font-medium leading-normal truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {conv.title}
                          </p>
                          <p className="text-[#5f8c6e] dark:text-gray-400 text-sm font-normal leading-normal truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {conv.lastMessageRole === 'assistant' ? 'AI: ' : t("Vous", "You") + ': '}
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-[#5f8c6e] dark:text-gray-400 text-xs font-normal leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatTimestamp(conv.timestamp)}
                        </p>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm(t(
                              "Êtes-vous sûr de vouloir supprimer cette conversation?",
                              "Are you sure you want to delete this conversation?"
                            ))) {
                              try {
                                const response = await apiClient.delete(`/ai-chat/session/${conv.id}`)
                                if (response.success) {
                                  toast.success(t("Conversation supprimée", "Conversation deleted"))
                                  // Refresh conversation history
                                  const historyResponse = await apiClient.get('/ai-chat/history', { limit: 20 })
                                  if (historyResponse.success && historyResponse.data) {
                                    const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : (historyResponse.data as any)?.conversations || []
                                    const transformedConversations: Conversation[] = historyData.map((c: any) => {
                                      const lastMessage = c.lastMessage || c.messages?.[c.messages.length - 1]?.content || ''
                                      const lastMessageRole = c.lastMessageRole || c.messages?.[c.messages.length - 1]?.role || 'assistant'
                                      
                                      return {
                                        id: c.id || c.chatId || '',
                                        title: c.title || lastMessage.substring(0, 50) || t("Nouvelle conversation", "New conversation"),
                                        lastMessage: lastMessage,
                                        lastMessageRole: lastMessageRole,
                                        timestamp: c.updatedAt || c.createdAt || new Date().toISOString(),
                                        createdAt: c.createdAt,
                                        updatedAt: c.updatedAt
                                      }
                                    })
                                    setConversations(transformedConversations)
                                    
                                    // If deleted chat was current, clear it
                                    if (currentChatId === conv.id) {
                                      setMessages([])
                                      setCurrentChatId(null)
                                    }
                                  }
                                }
                              } catch (error: any) {
                                console.error('Error deleting conversation:', error)
                                toast.error(t("Erreur lors de la suppression", "Error deleting"))
                              }
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
                          title={t("Supprimer", "Delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              
              {filteredConversations.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-[#5f8c6e] dark:text-gray-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t("Aucune conversation", "No conversations")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full rounded-xl glassmorphism">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 shrink-0">
            <h2 className="text-xl font-bold text-[#111111] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
              Aura <span className="text-[#06f957]">AI</span> Chat
            </h2>
            <div className="flex items-center gap-2">
              {currentChatId && (
                <button
                  onClick={deleteCurrentChat}
                  className="flex items-center justify-center size-10 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                  title={t("Supprimer la conversation", "Delete conversation")}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => router.push('/home')}
                className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#111111] dark:text-white transition-colors"
                title={t("Retour à l'accueil", "Go to home")}
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={startNewChat}
                className="flex items-center justify-center size-10 rounded-full bg-[#06f957] text-[#111111] hover:brightness-110 transition-all"
                title={t("Nouvelle conversation", "New conversation")}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Chat Feed */}
          <div ref={chatContainerRef} className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 max-w-xl ${
                    message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div
                      className="size-8 rounded-full bg-center bg-no-repeat aspect-square bg-cover shrink-0 border-2 border-white dark:border-gray-800"
                      style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBXijLl3-ucY1j5g8lnjT4Blpr93PnLIh83cF7iuVh5MGiFW5c-zDXOdSTSWmaDGMobZPy7y-AZndTZdfT3e8GYLgMwe21Ou6sC-WIL_Ba1EjYnv5pKDUZOaGPwe_bt5n4BY8zUh2ZTkKMqgvzuzO_Q_iLvwfcrA7Gsw11F6bU-rTz0XKyEz4rvLIqRKmpdRVQQmu0XNmuEWsc_JlzGzdy6BDGNotZe800TCVH68ZvK8DuMos9YCDRPXZE_z3A-EFIKPx7jl5HQsF-6")'
                      }}
                    />
                  )}
                  {message.role === 'user' && (
                    <div className="size-8 rounded-full bg-[#06f957] flex items-center justify-center shrink-0 border-2 border-white dark:border-gray-800">
                      <span className="text-black font-bold text-sm">
                        {user?.firstName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={`p-4 rounded-lg glassmorphism text-[#111111] dark:text-white ${
                      message.role === 'user'
                        ? 'rounded-br-none bg-[#06f957]/30 dark:bg-[#06f957]/40'
                        : 'rounded-tl-none'
                    }`}
                    style={{
                      border: message.role === 'user' 
                        ? '2px solid rgba(6, 249, 87, 0.4)' 
                        : '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <p className="text-base font-medium whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 max-w-xl"
              >
                <div
                  className="size-8 rounded-full bg-center bg-no-repeat aspect-square bg-cover shrink-0 border-2 border-white dark:border-gray-800"
                  style={{
                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuApLCYat5VlsJjVunj2AAj_qegBbNSrAlviKwHuMPJ_9hEwpO6o8F3iOVi4B0PpNpGYsKUa_fqFGhIZJ3t8PrZkYLqbbkDihu_N_CV_5fRHxwm-hM_3BZzSJHR5NoAK5jacGiiCePAIPkUpK3vNqP8OPe6ZFumC2E_e0CTTdPSDvhL7EyIYkq0e0OPh_vxNMIpkaVyFTde-NNAdm1-4hIjbgZ6KMgD6ulnRJe4-1ZMZHBeeNXd4SCHyZxRIbyQitmpfORUILEOD7HRn")'
                  }}
                />
                <div 
                  className="flex items-center gap-1.5 p-4 rounded-lg rounded-tl-none glassmorphism"
                  style={{ border: '2px solid rgba(255, 255, 255, 0.3)' }}
                >
                  <div className="size-2 rounded-full bg-[#06f957] animate-pulse" />
                  <div className="size-2 rounded-full bg-[#06f957] animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="size-2 rounded-full bg-[#06f957] animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - WhatsApp-style Rounded Container with Outlines - Reduced by 40% */}
          <div className="p-6 shrink-0">
            <div className="flex items-center gap-3 w-full max-w-[60%] mx-auto">
              {/* Input Container - Rounded like WhatsApp */}
              <div 
                className="flex-1 flex items-center rounded-full glassmorphism px-4 py-2"
                style={{ border: '2px solid rgba(6, 249, 87, 0.3)' }}
              >
                <Input
                  className="form-input flex-1 bg-transparent border-none text-base text-[#111111] dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:ring-0 outline-none rounded-full"
                  placeholder={t("Tapez votre message ici...", "Type your message here...")}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={loading || isTyping}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              {/* Send Button - Circular with Outline */}
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || loading || isTyping}
                className="flex items-center justify-center size-12 rounded-full bg-[#06f957] text-[#111111] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#06f957]/50 shadow-lg shrink-0"
              >
                {loading || isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
          </div>
        </main>
        </div>
    </div>
  )
}
