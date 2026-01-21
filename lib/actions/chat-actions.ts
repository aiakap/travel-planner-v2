"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
      title: title || `Chat about ${trip.title}`,
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

