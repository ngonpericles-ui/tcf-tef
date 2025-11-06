"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send } from "lucide-react"

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
  isSystemMessage?: boolean
}

interface ChatPanelProps {
  onClose: () => void
  messages?: ChatMessage[]
  currentUserId?: string
  onSendMessage?: (message: string) => void
  isConnected?: boolean
}

export function ChatPanel({ 
  onClose, 
  messages = [], 
  currentUserId,
  onSendMessage,
  isConnected = false
}: ChatPanelProps) {
  const [message, setMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const formatTime = (timestamp: Date | string | number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="w-80 bg-black border-l border-white/20 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white">Chat</h2>
          {!isConnected && (
            <div className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected" />
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 bg-black" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {msg.senderProfilePicture ? (
                    <img 
                      src={msg.senderProfilePicture} 
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <span className="text-xs font-medium text-white">
                        {msg.senderName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {msg.senderName}
                      {msg.senderId === currentUserId && " (You)"}
                    </span>
                    <span className="text-xs text-white/60">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm p-3 rounded-lg ${
                    msg.isSystemMessage 
                      ? "text-white/60 bg-white/10 italic" 
                      : "text-white bg-white/10"
                  }`}>
                    {msg.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60 text-sm">
                {isConnected ? "No messages yet" : "Connecting to chat..."}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/20 bg-black">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="px-3 bg-white/10 hover:bg-white/20 text-white border-white/20"
            disabled={!isConnected || !message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
