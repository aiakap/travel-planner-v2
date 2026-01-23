"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { GripVertical, MessageCircle, Send, Loader2, FileText, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripStructureWelcome } from "@/components/trip-structure-welcome";
import { TripMetadataCard } from "@/components/trip-metadata-card";
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

type MobileTab = "trip" | "chat" | "preview";

// Helper to extract text content from message parts
function getMessageText(message: any): string {
  if (!message) return "";
  return (
    message.parts
      ?.filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("") || message.content || ""
  );
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
  const [mobileTab, setMobileTab] = useState<MobileTab>("trip");
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isMetadataComplete, setIsMetadataComplete] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Refs
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Chat integration with structure-specific API endpoint
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    api: "/api/chat/structure",
    body: { userId, mode: "structure" },
    initialMessages: [],
  } as any);

  const isLoading = status === "in_progress";
  
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

  // Handle chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput("");
      if (!hasStartedChat) setHasStartedChat(true);
    }
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
  
  // Listen for tool invocations and update in-memory state
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return;
    
    const toolInvocations = (lastMessage as any)?.toolInvocations || [];
    
    toolInvocations.forEach((invocation: any) => {
      if (invocation.state !== "result") return;
      
      const result = invocation.result;
      
      // Handle trip metadata updates
      if (result.updateType === "trip_metadata") {
        setInMemoryTrip((prev) => ({
          ...prev,
          ...result.updates,
        }));
      }
      
      // Handle segment additions
      if (result.updateType === "add_segment") {
        setInMemoryTrip((prev) => ({
          ...prev,
          segments: [...prev.segments, {
            ...result.segment,
            order: prev.segments.length,
          }],
        }));
      }
    });
  }, [messages]);

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
          onClick={() => setMobileTab("trip")}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            mobileTab === "trip"
              ? "text-slate-900 border-t-2 border-slate-900"
              : "text-slate-500"
          }`}
        >
          <FileText className="h-5 w-5 mx-auto mb-1" />
          Trip
        </button>
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
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            mobileTab === "preview"
              ? "text-slate-900 border-t-2 border-slate-900"
              : "text-slate-500"
          }`}
        >
          <Layers className="h-5 w-5 mx-auto mb-1" />
          Preview
        </button>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex-1 pb-16 overflow-hidden">
        {mobileTab === "trip" && (
          <div className="h-full overflow-y-auto p-4">
            <TripMetadataCard
              title={inMemoryTrip.title}
              description={inMemoryTrip.description}
              startDate={inMemoryTrip.startDate}
              endDate={inMemoryTrip.endDate}
              imageUrl={inMemoryTrip.imageUrl}
              onUpdate={handleMetadataUpdate}
            />
          </div>
        )}
        {mobileTab === "chat" && (
          <div className="flex flex-col h-full bg-white">
            <div className="border-b border-slate-200 p-3 bg-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-900">Trip Planning Assistant</h2>
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
                          {getMessageText(msg)}
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
                  placeholder="Describe your trip structure..."
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
        {mobileTab === "preview" && (
          <div className="h-full overflow-y-auto p-4">
            <TripStructurePreview
              trip={inMemoryTrip}
              isMetadataComplete={isMetadataComplete}
              onCommit={handleCommitTrip}
              isCommitting={isCommitting}
            />
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Panel - Trip Card + Chat */}
        <div
          className="flex flex-col h-full border-r bg-white overflow-hidden"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Trip Metadata Card Section */}
          <div className="border-b border-slate-200 p-4 max-h-[50%] overflow-y-auto">
            <TripMetadataCard
              title={inMemoryTrip.title}
              description={inMemoryTrip.description}
              startDate={inMemoryTrip.startDate}
              endDate={inMemoryTrip.endDate}
              imageUrl={inMemoryTrip.imageUrl}
              onUpdate={handleMetadataUpdate}
            />
          </div>
          
          {/* Chat Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 p-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-900">Planning Assistant</h2>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {!hasStartedChat && messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-600 mb-4">
                    Tell me about your trip or fill in the details above
                  </p>
                  <Button onClick={handleStartChat} variant="outline" size="sm">
                    Start Planning
                  </Button>
                </div>
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
                          {getMessageText(msg)}
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
                  placeholder="Describe your trip structure..."
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
        </div>

        {/* Resizable Divider */}
        <div
          className="w-2 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex items-center justify-center group transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

        {/* Right Panel - Live Preview */}
        <div
          className="flex flex-col h-full bg-slate-50 overflow-hidden"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="border-b border-slate-200 p-4 bg-white h-16 flex items-center">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-slate-700" />
              <span className="text-sm font-medium text-slate-700">Trip Preview</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <TripStructurePreview
              trip={inMemoryTrip}
              isMetadataComplete={isMetadataComplete}
              onCommit={handleCommitTrip}
              isCommitting={isCommitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
