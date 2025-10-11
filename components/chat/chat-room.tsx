"use client"

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import {
  MessageCircle,
  Send,
  Users,
  Plus,
  Bot,
  Crown,
  Shield,
  User,
  Clock
} from "lucide-react"

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  userRole: string;
  message: string;
  timestamp: Date;
  isAura?: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  participantCount: number;
  createdAt: Date;
}

interface AuraResponse {
  message: string;
  suggestions?: string[];
  timestamp: Date;
}

export default function ChatRoom() {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [activeRoom, setActiveRoom] = useState<string>('general')
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [auraMessage, setAuraMessage] = useState('')
  const [auraResponse, setAuraResponse] = useState<AuraResponse | null>(null)
  const [auraSuggestions, setAuraSuggestions] = useState<string[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [newRoomPublic, setNewRoomPublic] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user) return

    // Initialize socket connection
    const newSocket = io((typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      setConnected(true)
      setSocket(newSocket)
      
      // Authenticate user
      newSocket.emit('authenticate', {
        userId: user.id,
        username: `${user.firstName} ${user.lastName}`,
        role: user.role
      })
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    newSocket.on('rooms-list', (roomsList: ChatRoom[]) => {
      setRooms(roomsList)
    })

    newSocket.on('room-history', (data: { roomId: string; messages: ChatMessage[] }) => {
      if (data.roomId === activeRoom) {
        setMessages(data.messages)
      }
    })

    newSocket.on('new-message', (message: ChatMessage) => {
      if (message.roomId === activeRoom) {
        setMessages(prev => [...prev, message])
      }
    })

    newSocket.on('aura-response', (response: AuraResponse) => {
      setAuraResponse(response)
      setAuraSuggestions(response.suggestions || [])
    })

    newSocket.on('room-created', (room: ChatRoom) => {
      setRooms(prev => [...prev, room])
      toast.success(`New room "${room.name}" created!`)
    })

    newSocket.on('room-created-success', (data: { roomId: string; name: string }) => {
      toast.success(`Room "${data.name}" created successfully!`)
      setShowCreateRoom(false)
      setNewRoomName('')
      setNewRoomDescription('')
      setNewRoomPublic(true)
    })

    newSocket.on('error', (error: { message: string }) => {
      toast.error(error.message)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (socket && activeRoom) {
      socket.emit('join-room', activeRoom)
    }
  }, [socket, activeRoom])

  const sendMessage = () => {
    if (!socket || !newMessage.trim()) return

    socket.emit('send-message', {
      roomId: activeRoom,
      message: newMessage.trim()
    })

    setNewMessage('')
  }

  const sendAuraMessage = () => {
    if (!socket || !auraMessage.trim()) return

    socket.emit('aura-chat', {
      message: auraMessage.trim()
    })

    setAuraMessage('')
  }

  const createRoom = () => {
    if (!socket || !newRoomName.trim()) return

    socket.emit('create-room', {
      name: newRoomName.trim(),
      description: newRoomDescription.trim(),
      isPublic: newRoomPublic
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to access the chat</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {connected ? 'Connected to chat' : 'Connecting...'}
          </span>
        </div>
        
        {/* Create Room Button (Admin/Manager only) */}
        {['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role) && (
          <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chat Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <Label htmlFor="room-description">Description (Optional)</Label>
                  <Textarea
                    id="room-description"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="Enter room description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="room-public"
                    checked={newRoomPublic}
                    onCheckedChange={setNewRoomPublic}
                  />
                  <Label htmlFor="room-public">Public Room</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRoom} disabled={!newRoomName.trim()}>
                    Create Room
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeRoom === 'aura' ? 'aura' : 'rooms'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rooms" onClick={() => setActiveRoom('general')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat Rooms
          </TabsTrigger>
          <TabsTrigger value="aura" onClick={() => setActiveRoom('aura')}>
            <Bot className="w-4 h-4 mr-2" />
            Aura.CA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Room List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Rooms</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 cursor-pointer hover:bg-muted border-b ${
                        activeRoom === room.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setActiveRoom(room.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{room.name}</span>
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {room.participantCount}
                        </Badge>
                      </div>
                      {room.description && (
                        <p className="text-xs text-muted-foreground mt-1">{room.description}</p>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm">
                  {rooms.find(r => r.id === activeRoom)?.name || 'Chat'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 p-4">
                  {messages.map((message) => (
                    <div key={message.id} className="mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        {getRoleIcon(message.userRole)}
                        <span className="font-medium text-sm">{message.username}</span>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm ml-6">{message.message}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={!connected}
                    />
                    <Button onClick={sendMessage} disabled={!connected || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aura" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-500" />
                Chat with Aura.CA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aura Response */}
              {auraResponse && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">Aura.CA</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(auraResponse.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{auraResponse.message}</p>
                </div>
              )}

              {/* Suggestions */}
              {auraSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {auraSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setAuraMessage(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Aura Input */}
              <div className="flex space-x-2">
                <Input
                  value={auraMessage}
                  onChange={(e) => setAuraMessage(e.target.value)}
                  placeholder="Ask Aura.CA about TCF/TEF preparation..."
                  onKeyPress={(e) => e.key === 'Enter' && sendAuraMessage()}
                  disabled={!connected}
                />
                <Button onClick={sendAuraMessage} disabled={!connected || !auraMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
