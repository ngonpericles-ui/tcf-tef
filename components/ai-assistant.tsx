"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import {
  Send,
  Mic,
  MicOff,
  ImageIcon,
  X,
  Bot,
  Sparkles,
  MessageCircle,
  Plus,
  Search,
  Library,
  Menu,
  Sun,
  Moon,
  Trash2,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
}

export default function AIAssistant() {
  const { lang, setLang } = useLang()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const messages = currentChat?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: t("Nouvelle conversation", "New conversation"),
      messages: [],
      lastMessage: new Date(),
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }

  const generateResponse = (userMessage: string): Message => {
    const responses = [
      t(
        "Je peux vous aider avec vos cours de français, vos tests TCF/TEF, et naviguer sur la plateforme. Que souhaitez-vous savoir ?",
        "I can help you with your French courses, TCF/TEF tests, and navigating the platform. What would you like to know?",
      ),
      t(
        "Excellent ! Voici quelques ressources qui pourraient vous intéresser. N'hésitez pas à me poser d'autres questions.",
        "Excellent! Here are some resources that might interest you. Feel free to ask me other questions.",
      ),
      t(
        "Je comprends votre question. Laissez-moi vous guider vers la bonne section de la plateforme.",
        "I understand your question. Let me guide you to the right section of the platform.",
      ),
    ]

    return {
      id: Date.now().toString(),
      type: "assistant",
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      suggestions: [
        t("Voir mes cours", "View my courses"),
        t("Passer un test", "Take a test"),
        t("Mon profil", "My profile"),
        t("Aide", "Help"),
      ],
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    let chatToUpdate = currentChat
    if (!chatToUpdate) {
      // Create new chat if none exists
      const newChat: Chat = {
        id: Date.now().toString(),
        title: inputValue.slice(0, 50) + (inputValue.length > 50 ? "..." : ""),
        messages: [],
        lastMessage: new Date(),
      }
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(newChat.id)
      chatToUpdate = newChat
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    // Update chat with user message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatToUpdate!.id
          ? { ...chat, messages: [...chat.messages, userMessage], lastMessage: new Date() }
          : chat,
      ),
    )

    const messageContent = inputValue
    setInputValue("")
    setIsTyping(true)

    try {
      // Send message to real AI backend
      const response = await apiClient.sendChatMessage(messageContent)

      if (response.success && response.data) {
        const assistantResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: response.data.message,
          timestamp: new Date(),
          suggestions: response.data.suggestions || []
        }

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatToUpdate!.id ? { ...chat, messages: [...chat.messages, assistantResponse] } : chat,
          ),
        )
      } else {
        // Fallback to generated response if API fails
        const assistantResponse = generateResponse(messageContent)
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatToUpdate!.id ? { ...chat, messages: [...chat.messages, assistantResponse] } : chat,
          ),
        )
      }
    } catch (error) {
      console.error('AI Chat error:', error)
      // Fallback to generated response on error
      const assistantResponse = generateResponse(messageContent)
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatToUpdate!.id ? { ...chat, messages: [...chat.messages, assistantResponse] } : chat,
        ),
      )
    } finally {
      setIsTyping(false)
    }
  }

  const filteredChats = chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false)
        setInputValue(t("Comment puis-je améliorer mon français ?", "How can I improve my French?"))
      }, 2000)
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const getThemeIcon = () => {
    return theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  }

  return (
    <>
      {/* AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-600 shadow-lg hover:shadow-2xl transition-all duration-300 group"
        >
          <div className="relative">
            <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-bounce" />
          </div>
        </Button>
      </div>

      {/* Full Screen Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background flex">
          {/* Sidebar */}
          <div
            className={`${sidebarCollapsed ? "w-16" : "w-80"} bg-card border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">TCF Assistant</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-muted-foreground"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button
                onClick={createNewChat}
                className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                {!sidebarCollapsed && t("Nouvelle conversation", "New chat")}
              </Button>
            </div>

            {!sidebarCollapsed && (
              <>
                {/* Search */}
                <div className="px-4 pb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("Rechercher...", "Search...")}
                      className="pl-10 bg-input border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 pb-4 space-y-2">
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                    <Library className="h-4 w-4" />
                    {t("Bibliothèque", "Library")}
                  </Button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto px-4">
                  <div className="space-y-1">
                    {filteredChats.length > 0 ? (
                      filteredChats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                            currentChatId === chat.id ? "bg-secondary" : "hover:bg-secondary/50"
                          }`}
                          onClick={() => setCurrentChatId(chat.id)}
                        >
                          <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground truncate flex-1">{chat.title}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteChat(chat.id)
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t("Aucune conversation", "No conversations")}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {/* Language Selector */}
                  <Button
                    variant="ghost"
                    onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                    className="w-full justify-start gap-2 text-muted-foreground"
                  >
                    <span className="text-lg">🇫🇷</span>
                    {lang === "fr" ? "Français" : "English"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="w-full justify-start gap-2 text-muted-foreground"
                  >
                    {getThemeIcon()}
                    {theme === "light" ? t("Clair", "Light") : t("Sombre", "Dark")}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentChat && (
                  <>
                    <h1 className="text-lg font-semibold text-foreground">{currentChat.title}</h1>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                // Welcome Screen
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="text-center max-w-2xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      {t("Sur quoi travaillez-vous ?", "What are you working on?")}
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      {t(
                        "Je suis votre assistant IA pour le TCF/TEF. Je peux vous aider avec vos cours, tests, et navigation sur la plateforme.",
                        "I'm your TCF/TEF AI assistant. I can help you with courses, tests, and platform navigation.",
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                      {[
                        t("Voir mes cours", "View my courses"),
                        t("Passer un test", "Take a test"),
                        t("Mon niveau", "My level"),
                        t("Aide navigation", "Navigation help"),
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => setInputValue(suggestion)}
                          className="text-left justify-start h-auto p-4 border-gray-200 dark:border-gray-700"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Chat Messages
                <div className="p-6 space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex gap-3 max-w-[70%]">
                        {message.type === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl p-4 ${
                            message.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          {message.suggestions && (
                            <div className="mt-4 space-y-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setInputValue(suggestion)}
                                  className="w-full text-xs justify-start"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-secondary rounded-2xl p-4">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder={t("Posez votre question...", "Ask anything...")}
                      className="bg-input border-gray-200 dark:border-gray-700 rounded-xl py-4 px-4 pr-20 text-base resize-none min-h-[56px]"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleVoiceRecord}
                        className={`p-2 rounded-full ${
                          isRecording ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-muted-foreground"
                        }`}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleImageUpload}
                        className="p-2 text-muted-foreground rounded-full"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-primary hover:bg-primary/90 rounded-xl px-4 py-4 min-h-[56px]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setInputValue(t("J'ai envoyé une image", "I sent an image"))
              }
            }}
          />
        </div>
      )}
    </>
  )
}
