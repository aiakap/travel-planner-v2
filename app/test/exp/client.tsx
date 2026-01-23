"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Plus, GripVertical, Table2, GitBranch, Grid3X3, MessageCircle, Calendar, Loader2, MapPin } from "lucide-react"
import { ChatWelcomeMessage } from "@/components/chat-welcome-message"
import { ChatQuickActions } from "@/components/chat-quick-actions"
import { ChatContextWelcome } from "@/components/chat-context-welcome"
import { TripSelector } from "@/components/trip-selector"
import { ChatNameDropdown } from "@/components/chat-name-dropdown"
import { EditChatModal } from "@/components/edit-chat-modal"
import { EditTripModal } from "@/components/edit-trip-modal"
import { AILoadingAnimation } from "@/components/ai-loading-animation"
import { ItineraryEmptyState } from "@/components/itinerary-empty-state"
import { TimelineView } from "@/components/timeline-view"
import { TableView } from "@/components/table-view"
import { PhotosView } from "@/components/photos-view"
import { ReservationDetailModal } from "@/components/reservation-detail-modal"
import { transformTripToV0Format } from "@/lib/v0-data-transform"
import type { V0Itinerary } from "@/lib/v0-types"
import { UserPersonalizationData, ChatQuickAction, getHobbyBasedDestination, getPreferenceBudgetLevel } from "@/lib/personalization"
import { generateGetLuckyPrompt } from "@/lib/ai/get-lucky-prompts"
import { renameTripConversation, createTripConversation } from "@/lib/actions/chat-actions"
import { MessageSegmentsRenderer } from "@/components/message-segments-renderer"
import { MessageSegment } from "@/lib/types/place-pipeline"

// Simple message type with segments
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  segments?: MessageSegment[];
}

// Removed old helper functions - no longer needed with non-streaming API!

// Type for database trip with all relations
interface DBTrip {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
  segments: Array<{
    id: string
    name: string
    imageUrl: string | null
    startTime: Date | null
    endTime: Date | null
    order: number
    segmentType: { name: string }
    reservations: Array<{
      id: string
      name: string
      confirmationNumber: string | null
      notes: string | null
      startTime: Date | null
      endTime: Date | null
      cost: number | null
      currency: string | null
      location: string | null
      url: string | null
      imageUrl: string | null
      departureLocation: string | null
      departureTimezone: string | null
      arrivalLocation: string | null
      arrivalTimezone: string | null
      contactPhone: string | null
      contactEmail: string | null
      cancellationPolicy: string | null
      reservationType: {
        name: string
        category: { name: string }
      }
      reservationStatus: { name: string }
    }>
  }>
}

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

interface ExpClientProps {
  initialTrips: DBTrip[]
  selectedTrip: DBTrip | null
  selectedConversation: Conversation | null
  initialConversations: Conversation[]
  userId: string
  profileData?: UserPersonalizationData | null
  quickActions?: ChatQuickAction[]
}

type ViewMode = "table" | "timeline" | "photos"
type MobileTab = "chat" | "itinerary"

export function ExpClient({
  initialTrips,
  selectedTrip: initialSelectedTrip,
  selectedConversation: initialSelectedConversation,
  initialConversations,
  userId,
  profileData = null,
  quickActions = [],
}: ExpClientProps) {
  // State
  const [trips, setTrips] = useState<DBTrip[]>(initialTrips)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(initialSelectedTrip?.id || null)
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialSelectedConversation?.id || null
  )
  const [hasStartedPlanning, setHasStartedPlanning] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat")
  const [leftPanelWidth, setLeftPanelWidth] = useState(40)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [isChatEditModalOpen, setIsChatEditModalOpen] = useState(false)
  const [isTripEditModalOpen, setIsTripEditModalOpen] = useState(false)

  // Refs
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Chat integration - Simple non-streaming version
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialSelectedConversation?.messages.map(m => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    })) || []
  )
  const [isLoading, setIsLoading] = useState(false)

  // Simple sendMessage function that calls our non-streaming API
  const sendMessage = async (text: string) => {
    if (!currentConversationId || !text.trim()) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Check if trip was created by AI
      if (data.tripCreated && data.tripId && !selectedTripId) {
        console.log("🎉 [Client] Trip created by AI:", data.tripId);
        console.log("   Scheduling trip refetch...");
        
        // Refetch trips and select the new one after a small delay
        setTimeout(async () => {
          console.log("🔄 [Client] Executing refetchTripsAndSelect");
          await refetchTripsAndSelect();
        }, 500); // Small delay to ensure DB write completes
      }

      // Add assistant message with segments
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        segments: data.segments,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("❌ [sendMessage] Error:", error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  // Tool call handling is removed - trips are created via direct tool invocation in the chat API

  // Resizable panel handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100
    const clampedWidth = Math.min(Math.max(newWidth, 25), 75)
    setLeftPanelWidth(clampedWidth)
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [handleMouseMove, handleMouseUp])

  // Trip creation detection is handled by the chat API now

  const refetchTripsAndSelect = async () => {
    console.log("🔄 [Refetch] Starting trip refetch...")
    console.log("🔄 [Refetch] Current trips count:", trips.length)
    
    try {
      const response = await fetch(`/api/trips?userId=${userId}`)
      console.log("🔄 [Refetch] API response status:", response.status, response.ok)
      
      if (response.ok) {
        const updatedTrips = await response.json()
        console.log("🔄 [Refetch] Updated trips count:", updatedTrips.length)
        console.log("🔄 [Refetch] Updated trips:", updatedTrips.map((t: any) => ({ id: t.id, title: t.title })))
        
        // Find the new trip (should be first in the list since ordered by createdAt desc)
        if (updatedTrips.length > trips.length) {
          const newestTrip = updatedTrips[0]
          console.log("✅ [Refetch] New trip found:", newestTrip.id, newestTrip.title)
          
          // Update trips list
          setTrips(updatedTrips)
          console.log("✅ [Refetch] Trips state updated")
          
          // Select the new trip
          setSelectedTripId(newestTrip.id)
          console.log("✅ [Refetch] Selected trip ID set to:", newestTrip.id)
          
          // Update URL without reload
          window.history.pushState({}, '', `/test/exp?tripId=${newestTrip.id}`)
          console.log("✅ [Refetch] URL updated to:", `/test/exp?tripId=${newestTrip.id}`)
          
          // Fetch conversations for the new trip
          console.log("🔄 [Refetch] Fetching conversations for trip:", newestTrip.id)
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.tsx:246',message:'Before fetch conversations',data:{tripId:newestTrip.id,url:`/api/conversations?tripId=${newestTrip.id}`},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
          // #endregion
          
          let convResponse
          try {
            convResponse = await fetch(`/api/conversations?tripId=${newestTrip.id}`)
            
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.tsx:252',message:'Fetch completed',data:{status:convResponse.status,ok:convResponse.ok,statusText:convResponse.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
          } catch (fetchError: any) {
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.tsx:258',message:'Fetch error caught',data:{errorMessage:fetchError.message,errorName:fetchError.name,errorStack:fetchError.stack},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            throw fetchError
          }
          
          console.log("🔄 [Refetch] Conversations API response:", convResponse.status, convResponse.ok)
          
          if (convResponse.ok) {
            const tripConversations = await convResponse.json()
            console.log("✅ [Refetch] Conversations fetched:", tripConversations.length)
            console.log("✅ [Refetch] Conversations:", tripConversations.map((c: any) => ({ id: c.id, title: c.title })))
            setConversations(tripConversations)
            
            // Select the current conversation (it should now be linked to the trip)
            if (currentConversationId) {
              console.log("🔄 [Refetch] Looking for current conversation:", currentConversationId)
              const currentConv = tripConversations.find((c: any) => c.id === currentConversationId)
              if (currentConv) {
                console.log("✅ [Refetch] Current conversation found and linked to trip")
                setCurrentConversationId(currentConv.id)
              } else {
                console.log("⚠️ [Refetch] Current conversation not found in trip conversations")
              }
            }
          } else {
            console.error("❌ [Refetch] Failed to fetch conversations:", convResponse.status)
          }
        } else {
          console.log("⚠️ [Refetch] No new trip detected (same count)")
        }
      } else {
        console.error("❌ [Refetch] Failed to fetch trips:", response.status)
      }
    } catch (error) {
      console.error("❌ [Refetch] Error refetching trips:", error)
    }
  }

  // Auto-create conversation if needed
  useEffect(() => {
    const autoCreateChat = async () => {
      // Only auto-create if no conversations exist and no conversation is currently set
      if (conversations.length === 0 && !currentConversationId) {
        try {
          let newConversation
          
          if (selectedTripId) {
            // Create conversation linked to existing trip
            const selectedTrip = trips.find(t => t.id === selectedTripId)
            const tripName = selectedTrip?.title || "your trip"
            
            newConversation = await createTripConversation(
              selectedTripId, 
              `Chat about ${tripName}`
            )
            
            // Add a greeting message from the assistant
            setMessages([{
              id: 'greeting',
              role: 'assistant',
              content: `What can I help with regarding ${tripName}?`,
            } as any])
          } else {
            // Create standalone conversation for new trip planning
            const { createConversation } = await import("@/lib/actions/chat-actions")
            const created = await createConversation("New Trip Planning", false)
            newConversation = {
              ...created,
              messages: [],
            }
          }
          
          setConversations([newConversation])
          setCurrentConversationId(newConversation.id)
        } catch (error) {
          console.error("Error auto-creating conversation:", error)
        }
      }
    }
    
    autoCreateChat()
  }, [selectedTripId, conversations.length, currentConversationId, trips])

  // No complex useEffect needed - messages come with segments pre-attached from API!

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages?.map(m => ({
        id: m.id,
        role: m.role as any,
        content: m.content,
        parts: [{ type: "text" as const, text: m.content }],
      })) || [])
    }
  }

  // Handle "Get Lucky" button click - shows plan before creating
  const handleGetLucky = () => {
    if (isLoading) return;
    
    // Generate profile-aware lucky prompt
    const destination = profileData 
      ? getHobbyBasedDestination(profileData.hobbies) 
      : null;
    const budgetLevel = (profileData 
      ? getPreferenceBudgetLevel(profileData.preferences) 
      : 'moderate') as "moderate" | "budget" | "luxury";
    
    const luckyPrompt = generateGetLuckyPrompt(destination, budgetLevel);
    
    // Bot will show the plan and ask for confirmation
    const confirmationMessage = `I have a trip idea for you:

${luckyPrompt}

What would you like to change about this plan, or should I create it as is?`;
    
    sendMessage(confirmationMessage);
    setHasStartedPlanning(true);
  }
  
  // Handle quick action selection
  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
    setHasStartedPlanning(true);
  }

  // Trip selection handler
  const handleTripSelect = async (tripId: string | null) => {
    if (tripId) {
      // Navigate to trip with URL parameter
      window.location.href = `/test/exp?tripId=${tripId}`
    } else {
      // Create a new conversation for a new trip
      try {
        const { createConversation } = await import("@/lib/actions/chat-actions")
        const newConversation = await createConversation("New Conversation", false)
        
        // Update state - add messages field to match Conversation type
        setConversations([{ ...newConversation, messages: [] }, ...conversations])
        setCurrentConversationId(newConversation.id)
        setSelectedTripId(null)
        setMessages([])
        setHasStartedPlanning(false)
        
        // Navigate to new conversation
        window.location.href = `/test/exp`
      } catch (error) {
        console.error("Error creating new conversation:", error)
        // Fallback to simple navigation
        window.location.href = `/test/exp`
      }
    }
  }
  
  // Modal handlers
  const handleChatUpdate = (updated: Conversation) => {
    setConversations(conversations.map(c => 
      c.id === updated.id ? updated : c
    ))
  }

  const handleTripUpdate = async () => {
    // Refetch trips to get updated data
    const response = await fetch(`/api/trips?userId=${userId}`)
    if (response.ok) {
      const updatedTrips = await response.json()
      setTrips(updatedTrips)
    }
  }
  
  // Get the selected trip details
  const selectedTrip = trips.find((t) => t.id === selectedTripId)
  const currentChatName = selectedTrip ? selectedTrip.title : "New Chat"
  
  // Transform selected trip to V0 format
  const transformedTrip: V0Itinerary | null = selectedTrip
    ? transformTripToV0Format(selectedTrip as any)
    : null

  // Calculate trip totals
  const getTripTotals = () => {
    if (!transformedTrip) return { total: 0 }
    
    let total = 0
    
    transformedTrip.segments.forEach((segment) => {
      segment.days.forEach((day) => {
        day.items.forEach((item) => {
          item.reservations.forEach((res) => {
            total += res.cost
          })
        })
      })
    })
    
    return { total }
  }

  const tripTotals = getTripTotals()

  // Refetch trips after adding a place to itinerary
  const refetchTrip = async () => {
    if (!selectedTripId) return;
    
    console.log('🔄 [EXP] Refetching trips after adding place');
    try {
      const response = await fetch(`/api/trips?userId=${userId}`);
      if (response.ok) {
        const updatedTrips = await response.json();
        setTrips(updatedTrips);
        console.log('✅ [EXP] Trips refreshed');
      }
    } catch (error) {
      console.error("❌ [EXP] Error refetching trips:", error);
    }
  };

  // Handler for chatting about the trip
  const handleChatAboutTrip = async (rawTrip: DBTrip, transformedTrip: V0Itinerary) => {
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      // Fetch AI-generated actions
      const response = await fetch('/api/chat/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trip',
          data: {
            title: transformedTrip.title,
            dates: transformedTrip.dates,
            totalCost: tripTotals.total,
            segmentsCount: transformedTrip.segments.length,
            totalReservations: transformedTrip.segments.reduce((acc, s) => 
              acc + (s.days?.reduce((a, d) => 
                a + (d.items?.reduce((b, i) => b + (i.reservations?.length || 0), 0) || 0), 0) || 0), 0),
            description: rawTrip.description
          },
          fullTripContext: rawTrip
        })
      });
      
      const { actions } = await response.json();
      
      // Format dates for editing (YYYY-MM-DD)
      const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Create context card message
      const contextMessage: ChatMessage = {
        id: `context-${Date.now()}`,
        role: 'assistant',
        content: '',
        segments: [{
          type: 'context_card',
          contextType: 'trip',
          data: {
            tripId: rawTrip.id,
            title: transformedTrip.title,
            startDate: formatDateForInput(rawTrip.startDate),
            endDate: formatDateForInput(rawTrip.endDate),
            dates: transformedTrip.dates,
            totalCost: tripTotals.total,
            segmentsCount: transformedTrip.segments.length,
            totalReservations: transformedTrip.segments.reduce((acc, s) => 
              acc + (s.days?.reduce((a, d) => 
                a + (d.items?.reduce((b, i) => b + (i.reservations?.length || 0), 0) || 0), 0) || 0), 0),
            description: rawTrip.description
          },
          actions,
          onSaved: refetchTrip
        }]
      };
      
      setMessages(prev => [...prev, contextMessage]);
    } catch (error) {
      console.error('Error generating trip context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for chatting about a segment
  const handleChatAboutSegment = async (segment: any) => {
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      const response = await fetch('/api/chat/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'segment',
          data: {
            name: segment.name,
            type: segment.type,
            startLocation: segment.startLocation || segment.startDate,
            endLocation: segment.endLocation || segment.endDate,
            startDate: segment.startDate,
            endDate: segment.endDate,
            reservationsCount: segment.days?.reduce((acc: number, d: any) => 
              acc + (d.items?.reduce((a: number, i: any) => a + (i.reservations?.length || 0), 0) || 0), 0) || 0
          },
          fullTripContext: selectedTrip
        })
      });
      
      const { actions } = await response.json();
      
      const contextMessage: ChatMessage = {
        id: `context-${Date.now()}`,
        role: 'assistant',
        content: '',
        segments: [{
          type: 'context_card',
          contextType: 'segment',
          data: {
            segmentId: segment.id,
            name: segment.name,
            type: segment.type,
            startLocation: segment.startLocation || 'N/A',
            endLocation: segment.endLocation || 'N/A',
            startDate: segment.startDate,
            endDate: segment.endDate,
            reservationsCount: segment.days?.reduce((acc: number, d: any) => 
              acc + (d.items?.reduce((a: number, i: any) => a + (i.reservations?.length || 0), 0) || 0), 0) || 0
          },
          actions,
          onSaved: refetchTrip
        }]
      };
      
      setMessages(prev => [...prev, contextMessage]);
    } catch (error) {
      console.error('Error generating segment context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for chatting about an item (reservation)
  const handleChatAboutItem = async (reservation: any, itemTitle: string) => {
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      const response = await fetch('/api/chat/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reservation',
          data: {
            vendor: reservation.vendor,
            name: reservation.vendor,
            category: itemTitle,
            status: reservation.status,
            confirmationNumber: reservation.confirmationNumber,
            cost: reservation.cost,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            text: reservation.text,
            contactPhone: reservation.contactPhone,
            contactEmail: reservation.contactEmail,
            website: reservation.website
          },
          fullTripContext: selectedTrip
        })
      });
      
      const { actions } = await response.json();
      
      const contextMessage: ChatMessage = {
        id: `context-${Date.now()}`,
        role: 'assistant',
        content: '',
        segments: [{
          type: 'context_card',
          contextType: 'reservation',
          data: {
            reservationId: reservation.id,
            vendor: reservation.vendor,
            name: reservation.vendor,
            category: itemTitle,
            status: reservation.status,
            confirmationNumber: reservation.confirmationNumber,
            cost: reservation.cost,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            text: reservation.text
          },
          actions,
          onSaved: refetchTrip
        }]
      };
      
      setMessages(prev => [...prev, contextMessage]);
    } catch (error) {
      console.error('Error generating reservation context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for context action clicks
  const handleContextAction = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handler for editing an item
  const handleEditItem = (reservation: any) => {
    // This will open the reservation detail modal
    setSelectedReservation({
      reservation,
      itemTitle: reservation.vendor,
      itemTime: reservation.startTime || '',
      itemType: 'reservation',
      dayDate: '',
    })
  }

  return (
    <div ref={containerRef} className="bg-slate-50 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-3 text-center text-sm font-medium ${mobileTab === "chat" ? "text-slate-900 border-t-2 border-slate-900" : "text-slate-500"}`}
        >
          <MessageCircle className="h-5 w-5 mx-auto mb-1" />
          Chat
        </button>
        <button
          onClick={() => setMobileTab("itinerary")}
          className={`flex-1 py-3 text-center text-sm font-medium ${mobileTab === "itinerary" ? "text-slate-900 border-t-2 border-slate-900" : "text-slate-500"}`}
        >
          <Calendar className="h-5 w-5 mx-auto mb-1" />
          Itinerary
        </button>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex-1 pb-16">
        {mobileTab === "chat" ? (
          <div className="flex flex-col h-full bg-white">
            <div className="border-b border-slate-200 p-3 bg-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-slate-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{currentChatName}</h2>
                  <p className="text-[10px] text-slate-500">AI Travel Assistant</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!hasStartedPlanning && messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="max-w-2xl mx-auto py-8 px-4">
                    <h2 className="text-3xl font-light text-slate-900 mb-4">
                      Let's plan your perfect trip
                    </h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                      <h3 className="font-medium text-blue-900 mb-3">
                        How it works:
                      </h3>
                      <ol className="space-y-2 text-sm text-blue-800">
                        <li className="flex gap-3">
                          <span className="font-semibold flex-shrink-0">1.</span>
                          <span>Tell me where you want to go - I'll create a trip with smart defaults</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold flex-shrink-0">2.</span>
                          <span>Edit the trip card inline or keep chatting to refine</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold flex-shrink-0">3.</span>
                          <span>Add flights, hotels, activities - in any order you want</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold flex-shrink-0">4.</span>
                          <span>Click cards to edit details or use the itinerary panel on the right</span>
                        </li>
                      </ol>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600 font-medium">
                        Try saying:
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            sendMessage("I want to visit Tokyo for a week");
                            setHasStartedPlanning(true);
                          }}
                          className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm text-slate-700"
                        >
                          "I want to visit Tokyo for a week"
                        </button>
                        <button
                          onClick={() => {
                            sendMessage("Plan a trip to Paris and Rome");
                            setHasStartedPlanning(true);
                          }}
                          className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm text-slate-700"
                        >
                          "Plan a trip to Paris and Rome"
                        </button>
                        <button
                          onClick={() => {
                            sendMessage("I need a beach vacation in June");
                            setHasStartedPlanning(true);
                          }}
                          className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm text-slate-700"
                        >
                          "I need a beach vacation in June"
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-900 border border-slate-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">
                          {msg.role === "assistant" && msg.segments ? (
                            <MessageSegmentsRenderer 
                              segments={msg.segments}
                              tripId={selectedTripId || undefined}
                              onReservationAdded={refetchTrip}
                              onActionClick={handleContextAction}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && <AILoadingAnimation />}
                </>
              )}
            </div>
            <div className="border-t border-slate-200 p-3 bg-white">
              <form onSubmit={(e) => {
                e.preventDefault()
                if (input.trim() && !isLoading) {
                  sendMessage(input)
                  setInput("")
                  if (!hasStartedPlanning) setHasStartedPlanning(true)
                }
              }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your trip..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                  disabled={isLoading}
                  onFocus={() => !hasStartedPlanning && setHasStartedPlanning(true)}
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
        ) : (
          <div className="flex flex-col h-full">
            {/* Trip Selector - Always visible at top */}
            <div className="border-b border-slate-200 p-3 bg-white">
              <TripSelector trips={trips} selectedTripId={selectedTripId} onTripSelect={handleTripSelect} />
            </div>
            
            {!selectedTripId || !transformedTrip ? (
              <ItineraryEmptyState />
            ) : (
              <>
                {transformedTrip && (
                  <>
                    <div className="border-b p-3 bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h1 className="text-sm font-bold">{transformedTrip.title}</h1>
                          <p className="text-[10px] text-muted-foreground">{transformedTrip.dates}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectedTrip && handleChatAboutTrip(selectedTrip, transformedTrip)}
                            className="h-7 w-7 p-0 hover:bg-slate-100"
                            title="Chat about this trip"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <div className="text-right">
                            <div className="text-xs font-semibold">${tripTotals.total.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <TimelineView
                        segments={transformedTrip.segments}
                        heroImage={transformedTrip.heroImage}
                        onSelectReservation={setSelectedReservation}
                        onChatAboutItem={handleChatAboutItem}
                        onChatAboutSegment={handleChatAboutSegment}
                        onEditItem={handleEditItem}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="flex flex-col h-full border-r bg-white overflow-hidden" style={{ width: `${leftPanelWidth}%` }}>
          <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <MessageCircle className="h-5 w-5 text-slate-700 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">Chat:</span>
                
                {/* Chat dropdown */}
                {!selectedTripId || conversations.length === 0 ? (
                  <span className="text-sm text-slate-600">Initial Chat</span>
                ) : (
                  <ChatNameDropdown
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={handleConversationSelect}
                    tripId={selectedTripId}
                    onConversationsChange={(newConversations) => setConversations(newConversations)}
                  />
                )}
              </div>
              
              {/* Edit button for chat (only when conversation exists) */}
              {currentConversationId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-slate-600 hover:text-slate-900"
                  onClick={() => setIsChatEditModalOpen(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 overscroll-contain">
            {!hasStartedPlanning && messages.length === 0 ? (
              selectedTripId && transformedTrip ? (
                // Show context-aware welcome for existing trips
                <ChatContextWelcome
                  tripData={transformedTrip}
                  onSuggestionClick={(prompt) => {
                    sendMessage(prompt)
                    setHasStartedPlanning(true)
                  }}
                />
              ) : (
                // Show generic welcome for new trips
                <div className="space-y-6">
                  <ChatWelcomeMessage
                    userName={profileData?.profile?.firstName || undefined}
                    hobbies={profileData?.hobbies.map(h => h.hobby.name) || []}
                    recentTrips={profileData?.recentTrips || []}
                  />
                  
                  {quickActions.length > 0 && (
                    <ChatQuickActions
                      suggestions={quickActions}
                      onSelect={handleQuickAction}
                    />
                  )}
                  
                  <div className="max-w-2xl mx-auto">
                    <button
                      onClick={handleGetLucky}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Surprise me with a trip idea
                    </button>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      I'll show you a plan that you can adjust before creating
                    </p>
                  </div>
                </div>
              )
            ) : (
              <>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-5 py-3 ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-900 border border-slate-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.role === "assistant" && msg.segments ? (
                            <MessageSegmentsRenderer 
                              segments={msg.segments}
                              tripId={selectedTripId || undefined}
                              onReservationAdded={refetchTrip}
                              onActionClick={handleContextAction}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {isLoading && <AILoadingAnimation />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-slate-200 p-6 bg-white">
            <form onSubmit={(e) => {
              e.preventDefault()
              if (input.trim() && !isLoading) {
                sendMessage(input)
                setInput("")
                if (!hasStartedPlanning) setHasStartedPlanning(true)
              }
            }} className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your trip..."
                className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                disabled={isLoading}
                onFocus={() => !hasStartedPlanning && setHasStartedPlanning(true)}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6"
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

        {/* Right Panel - Itinerary */}
        <div className="flex flex-col h-full bg-white overflow-hidden" style={{ width: `${100 - leftPanelWidth}%` }}>
          {/* Trip Selector - Always visible at top */}
          <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <MapPin className="h-5 w-5 text-slate-700 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">Trip:</span>
                <TripSelector trips={trips} selectedTripId={selectedTripId} onTripSelect={handleTripSelect} compact={true} />
              </div>
              
              {/* Edit button for trip (only when trip is selected) */}
              {selectedTripId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-slate-600 hover:text-slate-900"
                  onClick={() => setIsTripEditModalOpen(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          {!selectedTripId || !transformedTrip ? (
            <ItineraryEmptyState />
          ) : (
            <>
              {transformedTrip && (
                <div className="border-b border-slate-200 p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h1 className="text-sm font-bold">{transformedTrip?.title || "Select a trip"}</h1>
                      <p className="text-[10px] text-muted-foreground">{transformedTrip?.dates || ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectedTrip && handleChatAboutTrip(selectedTrip, transformedTrip)}
                        className="h-7 w-7 p-0 hover:bg-slate-100"
                        title="Chat about this trip"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {transformedTrip && (
                        <div className="text-right">
                          <div className="text-xs font-semibold">${tripTotals.total.toLocaleString()}</div>
                        </div>
                      )}
                      {transformedTrip && (
                        <div className="flex gap-1 border rounded-lg p-0.5">
                          <Button
                            variant={viewMode === "timeline" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("timeline")}
                            title="Timeline View"
                          >
                            <GitBranch className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("table")}
                            title="Table View"
                          >
                            <Table2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={viewMode === "photos" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("photos")}
                            title="Photo Grid View"
                          >
                            <Grid3X3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
                {transformedTrip ? (
                  <>
                    {viewMode === "table" && (
                      <TableView 
                        segments={transformedTrip.segments} 
                        onSelectReservation={setSelectedReservation}
                        onChatAboutItem={handleChatAboutItem}
                        onChatAboutSegment={handleChatAboutSegment}
                        onEditItem={handleEditItem}
                      />
                    )}
                    {viewMode === "timeline" && (
                      <TimelineView
                        segments={transformedTrip.segments}
                        heroImage={transformedTrip.heroImage}
                        onSelectReservation={setSelectedReservation}
                        onChatAboutItem={handleChatAboutItem}
                        onChatAboutSegment={handleChatAboutSegment}
                        onEditItem={handleEditItem}
                      />
                    )}
                    {viewMode === "photos" && (
                      <PhotosView segments={transformedTrip.segments} onSelectReservation={setSelectedReservation} />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Select a trip from the dropdown to view details</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reservation Detail Modal */}
      <ReservationDetailModal
        selectedReservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onConfirm={(id) => {
          // TODO: Implement confirm reservation
          console.log("Confirm reservation:", id)
        }}
        onDelete={(id) => {
          // TODO: Implement delete reservation
          console.log("Delete reservation:", id)
        }}
        onSave={(reservation) => {
          // TODO: Implement save reservation
          console.log("Save reservation:", reservation)
        }}
      />

      {/* Edit Modals */}
      {currentConversationId && (
        <EditChatModal
          isOpen={isChatEditModalOpen}
          onClose={() => setIsChatEditModalOpen(false)}
          conversation={conversations.find(c => c.id === currentConversationId)!}
          onUpdate={handleChatUpdate}
        />
      )}

      {selectedTripId && selectedTrip && (
        <EditTripModal
          isOpen={isTripEditModalOpen}
          onClose={() => setIsTripEditModalOpen(false)}
          trip={selectedTrip}
          onUpdate={handleTripUpdate}
        />
      )}
    </div>
  )
}
