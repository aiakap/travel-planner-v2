"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GripVertical, MessageCircle, Send, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripStructureWelcome } from "@/components/trip-structure-welcome";
import { TripStructurePreview } from "@/components/trip-structure-preview";
import { AILoadingAnimation } from "@/components/ai-loading-animation";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface InMemorySegment {
  tempId: string;
  name: string;
  segmentType: string;
  startLocation: string;
  endLocation: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  order: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startTimeZoneId?: string;
  startTimeZoneName?: string;
  endTimeZoneId?: string;
  endTimeZoneName?: string;
}

interface InMemoryTrip {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  segments: InMemorySegment[];
}

interface TripStructureBuilderClientProps {
  userId: string;
}

type MobileTab = "chat" | "edit";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function TripStructureBuilderClient({ userId }: TripStructureBuilderClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  // In-memory trip state
  const [inMemoryTrip, setInMemoryTrip] = useState<InMemoryTrip>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    imageUrl: null,
    segments: [],
  });
  
  // UI State
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isMetadataComplete, setIsMetadataComplete] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Refs
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if metadata is complete
  useEffect(() => {
    const isComplete = !!(
      inMemoryTrip.title &&
      inMemoryTrip.startDate &&
      inMemoryTrip.endDate
    );
    setIsMetadataComplete(isComplete);
  }, [inMemoryTrip]);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  
  // Handle trip metadata updates from card
  const handleMetadataUpdate = (updates: Partial<InMemoryTrip>) => {
    setInMemoryTrip((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Handle segments update from splitter card
  const handleSegmentsUpdate = (segments: InMemorySegment[]) => {
    setInMemoryTrip((prev) => ({
      ...prev,
      segments,
    }));
  };

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
    if (!hasStartedChat) setHasStartedChat(true);

    try {
      // Send to API
      const response = await fetch("/api/chat/structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          currentTrip: inMemoryTrip
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ [Client] API error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      console.log("📊 [Client] Received response:", {
        hasMessage: !!data.message,
        hasTripUpdates: !!data.tripUpdates,
        segmentsToAdd: data.segmentsToAdd?.length || 0
      });

      // Update in-memory trip with AI responses
      if (data.tripUpdates) {
        console.log("📝 [Client] Updating trip metadata:", data.tripUpdates);
        setInMemoryTrip(prev => ({ ...prev, ...data.tripUpdates }));
      }
      
      if (data.segmentsToAdd && data.segmentsToAdd.length > 0) {
        console.log("➕ [Client] Adding segments:", data.segmentsToAdd.length);
        setInMemoryTrip(prev => ({
          ...prev,
          segments: [...prev.segments, ...data.segmentsToAdd]
        }));
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
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
    }
  };

  // Handle chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  // Handle start chat from welcome
  const handleStartChat = () => {
    setHasStartedChat(true);
    chatInputRef.current?.focus();
  };

  // Handle add part button click
  const handleAddPart = () => {
    setHasStartedChat(true);
    chatInputRef.current?.focus();
    setInput("Add another part to my trip");
  };

  // Handle commit trip to database
  const handleCommitTrip = async () => {
    setIsCommitting(true);
    try {
      const response = await fetch("/api/trips/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: inMemoryTrip.title,
          description: inMemoryTrip.description,
          startDate: inMemoryTrip.startDate,
          endDate: inMemoryTrip.endDate,
          imageUrl: inMemoryTrip.imageUrl,
          segments: inMemoryTrip.segments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to commit trip");
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Trip created!",
          description: `Your trip "${inMemoryTrip.title}" has been created with ${data.trip.segmentCount} parts.`,
        });
        
        // Redirect to experience builder
        router.push(`/test/experience-builder?tripId=${data.trip.id}`);
      } else {
        throw new Error(data.error || "Failed to create trip");
      }
    } catch (error) {
      console.error("Error committing trip:", error);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-50 flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            mobileTab === "chat"
              ? "text-slate-900 border-t-2 border-slate-900"
              : "text-slate-500"
          }`}
        >
          <MessageCircle className="h-5 w-5 mx-auto mb-1" />
          Chat
        </button>
        <button
          onClick={() => setMobileTab("edit")}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            mobileTab === "edit"
              ? "text-slate-900 border-t-2 border-slate-900"
              : "text-slate-500"
          }`}
        >
          <Layers className="h-5 w-5 mx-auto mb-1" />
          Edit
        </button>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex-1 pb-16 overflow-hidden">
        {mobileTab === "chat" && (
          <div className="flex flex-col h-full bg-white">
          <div className="border-b border-slate-200 p-3 bg-slate-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-slate-700 flex-shrink-0" />
                <span className="text-base font-semibold text-slate-900">Journey Architect</span>
              </div>
              <span className="text-xs text-slate-600 ml-7">Build your trip structure conversationally</span>
            </div>
          </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!hasStartedChat && messages.length === 0 ? (
                <TripStructureWelcome onStartChat={handleStartChat} />
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex mb-4 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-900 border border-slate-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && <AILoadingAnimation />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="border-t border-slate-200 p-3 bg-white">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  ref={chatInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your journey..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
        {mobileTab === "edit" && (
          <div className="h-full overflow-y-auto p-4 bg-slate-50">
            <TripStructurePreview
              trip={inMemoryTrip}
              isMetadataComplete={isMetadataComplete}
              onCommit={handleCommitTrip}
              isCommitting={isCommitting}
              onMetadataUpdate={handleMetadataUpdate}
              onSegmentsUpdate={handleSegmentsUpdate}
            />
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Panel - Chat Only */}
        <div
          className="flex flex-col h-full border-r bg-white overflow-hidden"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Chat Header */}
          <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center">
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-slate-700 flex-shrink-0" />
                <span className="text-base font-semibold text-slate-900">Journey Architect</span>
              </div>
              <span className="text-xs text-slate-600 ml-7">Build your trip structure conversationally</span>
            </div>
          </div>
          
          {/* Chat Messages - Full Height */}
          <div className="flex-1 overflow-y-auto p-4">
            {!hasStartedChat && messages.length === 0 ? (
              <TripStructureWelcome onStartChat={handleStartChat} />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex mb-4 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-900 border border-slate-100"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed text-sm">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && <AILoadingAnimation />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-slate-200 p-3 bg-white">
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your journey..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
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

        {/* Right Panel - Trip Builder */}
        <div
          className="flex flex-col h-full bg-slate-50 overflow-hidden"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-slate-700" />
                <span className="text-base font-semibold text-slate-900">Journey Structure</span>
              </div>
              <span className="text-xs text-slate-600 ml-7">Your trip itinerary and timeline</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <TripStructurePreview
              trip={inMemoryTrip}
              isMetadataComplete={isMetadataComplete}
              onCommit={handleCommitTrip}
              isCommitting={isCommitting}
              onMetadataUpdate={handleMetadataUpdate}
              onSegmentsUpdate={handleSegmentsUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
