"use client";

/**
 * Object Style Chat Component
 * 
 * Card-based chat interface for the Dossier page.
 * Uses the unified /api/profile-graph/chat endpoint with mode=object
 */

import { useState, useRef, useEffect } from "react";
import { GraphData } from "@/lib/types/profile-graph";
import { AutoAddCard, AutoAddData } from "@/app/object/_cards/auto-add-card";
import { TopicChoiceCard, TopicChoiceData } from "@/app/object/_cards/topic-choice-card";
import { RelatedSuggestionsCard, RelatedSuggestionsData } from "@/app/object/_cards/related-suggestions-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  cards?: Card[];
  addedItems?: Array<{
    category: string;
    subcategory: string;
    value: string;
    metadata?: Record<string, string>;
  }>;
}

interface Card {
  id: string;
  type: "auto_add" | "topic_choice" | "related_suggestions";
  data: AutoAddData | TopicChoiceData | RelatedSuggestionsData;
}

interface ObjectStyleChatProps {
  graphData: GraphData;
  onGraphUpdate: (data: GraphData) => void;
}

export function ObjectStyleChat({ graphData, onGraphUpdate }: ObjectStyleChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoStartedRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start conversation
  useEffect(() => {
    const autoStartConversation = async () => {
      if (hasAutoStartedRef.current) return;
      hasAutoStartedRef.current = true;
      
      // Add welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Welcome! Let's build your travel profile using interactive cards. Tell me about yourself!",
        timestamp: new Date()
      }]);
    };

    autoStartConversation();
  }, []);

  // Handle card actions (reload data)
  const handleCardAction = async (action: string, data: any) => {
    console.log("🎬 [ObjectStyleChat] Card action:", action, data);
    
    if (action === "refresh" || action === "reload") {
      // Fetch updated graph data
      try {
        const response = await fetch("/api/profile-graph/chat", {
          method: "GET"
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.graphData) {
            onGraphUpdate(result.graphData);
          }
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  };

  // Send message
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile-graph/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          mode: "object",
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update graph data
      if (data.graphData) {
        onGraphUpdate(data.graphData);
      }

      // Add assistant response with cards
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.text || data.message || "",
        timestamp: new Date(),
        cards: data.cards || [],
        addedItems: data.addedItems || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I had trouble processing that. Could you try again?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle new topic
  const handleNewTopic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile-graph/suggest-new-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const newTopicMessage: Message = {
          id: `topic-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, newTopicMessage]);
      }
    } catch (error) {
      console.error("Error requesting new topic:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render card component
  const renderCard = (card: Card) => {
    switch (card.type) {
      case "auto_add":
        return (
          <AutoAddCard
            key={card.id}
            data={card.data as AutoAddData}
            onAction={handleCardAction}
          />
        );
      case "topic_choice":
        return (
          <TopicChoiceCard
            key={card.id}
            data={card.data as TopicChoiceData}
            onAction={handleCardAction}
          />
        );
      case "related_suggestions":
        return (
          <RelatedSuggestionsCard
            key={card.id}
            data={card.data as RelatedSuggestionsData}
            onAction={handleCardAction}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-3`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {/* Show auto-added items badge */}
              {message.role === "assistant" && message.addedItems && message.addedItems.length > 0 && (
                <div className="mb-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                    <span className="font-medium">✓ Added:</span>
                    <span>{message.addedItems.map(item => item.value).join(", ")}</span>
                  </div>
                </div>
              )}
              
              {/* Message text */}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Cards */}
              {message.cards && message.cards.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                  {message.cards.map(card => renderCard(card))}
                </div>
              )}
              
              {/* Timestamp */}
              <p className={`text-xs mt-1 ${
                message.role === "user" ? "text-blue-100" : "text-slate-400"
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-slate-100 rounded-lg p-3">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !isLoading) {
            handleSend();
          }
        }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about yourself..."
            disabled={isLoading}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewTopic}
            disabled={isLoading}
            className="px-3"
            title="Suggest new topic"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
