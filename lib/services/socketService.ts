import { io, Socket } from 'socket.io-client';

// Socket.IO service for real-time messaging
class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private user: any = null;

  constructor() {
    // Don't initialize immediately - wait for user to be available
  }

  public initializeSocket(user: any) {
    if (!user || this.socket) {
      return;
    }

    this.user = user;

    // Initialize Socket.IO connection
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
          auth: {
        userId: user.id,
        userRole: user.role,
        userName: `${user.firstName} ${user.lastName}`
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
      forceNew: true,
      autoConnect: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔌 Socket connection error:', error);
      this.handleReconnect();
    });

    // Message events
    this.socket.on('message:new', (message) => {
      console.log('📨 New message received:', message);
      this.handleNewMessage(message);
    });

    this.socket.on('message:offline', (message) => {
      console.log('📨 Offline message received:', message);
      this.handleOfflineMessage(message);
    });

    this.socket.on('message:delivered', (data) => {
      console.log('✅ Message delivered:', data);
      this.handleMessageDelivered(data);
    });

    this.socket.on('message:read', (data) => {
      console.log('👁️ Message read:', data);
      this.handleMessageRead(data);
    });

    this.socket.on('message:status:delivered', (data) => {
      console.log('✅ Message status delivered:', data);
      this.handleMessageStatusDelivered(data);
    });

    this.socket.on('message:status:read', (data) => {
      console.log('👁️ Message status read:', data);
      this.handleMessageStatusRead(data);
    });

    // Typing events
    this.socket.on('typing:update', (data) => {
      console.log('⌨️ Typing update:', data);
      this.handleTypingUpdate(data);
    });

    // Presence events
    this.socket.on('presence:online', (data) => {
      console.log('🟢 User online:', data);
      this.handleUserOnline(data);
    });

    this.socket.on('presence:offline', (data) => {
      console.log('🔴 User offline:', data);
      this.handleUserOffline(data);
    });

    // Room events
    this.socket.on('room:joined', (data) => {
      console.log('🚪 Joined room:', data);
      this.handleRoomJoined(data);
    });

    this.socket.on('room:left', (data) => {
      console.log('🚪 Left room:', data);
      this.handleRoomLeft(data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔌 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.user) {
        this.initializeSocket(this.user);
      }
    }, delay);
  }

  // Message handlers
  private handleNewMessage(message: any) {
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('message:new', { detail: message }));
  }

  private handleOfflineMessage(message: any) {
    window.dispatchEvent(new CustomEvent('message:offline', { detail: message }));
  }

  private handleMessageDelivered(data: any) {
    window.dispatchEvent(new CustomEvent('message:delivered', { detail: data }));
  }

  private handleMessageRead(data: any) {
    window.dispatchEvent(new CustomEvent('message:read', { detail: data }));
  }

  private handleMessageStatusDelivered(data: any) {
    window.dispatchEvent(new CustomEvent('message:status:delivered', { detail: data }));
  }

  private handleMessageStatusRead(data: any) {
    window.dispatchEvent(new CustomEvent('message:status:read', { detail: data }));
  }

  private handleTypingUpdate(data: any) {
    window.dispatchEvent(new CustomEvent('typing:update', { detail: data }));
  }

  private handleUserOnline(data: any) {
    window.dispatchEvent(new CustomEvent('presence:online', { detail: data }));
  }

  private handleUserOffline(data: any) {
    window.dispatchEvent(new CustomEvent('presence:offline', { detail: data }));
  }

  private handleRoomJoined(data: any) {
    window.dispatchEvent(new CustomEvent('room:joined', { detail: data }));
  }

  private handleRoomLeft(data: any) {
    window.dispatchEvent(new CustomEvent('room:left', { detail: data }));
  }

  // Public methods
  public sendMessage(data: {
    receiverId: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'audio' | 'video';
    attachments?: string[];
  }) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('message:send', data);
  }

  public sendGroupMessage(data: {
    roomId: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'audio' | 'video';
    attachments?: string[];
  }) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('message:send:group', data);
  }

  public markAsRead(messageId: string, conversationId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('message:read', { messageId, conversationId });
  }

  public markAsDelivered(messageId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('message:delivered', { messageId });
  }

  public markConversationAsRead(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('conversation:read', { conversationId });
  }

  public startTyping(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('typing:start', { roomId });
  }

  public stopTyping(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('typing:stop', { roomId });
  }

  public joinRoom(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('room:join', { roomId });
  }

  public leaveRoom(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('🔌 Socket not connected');
      return;
    }

    this.socket.emit('room:leave', { roomId });
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event listener helpers
  public addEventListener(event: string, callback: (data: any) => void) {
    window.addEventListener(event, (e: any) => callback(e.detail));
  }

  public removeEventListener(event: string, callback: (data: any) => void) {
    window.removeEventListener(event, callback);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;