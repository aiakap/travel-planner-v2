"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queueTripImageGeneration } from "./queue-image-generation";

export async function createQuickTrip({
  title,
  startDate,
  endDate,
  description,
}: {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Validate dates
  if (endDate < startDate) {
    throw new Error("End date must be after start date");
  }

  // Create trip
  const trip = await prisma.trip.create({
    data: {
      title,
      description: description || `Trip to ${title}`,
      startDate,
      endDate,
      userId: session.user.id,
      imageUrl: null,
      imageIsCustom: false,
    },
  });

  // Queue image generation (don't wait for it)
  try {
    await queueTripImageGeneration(trip.id);
    console.log(`✓ Queued trip image generation: ${trip.id}`);
  } catch (error) {
    console.error("❌ Failed to queue trip image generation:", error);
    // Don't fail the trip creation if queue fails
  }

  // Return trip ID (don't redirect - let modal flow handle it)
  return trip.id;
}
