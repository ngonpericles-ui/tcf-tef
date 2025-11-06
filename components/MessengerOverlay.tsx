"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/language-provider'
import { usePusher } from '@/hooks/usePusher'
import { messageService, Message, Contact } from '@/lib/services/messageService'
import { getComprehensiveProfilePictureUrl, createProfilePictureWithFallback } from '@/lib/utils/profilePicture'
import EmojiPicker from './EmojiPicker'
import MessageContextMenu from './MessageContextMenu'
import VoiceRecorder from './VoiceRecorder'
import { OneOnOneVideoCall } from './OneOnOneVideoCall'
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  Info, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck,
  X,
  PhoneOff,
  MessageCircle,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

interface MessengerOverlayProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  isMinimized?: boolean
}

export default function MessengerOverlay({ 
  isOpen, 
  onClose, 
  onMinimize, 
  isMinimized = false 
}: MessengerOverlayProps) {
  
  // Function to render messages with markdown formatting and clickable links
  const renderMessageWithLinks = (content: string) => {
    // First, convert markdown to HTML
    let htmlContent = content
      // Convert **text** to <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *text* to <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>')
    
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    
    // Split by URLs and process each part
    const parts = htmlContent.split(urlRegex)
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline break-all"
            onClick={(e) => {
              e.preventDefault()
              window.open(part, '_blank')
            }}
          >
            {part}
          </a>
        )
      }
      return (
        <span 
          key={index}
          dangerouslySetInnerHTML={{ __html: part }}
        />
      )
    })
  }
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  
  // Student-specific tabs: Tous, Non lus, Communauté
  type StudentTabType = 'all' | 'unread' | 'community'
  const [activeTab, setActiveTab] = useState<StudentTabType>('all')
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    messageId: string;
    position: { x: number; y: number };
    isOwnMessage: boolean;
  }>({
    isOpen: false,
    messageId: '',
    position: { x: 0, y: 0 },
    isOwnMessage: false
  })
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [incomingCallContact, setIncomingCallContact] = useState<Contact | null>(null)
  const { user } = useAuth()
  const { t } = useLanguage()
  const { 
    isConnected, 
    sendMessage: pusherSendMessage, 
    sendTypingIndicator: pusherSendTypingIndicator,
    typingUsers,
    onlineUsers,
    subscribeToUser, 
    subscribeToPresence,
    pusher 
  } = usePusher()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Filter contacts by active tab - Student specific
  const filteredContacts = React.useMemo(() => {
    if (activeTab === 'all') return contacts
    if (activeTab === 'unread') return contacts.filter(contact => contact.unreadCount > 0)
    if (activeTab === 'community') return contacts.filter(contact => contact.role === 'ADMIN')
    return contacts
  }, [contacts, activeTab])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Update contact online status from Pusher presence data
  useEffect(() => {
    if (onlineUsers && onlineUsers.size > 0) {
      setContacts(prevContacts =>
        prevContacts.map(contact => ({
          ...contact,
          isOnline: onlineUsers.has(contact.id)
        }))
      )
    }
  }, [onlineUsers])

  // Subscribe to presence channel on mount
  useEffect(() => {
    if (subscribeToPresence) {
      console.log('🟢 Subscribing to presence channel...')
      const presenceChannel = subscribeToPresence()
      
      return () => {
        if (presenceChannel) {
          presenceChannel.unbind_all()
        }
      }
    }
  }, [subscribeToPresence])

  // Build conversations from messages (Student-specific)
  const buildConversationsFromMessages = useCallback((messages: any[]) => {
    const conversationMap = new Map()
    
    // Ensure messages is an array
    if (!Array.isArray(messages)) {
      console.error('❌ buildConversationsFromMessages: messages is not an array:', messages)
      return []
    }
    
    console.log('📨 Building conversations from', messages.length, 'messages')
    
    messages.forEach(message => {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId
      const otherUser = message.senderId === user?.id ? message.receiver : message.sender
      
      // Skip if we can't identify the other user
      if (!otherUserId || !otherUser) {
        console.warn('⚠️ Skipping message with missing user data:', message)
        return
      }
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          id: otherUserId,
          firstName: otherUser?.firstName || 'Unknown',
          lastName: otherUser?.lastName || 'User',
          email: otherUser?.email || '',
          role: otherUser?.role || 'USER',
          profileImage: otherUser?.profileImage || '',
          lastMessageTime: message.createdAt,
          lastMessageContent: message.content,
          unreadCount: 0,
          isOnline: false,
          lastSeen: null
        })
        console.log('🆕 New conversation created with:', otherUser?.firstName, otherUser?.lastName)
      }
      
      // Update with latest message info
      const conversation = conversationMap.get(otherUserId)
      if (new Date(message.createdAt) > new Date(conversation.lastMessageTime)) {
        conversation.lastMessageTime = message.createdAt
        conversation.lastMessageContent = message.content
      }
      
      // Count unread messages (only messages sent TO the student)
      if (message.senderId !== user?.id && !message.isRead) {
        conversation.unreadCount++
      }
    })
    
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => {
        // Sort by last message time (most recent first)
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
    
    console.log('✅ Built', conversations.length, 'conversations for student')
    return conversations
  }, [user?.id])

  // Fetch conversations from messages (Student-specific)
  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // For students: Fetch all messages and build conversations from them
      const response = await messageService.getAllMessages()
      if (response.success && response.data) {
        console.log('📨 Student messages response:', response.data)
        const conversations = buildConversationsFromMessages(response.data)
        setContacts(conversations)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [buildConversationsFromMessages])

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async (contactId: string) => {
    try {
      const response = await messageService.getMessages(contactId)
      if (response.success && response.data) {
        // Ensure data is always an array
        const messagesData = Array.isArray(response.data) ? response.data : []
        setMessages(messagesData)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessages([])
    }
  }, [])

  // Send message - OPTIMIZED for speed
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedContact || !user?.id) return

    const messageContent = newMessage.trim()
    const messageTimestamp = new Date().toISOString()

    // Create optimistic message for instant UI update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: messageContent,
      senderId: user.id,
      receiverId: selectedContact.id,
      type: 'text',
      conversationId: `${user.id}-${selectedContact.id}`,
      timestamp: messageTimestamp,
      isRead: false,
      read: false,
      delivered: false, // Will be updated when confirmed
      readAt: null,
      createdAt: messageTimestamp,
      sender: {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'USER',
        profileImage: user.profileImage || ''
      },
      receiver: {
        id: selectedContact.id,
        firstName: selectedContact.firstName,
        lastName: selectedContact.lastName,
        email: selectedContact.email,
        role: selectedContact.role,
        profileImage: selectedContact.profileImage || ''
      },
      updatedAt: messageTimestamp
    }

    // Add optimistic message IMMEDIATELY for instant UI feedback
    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')
    setReplyingTo(null)
    scrollToBottom()

    try {
      // Get the token - try multiple locations
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('accessToken') ||
                    localStorage.getItem('token')
      
      if (!token) {
        console.error('🚨 No authentication token found!')
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        return
      }

      console.log('📤 Sending message to:', selectedContact.email)
      
      // Send message in background
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: messageContent,
          type: 'text'
        })
      })

      if (!response.ok) {
        console.error('Failed to send message:', response.status)
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        return
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Message sent successfully!')
        
        // Replace optimistic message with real message
        setMessages(prev => prev.map(m => 
          m.id === optimisticMsg.id 
            ? {
                ...m,
                id: result.data.id,
                delivered: true,
                timestamp: result.data.createdAt || messageTimestamp,
                createdAt: result.data.createdAt || messageTimestamp
              }
            : m
        ))

        // Note: Pusher notification is already sent by the backend API
      } else {
        console.error('Unexpected response format:', result)
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    }
  }, [newMessage, selectedContact, user, pusherSendMessage, scrollToBottom])

  // Send voice message
  const handleSendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (!selectedContact || !user?.id) return

    try {
      // Get the token
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('accessToken') ||
                    localStorage.getItem('token')
      
      if (!token) {
        console.error('🚨 No authentication token found!')
        return
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice-message.webm')
      formData.append('receiverId', selectedContact.id)
      formData.append('type', 'audio')

      console.log('📤 Sending voice message to:', selectedContact.email)
      const response = await fetch('http://localhost:3001/api/messages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to send voice message:', errorData)
        return
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Voice message sent successfully!')
        
        // Create message object for UI
        const newMsg: Message = {
          id: result.data.id,
          content: 'Voice message',
          senderId: result.data.senderId,
          receiverId: result.data.receiverId,
          type: 'audio',
          conversationId: `${user.id}-${selectedContact.id}`,
          timestamp: result.data.createdAt,
          isRead: false,
          read: false,
          delivered: true,
          readAt: null,
          createdAt: result.data.createdAt,
          fileUrl: result.data.fileUrl,
          fileName: result.data.fileName,
          fileSize: result.data.fileSize,
          sender: {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            role: user.role || 'USER',
            profileImage: user.profileImage || ''
          },
          receiver: {
            id: selectedContact.id,
            firstName: selectedContact.firstName,
            lastName: selectedContact.lastName,
            email: selectedContact.email,
            role: selectedContact.role,
            profileImage: selectedContact.profileImage || ''
          },
          updatedAt: result.data.createdAt
        }

        // Add to local state immediately for instant UI update
        setMessages(prev => [...prev, newMsg])
        scrollToBottom()

        // Note: Pusher notification is already sent by the backend API
      } else {
        console.error('Unexpected response format:', result)
      }
    } catch (error) {
      console.error('Failed to send voice message:', error)
    }
  }, [selectedContact, user, scrollToBottom])

  // Debounced typing indicator
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  // Handle typing indicators with debouncing
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!selectedContact || !pusherSendTypingIndicator) return

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    if (isTyping) {
      // Send typing indicator immediately
      pusherSendTypingIndicator(selectedContact.id, true)
      
      // Set timeout to stop typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        pusherSendTypingIndicator(selectedContact.id, false)
      }, 3000)
      
      setTypingTimeout(timeout)
    } else {
      // Send stop typing indicator immediately
      pusherSendTypingIndicator(selectedContact.id, false)
    }
  }, [selectedContact, pusherSendTypingIndicator, typingTimeout])

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }, [])

  // Handle context menu
  const handleMessageRightClick = useCallback((e: React.MouseEvent, message: Message) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      messageId: message.id,
      position: { x: e.clientX, y: e.clientY },
      isOwnMessage: message.senderId === user?.id
    })
  }, [user?.id])

  // Handle reply
  const handleReply = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setReplyingTo(message)
      setNewMessage('')
    }
  }, [messages])

  // Handle delete message
  const handleDeleteMessage = useCallback(async (messageId: string, deleteForEveryone = false) => {
    try {
      const response = await fetch(`http://localhost:3001/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ deleteForEveryone })
      })

      if (response.ok) {
        const result = await response.json()
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, content: result.data.content, isDeleted: true }
            : m
        ))
      } else {
        console.error('Failed to delete message')
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }, [])

  // Handle video call
  const handleStartVideoCall = useCallback(() => {
    if (selectedContact) {
      setIsVideoCallActive(true)
    }
  }, [selectedContact])

  const handleEndVideoCall = useCallback(() => {
    setIsVideoCallActive(false)
  }, [])

  // Handle incoming call
  const handleAcceptIncomingCall = useCallback(() => {
    if (incomingCallContact) {
      setSelectedContact(incomingCallContact)
      setIsVideoCallActive(true)
      setIsIncomingCall(false)
      setIncomingCallContact(null)
    }
  }, [incomingCallContact])

  const handleRejectIncomingCall = useCallback(() => {
    setIsIncomingCall(false)
    setIncomingCallContact(null)
  }, [])

  // Send presence update when user opens messaging
  useEffect(() => {
    const sendPresenceUpdate = async () => {
      if (!user?.id) return
      
      try {
        const token = localStorage.getItem('access_token') || 
                      localStorage.getItem('accessToken') ||
                      localStorage.getItem('token')
        
        if (!token) return
        
        console.log('🟢 Sending presence update: User is online')
        await fetch('http://localhost:3001/api/messages/presence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isOnline: true })
        })
      } catch (error) {
        console.error('Failed to send presence update:', error)
      }
    }

    if (isOpen) {
      sendPresenceUpdate()
    }

    // Send presence update every 30 seconds to keep user online
    const intervalId = setInterval(sendPresenceUpdate, 30000)

    // Send offline status when unmounting or tab closes
    return () => {
      clearInterval(intervalId)
      
      if (user?.id) {
        try {
          // Public offline endpoint (no auth headers with sendBeacon)
          const payload = new Blob([
            JSON.stringify({ userId: user.id, isOnline: false })
          ], { type: 'application/json' })
          navigator.sendBeacon(
            'http://localhost:3001/api/messages/presence-offline',
            payload
          )
        } catch {}
      }
    }
  }, [user?.id, isOpen])

  // Load conversations on mount
  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [fetchContacts, isOpen])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id)
      
      // Subscribe to Pusher channel for real-time messages
      const channel = subscribeToUser(selectedContact.id)
      
      // Mark messages as read when viewing conversation - OPTIMIZED
      const markMessagesAsRead = async () => {
        try {
          const token = localStorage.getItem('access_token') || 
                        localStorage.getItem('accessToken') ||
                        localStorage.getItem('token')
          
          if (!token) return
          
          // Get unread messages from this contact
          const unreadMessages = messages.filter(
            msg => msg.senderId === selectedContact.id && !msg.isRead && !msg.read
          )
          
          if (unreadMessages.length === 0) return
          
          console.log(`📖 Marking ${unreadMessages.length} messages as read`)
          
          // Update local state IMMEDIATELY for instant UI feedback
          setMessages(prev => prev.map(m => 
            unreadMessages.find(um => um.id === m.id)
              ? { ...m, isRead: true, read: true, readAt: new Date().toISOString() }
              : m
          ))
          
          // Update contact unread count IMMEDIATELY
          setContacts(prev => prev.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, unreadCount: 0 }
              : contact
          ))
          
          // Mark messages as read in background (don't wait for response)
          Promise.all(unreadMessages.map(msg => 
            fetch(`http://localhost:3001/api/messages/${msg.id}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }).catch(err => console.warn('Failed to mark message as read:', err))
          )).catch(err => console.warn('Some messages failed to mark as read:', err))
          
        } catch (error) {
          console.error('Failed to mark messages as read:', error)
        }
      }
      
      // Mark messages as read IMMEDIATELY when conversation is viewed
      markMessagesAsRead()
      
      return () => {
        // Cleanup subscription when contact changes
        if (channel) {
          channel.unbind_all()
        }
      }
    }
  }, [selectedContact, fetchMessages, subscribeToUser, messages])

  // Listen for incoming calls via Pusher
  useEffect(() => {
    if (!user?.id || !pusher) return

    const channel = pusher?.subscribe(`private-${user.id}`)
    
    if (channel) {
      // Listen for incoming video call events
      channel.bind('incoming-call', (data: any) => {
        console.log('Incoming call from:', data.callerId)
        // Find the caller in contacts
        const caller = contacts.find(c => c.id === data.callerId)
        if (caller) {
          setIncomingCallContact(caller)
          setIsIncomingCall(true)
        }
      })

      // Cleanup on unmount
      return () => {
        channel.unbind_all()
      }
    }
  }, [user?.id, pusher, contacts])

  // Filter contacts based on search
  const searchFilteredContacts = filteredContacts.filter((contact: Contact) =>
    contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper function to format message timestamp
  const formatMessageTime = (timestamp: string | Date | undefined) => {
    try {
      if (!timestamp) {
        console.warn('⚠️ No timestamp provided')
        return '--:--'
      }
      
      // Handle both ISO strings and Date objects
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date:', timestamp)
        return '--:--'
      }
      
      const now = new Date()
      const isToday = now.toDateString() === date.toDateString()
      const locale = t("fr", "en") === "fr" ? fr : enUS
      
      // Always show time in HH:mm format (24-hour)
      if (isToday) {
        // Show time only for messages from today
        return format(date, 'HH:mm', { locale })
      } else {
        // Show date and time for older messages (e.g., "27/10 16:45")
        return format(date, 'dd/MM HH:mm', { locale })
      }
    } catch (error) {
      console.error('❌ Error formatting timestamp:', error, 'Value:', timestamp)
      return '--:--'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Messenger Overlay - Facebook Messenger Style */}
      <div className={`fixed bottom-4 right-4 z-[9999] bg-white dark:bg-gray-800 rounded-t-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px] sm:w-[400px] sm:h-[600px]'
      }`} style={{ 
        maxHeight: 'calc(100vh - 2rem)', 
        maxWidth: 'calc(100vw - 2rem)',
        minHeight: isMinimized ? '4rem' : '400px',
        borderRadius: isMinimized ? '0.5rem' : '0.5rem 0.5rem 0 0'
      }}>
        {/* Header - Facebook Messenger Style */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-500 text-white" style={{ borderRadius: isMinimized ? '0.5rem 0.5rem 0 0' : '0.5rem 0.5rem 0 0' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm">Messages</span>
              {contacts.filter(c => c.unreadCount > 0).length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-xs opacity-90">{contacts.filter(c => c.unreadCount > 0).length} new</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="text-white hover:bg-blue-600 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-600 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher des conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Non lus
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'community'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Communauté
              </button>
            </div>

            {/* Content - Facebook Messenger Style */}
            <div className="flex-1 flex h-[400px] bg-gray-50 dark:bg-gray-700">
              {/* Conversations List */}
              <div className="w-1/2 sm:w-1/2 border-r border-gray-200 dark:border-gray-600 overflow-y-auto bg-white dark:bg-gray-800">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : searchFilteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <MessageCircle className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Aucune conversation</p>
                  </div>
                ) : (
                  searchFilteredContacts.map((contact: Contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={getComprehensiveProfilePictureUrl(contact.email, contact.profileImage)} 
                            onError={(e) => {
                              const fallback = createProfilePictureWithFallback(contact.email, contact.profileImage);
                              if (e.currentTarget.src !== fallback.fallbackUrl) {
                                e.currentTarget.src = fallback.fallbackUrl;
                              }
                            }}
                          />
                          <AvatarFallback>
                            {contact.firstName[0]}{contact.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.unreadCount > 0 && (
                              <Badge className="bg-blue-600 text-white text-xs">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {contact.email}
                          </p>
                          
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {contact.isOnline 
                              ? t("En ligne", "Online")
                              : contact.lastMessageContent 
                                ? contact.lastMessageContent.substring(0, 30) + (contact.lastMessageContent.length > 30 ? '...' : '')
                                : t("Aucun message", "No messages")
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Area */}
              <div className="w-1/2 sm:w-1/2 flex flex-col bg-white dark:bg-gray-800">
                {selectedContact ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={getComprehensiveProfilePictureUrl(selectedContact.email, selectedContact.profileImage)} 
                              onError={(e) => {
                                const fallback = createProfilePictureWithFallback(selectedContact.email, selectedContact.profileImage);
                                if (e.currentTarget.src !== fallback.fallbackUrl) {
                                  e.currentTarget.src = fallback.fallbackUrl;
                                }
                              }}
                            />
                            <AvatarFallback>
                              {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedContact.firstName} {selectedContact.lastName}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {selectedContact.isOnline ? t("En ligne", "Online") : t("Hors ligne", "Offline")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleStartVideoCall}
                            className="h-8 w-8 p-0"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Messages - Facebook Messenger Style */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-700">
                      {messages.slice().reverse().map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                              message.senderId === user?.id
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
                            }`}
                            onContextMenu={(e) => handleMessageRightClick(e, message)}
                          >
                            {/* Message Content */}
                            {message.type === 'audio' ? (
                              <div className="flex items-center space-x-2">
                                <audio 
                                  controls 
                                  className="w-full max-w-xs"
                                  src={message.fileUrl}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            ) : (
                              <div>
                                {renderMessageWithLinks(message.content)}
                              </div>
                            )}
                            <div className="flex items-center justify-end mt-1 space-x-1">
                              <span className="text-xs opacity-70">
                                {formatMessageTime(message.createdAt || message.timestamp || message.updatedAt)}
                              </span>
                              {message.senderId === user?.id && (
                                <div className="flex items-center space-x-1">
                                  {message.delivered ? (
                                    message.isRead || message.read ? (
                                      <div title="Read" className="flex items-center">
                                      <CheckCheck className="h-3 w-3 text-blue-300" />
                                      </div>
                                    ) : (
                                      <div title="Delivered" className="flex items-center">
                                        <Check className="h-3 w-3 text-blue-300" />
                                      </div>
                                    )
                                  ) : (
                                    <div title="Sent" className="flex items-center">
                                      <Check className="h-3 w-3 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input - Facebook Messenger Style */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                          <Smile className="h-4 w-4 text-gray-500" />
                        </Button>
                        
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Tapez un message..."
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value)
                              handleTyping(e.target.value.length > 0)
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                sendMessage()
                              }
                            }}
                            className="h-8 text-sm rounded-full border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* Voice Recorder */}
                        <VoiceRecorder
                          onSendVoiceMessage={handleSendVoiceMessage}
                          disabled={!isConnected}
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || !isConnected}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full disabled:opacity-50"
                        >
                          <Send className="h-4 w-4 text-blue-500" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Sélectionnez une conversation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />

      {/* Context Menu */}
      <MessageContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onReply={() => handleReply(contextMenu.messageId)}
        onDelete={() => handleDeleteMessage(contextMenu.messageId)}
        position={contextMenu.position}
        isOwnMessage={contextMenu.isOwnMessage}
      />

      {/* One-on-One Video Call */}
      {isVideoCallActive && selectedContact && (
        <OneOnOneVideoCall
          contactId={selectedContact.id}
          contactName={`${selectedContact.firstName} ${selectedContact.lastName}`}
          contactRole={selectedContact.role}
          onEndCall={handleEndVideoCall}
        />
      )}
    </>
  )
}
