"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Link a conversation to a trip and update the conversation title
 */
export async function linkConversationToTrip(
  conversationId: string,
  tripId: string,
  tripTitle?: string
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify conversation belongs to user
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId: session.user.id,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  // Verify trip belongs to user
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
  });

  if (!trip) {
    throw new Error("Trip not found or unauthorized");
  }

  // Update conversation
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { 
      tripId,
      title: tripTitle ? `Planning ${tripTitle}` : `Planning ${trip.title}`,
    },
  });
}
