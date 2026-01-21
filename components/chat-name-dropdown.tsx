"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Plus } from "lucide-react"
import { createTripConversation } from "@/lib/actions/chat-actions"

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages?: any[]
}

interface ChatNameDropdownProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  tripId: string
  onConversationsChange: (conversations: Conversation[]) => void
}

export function ChatNameDropdown({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  tripId,
  onConversationsChange 
}: ChatNameDropdownProps) {
  const [isCreating, setIsCreating] = useState(false)
  const currentConversation = conversations.find(c => c.id === currentConversationId)
  
  const truncateName = (name: string, maxLength: number = 25) => {
    return name.length > maxLength ? name.substring(0, maxLength) + "..." : name
  }

  const handleNewChat = async () => {
    setIsCreating(true)
    try {
      const newConversation = await createTripConversation(tripId)
      onConversationsChange([newConversation, ...conversations])
      onSelectConversation(newConversation.id)
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
        {conversations.map((conv) => (
          <SelectItem key={conv.id} value={conv.id}>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3 w-3" />
              <span>{conv.title}</span>
            </div>
          </SelectItem>
        ))}
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
