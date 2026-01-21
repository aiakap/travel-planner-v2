"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { UIMessage } from "ai"
import { Button } from "@/components/ui/button"
import { Send, Plus, GripVertical, Table2, GitBranch, Grid3X3, MessageCircle, Calendar, Loader2 } from "lucide-react"
import { ChatWelcomeMessage } from "@/components/chat-welcome-message"
import { ChatQuickActions } from "@/components/chat-quick-actions"
import { TripSelector } from "@/components/trip-selector"
import { ChatSelector } from "@/components/chat-selector"
import { ItineraryEmptyState } from "@/components/itinerary-empty-state"
import { TimelineView } from "@/components/timeline-view"
import { TableView } from "@/components/table-view"
import { PhotosView } from "@/components/photos-view"
import { ReservationDetailModal } from "@/components/reservation-detail-modal"
import { transformTripToV0Format } from "@/lib/v0-data-transform"
import type { V0Itinerary } from "@/lib/v0-types"
import { UserPersonalizationData, ChatQuickAction, getHobbyBasedDestination, getPreferenceBudgetLevel } from "@/lib/personalization"
import { generateGetLuckyPrompt } from "@/lib/ai/get-lucky-prompts"

// Helper to extract text content from message parts
function getMessageText(message: UIMessage): string {
  return message.parts?.filter((part: any) => part.type === "text").map((part: any) => part.text).join("") || message.content || ""
}

// Type for database trip with all relations
interface DBTrip {
  id: string
  title: string
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
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat")
  const [leftPanelWidth, setLeftPanelWidth] = useState(40)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)

  // Refs
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
          window.history.pushState({}, '', `/experience-builder?tripId=${newestTrip.id}`)
          console.log("✅ [Refetch] URL updated to:", `/experience-builder?tripId=${newestTrip.id}`)
          
          // Fetch conversations for the new trip
          console.log("🔄 [Refetch] Fetching conversations for trip:", newestTrip.id)
          const convResponse = await fetch(`/api/conversations?tripId=${newestTrip.id}`)
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

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages.map(m => ({
        id: m.id,
        role: m.role as any,
        content: m.content,
      })))
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

  // Trip selection handler
  const handleTripSelect = (tripId: string | null) => {
    if (tripId) {
      // Navigate to trip with URL parameter
      window.location.href = `/experience-builder?tripId=${tripId}`
    } else {
      // Navigate to new chat
      window.location.href = `/experience-builder`
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
    if (!transformedTrip) return { total: 0, estimatedTotal: 0 }
    
    let total = 0
    let estimatedTotal = 0
    
    transformedTrip.segments.forEach((segment) => {
      segment.days.forEach((day) => {
        day.items.forEach((item) => {
          item.reservations.forEach((res) => {
            total += res.cost
            if (res.status !== "confirmed") {
              estimatedTotal += res.cost
            }
          })
        })
      })
    })
    
    return { total, estimatedTotal }
  }

  const tripTotals = getTripTotals()

  return (
    <div ref={containerRef} className="h-screen bg-slate-50 flex flex-col">
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
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-900 border border-slate-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">{getMessageText(msg)}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 rounded-lg px-4 py-2.5 flex items-center gap-2 border border-slate-100">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        <span className="text-sm text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  )}
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
            
            {!hasStartedPlanning && !selectedTripId ? (
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
                          {tripTotals.estimatedTotal > 0 && (
                            <div className="text-[9px] text-muted-foreground">
                              <span className="text-amber-600">~${tripTotals.estimatedTotal.toLocaleString()}</span> estimated
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <TimelineView
                        segments={transformedTrip.segments}
                        heroImage={transformedTrip.heroImage}
                        onSelectReservation={setSelectedReservation}
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
        <div className="flex flex-col h-full border-r bg-white" style={{ width: `${leftPanelWidth}%` }}>
          <div className="border-b border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-slate-700" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">{currentChatName}</h2>
                <p className="text-xs text-slate-500">AI Travel Assistant</p>
              </div>
            </div>
          </div>

          {/* Chat Selector - only show if trip is selected */}
          {selectedTripId && conversations.length > 0 && (
            <ChatSelector
              tripId={selectedTripId}
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleConversationSelect}
              onConversationsChange={setConversations}
            />
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {!hasStartedPlanning && messages.length === 0 ? (
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
                      <div className="whitespace-pre-wrap leading-relaxed">{getMessageText(msg)}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 rounded-lg px-5 py-3 flex items-center gap-2 border border-slate-100">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      <span className="text-sm text-slate-500">Thinking...</span>
                    </div>
                  </div>
                )}
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

        {/* Resizable Divider */}
        <div
          className="w-2 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex items-center justify-center group transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

        {/* Right Panel - Itinerary */}
        <div className="flex flex-col h-full bg-white" style={{ width: `${100 - leftPanelWidth}%` }}>
          {/* Trip Selector - Always visible at top */}
          <div className="border-b border-slate-200 p-3 bg-white">
            <TripSelector trips={trips} selectedTripId={selectedTripId} onTripSelect={handleTripSelect} />
          </div>
          
          {!hasStartedPlanning && !selectedTripId ? (
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
                          {tripTotals.estimatedTotal > 0 && (
                            <div className="text-[9px] text-muted-foreground">
                              <span className="text-amber-600">~${tripTotals.estimatedTotal.toLocaleString()}</span> estimated
                            </div>
                          )}
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

              <div className="flex-1 overflow-y-auto p-3">
                {transformedTrip ? (
                  <>
                    {viewMode === "table" && (
                      <TableView segments={transformedTrip.segments} onSelectReservation={setSelectedReservation} />
                    )}
                    {viewMode === "timeline" && (
                      <TimelineView
                        segments={transformedTrip.segments}
                        heroImage={transformedTrip.heroImage}
                        onSelectReservation={setSelectedReservation}
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
    </div>
  )
}
