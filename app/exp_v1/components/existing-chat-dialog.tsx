"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ExistingChatDialogProps {
  open: boolean;
  entityType: 'segment' | 'reservation';
  entityName: string;
  existingChats: Array<{
    id: string;
    title: string;
    updatedAt: Date;
    messages: Array<{ content: string }>;
  }>;
  onOpenExisting: (conversationId: string) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export function ExistingChatDialog({
  open,
  entityType,
  entityName,
  existingChats,
  onOpenExisting,
  onCreateNew,
  onCancel,
}: ExistingChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Existing Chats Found</DialogTitle>
          <DialogDescription>
            You already have {existingChats.length} chat{existingChats.length > 1 ? 's' : ''} about{' '}
            <span className="font-semibold">{entityName}</span>. Would you like to open an existing
            chat or create a new one?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[300px] overflow-y-auto py-4">
          {existingChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onOpenExisting(chat.id)}
              className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent hover:border-accent-foreground transition-colors group"
            >
              <div className="flex items-start gap-3">
                <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last updated {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                  </div>
                  {chat.messages.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {chat.messages[0].content.substring(0, 60)}
                      {chat.messages[0].content.length > 60 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={onCreateNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create New Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
