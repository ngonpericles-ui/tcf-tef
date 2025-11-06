"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/language-provider'
import { usePusher } from '@/hooks/usePusher'
import { messageService, Message, Contact } from '@/lib/services/messageService'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import EmojiPicker from '@/components/EmojiPicker'
import VoiceRecorder from '@/components/VoiceRecorder'
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  ArrowLeft,
  MessageCircle,
  Users,
  Clock,
  Check,
  CheckCheck,
  Reply,
  Trash2,
  Edit3,
  Mic,
  Image,
  File,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow, format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export default function StudentMessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // Core state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [localTypingUsers, setLocalTypingUsers] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
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
  
  // Student-specific tabs: Tous, Étudiants, Tuteurs, Communauté
  type StudentTabType = 'tous' | 'etudiants' | 'tuteurs' | 'communaute'
  const [activeTab, setActiveTab] = useState<StudentTabType>('tous')
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedContactRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Pusher integration - Using local typing state to avoid conflicts
  const { 
    isConnected,
    onlineUsers,
    sendTypingIndicator,
    subscribeToPresence,
    pusher 
  } = usePusher()

  // Function to render messages with markdown formatting and clickable links
  const renderMessageWithLinks = useCallback((content: string) => {
    // Enhanced URL regex to catch more URL patterns
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[^\s<]+\.[a-z]{2,}[^\s<]*)/gi
    
    // Split content by URLs while preserving them
    const parts = content.split(urlRegex)
    
    return parts.map((part, index) => {
      // Check if this part is a URL
      if (urlRegex.test(part)) {
        let url = part
        // Add protocol if missing
        if (!url.startsWith('http')) {
          url = `https://${url}`
        }
        
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline font-medium break-all cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded border-b-2 border-blue-300 hover:border-blue-500 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              window.open(url, '_blank')
            }}
          >
            {part}
          </a>
        )
      } else {
        // Process markdown formatting for non-URL parts
        let processedContent = part
          // Convert **text** to bold
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Convert *text* to italic
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          // Convert line breaks
          .replace(/\n/g, '<br>')
        
      return (
        <span 
          key={index}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )
      }
    })
  }, [])

  // Scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Filter contacts based on active tab and search
  const filteredContacts = useMemo(() => {
    let filtered = contacts

    // Filter by tab
    if (activeTab === 'etudiants') {
      filtered = filtered.filter(contact => contact.role === 'STUDENT')
    } else if (activeTab === 'tuteurs') {
      filtered = filtered.filter(contact => 
        contact.role === 'ADMIN' || 
        contact.role === 'SENIOR_MANAGER' || 
        contact.role === 'JUNIOR_MANAGER'
      )
    } else if (activeTab === 'communaute') {
      filtered = filtered.filter(contact => 
        contact.role === 'ADMIN' || 
        contact.role === 'SENIOR_MANAGER'
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(contact => 
        contact.firstName?.toLowerCase().includes(query) ||
        contact.lastName?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [contacts, activeTab, searchQuery])

  // Update online status from Pusher - ENHANCED with better debugging
  useEffect(() => {
    if (onlineUsers) {
      console.log('🟢 Online users updated in StudentMessagesPage:', Array.from(onlineUsers))
      setContacts(prevContacts => {
        const updatedContacts = prevContacts.map(contact => {
          // FIXED: Enhanced status check for managers/admins (same as backend logic)
          const isManagerOrAdmin = contact.role === 'ADMIN' || contact.role === 'SENIOR_MANAGER' || contact.role === 'JUNIOR_MANAGER'
          const pusherOnline = onlineUsers.has(contact.id)
          const statusOnline = isManagerOrAdmin
            ? (contact.status === 'ONLINE' || contact.status === 'ACTIVE')
            : (contact.status === 'ONLINE')
          const isOnline = pusherOnline || statusOnline
          
          console.log(`👤 ${contact.firstName} ${contact.lastName} (${contact.id}): ${isOnline ? 'ONLINE' : 'OFFLINE'} - Pusher: ${pusherOnline}, Status: ${contact.status}, Role: ${contact.role}, Manager: ${isManagerOrAdmin}`)
          return {
            ...contact,
            isOnline,
            lastSeen: isOnline ? 'En ligne' : 'Hors ligne'
          }
        })
        console.log('📝 Updated contacts with online status:', updatedContacts.map(c => ({ name: `${c.firstName} ${c.lastName}`, id: c.id, isOnline: c.isOnline, status: c.status })))
        return updatedContacts
      })
      
      // Also update selected contact immediately when online users change
      setSelectedContact(prevSelected => {
        if (!prevSelected) return null
        
        // FIXED: Enhanced status check for managers/admins (same as backend logic)
        const isManagerOrAdmin = prevSelected.role === 'ADMIN' || prevSelected.role === 'SENIOR_MANAGER' || prevSelected.role === 'JUNIOR_MANAGER'
        const pusherOnline = onlineUsers.has(prevSelected.id)
        const statusOnline = isManagerOrAdmin
          ? (prevSelected.status === 'ONLINE' || prevSelected.status === 'ACTIVE')
          : (prevSelected.status === 'ONLINE')
        const isOnline = pusherOnline || statusOnline
        
        console.log(`🎯 HEADER STATUS UPDATE: ${prevSelected.firstName}`)
        console.log(`   - Pusher Online: ${pusherOnline}`)
        console.log(`   - Status: ${prevSelected.status}, Role: ${prevSelected.role}, Manager: ${isManagerOrAdmin}`)
        console.log(`   - Status Online: ${statusOnline}`)
        console.log(`   - Final Result: ${isOnline ? 'ONLINE' : 'OFFLINE'}`)
        console.log(`   - Will show: ${isOnline ? 'En ligne' : 'Hors ligne'}`)
        return {
          ...prevSelected,
          isOnline,
          lastSeen: isOnline ? 'En ligne' : 'Hors ligne'
        }
      })
    } else {
      console.log('❌ No online users data available')
    }
  }, [onlineUsers])

  // Simplified selected contact status update - now handled in onlineUsers effect above

  // Subscribe to presence and private channel for typing indicators
  useEffect(() => {
    if (isConnected && pusher && subscribeToPresence && user?.id) {
      console.log('🟢 Attempting to subscribe to presence channel...')
      subscribeToPresence()
      
      // Subscribe to user's private channel for typing indicators and new messages
      console.log('🟢 Subscribing to private channel for typing indicators:', `private-${user.id}`)
      const privateChannel = pusher.subscribe(`private-${user.id}`)
      
      // Wait for subscription to be authorized before binding events
      privateChannel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Private channel subscription succeeded, binding events...')
        
        // Listen for new messages from Pusher
        privateChannel.bind('new-message', (data: { message: any }) => {
          console.log('📨 NEW MESSAGE RECEIVED VIA PUSHER:', data.message)
          
          if (data.message && selectedContact && 
              (data.message.senderId === selectedContact.id || data.message.receiverId === selectedContact.id)) {
            const pusherMessage: Message = {
              ...data.message,
              id: data.message.id || `pusher-${Date.now()}`,
              senderId: data.message.senderId,
              receiverId: data.message.receiverId,
              content: data.message.content || '',
              timestamp: data.message.timestamp || data.message.createdAt || new Date().toISOString(),
              createdAt: data.message.createdAt || data.message.timestamp || new Date().toISOString(),
              isRead: data.message.isRead || false,
              read: data.message.read || false,
              delivered: data.message.delivered !== false,
              conversationId: data.message.conversationId || `${data.message.senderId}-${data.message.receiverId}`,
              sender: data.message.sender || {
                id: data.message.senderId,
                firstName: selectedContact.firstName,
                lastName: selectedContact.lastName,
                email: selectedContact.email || '',
                role: selectedContact.role || 'ADMIN'
              },
              receiver: data.message.receiver || {
                id: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.role || 'STUDENT'
              }
            }
            
            // Prevent duplicates - FIXED: Add to end (bottom) like WhatsApp
            setMessages(prev => {
              const exists = prev.some(m => m.id === pusherMessage.id)
              if (exists) {
                console.log('⚠️ Pusher message already exists, skipping duplicate:', pusherMessage.id)
                return prev
              }
              console.log('✅ Adding Pusher message to UI (bottom):', pusherMessage.id, pusherMessage.content.substring(0, 50))
              
              // Add to end and sort to ensure correct order
              const newMessages = [...prev, pusherMessage]
              return newMessages.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.timestamp || 0).getTime()
                const timeB = new Date(b.createdAt || b.timestamp || 0).getTime()
                return timeA - timeB // Ascending: oldest first, newest last
              })
            })
            
            // Update contact list
            setContacts(prev => {
              const contactIndex = prev.findIndex(c => c.id === selectedContact.id)
              if (contactIndex >= 0) {
                const updated = [...prev]
                updated[contactIndex] = {
                  ...updated[contactIndex],
                  lastMessageTime: pusherMessage.createdAt,
                  lastMessageContent: pusherMessage.content,
                  unreadCount: pusherMessage.senderId === selectedContact.id ? (updated[contactIndex].unreadCount + 1) : 0
                }
                // Move to top
                const [contact] = updated.splice(contactIndex, 1)
                return [contact, ...updated]
              }
              return prev
            })
            
            scrollToBottom()
          }
        })
        
        // Listen for typing indicators from other users
        privateChannel.bind('typing', (data: { senderId: string; isTyping: boolean }) => {
          console.log('👥 TYPING INDICATOR RECEIVED:', {
            senderId: data.senderId,
            isTyping: data.isTyping,
            selectedContactId: selectedContact?.id,
            willShow: selectedContact && data.senderId === selectedContact.id
          })
          
          if (data.isTyping) {
            setLocalTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.add(data.senderId)
              console.log('✍️ TYPING STARTED - User:', data.senderId, 'Total typing:', newSet.size, 'Set contents:', Array.from(newSet))
              return newSet
            })
          } else {
            setLocalTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.senderId)
              console.log('⌨️ TYPING STOPPED - User:', data.senderId, 'Total typing:', newSet.size)
              return newSet
            })
          }
        })
      })
      
      // Also bind events immediately (in case subscription already succeeded)
      // Listen for new messages
      privateChannel.bind('new-message', (data: { message: any }) => {
        console.log('📨 NEW MESSAGE RECEIVED VIA PUSHER (direct):', data.message)
        
        if (data.message && selectedContact && 
            (data.message.senderId === selectedContact.id || data.message.receiverId === selectedContact.id)) {
          const pusherMessage: Message = {
            ...data.message,
            id: data.message.id || `pusher-${Date.now()}`,
            senderId: data.message.senderId,
            receiverId: data.message.receiverId,
            content: data.message.content || '',
            timestamp: data.message.timestamp || data.message.createdAt || new Date().toISOString(),
            createdAt: data.message.createdAt || data.message.timestamp || new Date().toISOString(),
            isRead: data.message.isRead || false,
            read: data.message.read || false,
            delivered: data.message.delivered !== false,
            conversationId: data.message.conversationId || `${data.message.senderId}-${data.message.receiverId}`,
            sender: data.message.sender || {
              id: data.message.senderId,
              firstName: selectedContact.firstName,
              lastName: selectedContact.lastName,
              email: selectedContact.email || '',
              role: selectedContact.role || 'ADMIN'
            },
            receiver: data.message.receiver || {
              id: user.id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              role: user.role || 'STUDENT'
            }
          }
          
          // Prevent duplicates - FIXED: Add to end (bottom) like WhatsApp
          setMessages(prev => {
            const exists = prev.some(m => m.id === pusherMessage.id)
            if (exists) {
              console.log('⚠️ Pusher message already exists (direct), skipping duplicate:', pusherMessage.id)
              return prev
            }
            console.log('✅ Adding Pusher message to UI (direct, bottom):', pusherMessage.id, pusherMessage.content.substring(0, 50))
            
            // Add to end and sort to ensure correct order
            const newMessages = [...prev, pusherMessage]
            return newMessages.sort((a, b) => {
              const timeA = new Date(a.createdAt || a.timestamp || 0).getTime()
              const timeB = new Date(b.createdAt || b.timestamp || 0).getTime()
              return timeA - timeB // Ascending: oldest first, newest last
            })
          })
          
          scrollToBottom()
        }
      })
      
      // Also bind typing events immediately (in case subscription already succeeded)
      privateChannel.bind('typing', (data: { senderId: string; isTyping: boolean }) => {
        console.log('👥 TYPING INDICATOR RECEIVED (direct):', {
          senderId: data.senderId,
          isTyping: data.isTyping,
          selectedContactId: selectedContact?.id,
          willShow: selectedContact && data.senderId === selectedContact.id
        })
        
        if (data.isTyping) {
          setLocalTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.add(data.senderId)
            console.log('✍️ TYPING STARTED (direct) - User:', data.senderId, 'Total typing:', newSet.size, 'Set contents:', Array.from(newSet))
            return newSet
          })
        } else {
          setLocalTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.senderId)
            console.log('⌨️ TYPING STOPPED (direct) - User:', data.senderId, 'Total typing:', newSet.size)
            return newSet
          })
        }
      })
      
      // Log subscription errors
      privateChannel.bind('pusher:subscription_error', (error: any) => {
        console.error('❌ Private channel subscription error:', error)
      })

      // Cleanup on unmount
      return () => {
        try {
          privateChannel.unbind('new-message')
          privateChannel.unbind('typing')
          pusher.unsubscribe(`private-${user.id}`)
        } catch (e) {
          console.warn('Error cleaning up private channel:', e)
        }
      }
    }
  }, [isConnected, pusher, subscribeToPresence, user?.id, selectedContact?.id, scrollToBottom])

  // Fetch student's conversations (WhatsApp-style: only actual conversations)
  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // For students: Only fetch contacts they've actually messaged with
      const response = await messageService.getContacts()
      if (response.success && response.data) {
        console.log('📨 Student contacts:', response.data)
        
        // Transform and filter contacts
        const transformedContacts = response.data
          .filter((contact: any) => contact.id !== user?.id) // Remove self
          .map((contact: any) => ({
            id: contact.id,
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email || '',
            role: contact.role || 'STUDENT',
            profileImage: contact.profileImage || '',
            status: contact.status || 'OFFLINE', // Include status property
            lastMessageTime: contact.lastMessageTime || new Date().toISOString(),
            lastMessageContent: contact.lastMessageContent || '',
            unreadCount: contact.unreadCount || 0,
            isOnline: (() => {
              const isManagerOrAdmin = contact.role === 'ADMIN' || contact.role === 'SENIOR_MANAGER' || contact.role === 'JUNIOR_MANAGER'
              const pusherOnline = onlineUsers?.has(contact.id) || false
              const statusOnline = isManagerOrAdmin
                ? (contact.status === 'ONLINE' || contact.status === 'ACTIVE')
                : (contact.status === 'ONLINE')
              return pusherOnline || statusOnline
            })(),
            lastSeen: (() => {
              const isManagerOrAdmin = contact.role === 'ADMIN' || contact.role === 'SENIOR_MANAGER' || contact.role === 'JUNIOR_MANAGER'
              const pusherOnline = onlineUsers?.has(contact.id) || false
              const statusOnline = isManagerOrAdmin
                ? (contact.status === 'ONLINE' || contact.status === 'ACTIVE')
                : (contact.status === 'ONLINE')
              return (pusherOnline || statusOnline) ? 'En ligne' : 'Hors ligne'
            })()
          }))
        
        setContacts(transformedContacts)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, onlineUsers])

  // Fetch messages for specific contact
  const fetchMessages = useCallback(async (contactId: string) => {
    try {
      const response = await messageService.getMessages(contactId)
      if (response.success && response.data) {
        const messagesData = Array.isArray(response.data) ? response.data : []
        
        // FIXED: Sort messages by timestamp ascending (oldest first, newest last - WhatsApp style)
        const sortedMessages = messagesData.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.timestamp || 0).getTime()
          const timeB = new Date(b.createdAt || b.timestamp || 0).getTime()
          return timeA - timeB // Ascending order: oldest first, newest last
        })
        
        setMessages(sortedMessages)
        setTimeout(scrollToBottom, 100) // Delay for smooth transition
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessages([])
    }
  }, [scrollToBottom])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedContact || !user?.id || isSending) return

    const messageContent = newMessage.trim()
    setIsSending(true)
    setNewMessage('')
    setReplyingTo(null) // Clear reply state

    try {
      const result = await messageService.sendMessage({
        receiverId: selectedContact.id,
        content: messageContent,
        type: 'text',
        replyToId: replyingTo?.id
      })

      if (result.success && result.data) {
        const sentMessage = result.data
        
        // Ensure message has all required fields with proper structure
        const completeMessage: Message = {
          id: sentMessage.id || `temp-${Date.now()}`,
          senderId: sentMessage.senderId || user.id,
          receiverId: sentMessage.receiverId || selectedContact.id,
        content: messageContent,
          type: sentMessage.type || 'text',
          timestamp: sentMessage.timestamp || sentMessage.createdAt || new Date().toISOString(),
          createdAt: sentMessage.createdAt || sentMessage.timestamp || new Date().toISOString(),
          updatedAt: sentMessage.updatedAt || sentMessage.createdAt || new Date().toISOString(),
        isRead: false,
        read: false,
          delivered: sentMessage.delivered !== false,
          conversationId: sentMessage.conversationId || `${user.id}-${selectedContact.id}`,
          sender: sentMessage.sender || (sentMessage as any).sender || {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
            role: user.role || 'STUDENT',
            avatar: user.profileImage || undefined
        },
          receiver: sentMessage.receiver || (sentMessage as any).receiver || {
          id: selectedContact.id,
          firstName: selectedContact.firstName,
          lastName: selectedContact.lastName,
            email: selectedContact.email || '',
            role: selectedContact.role || 'ADMIN',
            avatar: selectedContact.profileImage || undefined
          },
          // Include other fields that might be present
          ...(sentMessage.replyToId && { replyToId: sentMessage.replyToId }),
          ...(sentMessage.parentId && { parentId: sentMessage.parentId }),
          ...(sentMessage.attachments && { attachments: sentMessage.attachments })
        }
        
        // Add message to UI - prevent duplicates by checking ID
        // FIXED: New messages go to the END (bottom) - WhatsApp style
        setMessages(prev => {
          const exists = prev.some(m => m.id === completeMessage.id)
          if (exists) {
            console.log('⚠️ Message already exists, skipping duplicate:', completeMessage.id)
            return prev
          }
          console.log('✅ Adding sent message to UI (bottom):', completeMessage.id, completeMessage.content.substring(0, 50))
          
          // Add to end and sort to ensure correct order
          const newMessages = [...prev, completeMessage]
          return newMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime()
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime()
            return timeA - timeB // Ascending: oldest first, newest last
          })
        })
        
        // Update contact list - move conversation to top
        setContacts(prev => {
          const contactIndex = prev.findIndex(c => c.id === selectedContact.id)
          if (contactIndex >= 0) {
            const updated = [...prev]
            updated[contactIndex] = {
              ...updated[contactIndex],
              lastMessageTime: completeMessage.createdAt || new Date().toISOString(),
              lastMessageContent: messageContent,
              unreadCount: 0
            }
            // Move to top
            const [contact] = updated.splice(contactIndex, 1)
            return [contact, ...updated]
          }
          return prev
        })

        // Note: Don't refresh immediately to avoid duplicate messages
        // Pusher will handle real-time updates, or we'll get it on next contact selection

        scrollToBottom()
      } else {
        toast.error(t("Erreur lors de l'envoi du message", "Error sending message"))
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(t("Erreur lors de l'envoi du message", "Error sending message"))
    } finally {
      setIsSending(false)
    }
  }, [newMessage, selectedContact, user?.id, isSending, replyingTo, scrollToBottom, t])

  // Handle contact selection with smooth transition
  const handleContactSelect = useCallback((contact: Contact) => {
    if (selectedContact?.id === contact.id) return // Already selected
    
    setIsTransitioning(true)
    setSelectedContact(contact)
    
    // Clear states
    setMessages([])
    setReplyingTo(null)
    setEditingMessage(null)
    setContextMenu(prev => ({ ...prev, isOpen: false }))
    
    fetchMessages(contact.id).then(() => {
      setIsTransitioning(false)
    })
    
    // Mark as read
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unreadCount: 0 } : c
    ))
  }, [selectedContact?.id, fetchMessages])

  // Add new contact from URL parameter (when messaging from marketplace)
  const addContactFromTutor = useCallback(async (tutorId: string) => {
    try {
      // Fetch tutor info from marketplace
      const tutorsResponse = await apiClient.get('/marketplace/tutors')
      if (!tutorsResponse.success || !tutorsResponse.data) {
        console.error('Failed to fetch tutors')
        return null
      }
      
      const tutors = Array.isArray(tutorsResponse.data) ? tutorsResponse.data : []
      const tutor = tutors.find((t: any) => t.id === tutorId)
      
      if (!tutor) {
        console.error('Tutor not found')
        return null
      }
      
      // Create new contact
      const newContact: Contact = {
        id: tutor.id,
        firstName: tutor.firstName || tutor.name?.split(' ')[0] || '',
        lastName: tutor.lastName || tutor.name?.split(' ').slice(1).join(' ') || '',
        email: tutor.email || '',
        role: tutor.role || 'ADMIN',
        profileImage: tutor.profilePicture || tutor.profileImage || '',
        status: tutor.status || 'OFFLINE', // Include status property
        lastMessageTime: new Date().toISOString(),
        lastMessageContent: '',
        unreadCount: 0,
        isOnline: (() => {
          const isManagerOrAdmin = tutor.role === 'ADMIN' || tutor.role === 'SENIOR_MANAGER' || tutor.role === 'JUNIOR_MANAGER'
          const pusherOnline = onlineUsers?.has(tutor.id) || false
          const statusOnline = isManagerOrAdmin
            ? (tutor.status === 'ONLINE' || tutor.status === 'ACTIVE')
            : (tutor.status === 'ONLINE')
          return pusherOnline || statusOnline
        })(),
        lastSeen: (() => {
          const isManagerOrAdmin = tutor.role === 'ADMIN' || tutor.role === 'SENIOR_MANAGER' || tutor.role === 'JUNIOR_MANAGER'
          const pusherOnline = onlineUsers?.has(tutor.id) || false
          const statusOnline = isManagerOrAdmin
            ? (tutor.status === 'ONLINE' || tutor.status === 'ACTIVE')
            : (tutor.status === 'ONLINE')
          return (pusherOnline || statusOnline) ? 'En ligne' : 'Hors ligne'
        })()
      }
      
      console.log('✅ Creating new contact:', newContact.firstName, newContact.lastName)
      
      // Add to contacts if not exists
      setContacts(prev => {
        const exists = prev.find(c => c.id === newContact.id)
        return exists ? prev : [newContact, ...prev]
      })
      
      return newContact
    } catch (error: any) {
      console.error('Error adding contact from tutor:', error)
      return null
    }
  }, [onlineUsers])

  // Handle URL contact parameter
  useEffect(() => {
    const contactId = searchParams?.get('contact')
    if (!contactId) {
      processedContactRef.current = null
        return
      }

    // Avoid re-processing same contact
    if (processedContactRef.current === contactId && selectedContact?.id === contactId) {
      return
    }
    
    // Check if contact exists
    const existingContact = contacts.find(c => c.id === contactId)
    if (existingContact) {
      if (selectedContact?.id !== contactId) {
        console.log('📧 Selecting existing contact:', existingContact.firstName, existingContact.lastName)
        processedContactRef.current = contactId
        handleContactSelect(existingContact)
      }
      return
    }
    
    // Contact not found - add from tutor info
    const addContact = async () => {
      const newContact = await addContactFromTutor(contactId)
      if (newContact) {
        processedContactRef.current = contactId
        handleContactSelect(newContact)
      }
    }
    
    addContact()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get('contact')])

  // Load contacts on mount
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Auto-scroll when messages change
  useEffect(() => {
        scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTyping(false) // Stop typing when sending
      sendMessage()
    }
  }

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)
    
    // Send typing indicator if user is typing
    if (value.length > 0) {
      handleTyping(true)
      } else {
      handleTyping(false)
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }, [])

  // Handle voice message
  const handleSendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (!selectedContact || !user?.id) return

    try {
      // TODO: Implement voice message upload
      toast.info("Message vocal à venir")
    } catch (error: any) {
      console.error('Error sending voice message:', error)
      toast.error("Erreur lors de l'envoi du message vocal")
    }
  }, [selectedContact, user?.id])

  // Handle typing indicators with debouncing
  const handleTyping = useCallback((isCurrentlyTyping: boolean) => {
    if (!selectedContact || !sendTypingIndicator) return

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    if (isCurrentlyTyping) {
      // Send typing indicator immediately
      console.log('🟢 Sending typing indicator to:', selectedContact.id)
      sendTypingIndicator(selectedContact.id, true)
      setIsTyping(true)
      
      // Set timeout to stop typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        console.log('⏰ Auto-stopping typing indicator for:', selectedContact.id)
        sendTypingIndicator(selectedContact.id, false)
        setIsTyping(false)
      }, 3000)
      
      setTypingTimeout(timeout)
    } else {
      // Send stop typing indicator immediately
      console.log('🔴 Stopping typing indicator for:', selectedContact.id)
      sendTypingIndicator(selectedContact.id, false)
      setIsTyping(false)
    }
  }, [selectedContact, sendTypingIndicator, typingTimeout])

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedContact) {
      // TODO: Implement file upload logic
      toast.info("Fonctionnalité de fichier à venir")
    }
  }, [selectedContact])

  // Handle message context menu
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
      setContextMenu(prev => ({ ...prev, isOpen: false }))
    }
  }, [messages])

  // Handle delete
  const handleDelete = useCallback(async (messageId: string) => {
    try {
      const result = await messageService.deleteMessage(messageId)
      if (result.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
        toast.success("Message supprimé")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Helper function to get profile image URL - FIXED double uploads issue
  const getProfileImageUrl = (profileImage: string | null | undefined) => {
    if (!profileImage) return ''
    if (profileImage.startsWith('http')) return profileImage
    
    // Fix double "uploads/" issue
    let cleanPath = profileImage.replace(/^\/+/, '') // Remove leading slashes
    if (cleanPath.startsWith('uploads/')) {
      // If it already has uploads/ prefix, don't add another one
      return `http://localhost:3001/${cleanPath}`
      } else {
      // If it doesn't have uploads/ prefix, add it
      return `http://localhost:3001/uploads/${cleanPath}`
    }
  }

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else if (diffInHours < 168) { // Less than a week
      return format(date, 'EEE HH:mm', { locale: fr })
      } else {
      return format(date, 'dd/MM/yyyy HH:mm')
    }
  }

  // Get message status icon
  const getMessageStatusIcon = (message: Message) => {
    if (message.senderId !== user?.id) return null
    
    if (message.read) {
      return <CheckCheck className="h-3 w-3 text-blue-400" />
    } else if (message.delivered) {
      return <CheckCheck className="h-3 w-3 text-gray-400" />
            } else {
      return <Check className="h-3 w-3 text-gray-400" />
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-[23.33%] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Messages Étudiant
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
              placeholder="Rechercher des conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Modern Rounded Blue Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0 p-2">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
            {[
              { key: 'tous', label: 'Tous' },
              { key: 'etudiants', label: 'Étudiants' },
              { key: 'tuteurs', label: 'Tuteurs' },
              { key: 'communaute', label: 'Communauté' }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.key as StudentTabType)}
                className={`flex-1 rounded-full transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
                {tab.key === 'tous' && contacts.filter(c => c.unreadCount > 0).length > 0 && (
                  <Badge className="ml-1 bg-red-500 text-white text-xs h-4 min-w-4 rounded-full">
                    {contacts.filter(c => c.unreadCount > 0).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? "Essayez un autre terme de recherche"
                  : "Commencez une conversation depuis la marketplace"
                }
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
            <div
              key={contact.id}
                onClick={() => handleContactSelect(contact)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                  selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                  <AvatarImage 
                        src={getProfileImageUrl(contact.profileImage)} 
                        alt={`${contact.firstName} ${contact.lastName}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                    {/* Modern Online Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      contact.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    } shadow-sm`} />
                  </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                      {contact.lastMessageTime && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(contact.lastMessageTime), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                            </span>
                      )}
                </div>
                
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {contact.lastMessageContent || 'Aucun message'}
                      </p>
                  {contact.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs h-5 min-w-5 rounded-full">
                      {contact.unreadCount}
                    </Badge>
                  )}
                </div>
                    
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        contact.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      {contact.isOnline ? 'En ligne' : contact.lastSeen}
                    </p>
              </div>
            </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {selectedContact ? (
          <>
            {/* Modern Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={getProfileImageUrl(selectedContact.profileImage)} 
                        alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {selectedContact.firstName.charAt(0)}{selectedContact.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      selectedContact.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    } shadow-sm`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      {localTypingUsers.has(selectedContact.id) ? (
                        <>
                          <div className="flex space-x-1 mr-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-blue-500 font-medium">écrit...</span>
                        </>
                      ) : (
                        <>
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            selectedContact.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {selectedContact.isOnline ? 'En ligne' : 'Hors ligne'}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Phone and Video buttons removed for students - only for admin/manager */}
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reply Bar */}
            {replyingTo && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Reply className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Répondre à {replyingTo.sender?.firstName}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 truncate max-w-xs">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setReplyingTo(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Messages Area with Modern Styling */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-opacity duration-200 ${
              isTransitioning ? 'opacity-50' : 'opacity-100'
            }`}>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucun message pour le moment. Commencez la conversation!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                      onContextMenu={(e) => handleMessageRightClick(e, message)}
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                      message.senderId === user?.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                      {/* Reply Context */}
                    {message.replyTo && (
                        <div className={`text-xs p-2 rounded-lg mb-2 border-l-2 ${
                        message.senderId === user?.id 
                            ? 'bg-blue-400/20 border-blue-200'
                          : 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                      }`}>
                          <p className="font-medium">{message.replyTo.sender.firstName}</p>
                          <p className="opacity-75">{message.replyTo.content}</p>
                      </div>
                    )}
                    
                      <div className="break-words">
                        {renderMessageWithLinks(message.content)}
                      </div>
                      
                      <div className={`flex items-center justify-between mt-2 text-xs ${
                        message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(message.timestamp || message.createdAt)}</span>
                        <div className="ml-2 flex items-center space-x-1">
                          {getMessageStatusIcon(message)}
                              </div>
                              </div>
                            </div>
                        </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {(() => {
                const shouldShow = selectedContact && localTypingUsers.has(selectedContact.id)
                console.log('🔍 TYPING INDICATOR CHECK:', {
                  selectedContactId: selectedContact?.id,
                  selectedContactName: selectedContact?.firstName,
                  localTypingUsers: Array.from(localTypingUsers),
                  hasTypingUser: selectedContact ? localTypingUsers.has(selectedContact.id) : false,
                  shouldShow
                })
                return shouldShow ? (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2 max-w-xs">
                      <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {selectedContact.firstName} écrit...
                        </span>
                    </div>
                  </div>
                </div>
                ) : null
              })()}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Modern Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <div className="flex items-end space-x-3">
                {/* File Upload */}
                  <Button
                    variant="ghost"
                    size="sm"
                  className="rounded-full p-2"
                  onClick={() => fileInputRef.current?.click()}
                  >
                  <Paperclip className="h-5 w-5 text-gray-600" />
                  </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />

                {/* Message Input Container - Modern Rounded Design */}
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-700 rounded-3xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 transition-colors">
                  <div className="flex items-end">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      disabled={isSending}
                      className="border-0 bg-transparent rounded-3xl py-3 px-4 pr-12 resize-none focus:ring-0 focus:border-transparent"
                      style={{ minHeight: '44px' }}
                    />
                    
                {/* Emoji Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                      className="absolute right-2 bottom-2 rounded-full p-1"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                      <Smile className="h-4 w-4 text-gray-600" />
                </Button>
                  </div>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50">
                      <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                        isOpen={showEmojiPicker}
                      />
                    </div>
                  )}
                </div>

                      {/* Voice Recorder */}
                      <VoiceRecorder
                        onSendVoiceMessage={handleSendVoiceMessage}
                  disabled={isSending}
                      />
                      
                {/* Send Button */}
                      <Button
                        onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 min-w-12 h-12 transition-all duration-200 disabled:opacity-50"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choisissez un contact pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          style={{
            left: contextMenu.position.x,
            top: contextMenu.position.y,
          }}
          onClick={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        >
              <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 text-left"
            onClick={() => handleReply(contextMenu.messageId)}
          >
            <Reply className="h-4 w-4 mr-2" />
            Répondre
              </Button>
          {contextMenu.isOwnMessage && (
              <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 text-left text-red-600 hover:text-red-800"
              onClick={() => handleDelete(contextMenu.messageId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
              </Button>
          )}
        </div>
      )}
    </div>
  )
}