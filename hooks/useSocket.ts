import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { socketService } from '@/lib/services/socketService';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !initialized.current) {
      console.log('🔌 Initializing Socket.IO with user:', user);
      socketService.initializeSocket(user);
      initialized.current = true;
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socketService) return;

    // Connection status
    const checkConnection = () => {
      setIsConnected(socketService.getConnectionStatus());
    };

    // Message events
    const handleNewMessage = (message: any) => {
      console.log('📨 New message received:', message);
      setMessages(prev => [...prev, message]);
    };

    const handleMessageDelivered = (data: any) => {
      console.log('✅ Message delivered:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, delivered: true, deliveredAt: data.deliveredAt }
            : msg
        )
      );
    };

    const handleMessageRead = (data: any) => {
      console.log('👁️ Message read:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, read: true, readAt: data.readAt }
            : msg
        )
      );
    };

    // Typing events
    const handleTypingUpdate = (data: any) => {
      console.log('⌨️ Typing update:', data);
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    // Presence events
    const handleUserOnline = (data: any) => {
      console.log('🟢 User online:', data);
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data: any) => {
      console.log('🔴 User offline:', data);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Add event listeners
    socketService.addEventListener('message:new', handleNewMessage);
    socketService.addEventListener('message:delivered', handleMessageDelivered);
    socketService.addEventListener('message:read', handleMessageRead);
    socketService.addEventListener('typing:update', handleTypingUpdate);
    socketService.addEventListener('presence:online', handleUserOnline);
    socketService.addEventListener('presence:offline', handleUserOffline);

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    return () => {
      // Cleanup
      socketService.removeEventListener('message:new', handleNewMessage);
      socketService.removeEventListener('message:delivered', handleMessageDelivered);
      socketService.removeEventListener('message:read', handleMessageRead);
      socketService.removeEventListener('typing:update', handleTypingUpdate);
      socketService.removeEventListener('presence:online', handleUserOnline);
      socketService.removeEventListener('presence:offline', handleUserOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage: socketService.sendMessage.bind(socketService),
    sendGroupMessage: socketService.sendGroupMessage.bind(socketService),
    markAsRead: socketService.markAsRead.bind(socketService),
    markAsDelivered: socketService.markAsDelivered.bind(socketService),
    markConversationAsRead: socketService.markConversationAsRead.bind(socketService),
    startTyping: socketService.startTyping.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
    joinRoom: socketService.joinRoom.bind(socketService),
    leaveRoom: socketService.leaveRoom.bind(socketService)
  };
};
