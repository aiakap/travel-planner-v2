"use client";

/**
 * Profile Graph Client Component
 * 
 * Main client component with split layout for chat and graph visualization
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { GraphData } from "@/lib/types/profile-graph";
import { ProfileGraphCanvas } from "@/components/profile-graph-canvas";
import { ProfileTextView } from "@/components/profile-text-view";
import { ProfileDossierView } from "@/components/profile-dossier-view";
import { DeleteNodeModal } from "@/components/delete-node-modal";
import { ClearAllModal } from "@/components/clear-all-modal";
import { ConversationalMessage } from "@/components/conversational-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, MessageCircle, Network, FileText, GripVertical, Loader2, Send, BookOpen, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PendingSuggestion, InlineSuggestion, GraphCategory } from "@/lib/types/profile-graph";

interface ProfileGraphClientProps {
  initialGraphData: GraphData;
  initialXmlData: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

type ViewMode = "graph" | "text" | "dossier";

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

export function ProfileGraphClient({
  initialGraphData,
  initialXmlData,
  user
}: ProfileGraphClientProps) {
  const [graphData, setGraphData] = useState<GraphData>(initialGraphData);
  const [xmlData, setXmlData] = useState<string | null>(initialXmlData);
  const [colorScheme, setColorScheme] = useState<string>("default");
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const [dossierContent, setDossierContent] = useState<string | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    nodeId: string;
    nodeName: string;
    nodeType: 'item' | 'subnode' | 'category';
    category?: string;
    subcategory?: string;
    value?: string;
  }>({
    isOpen: false,
    nodeId: '',
    nodeName: '',
    nodeType: 'item'
  });
  const [clearAllModal, setClearAllModal] = useState(false);
  const router = useRouter();
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome back! Let me get caught up on where we left off...",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileValues, setProfileValues] = useState<Set<string>>(new Set());
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  // Refs for resizable panel
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract all current profile item values
  const getCurrentProfileValues = (): Set<string> => {
    const values = new Set<string>();
    graphData.nodes.forEach(node => {
      if (node.type === 'item' && node.value) {
        values.add(node.value.toLowerCase());
      }
    });
    return values;
  };

  // Update profile values when graph data changes
  useEffect(() => {
    setProfileValues(getCurrentProfileValues());
  }, [graphData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start conversation when component mounts
  useEffect(() => {
    const autoStartConversation = async () => {
      if (hasAutoStarted) return;
      
      setHasAutoStarted(true);
      setIsLoading(true);
      
      // Small delay to let the welcome message appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const response = await fetch("/api/profile-graph/suggest-new-topic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            conversationHistory: []
          })
        });

        if (!response.ok) {
          throw new Error("Failed to generate conversation starter");
        }

        const data = await response.json();

        // Determine if suggestions are conversational format
        const isConversational = data.suggestions && 
          data.suggestions.length > 0 && 
          typeof data.suggestions[0] === 'object' && 
          'text' in data.suggestions[0];

        // Add the conversation starter message
        const starterMessage: Message = {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          inlineSuggestions: data.inlineSuggestions || [],
          conversationalSuggestions: isConversational ? data.suggestions : []
        };

        setMessages(prev => [...prev, starterMessage]);
      } catch (error) {
        console.error("Error starting conversation:", error);
        // Fallback message if auto-start fails
        const fallbackMessage: Message = {
          role: "assistant",
          content: "What would you like to explore today? Feel free to share any new travel preferences, interests, or experiences!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    autoStartConversation();
  }, [hasAutoStarted]);

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
      const response = await fetch("/api/profile-graph/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
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

      // Update graph data with auto-added items
      if (data.graphData) {
        console.log("📊 [Client] Updating graph with", data.graphData.nodes.length, "nodes");
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      // Log auto-added items
      if (data.addedItems && data.addedItems.length > 0) {
        console.log("✨ [Client] Auto-added items:", data.addedItems.map((i: any) => i.value).join(", "));
      }

      // Determine if suggestions are conversational format
      const isConversational = data.suggestions && 
        data.suggestions.length > 0 && 
        typeof data.suggestions[0] === 'object' && 
        'text' in data.suggestions[0];

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        pendingSuggestions: data.pendingSuggestions || [],
        inlineSuggestions: data.inlineSuggestions || [],
        conversationalSuggestions: isConversational ? data.suggestions as ConversationalSuggestion[] : [],
        addedItems: data.addedItems || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update profile values with auto-added items
      if (data.addedItems && data.addedItems.length > 0) {
        data.addedItems.forEach((item: any) => {
          setProfileValues(prev => new Set(prev).add(item.value.toLowerCase()));
        });
        console.log("📊 [Client] Updated profile values with auto-added items");
      }
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
      const response = await fetch("/api/profile-graph/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          value: suggestion.value,
          metadata: suggestion.metadata
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const data = await response.json();

      // Update graph with new item
      if (data.graphData) {
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      // Add to local tracking
      setProfileValues(prev => new Set(prev).add(suggestion.value.toLowerCase()));
      console.log("✅ Item added to profile:", suggestion.value);
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

  // Handle node deletion - delete immediately without confirmation
  const handleNodeDelete = async (nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    try {
      const response = await fetch("/api/profile-graph/delete-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId: nodeId,
          category: node.category,
          subcategory: node.metadata?.subcategory,
          value: node.value
        })
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      const data = await response.json();

      // Update graph with item removed
      if (data.graphData) {
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Item deleted from profile");
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Confirm node deletion
  const confirmNodeDelete = async () => {
    try {
      const response = await fetch("/api/profile-graph/delete-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId: deleteModal.nodeId,
          category: deleteModal.category,
          subcategory: deleteModal.subcategory,
          value: deleteModal.value
        })
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      const data = await response.json();

      // Update graph with item removed
      if (data.graphData) {
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Item deleted from profile");
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Handle node position changes (for persistence)
  const handleNodesChange = async (nodes: any[]) => {
    // TODO: Persist node positions to database
    console.log("Nodes changed:", nodes.length);
  };

  // Handle clear graph - show confirmation modal
  const handleClearGraph = () => {
    setClearAllModal(true);
  };

  // Confirm clear all
  const confirmClearAll = async () => {
    try {
      const response = await fetch("/api/profile-graph/clear", {
        method: "POST"
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error clearing graph:", error);
    } finally {
      setClearAllModal(false);
    }
  };

  // Handle dossier view
  const handleDossierView = async () => {
    setViewMode("dossier");
    
    // If we already have dossier content, don't regenerate
    if (dossierContent) return;
    
    setIsDossierLoading(true);
    try {
      const response = await fetch("/api/profile-graph/generate-dossier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          graphData: graphData
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate dossier");
      }

      const data = await response.json();
      setDossierContent(data.dossier);
    } catch (error) {
      console.error("Error generating dossier:", error);
    } finally {
      setIsDossierLoading(false);
    }
  };

  const handleRefreshDossier = async () => {
    setDossierContent(null); // Clear existing content
    await handleDossierView();
  };

  // Resizable panel handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedWidth = Math.min(Math.max(newWidth, 25), 75);
    setLeftPanelWidth(clampedWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex bg-slate-50 mt-16" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left Panel: Chat Interface */}
      <div className="flex flex-col h-full border-r bg-white overflow-hidden" style={{ width: `${leftPanelWidth}%` }}>
        {/* Fixed Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center">
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-slate-700 flex-shrink-0" />
              <span className="text-base font-semibold text-slate-900">Profile Intake</span>
            </div>
            <span className="text-xs text-slate-600 ml-7">Share your travel preferences and we'll build your profile</span>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 overscroll-contain">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
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
            <div className="flex justify-start mb-4">
              <div className="bg-slate-100 rounded-lg p-3">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input Area */}
        <div className="border-t border-slate-200 p-6 bg-white">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              handleSend();
            }
          }} className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about yourself..."
              disabled={isLoading}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6"
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

      {/* Resizable Divider */}
      <div
        className="w-2 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex items-center justify-center group transition-colors"
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>

      {/* Right Panel: Profile Visualization */}
      <div className="flex flex-col overflow-hidden" style={{ width: `${100 - leftPanelWidth}%` }}>
        {/* Right Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-700" />
              <span className="text-base font-semibold text-slate-900">Dossier</span>
            </div>
            <span className="text-xs text-slate-600 ml-7">Your comprehensive traveler profile</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex gap-1 border rounded-lg p-0.5 bg-white">
              <Button
                variant={viewMode === "text" ? "default" : "ghost"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setViewMode("text")}
                title="Text View"
              >
                <FileText className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "graph" ? "default" : "ghost"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setViewMode("graph")}
                title="Graph View"
              >
                <Network className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "dossier" ? "default" : "ghost"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleDossierView()}
                title="Dossier View"
              >
                <BookOpen className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Actions */}
            <Link href="/trip/new">
              <Button
                variant="default"
                size="sm"
                className="h-8 bg-blue-600 hover:bg-blue-700"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Plan a Trip
              </Button>
            </Link>
            <Link href="/suggestions">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Trip Suggestions
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearGraph}
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "graph" ? (
            <ProfileGraphCanvas
              key={`graph-${graphData.nodes.length}-${Date.now()}`}
              graphData={graphData}
              colorScheme={colorScheme}
              customColors={customColors}
              onNodeDelete={handleNodeDelete}
              onNodesChange={handleNodesChange}
              onColorSchemeChange={setColorScheme}
              onCustomColorChange={(category, color) => {
                setCustomColors(prev => ({ ...prev, [category]: color }));
              }}
              onClearAll={handleClearGraph}
              className="h-full"
            />
          ) : viewMode === "text" ? (
            <ProfileTextView 
              graphData={graphData}
              onNodeDelete={handleNodeDelete}
            />
          ) : (
            <ProfileDossierView 
              content={dossierContent}
              isLoading={isDossierLoading}
              onRefresh={handleRefreshDossier}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteNodeModal
        isOpen={deleteModal.isOpen}
        nodeName={deleteModal.nodeName}
        nodeType={deleteModal.nodeType}
        onConfirm={confirmNodeDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />

      {/* Clear All Confirmation Modal */}
      <ClearAllModal
        isOpen={clearAllModal}
        categoryCount={graphData.nodes.filter(n => n.type === 'category').length}
        itemCount={graphData.nodes.filter(n => n.type === 'item').length}
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllModal(false)}
      />
    </div>
  );
}
