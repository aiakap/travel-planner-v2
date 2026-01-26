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
  searchParams: Promise<{ tripId?: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  const params = await searchParams
  const tripId = params.tripId
  let selectedTrip = null
  let selectedConversation = null
  let conversations: any[] = []

  // Fetch all trips for the selector
  const allTrips = await prisma.trip.findMany({
    where: {
      userId: session.user.id,
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

  if (tripId) {
    // Load specific trip with full relations
    selectedTrip = allTrips.find(t => t.id === tripId) || null

    if (selectedTrip) {
      // Get all conversations for this trip
      conversations = await prisma.chatConversation.findMany({
        where: {
          tripId,
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

      // Get latest conversation or create first one
      selectedConversation = conversations[0]

      if (!selectedConversation) {
        selectedConversation = await prisma.chatConversation.create({
          data: {
            userId: session.user.id,
            tripId,
            title: `${selectedTrip.title} - ${formatChatTimestamp(new Date())}`,
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
    />
  )
}
