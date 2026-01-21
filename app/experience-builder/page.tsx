import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExperienceBuilderClient } from "./client"
import { getUserPersonalizationData, generateChatQuickActions } from "@/lib/personalization"

export default async function ExperienceBuilderPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  // Fetch all trips with full relations for the user
  const trips = await prisma.trip.findMany({
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

  // Get or create a conversation for this user
  let conversation = await prisma.chatConversation.findFirst({
    where: {
      userId: session.user.id,
      title: "Experience Builder Chat",
    },
  })

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        userId: session.user.id,
        title: "Experience Builder Chat",
      },
    })
  }

  // Load user profile data for personalization
  let profileData = null;
  let quickActions: any[] = [];
  try {
    profileData = await getUserPersonalizationData(session.user.id);
    quickActions = generateChatQuickActions(profileData);
  } catch (error) {
    console.error("Error loading profile data:", error);
  }

  return (
    <ExperienceBuilderClient
      initialTrips={trips}
      userId={session.user.id}
      conversationId={conversation.id}
      profileData={profileData}
      quickActions={quickActions}
    />
  )
}
