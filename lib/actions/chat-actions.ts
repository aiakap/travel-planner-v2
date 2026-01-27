"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function createConversation(title?: string, shouldRevalidate = true) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.chatConversation.create({
    data: {
      userId: session.user.id,
      title: title || "New Conversation",
    },
  });

  if (shouldRevalidate) {
    revalidatePath("/chat");
  }
  return conversation;
}

// Create conversation with full control over fields (for Surprise Journey)
export async function createConversationWithOptions({
  title,
  userId,
  chatType,
  tripId,
}: {
  title: string;
  userId: string;
  chatType?: 'TRIP' | 'SEGMENT' | 'RESERVATION';
  tripId?: string | null;
}) {
  const conversation = await prisma.chatConversation.create({
    data: {
      userId,
      title,
      chatType: chatType || 'TRIP',
      tripId: tripId || null,
    },
  });
  
  return conversation;
}

export async function getConversations() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const conversations = await prisma.chatConversation.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  return conversations;
}

export async function getConversation(conversationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId: session.user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return conversation;
}

export async function saveMessage({
  conversationId,
  role,
  content,
  toolCalls,
}: {
  conversationId: string;
  role: string;
  content: string;
  toolCalls?: any;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify conversation belongs to user
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId: session.user.id,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      role,
      content,
      toolCalls: toolCalls || null,
    },
  });

  // Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.chatConversation.updateMany({
    where: {
      id: conversationId,
      userId: session.user.id,
    },
    data: {
      title,
    },
  });

  revalidatePath("/chat");
}

export async function deleteConversation(conversationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.chatConversation.deleteMany({
    where: {
      id: conversationId,
      userId: session.user.id,
    },
  });

  revalidatePath("/chat");
}

export async function createTripConversation(tripId: string, title?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify trip belongs to user
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const conversation = await prisma.chatConversation.create({
    data: {
      userId: session.user.id,
      tripId,
      chatType: 'TRIP',
      title: title || `${trip.title} - ${formatChatTimestamp(new Date())}`,
    },
    include: {
      messages: true,
    },
  });

  revalidatePath("/experience-builder");
  return conversation;
}

export async function getTripConversations(tripId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await prisma.chatConversation.findMany({
    where: {
      tripId,
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1, // Just first message for preview
      },
    },
  });
}

export async function renameTripConversation(conversationId: string, newTitle: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId: session.user.id,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const updated = await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { title: newTitle },
    include: { messages: true },
  });

  revalidatePath("/experience-builder");
  return updated;
}

export async function createSegmentConversation(
  segmentId: string, 
  segmentName: string,
  tripId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const conversation = await prisma.chatConversation.create({
    data: {
      userId: session.user.id,
      tripId,
      segmentId,
      chatType: 'SEGMENT',
      title: `${segmentName} Chat - ${formatChatTimestamp(new Date())}`,
    },
    include: { messages: true },
  });
  
  revalidatePath("/exp");
  return conversation;
}

export async function createReservationConversation(
  reservationId: string,
  reservationName: string,
  segmentId: string,
  tripId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const conversation = await prisma.chatConversation.create({
    data: {
      userId: session.user.id,
      tripId,
      segmentId,
      reservationId,
      chatType: 'RESERVATION',
      title: `${reservationName} Chat - ${formatChatTimestamp(new Date())}`,
    },
    include: { messages: true },
  });
  
  revalidatePath("/exp");
  return conversation;
}

export async function findEntityConversations(
  entityType: 'SEGMENT' | 'RESERVATION',
  entityId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const where = entityType === 'SEGMENT' 
    ? { segmentId: entityId, userId: session.user.id }
    : { reservationId: entityId, userId: session.user.id };
  
  return await prisma.chatConversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: { messages: { take: 1 } },
  });
}

