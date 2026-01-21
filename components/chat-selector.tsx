"use client"

import { useState } from "react"
import { Plus, MessageCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTripConversation, deleteConversation } from "@/lib/actions/chat-actions"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages?: any[]
}

interface ChatSelectorProps {
  tripId: string
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onConversationsChange: (conversations: Conversation[]) => void
}

export function ChatSelector({
  tripId,
  conversations,
  currentConversationId,
  onSelectConversation,
  onConversationsChange,
}: ChatSelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleDeleteChat = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (conversations.length <= 1) {
      alert("Cannot delete the last conversation for this trip")
      return
    }

    if (!confirm("Are you sure you want to delete this conversation?")) {
      return
    }

    setDeletingId(conversationId)
    try {
      await deleteConversation(conversationId)
      const updatedConversations = conversations.filter(c => c.id !== conversationId)
      onConversationsChange(updatedConversations)
      
      // If deleting current conversation, switch to first available
      if (conversationId === currentConversationId && updatedConversations.length > 0) {
        onSelectConversation(updatedConversations[0].id)
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const conversationDate = new Date(date)
    const diffInHours = (now.getTime() - conversationDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return conversationDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return conversationDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Conversations
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewChat}
            disabled={isCreating}
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>

        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              disabled={deletingId === conv.id}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors group relative",
                "hover:bg-slate-50",
                currentConversationId === conv.id
                  ? "bg-slate-100 border border-slate-200"
                  : "border border-transparent",
                deletingId === conv.id && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteChat(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                    disabled={deletingId === conv.id}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
