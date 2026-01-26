"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/exp/ui/select"
import { MessageCircle, Plus, MapPin, Calendar, Hotel } from "lucide-react"
import { createTripConversation } from "@/lib/actions/chat-actions"

interface Conversation {
  id: string
  title: string
  tripId: string | null
  chatType?: 'TRIP' | 'SEGMENT' | 'RESERVATION'
  createdAt: Date
  updatedAt: Date
  messages: Array<{
    id: string
    role: string
    content: string
    createdAt: Date
  }>
}

interface ChatNameDropdownProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string, conversationOverride?: Conversation) => void
  tripId: string
  onConversationsChange: (conversations: Conversation[]) => void
  onMessagesReset: () => void
}

export function ChatNameDropdown({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  tripId,
  onConversationsChange,
  onMessagesReset
}: ChatNameDropdownProps) {
  const [isCreating, setIsCreating] = useState(false)
  const currentConversation = conversations.find(c => c.id === currentConversationId)
  
  const truncateName = (name: string, maxLength: number = 25) => {
    return name.length > maxLength ? name.substring(0, maxLength) + "..." : name
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  const getChatTypeInfo = (chatType?: 'TRIP' | 'SEGMENT' | 'RESERVATION') => {
    switch (chatType) {
      case 'SEGMENT':
        return { icon: MapPin, label: 'Segment', color: 'text-blue-600' }
      case 'RESERVATION':
        return { icon: Hotel, label: 'Reservation', color: 'text-green-600' }
      case 'TRIP':
      default:
        return { icon: Calendar, label: 'Trip', color: 'text-purple-600' }
    }
  }

  const handleNewChat = async () => {
    setIsCreating(true)
    try {
      const newConversation = await createTripConversation(tripId)
      onConversationsChange([newConversation, ...conversations])
      onMessagesReset() // Clear messages when switching to new chat
      onSelectConversation(newConversation.id, newConversation) // Pass the conversation directly
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Select
      value={currentConversationId || ""}
      onValueChange={(value) => {
        if (value === "new") {
          handleNewChat()
        } else {
          onSelectConversation(value)
        }
      }}
    >
      <SelectTrigger className="h-auto border-0 p-0 hover:bg-slate-50 rounded px-2 py-1 gap-1">
        <SelectValue>
          <span className="text-sm text-slate-600">
            {currentConversation ? truncateName(currentConversation.title) : "Select Chat"}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {conversations.map((conv) => {
          const typeInfo = getChatTypeInfo(conv.chatType)
          const TypeIcon = typeInfo.icon
          return (
            <SelectItem key={conv.id} value={conv.id}>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <TypeIcon className={`h-3 w-3 ${typeInfo.color}`} />
                  <span>{conv.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 ${typeInfo.color} font-medium`}>
                    {typeInfo.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Updated: {formatDate(conv.updatedAt)}
                </div>
              </div>
            </SelectItem>
          )
        })}
        <SelectItem value="new" disabled={isCreating}>
          <div className="flex items-center gap-2 text-primary">
            <Plus className="h-3 w-3" />
            <span>{isCreating ? "Creating..." : "New Chat"}</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
