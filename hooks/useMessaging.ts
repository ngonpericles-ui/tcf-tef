import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { messageService, type Message, type MessageStatus } from '@/lib/services/messageService';
import { socketService } from '@/lib/services/socketService';

export interface UseMessagingOptions {
  roomId?: string;
  autoConnect?: boolean;
  enableTyping?: boolean;
}

export interface MessagingState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  typingUsers: string[];
  onlineUsers: string[];
  unreadCount: number;
  offlineCount: number;
}

export interface MessagingActions {
  sendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'audio' | 'video') => Promise<void>;
  sendGroupMessage: (content: string, type?: 'text' | 'image' | 'file' | 'audio' | 'video') => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  refreshMessages: () => Promise<void>;
  getMessageStatus: (messageId: string) => Promise<MessageStatus | null>;
}

export function useMessaging(options: UseMessagingOptions = {}): MessagingState & MessagingActions {
  const { user, isAuthenticated } = useAuth();
  const { roomId, autoConnect = true, enableTyping = true } = options;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);

  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Initialize messaging
  useEffect(() => {
    if (!isAuthenticated || !user || !autoConnect) {
      return;
    }

    initializeMessaging();
    return () => cleanup();
  }, [isAuthenticated, user, autoConnect]);

  // Handle room changes
  useEffect(() => {
    if (roomId && isConnected) {
      joinRoom(roomId);
      loadMessages();
    }
  }, [roomId, isConnected]);

  const initializeMessaging = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check connection status
      setIsConnected(socketService.getConnectionStatus());

      // Load initial data
      await Promise.all([
        loadUnreadCount(),
        loadOfflineCount(),
        loadMessages()
      ]);

      // Setup socket event listeners
      setupSocketListeners();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize messaging');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Message events
    socketService.addEventListener('message:new', handleNewMessage);
    socketService.addEventListener('message:offline', handleOfflineMessage);
    socketService.addEventListener('message:delivered', handleMessageDelivered);
    socketService.addEventListener('message:read', handleMessageRead);
    socketService.addEventListener('message:status:delivered', handleMessageStatusDelivered);
    socketService.addEventListener('message:status:read', handleMessageStatusRead);

    // Typing events
    if (enableTyping) {
      socketService.addEventListener('typing:update', handleTypingUpdate);
    }

    // Presence events
    socketService.addEventListener('presence:online', handleUserOnline);
    socketService.addEventListener('presence:offline', handleUserOffline);

    // Room events
    socketService.addEventListener('room:joined', handleRoomJoined);
    socketService.addEventListener('room:left', handleRoomLeft);
  };

  const cleanup = () => {
    // Remove event listeners
    socketService.removeEventListener('message:new', handleNewMessage);
    socketService.removeEventListener('message:offline', handleOfflineMessage);
    socketService.removeEventListener('message:delivered', handleMessageDelivered);
    socketService.removeEventListener('message:read', handleMessageRead);
    socketService.removeEventListener('message:status:delivered', handleMessageStatusDelivered);
    socketService.removeEventListener('message:status:read', handleMessageStatusRead);
    socketService.removeEventListener('typing:update', handleTypingUpdate);
    socketService.removeEventListener('presence:online', handleUserOnline);
    socketService.removeEventListener('presence:offline', handleUserOffline);
    socketService.removeEventListener('room:joined', handleRoomJoined);
    socketService.removeEventListener('room:left', handleRoomLeft);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing if active
    if (isTypingRef.current && roomId) {
      socketService.stopTyping(roomId);
    }
  };

  // Event handlers
  const handleNewMessage = (message: Message) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    // Update unread count
    if (message.receiverId === user?.id) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleOfflineMessage = (message: Message) => {
    handleNewMessage(message);
    setOfflineCount(prev => Math.max(0, prev - 1));
  };

  const handleMessageDelivered = (data: { messageId: string; deliveredAt: string }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, deliveredAt: data.deliveredAt }
        : msg
    ));
  };

  const handleMessageRead = (data: { messageId: string; readAt: string; readBy: string }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, isRead: true, readAt: data.readAt }
        : msg
    ));
  };

  const handleMessageStatusDelivered = (data: { messageId: string; deliveredAt: string }) => {
    handleMessageDelivered(data);
  };

  const handleMessageStatusRead = (data: { messageId: string; readAt: string; readBy: string }) => {
    handleMessageRead(data);
  };

  const handleTypingUpdate = (data: { roomId: string; userId: string; isTyping: boolean; typingUsers: string[] }) => {
    if (data.roomId === roomId) {
      setTypingUsers(data.typingUsers.filter(id => id !== user?.id));
    }
  };

  const handleUserOnline = (data: { userId: string }) => {
    setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
  };

  const handleUserOffline = (data: { userId: string }) => {
    setOnlineUsers(prev => prev.filter(id => id !== data.userId));
  };

  const handleRoomJoined = (data: { roomId: string; userId: string }) => {
    if (data.roomId === roomId) {
      setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
    }
  };

  const handleRoomLeft = (data: { roomId: string; userId: string }) => {
    if (data.roomId === roomId) {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    }
  };

  // Actions
  const loadMessages = async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      const response = await messageService.getMessages({ roomId });
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await messageService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const loadOfflineCount = async () => {
    try {
      const response = await messageService.getOfflineMessageCount();
      if (response.success && response.data) {
        setOfflineCount(response.data.count);
      }
    } catch (err) {
      console.error('Failed to load offline count:', err);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text') => {
    if (!user || !roomId) return;

    try {
      // Send via socket for real-time delivery
      socketService.sendMessage({
        receiverId: roomId,
        content,
        type
      });

      // Also send via API for persistence
      const response = await messageService.sendMessage({
        receiverId: roomId,
        content,
        type
      });

      if (response.success && response.data) {
        // Message will be added via socket event
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const sendGroupMessage = async (content: string, type: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text') => {
    if (!user || !roomId) return;

    try {
      // Send via socket for real-time delivery
      socketService.sendGroupMessage({
        roomId,
        content,
        type
      });

      // Also send via API for persistence
      const response = await messageService.sendGroupMessage({
        roomId,
        content,
        type
      });

      if (response.success && response.data) {
        // Message will be added via socket event
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send group message');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      socketService.markAsRead(messageId, roomId || '');
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  };

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await messageService.markMessagesAsRead(messageIds);
      // Mark each message as read via socket
      messageIds.forEach(id => socketService.markAsRead(id, roomId || ''));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const startTyping = useCallback(() => {
    if (!roomId || !enableTyping || isTypingRef.current) return;

    isTypingRef.current = true;
    socketService.startTyping(roomId);

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [roomId, enableTyping]);

  const stopTyping = useCallback(() => {
    if (!roomId || !isTypingRef.current) return;

    isTypingRef.current = false;
    socketService.stopTyping(roomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [roomId]);

  const joinRoom = (roomId: string) => {
    socketService.joinRoom(roomId);
  };

  const leaveRoom = (roomId: string) => {
    socketService.leaveRoom(roomId);
  };

  const refreshMessages = async () => {
    await loadMessages();
  };

  const getMessageStatus = async (messageId: string): Promise<MessageStatus | null> => {
    try {
      const response = await messageService.getMessageStatus(messageId);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to get message status:', err);
      return null;
    }
  };

  return {
    // State
    messages,
    loading,
    error,
    isConnected,
    typingUsers,
    onlineUsers,
    unreadCount,
    offlineCount,
    // Actions
    sendMessage,
    sendGroupMessage,
    markAsRead,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
    refreshMessages,
    getMessageStatus
  };
}
