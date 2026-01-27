import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExpClient } from "./client"
import { getUserPersonalizationData, generateChatQuickActions } from "@/lib/personalization"

// Helper function to format chat timestamp
function formatChatTimestamp(date: Date): string {
  const month = date.getMonth() + 1 // 0-indexed
  const day = date.getDate()
  const year = date.getFullYear().toString().slice(-2) // Last 2 digits
  
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  
  // Convert to 12-hour format
  hours = hours % 12
  hours = hours ? hours : 12 // 0 should be 12
  
  // Pad minutes with leading zero if needed
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString()
  
  return `${month}/${day}/${year} - ${hours}:${minutesStr} ${ampm}`
}

export default async function ExpPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string; segmentId?: string; reservationId?: string; action?: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  const params = await searchParams
  const tripId = params.tripId
  const segmentId = params.segmentId
  const reservationId = params.reservationId
  let selectedTrip = null
  let selectedConversation = null
  let conversations: any[] = []
  let showModalByDefault = false

  // Fetch all trips for the selector
  const allTrips = await prisma.trip.findMany({
    where: {
      userId: session.user.id,
      status: { not: 'DRAFT' },
    },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          segmentType: true,
          reservations: {
            include: {
              reservationType: {
                include: {
                  category: true,
                },
              },
              reservationStatus: true,
            },
            orderBy: { startTime: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Determine which trip to load
  const mostRecentTrip = allTrips[0] // Already sorted by createdAt desc
  let tripToLoad = null

  if (tripId) {
    // Load specific trip from URL
    tripToLoad = allTrips.find(t => t.id === tripId) || null
  } else if (mostRecentTrip) {
    // No tripId but user has trips - use most recent
    tripToLoad = mostRecentTrip
  } else {
    // No trips at all - flag to show modal
    showModalByDefault = true
  }

  if (tripToLoad) {
    selectedTrip = tripToLoad

    // Get all conversations for this trip
    conversations = await prisma.chatConversation.findMany({
      where: {
        tripId: tripToLoad.id,
        userId: session.user.id,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    // Handle segmentId or reservationId from URL
    if (reservationId) {
      // Find existing reservation conversation
      const reservationConv = conversations.find(c => 
        c.chatType === 'RESERVATION' && c.reservationId === reservationId
      )
      
      if (reservationConv) {
        selectedConversation = reservationConv
      } else {
        // Create new reservation conversation
        const reservation = tripToLoad.segments
          .flatMap(s => s.reservations)
          .find(r => r.id === reservationId)
        
        if (reservation) {
          const segment = tripToLoad.segments.find(s => 
            s.reservations.some(r => r.id === reservationId)
          )
          
          selectedConversation = await prisma.chatConversation.create({
            data: {
              userId: session.user.id,
              tripId: tripToLoad.id,
              segmentId: segment?.id,
              reservationId: reservationId,
              chatType: 'RESERVATION',
              title: `${reservation.title} - ${formatChatTimestamp(new Date())}`,
            },
            include: {
              messages: true,
            },
          })
          conversations = [selectedConversation, ...conversations]
        }
      }
    } else if (segmentId) {
      // Find existing segment conversation
      const segmentConv = conversations.find(c => 
        c.chatType === 'SEGMENT' && c.segmentId === segmentId
      )
      
      if (segmentConv) {
        selectedConversation = segmentConv
      } else {
        // Create new segment conversation
        const segment = tripToLoad.segments.find(s => s.id === segmentId)
        
        if (segment) {
          selectedConversation = await prisma.chatConversation.create({
            data: {
              userId: session.user.id,
              tripId: tripToLoad.id,
              segmentId: segmentId,
              chatType: 'SEGMENT',
              title: `${segment.title} - ${formatChatTimestamp(new Date())}`,
            },
            include: {
              messages: true,
            },
          })
          conversations = [selectedConversation, ...conversations]
        }
      }
    }
    
    // If no specific entity selected, use latest conversation or create trip conversation
    if (!selectedConversation) {
      selectedConversation = conversations[0]

      if (!selectedConversation) {
        selectedConversation = await prisma.chatConversation.create({
          data: {
            userId: session.user.id,
            tripId: tripToLoad.id,
            chatType: 'TRIP',
            title: `${tripToLoad.title} - ${formatChatTimestamp(new Date())}`,
          },
          include: {
            messages: true,
          },
        })
        conversations = [selectedConversation]
      }
    }
  }

  // Load user profile data for personalization
  let profileData = null
  let quickActions: any[] = []
  try {
    profileData = await getUserPersonalizationData(session.user.id)
    quickActions = generateChatQuickActions(profileData)
  } catch (error) {
    console.error("Error loading profile data:", error)
  }

  return (
    <ExpClient
      initialTrips={allTrips}
      selectedTrip={selectedTrip}
      selectedConversation={selectedConversation}
      initialConversations={conversations}
      userId={session.user.id}
      profileData={profileData}
      quickActions={quickActions}
      showModalByDefault={showModalByDefault}
    />
  )
}
