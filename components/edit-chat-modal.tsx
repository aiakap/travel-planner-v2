"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { renameTripConversation } from "@/lib/actions/chat-actions"

interface Conversation {
  id: string
  title: string
  tripId: string | null
  createdAt: Date
  updatedAt: Date
  messages: Array<{
    id: string
    role: string
    content: string
    createdAt: Date
  }>
}

interface EditChatModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation
  onUpdate: (updated: Conversation) => void
}

export function EditChatModal({ isOpen, onClose, conversation, onUpdate }: EditChatModalProps) {
  const [title, setTitle] = useState(conversation.title)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      const updated = await renameTripConversation(conversation.id, title.trim())
      onUpdate(updated as Conversation)
      onClose()
    } catch (error) {
      console.error("Error updating chat:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="chat-title">Chat Title</Label>
            <Input
              id="chat-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
              placeholder="Enter chat title..."
            />
          </div>
          <div className="text-xs text-slate-500">
            <div>Created: {new Date(conversation.createdAt).toLocaleDateString()}</div>
            <div>Last updated: {new Date(conversation.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
