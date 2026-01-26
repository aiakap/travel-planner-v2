"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { UIMessage } from "ai"
import { Button } from "@/components/ui/button"
import { Send, Plus, GripVertical, Table2, GitBranch, Grid3X3, MessageCircle, Calendar, Loader2, MapPin, Sparkles } from "lucide-react"
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
import { SuggestionDetailModal } from "@/components/suggestion-detail-modal"
import { PlaceSuggestion, GooglePlaceData } from "@/lib/types/place-suggestion"

// Helper to extract text content from message parts
function getMessageText(message: UIMessage | undefined): string {
  if (!message) return ""
  return message.parts?.filter((part: any) => part.type === "text").map((part: any) => part.text).join("") || ""
}

// Helper to extract place suggestions from tool invocations
function getPlaceSuggestions(message: UIMessage): PlaceSuggestion[] {
  const suggestions: PlaceSuggestion[] = [];
  
  if (!message.parts) {
    console.log("🔍 [getPlaceSuggestions] No parts in message");
    return suggestions;
  }
  
  console.log("🔍 [getPlaceSuggestions] Analyzing message parts:", {
    totalParts: message.parts.length,
    partTypes: message.parts.map((p: any) => p.type),
  });
  
  message.parts.forEach((part: any, idx: number) => {
    // AI SDK can return tool results in different formats:
    // 1. type: "tool-result" with toolName and result fields
    // 2. type: "tool-{toolName}" with args field
    // 3. Nested result structure
    
    const isSuggestPlaceTool = 
      (part.type === "tool-result" && part.toolName === "suggest_place") ||
      part.type === "tool-suggest_place" ||
      part.toolName === "suggest_place";
    
    console.log(`🔍 [getPlaceSuggestions] Part ${idx}:`, {
      type: part.type,
      toolName: part.toolName,
      hasResult: !!part.result,
      hasArgs: !!part.args,
      hasOutput: !!part.output,
      allKeys: Object.keys(part),
      isSuggestPlaceTool,
    });
    
    // If this looks like a suggest_place tool, log the full part
    if (isSuggestPlaceTool) {
      console.log(`🔬 [getPlaceSuggestions] FULL PART ${idx}:`, JSON.stringify(part, null, 2));
    }
    
    if (isSuggestPlaceTool) {
      // Try to find the result in various locations
      let result = null;
      
      // Option 1: part.output (tool-result format from server)
      if (part.output) {
        result = part.output;
      }
      // Option 2: part.result (alternative tool-result format)
      else if (part.result) {
        result = part.result;
      }
      // Option 3: part.args (tool invocation format with arguments)
      else if (part.args) {
        // The args contain what was passed to the tool, so we need to construct the result
        result = {
          success: true,
          placeName: part.args.placeName,
          category: part.args.category,
          type: part.args.type,
          context: {
            dayNumber: part.args.dayNumber,
            timeOfDay: part.args.timeOfDay,
            specificTime: part.args.specificTime,
            notes: part.args.notes,
          },
          tripId: part.args.tripId,
          segmentId: part.args.segmentId,
        };
      }
      
      console.log("✨ [getPlaceSuggestions] Found suggest_place result:", {
        hasResult: !!result,
        placeName: result?.placeName,
        category: result?.category,
      });
      
      if (result?.placeName) {
        const suggestion: PlaceSuggestion = {
          placeName: result.placeName,
          category: result.category,
          type: result.type,
          context: result.context,
          tripId: result.tripId,
          segmentId: result.segmentId,
        };
        suggestions.push(suggestion);
        console.log("✅ [getPlaceSuggestions] Added suggestion:", suggestion.placeName);
      } else {
        console.error("❌ [getPlaceSuggestions] Invalid suggest_place result:", {
          hasResult: !!result,
          placeName: result?.placeName,
          partKeys: Object.keys(part),
        });
      }
    }
  });
  
  console.log(`🔍 [getPlaceSuggestions] Total suggestions extracted: ${suggestions.length}`);
  if (suggestions.length > 0) {
    console.log("📍 [getPlaceSuggestions] Place names:", suggestions.map(s => s.placeName));
  }
  
  return suggestions;
}

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

interface ExperienceBuilderClientProps {
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

export function ExperienceBuilderClient({
  initialTrips,
  selectedTrip: initialSelectedTrip,
  selectedConversation: initialSelectedConversation,
  initialConversations,
  userId,
  profileData = null,
  quickActions = [],
}: ExperienceBuilderClientProps) {
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
  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    suggestion: PlaceSuggestion;
    tripId: string;
  } | null>(null)

  // Refs
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Chat integration
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, setMessages } = useChat({
    api: "/api/chat" as any,
    body: { conversationId: currentConversationId } as any,
    initialMessages: initialSelectedConversation?.messages.map(m => ({
      id: m.id,
      role: m.role as any,
      content: m.content,
    })) || [],
  } as any)
  
  const isLoading = status === ("in_progress" as any)

  // Watch for trip creation in chat messages
  useEffect(() => {
    // Check if a trip was just created (look for create_trip tool call in recent messages)
    if (messages.length > 0 && !selectedTripId) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.parts) {
        // Find the create_trip tool result
        const tripResult = lastMessage.parts.find((part: any) => 
          part.type === "tool-result" && 
          part.toolName === "create_trip" && 
          part.result?.success === true
        ) as any;

        if (tripResult && tripResult?.result?.tripId) {
          // Trip was created, navigate to it with the trip ID
          setTimeout(() => {
            window.location.href = `/test/experience-builder?tripId=${tripResult.result.tripId}`;
          }, 1500); // Small delay to ensure DB updates are complete
        }
      }
    }
  }, [messages, selectedTripId])

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

  // Monitor chat messages for trip creation/updates
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    console.log("🔍 [Trip Detection] Last message:", lastMessage)
    console.log("🔍 [Trip Detection] Message role:", lastMessage?.role)
    console.log("🔍 [Trip Detection] Message content:", getMessageText(lastMessage))
    console.log("🔍 [Trip Detection] Tool invocations:", (lastMessage as any)?.toolInvocations)
    
    if (lastMessage?.role === "assistant") {
      const content = getMessageText(lastMessage).toLowerCase()
      console.log("🔍 [Trip Detection] Checking for trip creation, content:", content)
      
      // Check for tool invocations first (more reliable)
      const toolInvocations = (lastMessage as any)?.toolInvocations
      if (toolInvocations?.some((call: any) => call.toolName === "create_trip" && call.state === "result")) {
        console.log("✅ [Trip Detection] Trip creation detected via tool invocation!")
        setTimeout(() => refetchTripsAndSelect(), 500) // Small delay for DB sync
        return
      }
      
      // Fallback to text detection with multiple phrases
      const tripCreationPhrases = [
        "created trip",
        "created your trip", 
        "i've created",
        "trip has been created",
        "successfully created"
      ]
      
      if (tripCreationPhrases.some(phrase => content.includes(phrase))) {
        console.log("✅ [Trip Detection] Trip creation detected via text content!")
        setTimeout(() => refetchTripsAndSelect(), 500)
      } else {
        console.log("❌ [Trip Detection] No trip creation detected")
      }
    }
  }, [messages])

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
          window.history.pushState({}, '', `/test/experience-builder?tripId=${newestTrip.id}`)
          console.log("✅ [Refetch] URL updated to:", `/test/experience-builder?tripId=${newestTrip.id}`)
          
          // Fetch conversations for the new trip
          console.log("🔄 [Refetch] Fetching conversations for trip:", newestTrip.id)          let convResponse
          try {
            convResponse = await fetch(`/api/conversations?tripId=${newestTrip.id}`)          } catch (fetchError: any) {            throw fetchError
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

  // Auto-create conversation if trip has none
  useEffect(() => {
    const autoCreateChat = async () => {
      // Only auto-create if:
      // 1. A trip is selected
      // 2. No conversations exist for this trip
      // 3. Not currently creating one
      if (selectedTripId && conversations.length === 0 && !currentConversationId) {
        try {
          const selectedTrip = trips.find(t => t.id === selectedTripId)
          const tripName = selectedTrip?.title || "your trip"
          
          const newConversation = await createTripConversation(
            selectedTripId, 
            `Chat about ${tripName}`
          )
          
          setConversations([newConversation])
          setCurrentConversationId(newConversation.id)
          
          // Add a greeting message from the assistant
          setMessages([{
            id: 'greeting',
            role: 'assistant',
            content: `What can I help with regarding ${tripName}?`,
          } as any])
        } catch (error) {
          console.error("Error auto-creating conversation:", error)
        }
      }
    }
    
    autoCreateChat()
  }, [selectedTripId, conversations.length, currentConversationId, trips])

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
    
    sendMessage({ text: confirmationMessage });
    setHasStartedPlanning(true);
  }
  
  // Handle quick action selection
  const handleQuickAction = (prompt: string) => {
    sendMessage({ text: prompt });
    setHasStartedPlanning(true);
  }

  // Helper function to find place name in text with flexible matching
  const findPlaceInText = (text: string, placeName: string, startFrom: number): number => {
    // Try exact match first
    let index = text.indexOf(placeName, startFrom);
    if (index !== -1) return index;
    
    // Try with "the " prefix (e.g., "the Grand Hotel" when placeName is "Grand Hotel")
    index = text.indexOf(`the ${placeName}`, startFrom);
    if (index !== -1) return index + 4; // Skip "the "
    
    // Try with "The " prefix
    index = text.indexOf(`The ${placeName}`, startFrom);
    if (index !== -1) return index + 4; // Skip "The "
    
    // Try case-insensitive search
    const lowerText = text.toLowerCase();
    const lowerPlace = placeName.toLowerCase();
    index = lowerText.indexOf(lowerPlace, startFrom);
    if (index !== -1) return index;
    
    // Try matching without common prefixes like "Hotel", "The", etc.
    const placeWithoutPrefix = placeName.replace(/^(Hotel|The|Le|La|L'|Restaurant)\s+/i, '');
    if (placeWithoutPrefix !== placeName) {
      index = lowerText.indexOf(placeWithoutPrefix.toLowerCase(), startFrom);
      if (index !== -1) {
        // Find the actual start in the original text (accounting for case)
        const actualText = text.substring(index);
        const match = actualText.match(new RegExp(`\\b${placeWithoutPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
        if (match) {
          return index + match.index!;
        }
      }
    }
    
    return -1;
  };

  // Render text with clickable place suggestions
  const renderTextWithPlaceLinks = (text: string, suggestions: PlaceSuggestion[]) => {
    console.log("🎨 [renderTextWithPlaceLinks] Called with:", {
      textLength: text.length,
      textPreview: text.substring(0, 100) + "...",
      suggestionsCount: suggestions.length,
      placeNames: suggestions.map(s => s.placeName),
    });
    
    if (suggestions.length === 0) {
      console.log("⚠️  [renderTextWithPlaceLinks] No suggestions, rendering plain text");
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    // Split text by place names and create clickable links
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let linkedCount = 0;

    suggestions.forEach((suggestion, idx) => {
      const placeIndex = findPlaceInText(text, suggestion.placeName, lastIndex);
      
      console.log(`🔍 [renderTextWithPlaceLinks] Looking for "${suggestion.placeName}":`, {
        found: placeIndex !== -1,
        position: placeIndex,
        searchStartedAt: lastIndex,
      });
      
      if (placeIndex !== -1) {
        // Add text before the place name
        if (placeIndex > lastIndex) {
          elements.push(
            <span key={`text-${idx}`}>
              {text.substring(lastIndex, placeIndex)}
            </span>
          );
        }

        // Determine the actual text to highlight (might include "the " prefix)
        const actualTextMatch = text.substring(placeIndex, placeIndex + suggestion.placeName.length);

        // Add clickable place name with visual indicator
        elements.push(
          <button
            key={`place-${idx}`}
            onClick={() => {
              console.log("🖱️  [renderTextWithPlaceLinks] Place clicked:", suggestion.placeName);
              if (selectedTripId || suggestion.tripId) {
                setSelectedSuggestion({
                  suggestion,
                  tripId: selectedTripId || suggestion.tripId!,
                });
              } else {
                console.warn("⚠️  [renderTextWithPlaceLinks] No tripId available for suggestion");
              }
            }}
            className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 cursor-pointer transition-colors font-medium inline-flex items-center gap-0.5"
            title="Click to see details and add to itinerary"
          >
            {actualTextMatch}
            <Sparkles className="h-3 w-3 inline" />
          </button>
        );

        linkedCount++;
        lastIndex = placeIndex + suggestion.placeName.length;
      } else {
        console.warn(`❌ [renderTextWithPlaceLinks] Place name "${suggestion.placeName}" NOT FOUND in text`);
        console.warn(`   Text around this area: "${text.substring(Math.max(0, lastIndex - 50), lastIndex + 100)}"`);
      }
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      );
    }

    console.log(`✅ [renderTextWithPlaceLinks] Rendered ${linkedCount}/${suggestions.length} clickable links`);

    return <span className="whitespace-pre-wrap inline">{elements}</span>;
  };

  // Handle adding suggestion to itinerary
  const handleAddToItinerary = async (data: {
    placeName: string;
    placeData: GooglePlaceData | null;
    day: number;
    startTime: string;
    endTime: string;
    cost: number;
    category: string;
    type: string;
  }) => {
    try {
      const { createReservationFromSuggestion } = await import(
        "@/lib/actions/create-reservation"
      );

      await createReservationFromSuggestion({
        tripId: selectedSuggestion!.tripId,
        placeName: data.placeName,
        placeData: data.placeData,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        cost: data.cost,
        category: data.category,
        type: data.type,
      });

      // Refresh the page to show updated itinerary
      window.location.reload();
    } catch (error) {
      console.error("Error adding to itinerary:", error);
      throw error;
    }
  };

  // Trip selection handler
  const handleTripSelect = async (tripId: string | null) => {
    if (tripId) {
      // Navigate to trip with URL parameter
      window.location.href = `/test/experience-builder?tripId=${tripId}`
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
        window.location.href = `/test/experience-builder`
      } catch (error) {
        console.error("Error creating new conversation:", error)
        // Fallback to simple navigation
        window.location.href = `/test/experience-builder`
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

  // Handler for chatting about an item
  const handleChatAboutItem = (reservation: any, itemTitle: string) => {
    const prompt = `Tell me more about ${reservation.vendor} (${itemTitle}). Here are the details: ${reservation.text || 'No additional details'}`
    sendMessage({ text: prompt })
    setHasStartedPlanning(true)
  }

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
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const textContent = getMessageText(msg);
                    const placeSuggestions = getPlaceSuggestions(msg);

                    return (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                            msg.role === "user"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-50 text-slate-900 border border-slate-100"
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed text-sm">
                            {msg.role === "assistant" && placeSuggestions.length > 0
                              ? renderTextWithPlaceLinks(textContent, placeSuggestions)
                              : textContent
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isLoading && <AILoadingAnimation />}
                </>
              )}
            </div>
            <div className="border-t border-slate-200 p-3 bg-white">
              <form onSubmit={(e) => {
                e.preventDefault()
                if (input.trim() && !isLoading) {
                  sendMessage({ text: input })
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
                        <div>
                          <h1 className="text-sm font-bold">{transformedTrip.title}</h1>
                          <p className="text-[10px] text-muted-foreground">{transformedTrip.dates}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold">${tripTotals.total.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <TimelineView
                        segments={transformedTrip.segments}
                        heroImage={transformedTrip.heroImage}
                        onSelectReservation={setSelectedReservation}
                        onChatAboutItem={handleChatAboutItem}
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
        {/* Left Panel - Itinerary */}
        <div className="flex flex-col h-full border-r bg-white overflow-hidden" style={{ width: `${leftPanelWidth}%` }}>
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
                    <div>
                      <h1 className="text-sm font-bold">{transformedTrip?.title || "Select a trip"}</h1>
                      <p className="text-[10px] text-muted-foreground">{transformedTrip?.dates || ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {transformedTrip && (
                        <div className="text-right">
                          <div className="text-xs font-semibold">${tripTotals.total.toLocaleString()}</div>
                        </div>
                      )}
                      {transformedTrip && (
                        <div className="flex gap-1 border rounded-lg p-0.5">
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
                            variant={viewMode === "timeline" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("timeline")}
                            title="Timeline View"
                          >
                            <GitBranch className="h-3 w-3" />
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
                        onEditItem={handleEditItem}
                      />
                    )}
                    {viewMode === "timeline" && (
                      <TimelineView
                        segments={transformedTrip.segments}
                        heroImage={transformedTrip.heroImage}
                        onSelectReservation={setSelectedReservation}
                        onChatAboutItem={handleChatAboutItem}
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

        {/* Resizable Divider */}
        <div
          className="w-2 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex items-center justify-center group transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

        {/* Right Panel - Chat */}
        <div className="flex flex-col h-full bg-white overflow-hidden" style={{ width: `${100 - leftPanelWidth}%` }}>
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
                    sendMessage({ text: prompt })
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
                {messages.map((msg, i) => {
                  const textContent = getMessageText(msg);
                  const placeSuggestions = getPlaceSuggestions(msg);

                  return (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-5 py-3 ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-900 border border-slate-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.role === "assistant" && placeSuggestions.length > 0
                            ? renderTextWithPlaceLinks(textContent, placeSuggestions)
                            : textContent
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && <AILoadingAnimation />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-slate-200 p-6 bg-white">
            <form onSubmit={(e) => {
              e.preventDefault()
              if (input.trim() && !isLoading) {
                sendMessage({ text: input })
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

      {/* Suggestion Detail Modal */}
      {selectedSuggestion && (
        <SuggestionDetailModal
          suggestion={selectedSuggestion.suggestion}
          tripId={selectedSuggestion.tripId}
          onClose={() => setSelectedSuggestion(null)}
          onAddToItinerary={handleAddToItinerary}
        />
      )}
    </div>
  )
}
