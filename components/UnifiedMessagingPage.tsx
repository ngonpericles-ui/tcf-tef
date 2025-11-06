"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/language-provider'
import { usePusher } from '@/hooks/usePusher'
import { messageService, Message, Contact } from '@/lib/services/messageService'
import { getComprehensiveProfilePictureUrl, createProfilePictureWithFallback } from '@/lib/utils/profilePicture'
import { apiClient } from '@/lib/api-client'
import EmojiPicker from './EmojiPicker'
import MessageContextMenu from './MessageContextMenu'
import { OneOnOneVideoCall } from './OneOnOneVideoCall'
import VoiceRecorder from './VoiceRecorder'
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck,
  ArrowLeft,
  Users,
  MessageCircle,
  X,
  PhoneOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

interface UnifiedMessagingPageProps {
  preSelectedContact?: Contact | null
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER' | 'STUDENT'
}

export default function UnifiedMessagingPage({ 
  preSelectedContact = null, 
  userRole 
}: UnifiedMessagingPageProps) {
  
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
    
    // Regular expression to match URLs and stop before HTML tags like <br>
    const urlRegex = /(https?:\/\/[^\s<]+)/g
    
    // Split by URLs and process each part
    const parts = htmlContent.split(urlRegex)
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Sanitize possible trailing HTML fragments or punctuation accidentally captured
        const cleanUrl = part
          .replace(/<.*$/, '') // drop anything after first '<' (e.g., <br>)
          .replace(/[),.;]+$/, '') // drop trailing punctuation
          .trim()
        return (
          <a
            key={index}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 block my-2"
            onClick={(e) => {
              e.preventDefault()
              window.open(cleanUrl, '_blank')
            }}
          >
            🔗 {cleanUrl}
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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(preSelectedContact)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  // Dynamic tab types based on role
  const isManagerOrAdmin = userRole === 'ADMIN' || userRole === 'SENIOR_MANAGER' || userRole === 'JUNIOR_MANAGER'
  type TabType = typeof isManagerOrAdmin extends true ? 'all' | 'students' | 'tutors' | 'community' : 'all' | 'unread' | 'community'
  const [activeTab, setActiveTab] = useState<any>(isManagerOrAdmin ? 'all' : 'all')
  
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
  const [contactContextMenu, setContactContextMenu] = useState<{ x: number; y: number; contact: Contact } | null>(null)
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
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

  // Track if user is at bottom to avoid auto-scrolling when they're reading older messages
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [lastMessageCount, setLastMessageCount] = useState(0)

  // Filter contacts by active tab - Dynamic based on role
  const filteredContacts = useMemo(() => {
    if (isManagerOrAdmin) {
      // Manager/Admin tabs: Tous, Étudiants, Tuteurs, Communauté
      if (activeTab === 'all') return contacts
      if (activeTab === 'students') return contacts.filter(contact => contact.role === 'STUDENT' || contact.role === 'USER')
      if (activeTab === 'tutors') return contacts.filter(contact => contact.role === 'SENIOR_MANAGER' || contact.role === 'JUNIOR_MANAGER')
      if (activeTab === 'community') return contacts.filter(contact => contact.role === 'ADMIN')
      return contacts
    } else {
      // Student tabs: Tous, Non lus, Communauté
      // For students, "Tous" shows all conversations (from messages), not contacts
      if (activeTab === 'all') return contacts
      if (activeTab === 'unread') return contacts.filter(contact => contact.unreadCount > 0)
      if (activeTab === 'community') return contacts.filter(contact => contact.role === 'ADMIN')
      return contacts
    }
  }, [contacts, activeTab, isManagerOrAdmin])

  // Only auto-scroll if user is at bottom and new messages arrive
  useEffect(() => {
    if (isAtBottom && messages.length > lastMessageCount) {
    scrollToBottom()
    }
    setLastMessageCount(messages.length)
  }, [messages, isAtBottom, lastMessageCount, scrollToBottom])

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsAtBottom(isNearBottom)
  }, [])

  // Update contact online status from Pusher presence data
  useEffect(() => {
    if (onlineUsers) {
      console.log('🟢 Online users updated in UnifiedMessagingPage:', Array.from(onlineUsers))
      setContacts(prevContacts => {
        const updatedContacts = prevContacts.map(contact => {
          const isOnline = onlineUsers.has(contact.id)
          console.log(`👤 ${contact.firstName} ${contact.lastName} (${contact.id}): ${isOnline ? 'ONLINE' : 'OFFLINE'}`)
          return {
          ...contact,
            isOnline,
            lastSeen: isOnline ? 'En ligne' : contact.lastSeen
          }
        })
        console.log('📝 Updated contacts with online status:', updatedContacts.map(c => ({ name: `${c.firstName} ${c.lastName}`, id: c.id, isOnline: c.isOnline })))
        return updatedContacts
      })
    } else {
      console.log('❌ No online users data available')
    }
  }, [onlineUsers])

  // Subscribe to presence channel on mount - only when Pusher is connected
  useEffect(() => {
    if (isConnected && pusher && subscribeToPresence) {
      console.log('🟢 Attempting to subscribe to presence channel...')
      const presenceChannel = subscribeToPresence()
      
      return () => {
        if (presenceChannel) {
          try {
          presenceChannel.unbind_all()
            pusher?.unsubscribe('presence-presence-channel')
          } catch (error) {
            console.error('Error unsubscribing from presence:', error)
        }
      }
    }
    }
  }, [isConnected, pusher, subscribeToPresence])

  // Build conversations from messages (Universal - works for all roles)
  const buildConversationsFromMessages = useCallback((messages: any[]) => {
    const conversationMap = new Map()
    
    // Ensure messages is an array
    if (!Array.isArray(messages)) {
      console.error('❌ buildConversationsFromMessages: messages is not an array:', messages)
      return []
    }
    
    console.log('📨 Building conversations from', messages.length, 'messages for', userRole, ':', user?.email)
    
    messages.forEach(message => {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId
      const otherUser = message.senderId === user?.id ? message.receiver : message.sender
      
      console.log('🔍 Processing message:', {
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        currentUserId: user?.id,
        otherUserId,
        otherUserName: otherUser?.firstName + ' ' + otherUser?.lastName,
        content: message.content?.substring(0, 30)
      })
      
      // Skip if we can't identify the other user
      if (!otherUserId || !otherUser) {
        console.warn('⚠️ Skipping message with missing user data:', message)
        return
      }
      
      // Skip if this is a message from the user to themselves (shouldn't happen)
      if (otherUserId === user?.id) {
        console.warn('⚠️ Skipping self-message:', {
          messageId: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          currentUserId: user?.id
        })
        return
      }
      
      // Additional check: Skip if sender and receiver are the same person
      if (message.senderId === message.receiverId) {
        console.warn('⚠️ Skipping message where sender equals receiver:', {
          messageId: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId
        })
        return
      }
      
      // Create unique key to prevent duplicates
      const conversationKey = `${otherUserId}-${otherUser?.email || 'unknown'}`
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
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
          lastSeen: null,
          // WhatsApp-style conversation metadata
          isGroup: false,
          lastMessageSender: message.senderId === user?.id ? 'You' : otherUser?.firstName || 'Unknown',
          lastMessageType: message.type || 'text'
        })
        console.log('🆕 New conversation created with:', otherUser?.firstName, otherUser?.lastName, '(Role:', otherUser?.role, ')')
      }
      
      // Update with latest message info
      const conversation = conversationMap.get(conversationKey)
      if (new Date(message.createdAt) > new Date(conversation.lastMessageTime)) {
        conversation.lastMessageTime = message.createdAt
        conversation.lastMessageContent = message.content
      }
      
      // Count unread messages (only messages sent TO the current user)
      if (message.senderId !== user?.id && !message.isRead) {
        conversation.unreadCount++
      }
    })
    
    const conversations = Array.from(conversationMap.values())
      .filter(conversation => {
        // Final safety check: Remove any conversations where the other user is the same as current user
        if (conversation.id === user?.id) {
          console.warn('⚠️ Removing self-conversation:', conversation.firstName, conversation.lastName)
          return false
        }
        return true
      })
      .sort((a, b) => {
        // Sort by last message time (most recent first)
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
    
    console.log('✅ Built', conversations.length, 'conversations for', userRole)
    return conversations
  }, [user?.id, userRole])

  // Fetch contacts - Different logic for students vs admin/manager
  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      
      if (userRole === 'STUDENT') {
        // For students: Fetch all messages and build conversations from them
        const response = await messageService.getAllMessages()
        if (response.success && response.data) {
          console.log('📨 Student messages response:', response.data)
          const conversations = buildConversationsFromMessages(response.data)
          setContacts(conversations)
          // Only auto-select if there's a preSelectedContact and no current selection
          if (preSelectedContact && !selectedContact) {
            setSelectedContact(preSelectedContact)
          } else if (!preSelectedContact && !selectedContact && conversations.length > 0) {
            // Don't auto-select the first contact - let user choose
            console.log('📋 Contacts loaded, waiting for user selection')
          }
        }
      } else {
        // For admin/manager: Fetch ALL users (not just conversations)
        const response = await messageService.getContacts()
        if (response.success && response.data) {
          console.log('📨 Admin/Manager contacts response:', response.data)
          // Data already includes lastMessage and unreadCount from backend
          setContacts(response.data)
          // Only auto-select if there's a preSelectedContact and no current selection
          if (preSelectedContact && !selectedContact) {
            setSelectedContact(preSelectedContact)
          } else if (!preSelectedContact && !selectedContact && response.data.length > 0) {
            // Don't auto-select the first contact - let user choose
            console.log('📋 Contacts loaded, waiting for user selection')
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [preSelectedContact, selectedContact, userRole, buildConversationsFromMessages])

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

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedContact || !user?.id || isSending) return

    const messageContent = newMessage.trim()
    const messageTimestamp = new Date().toISOString()

    try {
      setIsSending(true)
      // Get the token - try multiple locations
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('accessToken') ||
                    localStorage.getItem('token')
      
      if (!token) {
        console.error('🚨 No authentication token found!')
        setIsSending(false)
        return
      }

      console.log('📤 Sending message to:', selectedContact.email)
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

      console.log('📥 Response Status:', response.status, 'Content-Type:', response.headers.get('content-type'))

      // Check response status first
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorData: any
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json()
          console.error('Failed to send message (JSON):', errorData)
        } else {
          const text = await response.text()
          console.error('Failed to send message (HTML):', text.substring(0, 200))
          console.error('🚨 Response was not JSON, got:', contentType, 'Status:', response.status)
          console.error('🚨 Full URL attempted: /api/messages')
          console.error('🚨 Auth token present:', !!token)
        }
        return
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('🚨 Expected JSON but got:', contentType)
        console.error('Response text:', text.substring(0, 200))
        return
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Message sent successfully!')
        // Message saved successfully - create message object for UI
        const newMsg: Message = {
          id: result.data.id,
          content: result.data.content,
          senderId: result.data.senderId,
          receiverId: result.data.receiverId,
          type: 'text',
          conversationId: `${user.id}-${selectedContact.id}`,
          timestamp: result.data.createdAt || messageTimestamp,
          isRead: false,
          read: false,
          delivered: true,
          readAt: null,
          createdAt: result.data.createdAt || messageTimestamp,
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

        // Add to local state immediately for instant UI update
        setMessages(prev => [...prev, newMsg])
        setNewMessage('')
        setReplyingTo(null)
        scrollToBottom()

        // Note: Pusher notification is already sent by the backend API
      } else {
        console.error('Unexpected response format:', result)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // TODO: Show error toast to user
    } finally {
      setIsSending(false)
    }
  }, [newMessage, selectedContact, user, pusherSendMessage, scrollToBottom, isSending])

  // Send voice message
  const handleSendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (!selectedContact || !user?.id || isSending) return

    try {
      setIsSending(true)
      
      // Get the token
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('accessToken') ||
                    localStorage.getItem('token')
      
      if (!token) {
        console.error('🚨 No authentication token found!')
        setIsSending(false)
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
    } finally {
      setIsSending(false)
    }
  }, [selectedContact, user, scrollToBottom, isSending])

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
      const response = await apiClient.delete(`/messages/${messageId}`, {
        data: { deleteForEveryone }
      })

      if (response.data?.success) {
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, content: response.data.data.content, isDeleted: true }
            : m
        ))
      } else {
        console.error('Failed to delete message:', response.data?.error)
      }
    } catch (error: any) {
      console.error('Failed to delete message:', error?.response?.data?.error || error?.message || error)
    }
  }, [])

  // Handle video call - now creates direct session and redirects to dedicated page
  const handleStartVideoCall = useCallback(async () => {
    if (selectedContact && user) {
      // Only allow one-on-one sessions with students
      if (selectedContact.role === 'STUDENT') {
        try {
          // Create direct one-on-one session
          const response = await apiClient.post('/messages/create-direct-session', {
            contactId: selectedContact.id
          })

          if (response.success && response.data) {
            console.log('Direct session created:', response.data)
            // Redirect to dedicated session page
            router.push(`/session/direct/${(response.data as any).sessionId}`)
          } else {
            console.error('Failed to create direct session:', response.error)
            alert('Erreur lors de la création de la session')
          }
        } catch (error) {
          console.error('Failed to create direct session:', error)
          alert('Erreur lors de la création de la session')
        }
      } else {
        // For non-students, use the old direct video call method
        try {
          await apiClient.post('/messages/video-call-notification', {
            receiverId: selectedContact.id,
            callerId: user.id,
            callerName: `${user.firstName} ${user.lastName}`,
            callerRole: user.role
          })
          console.log('Video call notification sent to:', selectedContact.id)
        } catch (error) {
          console.error('Failed to send video call notification:', error)
        }
      setIsVideoCallActive(true)
    }
    }
  }, [selectedContact, user, router])

  const handleEndVideoCall = useCallback(() => {
    setIsVideoCallActive(false)
  }, [])

  // Handle right-click context menu
  const handleContactContextMenu = useCallback((e: React.MouseEvent, contact: Contact) => {
    e.preventDefault()
    e.stopPropagation()
    setContactContextMenu({
      x: e.clientX,
      y: e.clientY,
      contact
    })
  }, [])

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async (contact: Contact) => {
    if (!user?.id) return
    
    try {
      const response = await apiClient.delete(`/messages/conversations/${user.id}/${contact.id}`)
      
      if (response.success) {
        // Remove contact from local state
        setContacts(prevContacts => 
          prevContacts.filter(c => c.id !== contact.id)
        )
        
        // If this was the selected contact, clear selection
        if (selectedContact?.id === contact.id) {
          setSelectedContact(null)
        }
        
        console.log('✅ Conversation deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
    
    setContactContextMenu(null)
  }, [user?.id, selectedContact])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContactContextMenu(null)
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
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

  // Socket event handlers - simplified for now
  useEffect(() => {
    // Note: Real-time features would need to be implemented in the useSocket hook
    // For now, we'll handle message updates through polling or other mechanisms
  }, [user?.id, selectedContact?.id])

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

    sendPresenceUpdate()

    // Send presence update every 30 seconds to keep user online
    const intervalId = setInterval(sendPresenceUpdate, 30000)

    // Send offline status when unmounting or tab closes
    return () => {
      clearInterval(intervalId)
      
      if (user?.id) {
        try {
          // Use public offline endpoint; sendBeacon cannot attach headers
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
  }, [user?.id])

  // Load contacts and messages on mount
  useEffect(() => {
    fetchContacts()
  }, []) // Remove fetchContacts from dependencies to prevent infinite loops

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id)
      
      // Subscribe to Pusher channel for real-time messages
      const channel = subscribeToUser(selectedContact.id)
      
      // Mark messages as read when viewing conversation
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
          
          // Mark each message as read
          for (const msg of unreadMessages) {
            await fetch(`http://localhost:3001/api/messages/${msg.id}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
          }
          
          // Update local state
          setMessages(prev => prev.map(m => 
            unreadMessages.find(um => um.id === m.id)
              ? { ...m, isRead: true, read: true, readAt: new Date().toISOString() }
              : m
          ))
          
          // Update contact unread count
          setContacts(prev => prev.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, unreadCount: 0 }
              : contact
          ))
        } catch (error) {
          console.error('Failed to mark messages as read:', error)
        }
      }
      
      // Mark messages as read after a short delay (to ensure messages are loaded)
      const timeoutId = setTimeout(markMessagesAsRead, 1000)
      
      return () => {
        clearTimeout(timeoutId)
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin'
      case 'SENIOR_MANAGER': return 'Gestionnaire Senior'
      case 'JUNIOR_MANAGER': return 'Gestionnaire Junior'
      case 'STUDENT': return 'Étudiant'
      case 'USER': return 'Utilisateur'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'SENIOR_MANAGER': return 'bg-blue-100 text-blue-800'
      case 'JUNIOR_MANAGER': return 'bg-green-100 text-green-800'
      case 'STUDENT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden min-h-0">

      {/* Incoming Call Notification Modal */}
      {isIncomingCall && incomingCallContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in">
            <div className="text-center">
              <div className="mb-6">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage 
                    src={getComprehensiveProfilePictureUrl(incomingCallContact.email, incomingCallContact.profileImage)} 
                    onError={(e) => {
                      const fallback = createProfilePictureWithFallback(incomingCallContact.email, incomingCallContact.profileImage);
                      if (e.currentTarget.src !== fallback.fallbackUrl) {
                        e.currentTarget.src = fallback.fallbackUrl;
                      }
                    }}
                  />
                  <AvatarFallback>
                    {incomingCallContact.firstName[0]}{incomingCallContact.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {incomingCallContact.firstName} {incomingCallContact.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Appel vidéo entrant...
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleRejectIncomingCall}
                  variant="destructive"
                  className="rounded-full w-14 h-14 p-0 flex items-center justify-center"
                  title="Rejeter l'appel"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleAcceptIncomingCall}
                  className="rounded-full w-14 h-14 p-0 flex items-center justify-center bg-green-500 hover:bg-green-600"
                  title="Accepter l'appel"
                >
                  <Video className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar - FIXED: Increased width and responsive */}
      <div className="w-[400px] min-w-[320px] max-w-[35%] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Messages {getRoleDisplayName(userRole)}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Role Tabs - Dynamic based on user role - FIXED: Horizontal scrollable */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex space-x-2 px-4 py-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* All roles see "Tous" tab - FIXED: Reduced padding for better fit */}
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'all'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Tous
            </button>

            {/* Manager/Admin specific tabs - FIXED: Whitespace-nowrap to prevent wrapping */}
            {isManagerOrAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'students'
                      ? 'bg-blue-500 text-white shadow-md transform scale-105'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Étudiants
                </button>
                <button
                  onClick={() => setActiveTab('tutors')}
                  className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'tutors'
                      ? 'bg-blue-500 text-white shadow-md transform scale-105'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Tuteurs
                </button>
              </>
            ) : (
              /* Student specific tab */
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'unread'
                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Non lus
              </button>
            )}

            {/* All roles see "Communauté" tab - FIXED: Whitespace-nowrap to prevent cutoff */}
            <button
              onClick={() => setActiveTab('community')}
              className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'community'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Communauté
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {searchFilteredContacts.map((contact: Contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              onContextMenu={(e) => handleContactContextMenu(e, contact)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
                    {/* Hide role badges in all tabs for cleaner UI */}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {contact.email}
                  </p>
                  
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {contact.isOnline 
                      ? t("En ligne", "Online")
                      : contact.lastMessageContent 
                        ? (
                            <span>
                              {contact.lastMessageSender === 'You' ? 'Vous: ' : ''}
                              {contact.lastMessageContent.substring(0, 50)}
                              {contact.lastMessageContent.length > 50 ? '...' : ''}
                            </span>
                          )
                        : t("Aucun message", "No messages")
                    }
                  </p>
                </div>
                
                {contact.unreadCount > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    {contact.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedContact ? (
          <>
            {/* Chat Header - Fixed */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                  <Avatar className="h-10 w-10">
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
                    {/* Online indicator */}
                    {selectedContact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h2>
                    <p className={`text-sm ${selectedContact.isOnline ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {selectedContact.isOnline ? t("En ligne", "Online") : t("Hors ligne", "Offline")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Démarrer une session vidéo"
                    onClick={handleStartVideoCall}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Informations du contact">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages - Scrollable Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
              onScroll={handleScroll}
            >
              {messages.slice().reverse().map((message, index) => (
                <div
                  key={`${message.id}-${message.senderId}-${message.createdAt}-${index}`}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity ${
                      message.senderId === user?.id
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                    }`}
                    onContextMenu={(e) => handleMessageRightClick(e, message)}
                  >
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className={`text-xs mb-2 p-2 rounded border-l-2 ${
                        message.senderId === user?.id 
                          ? 'bg-blue-500 bg-opacity-20 border-blue-300' 
                          : 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                      }`}>
                        <p className="font-medium">
                          {message.replyTo.sender?.firstName} {message.replyTo.sender?.lastName}
                        </p>
                        <p className="truncate">{message.replyTo.content}</p>
                      </div>
                    )}
                    
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
                      <div className="text-sm">
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
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start mb-2">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {Array.from(typingUsers).map((id: string) => (
                          <div key={id} className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        {Array.from(typingUsers).map((id: string) => {
                          const user = contacts.find(c => c.id === id)
                          return user ? `${user.firstName} tape...` : 'Quelqu\'un tape...'
                        }).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Indicator */}
            {replyingTo && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-8 bg-blue-500 rounded"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Répondre à {replyingTo.sender?.firstName} {replyingTo.sender?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {replyingTo.content}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input - Fixed at Bottom with Rounded Design */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 sticky bottom-0 z-10">
              {/* Emoji Picker */}
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
              
              {/* Reply Indicator */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Répondre à {replyingTo.sender.firstName}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{replyingTo.content}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                {/* Emoji Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                
                {/* Attachment Button */}
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                {/* Message Input Container - Rounded */}
                <div className="flex-1 relative">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
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
                      className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <div className="flex items-center space-x-2">
                      {/* Voice Recorder */}
                      <VoiceRecorder
                        onSendVoiceMessage={handleSendVoiceMessage}
                        disabled={!isConnected || isSending}
                      />
                      
                      {/* Send Button - WhatsApp Style */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full h-8 w-8 p-0 transition-colors ${
                          newMessage.trim() && isConnected && !isSending
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !isConnected || isSending}
                        title="Envoyer le message"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a contact to start messaging
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose someone from the list to begin your conversation
              </p>
            </div>
          </div>
        )}
      </div>

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

      {/* Contact Context Menu */}
      {contactContextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[150px]"
          style={{
            left: contactContextMenu.x,
            top: contactContextMenu.y,
          }}
        >
          <button
            onClick={() => handleDeleteConversation(contactContextMenu.contact)}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Delete Conversation</span>
          </button>
        </div>
      )}
    </div>
  )
}
