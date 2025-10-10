import { io, Socket } from 'socket.io-client'

export interface SocketMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  type: 'text' | 'image' | 'file'
  metadata?: any
}

export interface OnlineUser {
  userId: string
  socketId: string
  role: string
  lastSeen: string
}

export interface TypingIndicator {
  userId: string
  isTyping: boolean
  conversationId: string
}

class SocketService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Initialize socket connection
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', {
          auth: {
            token
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        })

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket?.id)
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason)
          this.isConnected = false
          this.handleReconnection()
        })

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error)
          this.isConnected = false
          reject(error)
        })

        // Set up event listeners
        this.setupEventListeners()

      } catch (error) {
        console.error('Failed to initialize socket:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Message events
    this.socket.on('new-message', this.handleNewMessage.bind(this))
    this.socket.on('message-read', this.handleMessageRead.bind(this))
    this.socket.on('typing-start', this.handleTypingStart.bind(this))
    this.socket.on('typing-stop', this.handleTypingStop.bind(this))

    // Notification events
    this.socket.on('new-notification', this.handleNewNotification.bind(this))
    this.socket.on('notification-read', this.handleNotificationRead.bind(this))

    // User presence events
    this.socket.on('user-online', this.handleUserOnline.bind(this))
    this.socket.on('user-offline', this.handleUserOffline.bind(this))
    this.socket.on('online-users', this.handleOnlineUsers.bind(this))

    // Live session events
    this.socket.on('session-started', this.handleSessionStarted.bind(this))
    this.socket.on('session-ended', this.handleSessionEnded.bind(this))
    this.socket.on('participant-joined', this.handleParticipantJoined.bind(this))
    this.socket.on('participant-left', this.handleParticipantLeft.bind(this))
  }

  /**
   * Send a message
   */
  sendMessage(message: Omit<SocketMessage, 'id' | 'timestamp'>): void {
    if (!this.isSocketConnected()) {
      console.error('Socket not connected')
      return
    }

    this.socket?.emit('send-message', {
      ...message,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('join-conversation', conversationId)
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('leave-conversation', conversationId)
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('typing', { conversationId, isTyping })
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('mark-message-read', messageId)
  }

  /**
   * Join live session room
   */
  joinLiveSession(sessionId: string): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('join-live-session', sessionId)
  }

  /**
   * Leave live session room
   */
  leaveLiveSession(sessionId: string): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('leave-live-session', sessionId)
  }

  /**
   * Send live session chat message
   */
  sendLiveSessionMessage(sessionId: string, message: string): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit('live-session-chat', { sessionId, message })
  }

  /**
   * Event handlers
   */
  private handleNewMessage(message: SocketMessage): void {
    window.dispatchEvent(new CustomEvent('socket:new-message', { detail: message }))
  }

  private handleMessageRead(data: { messageId: string, readBy: string }): void {
    window.dispatchEvent(new CustomEvent('socket:message-read', { detail: data }))
  }

  private handleTypingStart(data: TypingIndicator): void {
    window.dispatchEvent(new CustomEvent('socket:typing-start', { detail: data }))
  }

  private handleTypingStop(data: TypingIndicator): void {
    window.dispatchEvent(new CustomEvent('socket:typing-stop', { detail: data }))
  }

  private handleNewNotification(notification: any): void {
    window.dispatchEvent(new CustomEvent('socket:new-notification', { detail: notification }))
  }

  private handleNotificationRead(data: { notificationId: string }): void {
    window.dispatchEvent(new CustomEvent('socket:notification-read', { detail: data }))
  }

  private handleUserOnline(user: OnlineUser): void {
    window.dispatchEvent(new CustomEvent('socket:user-online', { detail: user }))
  }

  private handleUserOffline(user: OnlineUser): void {
    window.dispatchEvent(new CustomEvent('socket:user-offline', { detail: user }))
  }

  private handleOnlineUsers(users: OnlineUser[]): void {
    window.dispatchEvent(new CustomEvent('socket:online-users', { detail: users }))
  }

  private handleSessionStarted(data: { sessionId: string }): void {
    window.dispatchEvent(new CustomEvent('socket:session-started', { detail: data }))
  }

  private handleSessionEnded(data: { sessionId: string }): void {
    window.dispatchEvent(new CustomEvent('socket:session-ended', { detail: data }))
  }

  private handleParticipantJoined(data: { sessionId: string, participant: any }): void {
    window.dispatchEvent(new CustomEvent('socket:participant-joined', { detail: data }))
  }

  private handleParticipantLeft(data: { sessionId: string, participant: any }): void {
    window.dispatchEvent(new CustomEvent('socket:participant-left', { detail: data }))
  }

  /**
   * Handle reconnection
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect()
        }
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) return
    this.socket.on(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return
    this.socket.off(event, callback)
  }

  /**
   * Emit custom event
   */
  emit(event: string, data: any): void {
    if (!this.isSocketConnected()) return
    this.socket?.emit(event, data)
  }
}

// Export singleton instance
export const socketService = new SocketService()
export default socketService
