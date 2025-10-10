"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageSquare,
  Send,
  Search,
  Plus,
  Reply,
  MoreHorizontal,
  Paperclip,
  Star,
  Archive,
  Trash2,
  User,
  Crown,
  Shield,
  UserCheck
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { messageService, type Message, type Contact } from "@/lib/services/messageService"
import { notificationService } from "@/lib/services/notificationService"
import { socketService } from "@/lib/services/socketService"
import { toast } from "sonner"
import PageShell from "@/components/page-shell"
import { formatDistanceToNow } from "date-fns"
import { fr, enUS } from "date-fns/locale"

// Types imported from messageService

export default function MessagesPage() {
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    receiverId: "",
    subject: "",
    content: ""
  })
  const [replyContent, setReplyContent] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages()
      fetchContacts()
      initializeSocket()
    }
  }, [isAuthenticated])

  const initializeSocket = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await socketService.connect(token)

        // Listen for real-time events
        window.addEventListener('socket:new-message', handleNewMessage as EventListener)
        window.addEventListener('socket:message-read', handleMessageRead as EventListener)
        window.addEventListener('socket:user-online', handleUserOnline as EventListener)
        window.addEventListener('socket:user-offline', handleUserOffline as EventListener)
      }
    } catch (error) {
      console.error('Failed to initialize socket:', error)
    }
  }

  // Real-time event handlers
  const handleNewMessage = (event: Event) => {
    const customEvent = event as CustomEvent
    const message = customEvent.detail
    setMessages(prev => [message, ...prev])
    setUnreadCount(prev => prev + 1)
  }

  const handleMessageRead = (event: Event) => {
    const customEvent = event as CustomEvent
    const { messageId } = customEvent.detail
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ))
  }

  const handleUserOnline = (event: Event) => {
    const customEvent = event as CustomEvent
    const user = customEvent.detail
    setContacts(prev => prev.map(contact =>
      contact.id === user.userId ? { ...contact, isOnline: true } : contact
    ))
  }

  const handleUserOffline = (event: Event) => {
    const customEvent = event as CustomEvent
    const user = customEvent.detail
    setContacts(prev => prev.map(contact =>
      contact.id === user.userId ? { ...contact, isOnline: false, lastSeen: new Date().toISOString() } : contact
    ))
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await messageService.getMessages({ page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })
      if (response.success && response.data) {
        setMessages(response.data.messages || [])
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError(t("Erreur lors du chargement", "Error loading messages"))
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await messageService.getContacts()
      if (response.success && response.data) {
        setContacts(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const sendMessage = async () => {
    if (!composeData.receiverId || !composeData.content.trim()) {
      setError(t("Veuillez remplir tous les champs", "Please fill all fields"))
      return
    }

    try {
      setSending(true)
      const response = await messageService.sendMessage(composeData)
      if (response.success) {
        setComposeData({ receiverId: "", subject: "", content: "" })
        setShowCompose(false)
        setSelectedContact(null)
        fetchMessages()

        // Send via socket for real-time delivery
        if (socketService.isSocketConnected()) {
          socketService.sendMessage({
            senderId: user?.id || '',
            receiverId: composeData.receiverId,
            content: composeData.content,
            type: 'text'
          })
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError(t("Erreur lors de l'envoi", "Error sending message"))
    } finally {
      setSending(false)
    }
  }

  const replyToMessage = async () => {
    if (!selectedMessage || !replyContent.trim()) {
      setError(t("Veuillez saisir votre réponse", "Please enter your reply"))
      return
    }

    try {
      const response = await messageService.replyToMessage(selectedMessage.id, replyContent)
      if (response.success) {
        setReplyContent("")
        fetchMessages()
        // Refresh the selected message
        const messageResponse = await messageService.getMessageById(selectedMessage.id)
        if (messageResponse.success && messageResponse.data) {
          setSelectedMessage(messageResponse.data)
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      setError(t("Erreur lors de l'envoi", "Error sending reply"))
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId)
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, isRead: true } : m)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Send real-time update
      if (socketService.isSocketConnected()) {
        socketService.markMessageAsRead(messageId)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'SENIOR_MANAGER':
        return <Shield className="w-4 h-4 text-blue-600" />
      case 'JUNIOR_MANAGER':
        return <UserCheck className="w-4 h-4 text-green-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return t("Administrateur", "Administrator")
      case 'SENIOR_MANAGER':
        return t("Manager Senior", "Senior Manager")
      case 'JUNIOR_MANAGER':
        return t("Manager Junior", "Junior Manager")
      case 'STUDENT':
      case 'USER':
        return t("Étudiant", "Student")
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: lang === 'fr' ? fr : enUS
    })
  }

  const filteredMessages = messages.filter(message => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      message.subject?.toLowerCase().includes(searchLower) ||
      message.content.toLowerCase().includes(searchLower) ||
      `${message.sender.firstName} ${message.sender.lastName}`.toLowerCase().includes(searchLower)
    )
  })

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("Chargement des messages...", "Loading messages...")}</p>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">{t("Messages", "Messages")}</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {unreadCount} {t("non lu(s)", "unread")}
                </Badge>
              )}
            </div>
            <Button onClick={() => setShowCompose(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("Nouveau message", "New message")}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t("Boîte de réception", "Inbox")}</CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t("Rechercher...", "Search...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t("Aucun message", "No messages")}</p>
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedMessage?.id === message.id ? 'bg-muted' : ''
                        } ${!message.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        onClick={() => {
                          setSelectedMessage(message)
                          if (!message.isRead) {
                            markAsRead(message.id)
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={message.sender.avatar} />
                            <AvatarFallback>
                              {message.sender.firstName[0]}{message.sender.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-medium truncate ${
                                !message.isRead ? 'font-semibold' : ''
                              }`}>
                                {message.sender.firstName} {message.sender.lastName}
                              </h4>
                              {getRoleIcon(message.sender.role)}
                              {!message.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-1">
                              {message.subject || t("Pas de sujet", "No subject")}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail / Compose */}
          <div className="lg:col-span-2">
            {showCompose ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("Nouveau message", "New message")}</CardTitle>
                    <Button variant="outline" onClick={() => setShowCompose(false)}>
                      {t("Annuler", "Cancel")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("Destinataire", "Recipient")}
                    </label>
                    <select
                      value={composeData.receiverId}
                      onChange={(e) => setComposeData(prev => ({ ...prev, receiverId: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">{t("Sélectionner un contact", "Select a contact")}</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName} ({getRoleLabel(contact.role)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("Sujet", "Subject")}
                    </label>
                    <Input
                      value={composeData.subject}
                      onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder={t("Sujet du message", "Message subject")}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("Message", "Message")}
                    </label>
                    <Textarea
                      value={composeData.content}
                      onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={t("Tapez votre message...", "Type your message...")}
                      className="min-h-[200px]"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCompose(false)}>
                      {t("Annuler", "Cancel")}
                    </Button>
                    <Button onClick={sendMessage}>
                      <Send className="w-4 h-4 mr-2" />
                      {t("Envoyer", "Send")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedMessage ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedMessage.sender.avatar} />
                        <AvatarFallback>
                          {selectedMessage.sender.firstName[0]}{selectedMessage.sender.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getRoleIcon(selectedMessage.sender.role)}
                          <span>{getRoleLabel(selectedMessage.sender.role)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedMessage.createdAt)}
                    </div>
                  </div>
                  {selectedMessage.subject && (
                    <div className="mt-2">
                      <h4 className="font-medium">{selectedMessage.subject}</h4>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-450px)] mb-4">
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>
                      
                      {/* Replies functionality can be added later */}
                    </div>
                  </ScrollArea>
                  
                  <div className="space-y-3">
                    <Separator />
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t("Répondre", "Reply")}
                      </label>
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={t("Tapez votre réponse...", "Type your reply...")}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={replyToMessage} disabled={!replyContent.trim()}>
                        <Reply className="w-4 h-4 mr-2" />
                        {t("Répondre", "Reply")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("Sélectionnez un message", "Select a message")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("Choisissez un message dans la liste pour le lire", "Choose a message from the list to read it")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  )
}
