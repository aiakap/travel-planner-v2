"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/app/exp/ui/button"
import { Send, Plus, GripVertical, Table2, GitBranch, Grid3X3, MessageCircle, Calendar, Loader2, MapPin } from "lucide-react"
import { ChatWelcomeMessage } from "@/app/exp/components/chat-welcome-message"
import { ChatQuickActions } from "@/app/exp/components/chat-quick-actions"
import { ChatContextWelcome } from "@/app/exp/components/chat-context-welcome"
import { TripSelector } from "@/app/exp/components/trip-selector"
import { ChatNameDropdown } from "@/app/exp/components/chat-name-dropdown"
import { EditChatModal } from "@/app/exp/components/edit-chat-modal"
import { EditTripModal } from "@/app/exp/components/edit-trip-modal"
import { AILoadingAnimation } from "@/app/exp/components/ai-loading-animation"
import { ItineraryEmptyState } from "@/app/exp/components/itinerary-empty-state"
import { TimelineView } from "@/app/exp/components/timeline-view"
import { TableView } from "@/app/exp/components/table-view"
import { PhotosView } from "@/app/exp/components/photos-view"
import { ReservationDetailModal } from "@/app/exp/components/reservation-detail-modal"
import { ReservationTypeSelector } from "@/app/exp/components/reservation-type-selector"
import { ExistingChatDialog } from "@/app/exp/components/existing-chat-dialog"
import { MultiCityTripModal } from "@/app/exp/components/multi-city-trip-modal"
import { TimelineCollapsedView } from "@/app/exp/components/timeline-collapsed-view"
import { transformTripToV0Format } from "@/lib/v0-data-transform"
import type { V0Itinerary } from "@/lib/v0-types"
import { UserPersonalizationData, ChatQuickAction, getHobbyBasedDestination, getPreferenceBudgetLevel } from "@/lib/personalization"
import { generateGetLuckyPrompt } from "@/lib/ai/get-lucky-prompts"
import { renameTripConversation, createTripConversation, createConversation, createConversationWithOptions, createSegmentConversation, createReservationConversation, findEntityConversations } from "@/lib/actions/chat-actions"
import { MessageSegmentsRenderer } from "@/app/exp/components/message-segments-renderer"
import { MessageSegment } from "@/lib/types/place-pipeline"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

// Simple message type with segments
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  segments?: MessageSegment[];
}

// Helper function to format chat timestamp
function formatChatTimestamp(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  
  return `${month}/${day}/${year} - ${hours}:${minutesStr} ${ampm}`;
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
    startTitle: string
    endTitle: string
    order: number
    segmentType: { name: string }
    reservations: Array<{
      id: string
      name: string
      segmentId: string
      confirmationNumber: string | null
      notes: string | null
      startTime: Date | null
      endTime: Date | null
      cost: number | null
      currency: string | null
      location: string | null
      url: string | null
      imageUrl: string | null
      imageIsCustom: boolean
      latitude: number | null
      longitude: number | null
      timeZoneId: string | null
      timeZoneName: string | null
      vendor: string | null
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
  chatType?: 'TRIP' | 'SEGMENT' | 'RESERVATION'
  segmentId?: string | null
  reservationId?: string | null
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
  showModalByDefault?: boolean
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
  showModalByDefault = false,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [existingChatsDialog, setExistingChatsDialog] = useState<{
    open: boolean;
    entityType: 'segment' | 'reservation';
    entityId: string;
    entityName: string;
    existingChats: any[];
  } | null>(null)
  const [isMultiCityModalOpen, setIsMultiCityModalOpen] = useState(false)
  const [isTimelineVisible, setIsTimelineVisible] = useState(true) // Default visible for existing trips
  const [timelineVisibility, setTimelineVisibility] = useState<Record<string, boolean>>({})
  const [pendingPaste, setPendingPaste] = useState<{
    text: string;
    detectedType: string;
    confidence: number;
  } | null>(null)
  
  // Debug mode state
  const [debugMode, setDebugMode] = useState(false)
  const [debugLogs, setDebugLogs] = useState<any[]>([])

  // Refs
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Router for page refresh
  const router = useRouter()

  // Debug mode keyboard shortcut (Cmd+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugMode(prev => {
          const newMode = !prev;
          console.log(`🔍 [DEBUG] Debug mode ${newMode ? 'enabled' : 'disabled'}`);
          if (!newMode) {
            setDebugLogs([]);
          }
          return newMode;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper function to format dates
  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

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

    // Check if this might be a pasted reservation (long text with keywords)
    console.log(`[sendMessage] Text length: ${text.length}, checking for reservation...`);
    
    if (text.length > 200) {
      console.log(`[sendMessage] Text length > 200, calling detection API...`);
      
      try {
        const detection = await fetch('/api/chat/detect-paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        console.log(`[sendMessage] Detection API status: ${detection.status}`);
        
        if (detection.ok) {
          const result = await detection.json();
          
          console.log(`[sendMessage] Detection result:`, result);
          console.log(`[sendMessage] - isReservation: ${result.isReservation}`);
          console.log(`[sendMessage] - suggestedAction: ${result.suggestedAction}`);
          console.log(`[sendMessage] - detectedType: ${result.detectedType}`);
          console.log(`[sendMessage] - confidence: ${result.confidence}`);
          console.log(`[sendMessage] - category: ${result.category}`);
          console.log(`[sendMessage] - handler: ${result.handler}`);
          
          if (result.suggestedAction === "extract") {
            console.log(`[sendMessage] ✅ Auto-extracting: ${result.detectedType} (confidence: ${result.confidence})`);
            await handleReservationPaste(text, result.detectedType);
            return; // Don't send as normal message
          } else if (result.suggestedAction === "ask_user") {
            console.log(`[sendMessage] ⚠️ Medium confidence - asking user to confirm type`);
            setPendingPaste({
              text,
              detectedType: result.detectedType,
              confidence: result.confidence
            });
            return; // Don't send as normal message, wait for user confirmation
          } else {
            console.log(`[sendMessage] ⏭️ Suggested action is "${result.suggestedAction}", continuing as normal message`);
          }
          // If suggestedAction === "ignore", continue with normal message
        } else {
          const errorText = await detection.text();
          console.error(`[sendMessage] Detection API error: ${detection.status}`, errorText);
        }
      } catch (error) {
        console.error('[sendMessage] Detection error:', error);
        // Continue with normal message if detection fails
      }
    } else {
      console.log(`[sendMessage] Text too short (${text.length} chars), skipping detection`);
    }

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
          useExpPrompt: true, // Use exp1 builder prompt
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [Client] API error:", response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();

      // DEBUG: Log received data
      console.log("📨 [Client] Received response:");
      console.log("   Content length:", data.content?.length || 0);
      console.log("   Segments:", data.segments?.length || 0);
      if (data.segments) {
        console.log("   Segment breakdown:");
        const breakdown = data.segments.reduce((acc: any, seg: any) => {
          acc[seg.type] = (acc[seg.type] || 0) + 1;
          return acc;
        }, {});
        console.log("   ", breakdown);
        
        // Log place segments specifically
        const placeSegments = data.segments.filter((s: any) => s.type === "place");
        if (placeSegments.length > 0) {
          console.log("   Place segments:");
          placeSegments.forEach((seg: any, idx: number) => {
            console.log(`     ${idx + 1}. "${seg.display}" (hasData: ${!!seg.placeData})`);
          });
        } else {
          console.log("   ⚠️  NO PLACE SEGMENTS!");
        }
      }

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
      
      // Update conversations array with new messages to keep cache fresh
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [
              ...(conv.messages || []),
              {
                id: userMessage.id,
                role: 'user',
                content: text,
                createdAt: new Date()
              },
              {
                id: assistantMessage.id,
                role: 'assistant',
                content: data.content,
                createdAt: new Date()
              }
            ],
            updatedAt: new Date()
          };
        }
        return conv;
      }));
      
      console.log('[sendMessage] Updated conversations array with new messages for conversation:', currentConversationId);
    } catch (error) {
      console.error("❌ [sendMessage] Error:", error);
      
      // Determine error message based on error type
      let errorContent = "Sorry, I encountered an error processing your request.";
      
      if (error instanceof Error) {
        if (error.message.includes("500")) {
          errorContent = "I encountered an error generating a response. This might be due to an unexpected format issue. Please try rephrasing your message or try again.";
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorContent = "Authentication error. Please refresh the page and try again.";
        } else if (error.message.includes("timeout")) {
          errorContent = "The request timed out. Please try again.";
        }
      }
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: errorContent,
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Update conversations array with error message to keep cache fresh
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [
              ...(conv.messages || []),
              {
                id: userMessage.id,
                role: 'user',
                content: text,
                createdAt: new Date()
              },
              {
                id: errorMessage.id,
                role: 'assistant',
                content: errorContent,
                createdAt: new Date()
              }
            ],
            updatedAt: new Date()
          };
        }
        return conv;
      }));
      
      console.log('[sendMessage] Updated conversations array with error message for conversation:', currentConversationId);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle user confirming the paste type
  const handlePasteTypeConfirm = async (selectedType: string) => {
    if (!pendingPaste) return;
    
    console.log(`[handlePasteTypeConfirm] User confirmed type: ${selectedType}`);
    setPendingPaste(null); // Clear pending state
    await handleReservationPaste(pendingPaste.text, selectedType);
  };

  // Handle user canceling paste extraction
  const handlePasteTypeCancel = () => {
    if (!pendingPaste) return;
    
    console.log(`[handlePasteTypeCancel] User canceled - sending as normal message`);
    const text = pendingPaste.text;
    setPendingPaste(null); // Clear pending state
    
    // Send as normal message
    sendMessage(text);
  };

  // Handle pasted reservation extraction
  const handleReservationPaste = async (text: string, detectedType?: string) => {
    console.log(`[handleReservationPaste] 🚀 CALLED!`);
    console.log(`[handleReservationPaste] - detectedType: ${detectedType}`);
    console.log(`[handleReservationPaste] - text length: ${text.length}`);
    console.log(`[handleReservationPaste] - selectedTripId: ${selectedTripId}`);
    
    if (!selectedTripId) {
      // No trip selected - show error
      console.log(`[handleReservationPaste] ❌ No trip selected, showing error`);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I detected a booking confirmation, but you need to select or create a trip first before I can add reservations to it."
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    console.log(`[handleReservationPaste] ✅ Trip selected, starting extraction...`);
    setIsLoading(true);
    setHasStartedPlanning(true);

    const progressMessageId = `extraction-${Date.now()}`;
    const progressSteps = [
      "Analyzing your booking confirmation...",
      "Extracting reservation details...",
      "Adding to your trip...",
      "Geocoding location...",
      "Fetching images from Google Places...",
      "Creating reservation...",
      "Done! Let's review the details."
    ];

    let currentStep = 0;

    // Helper to update progress
    const updateProgress = (step: number, message: string) => {
      currentStep = step;
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== progressMessageId);
        return [...filtered, {
          id: progressMessageId,
          role: 'assistant',
          content: '',
          segments: [{
            type: 'extraction_progress' as const,
            step,
            totalSteps: progressSteps.length,
            message
          }]
        }];
      });
    };

    try {
      // Step 1: Show initial progress
      updateProgress(1, progressSteps[0]);

      // Step 2: Extract data
      updateProgress(2, progressSteps[1]);
      
      // Map detected type to extraction type
      const typeMapping: Record<string, string> = {
        'Flight': 'flight',
        'Hotel': 'hotel',
        'Car Rental': 'car-rental',
        'Private Driver': 'car-rental', // Transfers use car-rental schema
        'Ride Share': 'car-rental',
        'Taxi': 'car-rental',
        'Train': 'train',
        'Restaurant': 'restaurant',
        'Event': 'event',
        'Activity': 'event',
        'Cruise': 'cruise'
      };
      
      const extractionType = detectedType ? typeMapping[detectedType] || 'generic' : undefined;
      console.log(`[handleReservationPaste] Detected type: ${detectedType}, Extraction type: ${extractionType}`);
      
      const extractionResponse = await fetch('/api/admin/email-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailText: text,
          detectedType: extractionType // Pass the detected type to skip pattern matching
        })
      });

      if (!extractionResponse.ok) {
        throw new Error('Extraction failed');
      }

      const extractionResult = await extractionResponse.json();
      const { type, data } = extractionResult;

      console.log(`[handleReservationPaste] Extracted ${type}:`, data);

      // Step 3: Add to trip
      updateProgress(3, `Found a ${type} booking! Adding to your trip...`);

      let result: any;

      // Import the appropriate action dynamically
      if (type === 'hotel') {
        const { addHotelsToTrip } = await import('@/lib/actions/add-hotels-to-trip');
        result = await addHotelsToTrip({
          tripId: selectedTripId,
          segmentId: null,
          hotelData: data,
          options: {
            autoMatch: true,
            minScore: 60,
            createSuggestedSegments: true
          }
        });
      } else if (type === 'flight') {
        const { addFlightsToTrip } = await import('@/lib/actions/add-flights-to-trip');
        // addFlightsToTrip uses positional parameters, not an object
        result = await addFlightsToTrip(
          selectedTripId,
          null, // segmentId
          data, // flightData
          {
            autoCluster: false,
            createSuggestedSegments: true
          }
        );
      } else if (type === 'car-rental') {
        const { addCarRentalToTrip } = await import('@/lib/actions/add-car-rentals-to-trip');
        result = await addCarRentalToTrip({
          tripId: selectedTripId,
          segmentId: null,
          carRentalData: data,
          options: {
            autoMatch: true,
            minScore: 60,
            createSuggestedSegments: true
          }
        });
      } else if (type === 'restaurant') {
        const { addRestaurantsToTrip } = await import('@/lib/actions/add-restaurants-to-trip');
        result = await addRestaurantsToTrip({
          tripId: selectedTripId,
          segmentId: null,
          restaurantData: data,
          options: {
            autoMatch: true,
            minScore: 60,
            createSuggestedSegments: true
          }
        });
      } else if (type === 'event') {
        const { addEventsToTrip } = await import('@/lib/actions/add-events-to-trip');
        result = await addEventsToTrip({
          tripId: selectedTripId,
          segmentId: null,
          eventData: data,
          options: {
            autoMatch: true,
            minScore: 60,
            createSuggestedSegments: true
          }
        });
      } else if (type === 'generic') {
        const { addGenericReservationToTrip } = await import('@/lib/actions/add-generic-reservation-to-trip');
        result = await addGenericReservationToTrip({
          tripId: selectedTripId,
          segmentId: null,
          reservationData: data,
          options: {
            autoMatch: true,
            minScore: 60,
            createSuggestedSegments: true
          }
        });
      } else {
        throw new Error(`Unsupported reservation type: ${type}`);
      }

      // Step 6: Complete
      updateProgress(6, progressSteps[5]);

      // Refetch trips to get updated data
      await refetchTrip();

      // Remove progress message
      setMessages(prev => prev.filter(m => m.id !== progressMessageId));

      // Add success message
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `I've successfully added your ${type} booking to your trip! Let me show you the details.`
      };
      setMessages(prev => [...prev, successMessage]);

      // Get the first reservation ID
      const reservationId = result.reservationIds?.[0];

      if (reservationId) {
        // Fetch the full reservation from the updated trip
        const updatedTrip = trips.find(t => t.id === selectedTripId);
        const reservation = updatedTrip?.segments
          .flatMap(s => s.reservations)
          .find(r => r.id === reservationId);

        if (reservation) {
          // Create a conversation for this reservation
          await createNewReservationChat(reservation, reservation.name);
        }
      }

    } catch (error: any) {
      console.error('[handleReservationPaste] Error:', error);
      
      // Remove progress message
      setMessages(prev => prev.filter(m => m.id !== progressMessageId));
      
      // Show error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I had trouble extracting that booking. Could you try pasting it again, or tell me about it in your own words?"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
          window.history.pushState({}, '', `/exp?tripId=${newestTrip.id}`)
          console.log("✅ [Refetch] URL updated to:", `/exp?tripId=${newestTrip.id}`)
          
          // Fetch conversations for the new trip
          console.log("🔄 [Refetch] Fetching conversations for trip:", newestTrip.id)
          let convResponse
          try {
            convResponse = await fetch(`/api/conversations?tripId=${newestTrip.id}`)
          } catch (fetchError: any) {
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
            
            newConversation = await createTripConversation(selectedTripId)
            
            // Add a greeting message from the assistant
            setMessages([{
              id: 'greeting',
              role: 'assistant',
              content: `What can I help with regarding ${tripName}?`,
            } as any])
          } else {
            // Create standalone conversation for new trip planning
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
  const handleConversationSelect = (conversationId: string, conversationOverride?: Conversation) => {
    console.log('[handleConversationSelect] Selecting conversation:', conversationId);
    
    const conversation = conversationOverride || conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      console.log('[handleConversationSelect] Conversation found:', {
        id: conversation.id,
        chatType: conversation.chatType,
        messageCount: conversation.messages?.length || 0,
        title: conversation.title
      });
      
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages?.map(m => ({
        id: m.id,
        role: m.role as any,
        content: m.content,
        parts: [{ type: "text" as const, text: m.content }],
      })) || []);
    } else {
      console.warn('[handleConversationSelect] Conversation not found:', conversationId);
      console.warn('[handleConversationSelect] Available conversations:', conversations.map(c => ({ id: c.id, title: c.title })));
    }
  }

  // Handle "Get Lucky" button click - auto-generates complete trip
  const handleGetLucky = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      const timestamp = formatChatTimestamp(new Date());
      
      // 1. Create trip first with placeholder name
      const placeholderTripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Surprise Journey',
          description: 'Generating your personalized trip...',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'DRAFT'
        })
      });
      
      if (!placeholderTripResponse.ok) {
        throw new Error('Failed to create placeholder trip');
      }
      
      const trip = await placeholderTripResponse.json();
      const tripId = trip.id;
      
      console.log(`✅ Created placeholder trip: ${tripId}`);
      
      // 2. Add to trips list and switch to it (right pane shows immediately)
      setTrips(prev => [trip, ...prev]);
      setSelectedTripId(tripId);
      
      // 3. Create conversation linked to the trip
      const conversation = await createConversationWithOptions({
        title: `Surprise Journey - ${timestamp}`,
        userId,
        chatType: 'TRIP',
        tripId: tripId,
      });
      
      console.log(`✅ Created Surprise Journey conversation: ${conversation.id}`);
      
      // 4. Add to conversations and switch to it
      const fullConversation = { 
        ...conversation, 
        messages: [], 
        chatType: 'TRIP' as const,
        tripId: tripId
      };
      setConversations(prev => [fullConversation, ...prev]);
      setCurrentConversationId(conversation.id);
      
      // 5. Create streaming loader message
      const loaderId = `get-lucky-${Date.now()}`;
      const loaderMessage: ChatMessage = {
        id: loaderId,
        role: 'assistant',
        content: '',
        segments: [{
          type: 'get_lucky_loader',
          loaderId,
          stages: [],
        }],
      };
      
      setMessages([loaderMessage]);
      
      // 6. Get profile preferences
      const destination = profileData 
        ? getHobbyBasedDestination(profileData.hobbies) 
        : null;
      const budgetLevel = (profileData 
        ? getPreferenceBudgetLevel(profileData.preferences) 
        : 'moderate') as "moderate" | "budget" | "luxury";
      const activityLevel = profileData?.preferences?.find(
        (p: any) => p.preferenceType?.name === 'activity_level'
      )?.option?.label || 'Moderate';
      
      // 7. Start SSE stream (pass conversationId and tripId)
      const response = await fetch('/api/get-lucky/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData,
          destination,
          budgetLevel,
          activityLevel,
          conversationId: conversation.id,
          tripId: tripId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedTripId: string | null = tripId; // Trip already exists
      let tripName: string | null = null;
      
      // Process SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            // Debug logging
            if (debugMode) {
              const logEntry = {
                timestamp: new Date().toISOString(),
                type: data.type,
                stage: data.stage,
                message: data.message,
                data: data.data,
              };
              setDebugLogs(prev => [...prev, logEntry]);
              console.log('🔍 [DEBUG:SSE]', logEntry);
            }
            
            // Handle trip_updated event
            if (data.type === 'trip_updated') {
              tripName = data.data.tripName;
              
              console.log(`✅ Trip updated: ${generatedTripId} - ${tripName}`);
              
              // Update conversation title with AI-generated trip name
              setConversations(prev => prev.map(c => 
                c.id === conversation.id 
                  ? { ...c, title: `${tripName} - ${timestamp}` }
                  : c
              ));
              
              // Refetch trip to get updated details (name, description, dates)
              try {
                const tripResponse = await fetch(`/api/trips/${generatedTripId}`);
                if (tripResponse.ok) {
                  const updatedTrip = await tripResponse.json();
                  
                  // Update trips list - this will trigger re-render of right pane
                  setTrips(prev => {
                    const filtered = prev.filter(t => t.id !== generatedTripId);
                    return [updatedTrip, ...filtered];
                  });
                  
                  console.log(`✅ Trip updated in right pane with new name`);
                }
              } catch (error) {
                console.error('❌ Failed to fetch updated trip details:', error);
              }
              
              continue; // Don't process as regular stage
            }
            
            // Helper function to refetch trip and update right pane
            const refetchTrip = async () => {
              if (!generatedTripId) return;
              
              try {
                const tripResponse = await fetch(`/api/trips/${generatedTripId}`);
                if (tripResponse.ok) {
                  const updatedTrip = await tripResponse.json();
                  setTrips(prev => {
                    const filtered = prev.filter(t => t.id !== generatedTripId);
                    return [updatedTrip, ...filtered];
                  });
                  console.log(`🔄 Trip refreshed in right pane`);
                }
              } catch (error) {
                console.error('❌ Failed to refetch trip:', error);
              }
            };
            
            // Update loader stages based on event
            setMessages(prev => {
              const updated = [...prev];
              const loaderIdx = updated.findIndex(m => m.id === loaderId);
              
              if (loaderIdx >= 0 && updated[loaderIdx].segments?.[0]?.type === 'get_lucky_loader') {
                const loaderSegment = updated[loaderIdx].segments![0];
                const stages = [...loaderSegment.stages];
                
                if (data.type === 'stage') {
                  // Add or update stage
                  const existingIdx = stages.findIndex(s => s.id === data.stage);
                  if (existingIdx >= 0) {
                    stages[existingIdx] = {
                      ...stages[existingIdx],
                      status: 'loading',
                      message: data.message,
                    };
                  } else {
                    stages.push({
                      id: data.stage || 'unknown',
                      status: 'loading',
                      message: data.message || 'Processing...',
                      items: [],
                    });
                  }
                  
                  // Refetch trip when starting a new stage (segments/reservations may have been added)
                  if (data.stage === 'route' || data.stage === 'hotels' || data.stage === 'restaurants' || data.stage === 'activities') {
                    refetchTrip();
                  }
                } else if (data.type === 'item') {
                  // Add item to current stage
                  const stageIdx = stages.findIndex(s => s.id === data.stage);
                  if (stageIdx >= 0) {
                    if (!stages[stageIdx].items) {
                      stages[stageIdx].items = [];
                    }
                    stages[stageIdx].items!.push({
                      text: data.message || '',
                      data: data.data,
                    });
                    
                    // Refetch trip periodically as items are added (every 3 items to avoid too many requests)
                    if (stages[stageIdx].items!.length % 3 === 0) {
                      refetchTrip();
                    }
                  }
                } else if (data.type === 'complete') {
                  // Mark last stage as complete
                  if (stages.length > 0) {
                    stages[stages.length - 1].status = 'complete';
                  }
                  // Add completion stage
                  stages.push({
                    id: 'complete',
                    status: 'complete',
                    message: data.message || 'Your trip is ready!',
                    items: [],
                  });
                  
                  // Final refetch to ensure everything is up to date
                  refetchTrip();
                } else if (data.type === 'error') {
                  // Mark current stage as error
                  if (stages.length > 0) {
                    stages[stages.length - 1].status = 'error';
                  }
                }
                
                updated[loaderIdx] = {
                  ...updated[loaderIdx],
                  segments: [{
                    ...loaderSegment,
                    stages,
                  }],
                };
              }
              
              return updated;
            });
          }
        }
      }
      
      // Stay on /exp page - trip is already visible in right pane
      console.log(`✅ Surprise Journey complete! Trip ${generatedTripId} is visible`);
      
    } catch (error) {
      console.error('❌ Get Lucky failed:', error);
      // Show error in loader if we have messages
      setMessages(prev => {
        if (prev.length === 0) return prev;
        
        const updated = [...prev];
        const loaderIdx = updated.findIndex(m => m.segments?.[0]?.type === 'get_lucky_loader');
        
        if (loaderIdx >= 0 && updated[loaderIdx].segments?.[0]?.type === 'get_lucky_loader') {
          const loaderSegment = updated[loaderIdx].segments![0];
          updated[loaderIdx] = {
            ...updated[loaderIdx],
            segments: [{
              ...loaderSegment,
              stages: [
                ...loaderSegment.stages,
                {
                  id: 'error',
                  status: 'error' as const,
                  message: 'Generation failed. Please try again.',
                  items: [],
                },
              ],
            }],
          };
        }
        
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
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
      window.location.href = `/exp?tripId=${tripId}`
    } else {
      // Open multi-city modal for new trip
      setIsMultiCityModalOpen(true)
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
    
    console.log('🔄 [EXP] Refetching trips after update');
    try {
      const response = await fetch(`/api/trips?userId=${userId}`);
      if (response.ok) {
        const updatedTrips = await response.json();
        setTrips(updatedTrips);
        
        // selectedTrip will automatically update since it's computed from trips
        console.log('✅ [EXP] Trips refreshed (selectedTrip will auto-update)');
      }
    } catch (error) {
      console.error("❌ [EXP] Error refetching trips:", error);
    }
  };

  // Helper function to append context card for any conversation type
  const appendContextCardForConversation = async (conversation: Conversation) => {
    const chatType = conversation.chatType;
    
    try {
      // Remove loading message if it exists
      setMessages(prev => prev.filter(m => m.id !== `loading-${conversation.id}`));
      
      if (chatType === 'SEGMENT' && conversation.segmentId) {
        // Find the segment from selectedTrip
        const dbSegment = selectedTrip?.segments.find(s => s.id === conversation.segmentId);
        if (!dbSegment) {
          console.error('Segment not found:', conversation.segmentId);
          return;
        }
        
        // Transform to V0 format for display
        const transformedTrip = selectedTrip ? transformTripToV0Format(selectedTrip) : null;
        const v0Segment = transformedTrip?.segments.find(s => s.dbId === conversation.segmentId);
        if (!v0Segment) return;
        
        // Generate context card
        const response = await fetch('/api/chat/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'segment',
            data: {
              name: v0Segment.name,
              type: v0Segment.type,
              startLocation: v0Segment.startLocation || v0Segment.startDate,
              endLocation: v0Segment.endLocation || v0Segment.endDate,
              startDate: v0Segment.startDate,
              endDate: v0Segment.endDate,
              reservationsCount: v0Segment.days?.reduce((acc: number, d: any) => 
                acc + (d.items?.reduce((a: number, i: any) => a + (i.reservations?.length || 0), 0) || 0), 0) || 0
            },
            fullTripContext: selectedTrip
          })
        });
        
        const { actions } = await response.json();
        
        const greetingMessage: ChatMessage = {
          id: `greeting-${Date.now()}`,
          role: 'assistant',
          content: `I'm here to help with the ${v0Segment.name} segment of your ${selectedTrip?.title || 'trip'}. I can help you adjust dates, add reservations, or make other changes. What would you like to do?`,
        };
        
        const contextMessage: ChatMessage = {
          id: `context-${Date.now()}`,
          role: 'assistant',
          content: '',
          segments: [{
            type: 'context_card',
            contextType: 'segment',
            data: {
              segmentId: conversation.segmentId,
              name: v0Segment.name,
              type: v0Segment.type,
              startLocation: v0Segment.startLocation || 'N/A',
              endLocation: v0Segment.endLocation || 'N/A',
              startDate: v0Segment.startDate,
              endDate: v0Segment.endDate,
              reservationsCount: v0Segment.days?.reduce((acc: number, d: any) => 
                acc + (d.items?.reduce((a: number, i: any) => a + (i.reservations?.length || 0), 0) || 0), 0) || 0
            },
            actions,
            onSaved: refetchTrip
          }]
        };
        
        setMessages(prev => [...prev, greetingMessage, contextMessage]);
        
      } else if (chatType === 'RESERVATION' && conversation.reservationId) {
        // Find the reservation from selectedTrip
        const dbReservation = selectedTrip?.segments
          .flatMap(s => s.reservations)
          .find(r => r.id === conversation.reservationId);
        
        if (!dbReservation) {
          console.error('Reservation not found:', conversation.reservationId);
          return;
        }
        
        // Transform to V0 format
        const transformedTrip = selectedTrip ? transformTripToV0Format(selectedTrip) : null;
        let v0Reservation: any = null;
        let itemTitle = '';
        
        // Find reservation in V0 format
        for (const segment of transformedTrip?.segments || []) {
          for (const day of segment.days || []) {
            for (const item of day.items || []) {
              const res = item.reservations.find(r => r.id === conversation.reservationId);
              if (res) {
                v0Reservation = res;
                itemTitle = item.title;
                break;
              }
            }
            if (v0Reservation) break;
          }
          if (v0Reservation) break;
        }
        
        if (!v0Reservation) return;
        
        // Generate context card
        const response = await fetch('/api/chat/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reservation',
            data: {
              vendor: v0Reservation.vendor,
              name: v0Reservation.vendor,
              category: itemTitle,
              status: v0Reservation.status,
              confirmationNumber: v0Reservation.confirmationNumber,
              cost: v0Reservation.cost,
              startTime: dbReservation?.startTime instanceof Date 
                ? dbReservation.startTime.toISOString() 
                : dbReservation?.startTime,
              endTime: dbReservation?.endTime instanceof Date 
                ? dbReservation.endTime.toISOString() 
                : dbReservation?.endTime,
              text: v0Reservation.text,
              contactPhone: v0Reservation.contactPhone,
              contactEmail: v0Reservation.contactEmail,
              website: v0Reservation.website
            },
            fullTripContext: selectedTrip
          })
        });
        
        const { actions } = await response.json();
        
        const greetingMessage: ChatMessage = {
          id: `greeting-${Date.now()}`,
          role: 'assistant',
          content: `I'm here to help with your ${v0Reservation.name || itemTitle} reservation. I can help you update details, change dates, add a confirmation number, or answer any questions. What would you like to do?`,
        };
        
        const contextMessage: ChatMessage = {
          id: `context-${Date.now()}`,
          role: 'assistant',
          content: '',
          segments: [{
            type: 'context_card',
            contextType: 'reservation',
            data: {
              reservationId: v0Reservation.id,
              vendor: v0Reservation.vendor,
              name: v0Reservation.vendor,
              category: itemTitle,
              status: v0Reservation.status,
              confirmationNumber: v0Reservation.confirmationNumber,
              cost: v0Reservation.cost,
              startTime: dbReservation?.startTime instanceof Date 
                ? dbReservation.startTime.toISOString() 
                : dbReservation?.startTime,
              endTime: dbReservation?.endTime instanceof Date 
                ? dbReservation.endTime.toISOString() 
                : dbReservation?.endTime,
              text: v0Reservation.text
            },
            actions,
            onSaved: refetchTrip
          }]
        };
        
        setMessages(prev => [...prev, greetingMessage, contextMessage]);
        
      } else if (chatType === 'TRIP') {
        // Find the trip and transform
        const rawTrip = selectedTrip;
        if (!rawTrip) return;
        
        const transformedTrip = transformTripToV0Format(rawTrip);
        
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
        const formatDateForInput = (date: Date | string) => {
          if (typeof date === 'string') {
            return date.split('T')[0];
          }
          return date.toISOString().split('T')[0];
        };
        
        const totalReservations = transformedTrip.segments.reduce((acc, s) => 
          acc + (s.days?.reduce((a, d) => 
            a + (d.items?.reduce((b, i) => b + (i.reservations?.length || 0), 0) || 0), 0) || 0), 0);
        
        const greetingMessage: ChatMessage = {
          id: `greeting-${Date.now()}`,
          role: 'assistant',
          content: `I'm here to help with your ${transformedTrip.title} trip. I can see you have ${transformedTrip.segments.length} segment${transformedTrip.segments.length !== 1 ? 's' : ''} and ${totalReservations} reservation${totalReservations !== 1 ? 's' : ''} planned. What would you like to work on?`,
        };
        
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
              totalReservations: totalReservations,
              description: rawTrip.description
            },
            actions,
            onSaved: refetchTrip
          }]
        };
        
        setMessages(prev => [...prev, greetingMessage, contextMessage]);
      }
    } catch (error) {
      console.error('Error appending context card:', error);
      // Remove loading message and show error
      setMessages(prev => prev.filter(m => m.id !== `loading-${conversation.id}`));
      toast.error('Failed to load chat context');
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
      const formatDateForInput = (date: Date | string) => {
        if (typeof date === 'string') {
          return date.split('T')[0];
        }
        return date.toISOString().split('T')[0];
      };
      
      // Calculate reservation count
      const totalReservations = transformedTrip.segments.reduce((acc, s) => 
        acc + (s.days?.reduce((a, d) => 
          a + (d.items?.reduce((b, i) => b + (i.reservations?.length || 0), 0) || 0), 0) || 0), 0);
      
      // Create initial greeting message
      const greetingMessage: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: `I'm here to help with your ${transformedTrip.title} trip. I can see you have ${transformedTrip.segments.length} segment${transformedTrip.segments.length !== 1 ? 's' : ''} and ${totalReservations} reservation${totalReservations !== 1 ? 's' : ''} planned. What would you like to work on?`,
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
            totalReservations: totalReservations,
            description: rawTrip.description
          },
          actions,
          onSaved: refetchTrip
        }]
      };
      
      setMessages(prev => [...prev, greetingMessage, contextMessage]);
    } catch (error) {
      console.error('Error generating trip context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for chatting about a segment
  const handleChatAboutSegment = async (segment: any) => {
    // Use dbId (string UUID) instead of id (numeric index)
    const segmentDbId = segment.dbId || segment.id;
    
    // 1. Check for existing chats
    const existing = await findEntityConversations('SEGMENT', segmentDbId);
    
    // 2. If existing chats found, show dialog
    if (existing.length > 0) {
      setExistingChatsDialog({
        open: true,
        entityType: 'segment',
        entityId: segmentDbId,
        entityName: segment.name,
        existingChats: existing,
      });
      return;
    }
    
    // 3. Create new chat
    await createNewSegmentChat(segment);
  };

  // Handler for chatting about an item (reservation)
  const handleChatAboutItem = async (reservation: any, itemTitle: string) => {
    // 1. Check for existing chats
    const existing = await findEntityConversations('RESERVATION', reservation.id);
    
    // 2. If existing chats found, show dialog
    if (existing.length > 0) {
      setExistingChatsDialog({
        open: true,
        entityType: 'reservation',
        entityId: reservation.id,
        entityName: reservation.name || itemTitle,
        existingChats: existing,
      });
      return;
    }
    
    // 3. Create new chat
    await createNewReservationChat(reservation, itemTitle);
  };

  // Helper function to create a new segment chat
  const createNewSegmentChat = async (segment: any) => {
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      // Use dbId (string UUID) instead of id (numeric index)
      const segmentDbId = segment.dbId || segment.id;
      
      console.log('[createNewSegmentChat] Creating conversation for segment:', segmentDbId);
      
      // 1. Create the conversation in DB immediately
      const conversation = await createSegmentConversation(
        segmentDbId,
        segment.name,
        selectedTripId!
      );
      
      console.log('[createNewSegmentChat] Conversation created:', conversation.id);
      
      // 2. Add to state and switch to it
      const fullConversation = { 
        ...conversation, 
        messages: [], 
        chatType: 'SEGMENT' as const,
        segmentId: conversation.segmentId
      };
      setConversations(prev => [fullConversation, ...prev]);
      setCurrentConversationId(conversation.id);
      
      // 3. Show loading message immediately
      setMessages([{
        id: `loading-${conversation.id}`,
        role: 'assistant' as const,
        content: '',
        segments: [{
          type: 'chat_loading' as const,
          conversationId: conversation.id
        }]
      }]);
      
      // 4. Asynchronously fetch context and render card (removes loading message inside)
      await appendContextCardForConversation(fullConversation);
      
    } catch (error) {
      console.error('Error creating segment chat:', error);
      toast.error('Failed to create segment chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create a new reservation chat
  const createNewReservationChat = async (reservation: any, itemTitle: string) => {
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      // Find the actual DB reservation from selectedTrip
      const dbReservation = selectedTrip?.segments
        .flatMap(s => s.reservations)
        .find(r => r.id === reservation.id);
      
      if (!dbReservation) {
        console.error("Could not find database reservation with ID:", reservation.id);
        toast.error('Reservation not found');
        return;
      }
      
      console.log('[createNewReservationChat] Creating conversation for reservation:', reservation.id);
      
      // 1. Create the conversation in DB immediately
      const conversation = await createReservationConversation(
        reservation.id,
        reservation.name || itemTitle,
        dbReservation.segmentId,
        selectedTripId!
      );
      
      console.log('[createNewReservationChat] Conversation created:', conversation.id);
      
      // 2. Add to state and switch to it
      const fullConversation = { 
        ...conversation, 
        messages: [], 
        chatType: 'RESERVATION' as const, 
        reservationId: reservation.id, 
        segmentId: dbReservation.segmentId 
      };
      setConversations(prev => [fullConversation, ...prev]);
      setCurrentConversationId(conversation.id);
      
      // 3. Show loading message immediately
      setMessages([{
        id: `loading-${conversation.id}`,
        role: 'assistant' as const,
        content: '',
        segments: [{
          type: 'chat_loading' as const,
          conversationId: conversation.id
        }]
      }]);
      
      // 4. Asynchronously fetch context and render card (removes loading message inside)
      await appendContextCardForConversation(fullConversation);
      
    } catch (error) {
      console.error('Error creating reservation chat:', error);
      toast.error('Failed to create reservation chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create a new trip chat
  const createNewTripChat = async () => {
    if (!selectedTripId) {
      console.error('No trip selected');
      toast.error('Please select a trip first');
      return;
    }
    
    setIsLoading(true);
    setHasStartedPlanning(true);
    
    try {
      console.log('[createNewTripChat] Creating conversation for trip:', selectedTripId);
      
      // 1. Create the conversation in DB immediately
      const conversation = await createTripConversation(selectedTripId);
      
      console.log('[createNewTripChat] Conversation created:', conversation.id);
      
      // 2. Add to state and switch to it
      const fullConversation = { 
        ...conversation, 
        messages: [], 
        chatType: 'TRIP' as const,
        tripId: selectedTripId
      };
      setConversations(prev => [fullConversation, ...prev]);
      setCurrentConversationId(conversation.id);
      
      // 3. Show loading message immediately
      setMessages([{
        id: `loading-${conversation.id}`,
        role: 'assistant' as const,
        content: '',
        segments: [{
          type: 'chat_loading' as const,
          conversationId: conversation.id
        }]
      }]);
      
      // 4. Asynchronously fetch context and render card (removes loading message inside)
      await appendContextCardForConversation(fullConversation);
      
    } catch (error) {
      console.error('Error creating trip chat:', error);
      toast.error('Failed to create trip chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for opening an existing chat
  const handleOpenExistingChat = async (conversationId: string) => {
    setIsLoading(true);
    setExistingChatsDialog(null);
    
    try {
      // Find conversation in local state first
      const localConv = conversations.find(c => c.id === conversationId);
      let fullConversation: Conversation;
      
      if (localConv && localConv.messages && localConv.messages.length > 0) {
        // Use cached messages
        fullConversation = localConv;
        console.log('[handleOpenExistingChat] Using cached conversation with', localConv.messages.length, 'messages');
      } else {
        // Fetch full conversation with messages from server
        console.log('[handleOpenExistingChat] Fetching conversation from API:', conversationId);
        const response = await fetch(`/api/conversations/${conversationId}`);
        fullConversation = await response.json() as Conversation;
        console.log('[handleOpenExistingChat] Loaded conversation with', fullConversation.messages?.length || 0, 'messages');
        
        // Update conversations array with full data
        setConversations(prev => 
          prev.map(c => c.id === conversationId ? fullConversation : c)
        );
      }
      
      // 1. Switch to conversation and load existing messages
      setCurrentConversationId(conversationId);
      setMessages(fullConversation.messages?.map((m: any) => ({
        id: m.id,
        role: m.role as any,
        content: m.content,
      })) || []);
      
      // 2. Add loading message
      setMessages(prev => [...prev, {
        id: `loading-${conversationId}`,
        role: 'assistant' as const,
        content: '',
        segments: [{
          type: 'chat_loading' as const,
          conversationId: conversationId
        }]
      }]);
      
      // 3. Asynchronously append context card (removes loading message inside)
      console.log('[handleOpenExistingChat] Appending context card for chatType:', fullConversation.chatType);
      await appendContextCardForConversation(fullConversation);
      
    } catch (error) {
      console.error('[handleOpenExistingChat] Error loading existing chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for creating a new chat from dialog
  const handleCreateNewFromDialog = async () => {
    if (!existingChatsDialog) return;
    
    const { entityType, entityId } = existingChatsDialog;
    setExistingChatsDialog(null);
    
    if (entityType === 'segment') {
      const segment = selectedTrip?.segments.find(s => s.id === entityId);
      if (segment) {
        // Transform segment to V0 format for createNewSegmentChat
        const transformedTrip = selectedTrip ? transformTripToV0Format(selectedTrip) : null;
        // Use dbId (UUID) instead of id (numeric index) for consistent ID handling
        const v0Segment = transformedTrip?.segments.find(s => s.dbId === entityId);
        if (v0Segment) await createNewSegmentChat(v0Segment);
      }
    } else {
      const reservation = selectedTrip?.segments
        .flatMap(s => s.reservations)
        .find(r => r.id === entityId);
      if (reservation) await createNewReservationChat(reservation, reservation.name);
    }
  };

  // Handler for context action clicks
  const handleContextAction = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handler for multi-city trip modal submission
  const handleMultiCitySubmit = async (data: {
    title?: string;
    startDate: Date;
    cities: Array<{ city: string; durationDays: number }>;
  }) => {
    try {
      console.log('[Journey] Sending request:', {
        cities: data.cities,
        startDate: data.startDate.toISOString(),
        conversationId: currentConversationId,
      });

      const response = await fetch('/api/trip/create-multi-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          conversationId: currentConversationId,
        }),
      });

      console.log('[Journey] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Journey] API error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        throw new Error(errorData.error || 'Failed to create journey');
      }

      const result = await response.json();
      console.log('[Journey] Trip created:', result.tripId);

      // Finalize trip (update status to PLANNING and trigger image generation)
      try {
        const { finalizeTrip } = await import('@/app/trip/new/actions/finalize-trip');
        await finalizeTrip(result.tripId);
        console.log('[Journey] Trip finalized');
      } catch (error) {
        console.error('[Journey] Failed to finalize trip:', error);
        // Continue anyway - trip was created successfully
      }

      // Navigate to the trip
      window.location.href = `/exp?tripId=${result.tripId}`;
    } catch (error: any) {
      console.error('[Journey] Error:', error);
      throw error;
    }
  };

  // Handler for expanding timeline
  const handleExpandTimeline = () => {
    setIsTimelineVisible(true);
    if (selectedTripId) {
      setTimelineVisibility(prev => ({
        ...prev,
        [selectedTripId]: true
      }));
    }
  };

  // Update timeline visibility when trip changes
  useEffect(() => {
    if (selectedTripId) {
      // Check if this trip has been viewed before, default to visible for existing trips
      const isVisible = timelineVisibility[selectedTripId] ?? true;
      setIsTimelineVisible(isVisible);
    } else {
      setIsTimelineVisible(true);
    }
  }, [selectedTripId, timelineVisibility]);

  // Auto-show modal when user has no trips - DISABLED
  // useEffect(() => {
  //   if (showModalByDefault && !selectedTripId) {
  //     setIsMultiCityModalOpen(true);
  //   }
  // }, [showModalByDefault, selectedTripId]);

  // Handler for editing an item
  const handleEditItem = (v0Reservation: any) => {
    // Find the actual database reservation from selectedTrip using the ID
    if (!selectedTrip) return
    
    // Now that V0 reservations preserve the actual database ID, we can find by ID directly
    let dbReservation = null
    let segmentName = ""
    let dayDate = ""
    
    for (const segment of selectedTrip.segments) {
      const found = segment.reservations.find(r => r.id === v0Reservation.id)
      if (found) {
        dbReservation = found
        segmentName = segment.name
        
        // Get the day date from the segment
        if (segment.startTime) {
          dayDate = new Date(segment.startTime).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
        }
        break
      }
    }
    
    if (dbReservation) {
      // Properly structure the data for ReservationDetailModal
      setSelectedReservation({
        reservation: dbReservation,
        itemTitle: v0Reservation.vendor || dbReservation.name,
        itemTime: v0Reservation.startTime || '',
        itemType: dbReservation.reservationType?.category?.name || '',
        dayDate,
        segmentName
      })
    }
  }

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      setIsDeleting(true)
      
      // Import and call the delete action
      const { deleteReservation } = await import("@/lib/actions/delete-reservation")
      await deleteReservation(reservationId)
      
      // Refetch the trip data
      await refetchTrip()
      
      // Close the modal and dialog
      setSelectedReservation(null)
      setIsDeleteDialogOpen(false)
      setReservationToDelete(null)
    } catch (error) {
      console.error("Error deleting reservation:", error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div ref={containerRef} className="bg-slate-50 flex flex-col overflow-hidden pt-20 h-screen">
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
            <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-8">
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
                              onEditItem={handleEditItem}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingPaste && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%]">
                        <ReservationTypeSelector
                          detectedType={pendingPaste.detectedType as any}
                          confidence={pendingPaste.confidence}
                          onConfirm={handlePasteTypeConfirm}
                          onCancel={handlePasteTypeCancel}
                        />
                      </div>
                    </div>
                  )}
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
                    <div className="flex-1 overflow-y-auto p-2 pb-24 md:pb-8">
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
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                        onMessagesReset={() => setMessages([])}
                        onCreateNewChat={createNewTripChat}
                      />
                    )}
                  </div>
                  {currentConversationId && conversations.find(c => c.id === currentConversationId) && (
                    <span className="text-xs text-slate-500">
                      Updated: {formatDate(conversations.find(c => c.id === currentConversationId)!.updatedAt)}
                    </span>
                  )}
                </div>
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
              
              {/* Surprise Trip button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
                onClick={handleGetLucky}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-lg">✨</span>
                )}
                Surprise Trip
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 overscroll-contain pb-24 md:pb-8">
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
                              onEditItem={handleEditItem}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {pendingPaste && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%]">
                      <ReservationTypeSelector
                        detectedType={pendingPaste.detectedType as any}
                        confidence={pendingPaste.confidence}
                        onConfirm={handlePasteTypeConfirm}
                        onCancel={handlePasteTypeCancel}
                      />
                    </div>
                  </div>
                )}
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

              <div className="flex-1 overflow-y-auto p-3 overscroll-contain pb-24 md:pb-8">
                {transformedTrip ? (
                  <>
                    {!isTimelineVisible ? (
                      <TimelineCollapsedView
                        tripTitle={transformedTrip.title}
                        cityNames={transformedTrip.segments.map(s => s.name.replace(/^Stay in /, '').replace(/ → .*/, ''))}
                        totalDays={Math.ceil((selectedTrip!.endDate.getTime() - selectedTrip!.startDate.getTime()) / (1000 * 60 * 60 * 24))}
                        segmentCount={transformedTrip.segments.length}
                        stayCount={transformedTrip.segments.filter(s => s.type !== 'Flight').length}
                        travelCount={transformedTrip.segments.filter(s => s.type === 'Flight').length}
                        onExpand={handleExpandTimeline}
                      />
                    ) : (
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
          setReservationToDelete(id)
          setIsDeleteDialogOpen(true)
        }}
          onSave={async (reservation) => {
            try {
              const { updateReservationSimple } = await import("@/lib/actions/update-reservation-simple");
              await updateReservationSimple(reservation.id, {
                name: reservation.name,
                vendor: reservation.vendor ?? undefined,
                confirmationNumber: reservation.confirmationNumber ?? undefined,
                contactPhone: reservation.contactPhone ?? undefined,
                contactEmail: reservation.contactEmail ?? undefined,
                website: reservation.url ?? undefined,
                cost: reservation.cost ?? undefined,
                notes: reservation.notes ?? undefined,
                cancellationPolicy: reservation.cancellationPolicy ?? undefined,
                startTime: reservation.startTime instanceof Date ? reservation.startTime.toISOString() : reservation.startTime ? new Date(reservation.startTime).toISOString() : undefined,
                endTime: reservation.endTime instanceof Date ? reservation.endTime.toISOString() : reservation.endTime ? new Date(reservation.endTime).toISOString() : undefined,
                location: reservation.location ?? undefined,
                latitude: reservation.latitude ?? undefined,
                longitude: reservation.longitude ?? undefined,
                timeZoneId: reservation.timeZoneId ?? undefined,
                timeZoneName: reservation.timeZoneName ?? undefined,
                imageUrl: reservation.imageUrl ?? undefined,
                imageIsCustom: reservation.imageIsCustom,
              });
              router.refresh();
            } catch (error) {
              console.error("Error saving reservation:", error);
              alert("Failed to save reservation. Please try again.");
            }
          }}
      />

      {/* Edit Modals */}
      {currentConversationId && conversations.find(c => c.id === currentConversationId) && (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reservationToDelete) {
                  handleDeleteReservation(reservationToDelete)
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Existing Chat Dialog */}
      {existingChatsDialog && (
        <ExistingChatDialog
          open={existingChatsDialog.open}
          entityType={existingChatsDialog.entityType}
          entityName={existingChatsDialog.entityName}
          existingChats={existingChatsDialog.existingChats}
          onOpenExisting={handleOpenExistingChat}
          onCreateNew={handleCreateNewFromDialog}
          onCancel={() => setExistingChatsDialog(null)}
        />
      )}

      {/* Multi-City Trip Modal */}
      <MultiCityTripModal
        isOpen={isMultiCityModalOpen}
        onClose={() => setIsMultiCityModalOpen(false)}
        onSubmit={handleMultiCitySubmit}
      />

      {/* Debug Panel */}
      {debugMode && (
        <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 text-green-400 rounded-lg shadow-2xl overflow-hidden z-50 border border-green-500">
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-green-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono font-bold">DEBUG MODE</span>
            </div>
            <button
              onClick={() => setDebugMode(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="p-3 overflow-y-auto max-h-80 text-xs font-mono">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No events yet. Waiting for SSE data...</div>
            ) : (
              <div className="space-y-2">
                {debugLogs.map((log, i) => (
                  <div key={i} className="border-l-2 border-green-500 pl-2">
                    <div className="text-gray-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-green-400 font-bold">
                      {log.type} {log.stage && `[${log.stage}]`}
                    </div>
                    {log.message && (
                      <div className="text-gray-300">{log.message}</div>
                    )}
                    {log.data && (
                      <details className="mt-1">
                        <summary className="text-blue-400 cursor-pointer hover:text-blue-300">
                          data
                        </summary>
                        <pre className="text-[10px] text-gray-400 mt-1 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-800 px-4 py-2 border-t border-green-500 text-[10px] text-gray-500">
            Press Cmd+Shift+D to toggle • {debugLogs.length} events
          </div>
        </div>
      )}
    </div>
  )
}
