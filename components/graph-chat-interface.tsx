"use client";

/**
 * Graph Chat Interface Component
 * 
 * Non-streaming chat interface for profile graph builder
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SAMPLE_PROMPTS, PendingSuggestion, SmartSuggestion, InlineSuggestion, GraphCategory } from "@/lib/types/profile-graph";
import { Loader2, Send, Sparkles } from "lucide-react";
import { SuggestionBubble } from "@/components/suggestion-bubble";
import { ConversationalMessage } from "@/components/conversational-message";

interface ConversationalSuggestion {
  text: string;
  category: GraphCategory;
  subcategory: string;
  metadata?: Record<string, string>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  pendingSuggestions?: PendingSuggestion[];
  inlineSuggestions?: InlineSuggestion[];
  conversationalSuggestions?: ConversationalSuggestion[];
  addedItems?: Array<{
    category: string;
    subcategory: string;
    value: string;
    metadata?: Record<string, string>;
  }>;
}

interface GraphChatInterfaceProps {
  onMessageSent: (message: string, history: Message[]) => Promise<{
    message: string;
    suggestions: string[] | ConversationalSuggestion[];
    addedItems?: Array<{
      category: string;
      subcategory: string;
      value: string;
      metadata?: Record<string, string>;
    }>;
    pendingSuggestions?: PendingSuggestion[];
    similarSuggestions?: PendingSuggestion[];
    inlineSuggestions?: InlineSuggestion[];
  }>;
  onSuggestionAccepted: (suggestion: PendingSuggestion) => Promise<void>;
  onNewTopicRequested?: () => Promise<void>;
  currentProfileValues?: Set<string>;
  className?: string;
}

export function GraphChatInterface({
  onMessageSent,
  onSuggestionAccepted,
  onNewTopicRequested,
  currentProfileValues,
  className = ""
}: GraphChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'd love to learn more about you. Tell me about your travel preferences, hobbies, family, or anything else you'd like to share!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [fadingOutIds, setFadingOutIds] = useState<Set<string>>(new Set());
  const [profileValues, setProfileValues] = useState<Set<string>>(
    currentProfileValues || new Set()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send to API
      const response = await onMessageSent(textToSend, messages);

      // Determine if suggestions are conversational format
      const isConversational = response.suggestions && 
        response.suggestions.length > 0 && 
        typeof response.suggestions[0] === 'object' && 
        'text' in response.suggestions[0];

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        pendingSuggestions: response.pendingSuggestions || [],
        inlineSuggestions: response.inlineSuggestions || [],
        conversationalSuggestions: isConversational ? response.suggestions as ConversationalSuggestion[] : [],
        addedItems: response.addedItems || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update profile values with auto-added items
      if (response.addedItems && response.addedItems.length > 0) {
        response.addedItems.forEach(item => {
          setProfileValues(prev => new Set(prev).add(item.value.toLowerCase()));
        });
        console.log("📊 [GraphChatInterface] Updated profile values with auto-added items");
      }
      
      console.log("📨 [GraphChatInterface] Received response:", {
        pendingSuggestions: response.pendingSuggestions?.length || 0,
        similarSuggestions: response.similarSuggestions?.length || 0,
        suggestions: response.suggestions?.length || 0
      });
      
      // Convert response to smart suggestions (extracted items + similar suggestions)
      const newSmartSuggestions: SmartSuggestion[] = [];
      
      // Add extracted items as 'extracted' type
      if (response.pendingSuggestions && response.pendingSuggestions.length > 0) {
        console.log("📊 [GraphChatInterface] Adding", response.pendingSuggestions.length, "extracted items");
        response.pendingSuggestions.forEach(item => {
          newSmartSuggestions.push({
            ...item,
            type: 'extracted'
          });
        });
      }
      
      // Add similar suggestions as 'similar' type with dimension metadata
      if (response.similarSuggestions && response.similarSuggestions.length > 0) {
        console.log("📊 [GraphChatInterface] Adding", response.similarSuggestions.length, "similar suggestions");
        response.similarSuggestions.forEach(item => {
          newSmartSuggestions.push({
            ...item,
            type: 'similar',
            dimension: item.metadata?.dimension as any
          });
        });
      }
      
      // If no extracted/similar suggestions, show prompt suggestions
      if (newSmartSuggestions.length === 0 && response.suggestions && response.suggestions.length > 0) {
        console.log("📊 [GraphChatInterface] No extracted/similar, adding", response.suggestions.length, "prompt suggestions");
        response.suggestions.slice(0, 5).forEach((suggestion, index) => {
          newSmartSuggestions.push({
            id: `prompt-${Date.now()}-${index}`,
            value: suggestion,
            type: 'prompt'
          });
        });
      }
      
      console.log("✅ [GraphChatInterface] Total smart suggestions:", newSmartSuggestions.length);
      console.log("📊 [GraphChatInterface] Suggestions:", newSmartSuggestions.map(s => `${s.value} (${s.type})`).join(", "));
      
      // Limit to 5 suggestions max
      setSmartSuggestions(newSmartSuggestions.slice(0, 5));
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
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

  // Handle accepting a suggestion with fade-out animation
  const handleAcceptSuggestion = async (suggestion: SmartSuggestion) => {
    // For prompt type, just send the message
    if (suggestion.type === 'prompt') {
      handleSend(suggestion.value);
      return;
    }
    
    // For extracted/similar types, add to graph
    if (!suggestion.category || !suggestion.subcategory) {
      console.error("Missing category or subcategory for suggestion:", suggestion);
      return;
    }
    
    // Start fade-out animation
    setFadingOutIds(prev => new Set(prev).add(suggestion.id));
    
    // Wait for animation to complete
    setTimeout(async () => {
      try {
        // Add to graph
        await onSuggestionAccepted({
          id: suggestion.id,
          category: suggestion.category!,
          subcategory: suggestion.subcategory!,
          value: suggestion.value,
          metadata: suggestion.metadata
        });
        
        // Remove from smart suggestions
        setSmartSuggestions(prev => 
          prev.filter(s => s.id !== suggestion.id)
        );
        
        // Clear fading state
        setFadingOutIds(prev => {
          const next = new Set(prev);
          next.delete(suggestion.id);
          return next;
        });
        
        // Fetch new similar suggestion to replace this one (only for similar/extracted types)
        if (suggestion.type === 'similar' || suggestion.type === 'extracted') {
          // Add loading bubble
          const loadingId = `loading-${Date.now()}`;
          setSmartSuggestions(prev => [...prev, {
            id: loadingId,
            value: 'Generating...',
            type: 'similar' as const,
            category: suggestion.category,
            subcategory: suggestion.subcategory,
            isLoading: true
          }]);
          
          try {
            const response = await fetch('/api/profile-graph/suggest-similar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                referenceTag: suggestion.value,
                category: suggestion.category,
                subcategory: suggestion.subcategory,
                wasAccepted: true
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.suggestion) {
                // Replace loading bubble with actual suggestion
                setSmartSuggestions(prev => prev.map(s => 
                  s.id === loadingId ? {
                    ...data.suggestion,
                    type: 'similar' as const,
                    dimension: data.suggestion.metadata?.dimension as any
                  } : s
                ));
              } else {
                // Remove loading bubble if no suggestion
                setSmartSuggestions(prev => prev.filter(s => s.id !== loadingId));
              }
            } else {
              // Remove loading bubble on error
              setSmartSuggestions(prev => prev.filter(s => s.id !== loadingId));
            }
          } catch (error) {
            console.error("Error fetching new similar suggestion:", error);
            // Remove loading bubble on error
            setSmartSuggestions(prev => prev.filter(s => s.id !== loadingId));
          }
        }
      } catch (error) {
        console.error("Error accepting suggestion:", error);
        // Revert fade-out on error
        setFadingOutIds(prev => {
          const next = new Set(prev);
          next.delete(suggestion.id);
          return next;
        });
      }
    }, 300); // Match CSS transition duration
  };

  // Handle rejecting a suggestion with fade-out animation
  const handleRejectSuggestion = (suggestionId: string) => {
    // Start fade-out animation
    setFadingOutIds(prev => new Set(prev).add(suggestionId));
    
    // Remove after animation
    setTimeout(() => {
      setSmartSuggestions(prev => 
        prev.filter(s => s.id !== suggestionId)
      );
      setFadingOutIds(prev => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
      
      // Fetch new similar suggestion to replace the rejected one
      const rejectedSuggestion = smartSuggestions.find(s => s.id === suggestionId);
      if (rejectedSuggestion && (rejectedSuggestion.type === 'similar' || rejectedSuggestion.type === 'extracted')) {
        // Add loading bubble
        const loadingId = `loading-${Date.now()}`;
        setSmartSuggestions(prev => [...prev, {
          id: loadingId,
          value: 'Generating...',
          type: 'similar' as const,
          category: rejectedSuggestion.category,
          subcategory: rejectedSuggestion.subcategory,
          isLoading: true
        }]);
        
        fetch('/api/profile-graph/suggest-similar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceTag: rejectedSuggestion.value,
            category: rejectedSuggestion.category,
            subcategory: rejectedSuggestion.subcategory,
            wasAccepted: false
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.suggestion) {
            // Replace loading bubble with actual suggestion
            setSmartSuggestions(prev => prev.map(s => 
              s.id === loadingId ? {
                ...data.suggestion,
                type: 'similar' as const,
                dimension: data.suggestion.metadata?.dimension as any
              } : s
            ));
          } else {
            // Remove loading bubble if no suggestion
            setSmartSuggestions(prev => prev.filter(s => s.id !== loadingId));
          }
        })
        .catch(error => {
          console.error("Error fetching new similar suggestion:", error);
          // Remove loading bubble on error
          setSmartSuggestions(prev => prev.filter(s => s.id !== loadingId));
        });
      }
    }, 300);
  };

  // Handle new topic request
  const handleNewTopicClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile-graph/suggest-new-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate new topic");
      }

      const data = await response.json();

      // Determine if suggestions are conversational format
      const isConversational = data.suggestions && 
        data.suggestions.length > 0 && 
        typeof data.suggestions[0] === 'object' && 
        'text' in data.suggestions[0];

      // Add new topic message to conversation
      const newTopicMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        inlineSuggestions: data.inlineSuggestions || [],
        conversationalSuggestions: isConversational ? data.suggestions : []
      };

      setMessages(prev => [...prev, newTopicMessage]);
    } catch (error) {
      console.error("Error requesting new topic:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle inline suggestion click
  const handleInlineSuggestionClick = async (suggestion: {
    category: any;
    subcategory: string;
    value: string;
    metadata?: Record<string, string>;
  }) => {
    try {
      await onSuggestionAccepted({
        id: `inline-${Date.now()}`,
        category: suggestion.category,
        subcategory: suggestion.subcategory,
        value: suggestion.value,
        metadata: suggestion.metadata
      });
      // Add to local tracking
      setProfileValues(prev => new Set(prev).add(suggestion.value.toLowerCase()));
      console.log("📊 [GraphChatInterface] Added to profile values:", suggestion.value);
    } catch (error) {
      console.error("Error accepting inline suggestion:", error);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {/* Show auto-added items badge */}
              {message.role === "assistant" && message.addedItems && message.addedItems.length > 0 && (
                <div className="mb-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded">
                    <span className="font-medium">✓ Added to profile:</span>
                    <span>{message.addedItems.map(item => item.value).join(", ")}</span>
                  </div>
                </div>
              )}
              
              {/* Render conversational message if it has conversational suggestions */}
              {message.role === "assistant" && message.conversationalSuggestions && message.conversationalSuggestions.length > 0 ? (
                <ConversationalMessage
                  message={message.content}
                  suggestions={message.conversationalSuggestions}
                  onSuggestionClick={handleInlineSuggestionClick}
                  onNewTopicClick={handleNewTopicClick}
                  existingProfileValues={profileValues}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <p className={`text-xs mt-1 ${
                message.role === "user" ? "text-blue-100" : "text-slate-500"
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
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-3">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about yourself..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
