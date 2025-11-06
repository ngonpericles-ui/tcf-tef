import { useEffect, useState, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import { offlineMessageService } from '../lib/services/offlineMessageService';

interface PusherMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  read: boolean;
  delivered: boolean;
}

interface PusherTyping {
  senderId: string;
  isTyping: boolean;
  timestamp: string;
}

interface PusherPresence {
  userId: string;
  isOnline: boolean;
  timestamp: string;
}

export const usePusher = () => {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<PusherMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    
    if (!token) {
      console.warn('⚠️ No auth token found, Pusher will not connect');
      return;
    }

    // Initialize Pusher
    const pusherClient = new Pusher('110ed53534004e19ee0c', {
      cluster: 'eu',
      authEndpoint: 'http://localhost:3001/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      enabledTransports: ['ws', 'wss'],
      forceTLS: true
    });

    // Connection event handlers
    pusherClient.connection.bind('connected', () => {
      console.log('✅ Pusher connected');
      setIsConnected(true);
      // Sync offline messages when connection is restored
      offlineMessageService.syncOfflineMessages();
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
      setIsConnected(false);
    });

    pusherClient.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
      setIsConnected(false);
    });

    pusherClient.connection.bind('unavailable', () => {
      console.error('❌ Pusher unavailable');
      setIsConnected(false);
    });

    setPusher(pusherClient);

    // Cleanup on unmount
    return () => {
      try {
        // Cleanup presence channel if it exists
        if (presenceChannelRef.current) {
          try {
            presenceChannelRef.current.unbind_all();
          } catch (e) {}
          try {
            pusherClient.unsubscribe('presence-presence-channel');
          } catch (e) {}
          presenceChannelRef.current = null;
        }
        pusherClient.disconnect();
        setIsConnected(false);
        setPusher(null);
      } catch (error) {
        console.error('Error during Pusher cleanup:', error);
      }
    };
  }, []);

  // Subscribe to private channel for messages
  const subscribeToUser = useCallback((userId: string) => {
    if (!pusher) return null;

    const channel = pusher.subscribe(`private-${userId}`);
    
    // Listen for new messages
    channel.bind('new-message', (data: { message: PusherMessage }) => {
      console.log('New message received:', data.message);
      setMessages(prev => [...prev, data.message]);
    });

    // Note: Typing indicators are now handled directly in the message page
    // to avoid conflicts and ensure proper state management

    // Listen for message status updates
    channel.bind('message-status', (data: { messageId: string; status: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, delivered: data.status === 'delivered', read: data.status === 'read' }
            : msg
        )
      );
    });

    return channel;
  }, [pusher]);

  // Subscribe to presence channel - FIXED TO WORK RELIABLY
  const subscribeToPresence = useCallback(() => {
    // Wait for pusher to be available
    if (!pusher) {
      console.warn('⏳ Pusher client not initialized yet, presence subscription will retry when available');
      return null;
    }

    // Check connection state - but don't block if state hasn't updated yet
    const connectionState = pusher.connection.state;
    if (connectionState !== 'connected' && connectionState !== 'connecting') {
      console.warn(`⏳ Pusher connection state: ${connectionState}, presence subscription will retry`);
      // Still try to subscribe - Pusher will handle connection automatically
    }

    console.log('🔄 Subscribing to presence channel...', 'Connection state:', connectionState);
    
    try {
      // Unsubscribe from previous channel if exists
      if (presenceChannelRef.current) {
        try {
          presenceChannelRef.current.unbind_all();
          pusher.unsubscribe('presence-presence-channel');
        } catch (e) {
          // Ignore errors during cleanup
        }
        presenceChannelRef.current = null;
      }

      const channel = pusher.subscribe('presence-presence-channel');
      presenceChannelRef.current = channel;
      
      // Handle subscription success - get initial members
      channel.bind('pusher:subscription_succeeded', (members: any) => {
        console.log('✅ Successfully subscribed to presence channel');
        const memberIds = Object.keys(members.members || {});
        console.log('👥 Initial members online:', memberIds.length, memberIds);
        setOnlineUsers(new Set(memberIds));
      });

      // Handle member added (user comes online)
      channel.bind('pusher:member_added', (member: any) => {
        const userId = member.id;
        console.log('🟢 User came online:', userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(userId);
          console.log('✅ Added user to online list:', userId, 'Total online:', newSet.size);
          return newSet;
        });
      });

      // Handle member removed (user goes offline)
      channel.bind('pusher:member_removed', (member: any) => {
        const userId = member.id;
        console.log('🔴 User went offline:', userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          console.log('❌ Removed user from online list:', userId, 'Total online:', newSet.size);
          return newSet;
        });
    });

      // Handle subscription error
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('❌ Failed to subscribe to presence channel:', error);
        // Reset online users on error
        setOnlineUsers(new Set());
      });

      console.log('✅ Presence channel subscription initiated');
      return channel;
    } catch (error: any) {
      console.error('❌ Error subscribing to presence channel:', error?.message || error);
      return null;
    }
  }, [pusher]);

  // Send message
  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    if (!pusher || !isConnected) {
      console.error('Pusher not connected');
      return;
    }

    try {
      // Try backend API first
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          receiverId,
          content,
          type: 'text'
        })
      });

      if (!response.ok) {
        console.log('Backend API failed, storing offline...');
        // Store message offline using the service
        offlineMessageService.storeMessage({
          senderId: 'current_user',
          receiverId,
          content,
          type: 'text'
        });
        return;
      }

      const message = await response.json();
      console.log('Message sent successfully:', message);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Store message offline as fallback
      offlineMessageService.storeMessage({
        senderId: 'current_user',
        receiverId,
        content,
        type: 'text'
      });
    }
  }, [pusher, isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (receiverId: string, isTyping: boolean) => {
    if (!pusher || !isConnected) return;

    try {
      await fetch('http://localhost:3001/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          receiverId,
          isTyping
        })
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [pusher, isConnected]);

  // Send presence update
  const sendPresenceUpdate = useCallback(async (isOnline: boolean) => {
    if (!pusher || !isConnected) return;

    try {
      await fetch('http://localhost:3001/api/messages/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ isOnline })
      });
      console.log(`🟢 Presence update sent: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('Failed to send presence update:', error);
    }
  }, [pusher, isConnected]);

  // Set user as online when connected and auto-subscribe to presence
  useEffect(() => {
    if (isConnected && pusher && !presenceChannelRef.current) {
      // Send presence update
      sendPresenceUpdate(true);
      
      // Auto-subscribe to presence channel when connected
      // Small delay to ensure Pusher is fully ready
      const timer = setTimeout(() => {
        const channel = subscribeToPresence();
        if (channel) {
          presenceChannelRef.current = channel;
        }
      }, 500);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    // Cleanup on disconnect
    if (!isConnected && presenceChannelRef.current) {
      try {
        presenceChannelRef.current.unbind_all();
        if (pusher) {
          pusher.unsubscribe('presence-presence-channel');
        }
      } catch (error) {
        console.error('Error cleaning up presence channel:', error);
      }
      presenceChannelRef.current = null;
    }
  }, [isConnected, pusher, sendPresenceUpdate, subscribeToPresence]);

  // Set user as offline when disconnecting
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendPresenceUpdate(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendPresenceUpdate(false);
    };
  }, [sendPresenceUpdate]);

  return {
    pusher,
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    subscribeToUser,
    subscribeToPresence,
    sendMessage,
    sendTypingIndicator
  };
};
