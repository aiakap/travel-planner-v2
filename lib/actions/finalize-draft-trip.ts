"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TripStatus } from "@/app/generated/prisma";
import { queueTripImageGeneration } from "./queue-image-generation";
import { revalidatePath } from "next/cache";

/**
 * Finalizes a draft trip by:
 * 1. Setting the default theme (ImagePromptStyle)
 * 2. Setting a placeholder image based on first destination
 * 3. Queuing AI image generation
 * 4. Updating status from DRAFT to PLANNING
 */
export async function finalizeDraftTrip(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Get trip with segments to build placeholder image
  const trip = await prisma.trip.findFirst({
    where: { 
      id: tripId, 
      userId: session.user.id,
      status: TripStatus.DRAFT,
    },
    include: {
      segments: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found or not in draft status");
  }

  // Get the default style
  const defaultStyle = await prisma.imagePromptStyle.findFirst({
    where: { 
      isDefault: true, 
      isActive: true,
    },
  });

  if (!defaultStyle) {
    console.error("[finalizeDraftTrip] No default style found!");
    throw new Error("No default image style configured");
  }

  // Build placeholder image URL from first destination
  let placeholderImageUrl: string;
  const firstSegment = trip.segments[0];
  if (firstSegment?.startTitle) {
    // Use Unsplash with the destination name
    const destination = firstSegment.startTitle.split(",")[0].trim();
    const searchTerms = encodeURIComponent(`${destination} travel landscape`);
    placeholderImageUrl = `https://source.unsplash.com/1600x900/?${searchTerms}`;
  } else if (trip.title) {
    // Fallback to trip title
    const searchTerms = encodeURIComponent(`${trip.title} travel`);
    placeholderImageUrl = `https://source.unsplash.com/1600x900/?${searchTerms}`;
  } else {
    // Generic travel placeholder
    placeholderImageUrl = "https://source.unsplash.com/1600x900/?travel,adventure,landscape";
  }

  // Update trip with default style, placeholder image, and new status
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: TripStatus.PLANNING,
      imagePromptStyleId: defaultStyle.id,
      imageUrl: placeholderImageUrl,
      imageIsCustom: false,
    },
  });

  console.log(`[finalizeDraftTrip] Trip ${tripId} updated:`, {
    status: "PLANNING",
    style: defaultStyle.name,
    placeholderImage: placeholderImageUrl,
  });

  // Queue AI image generation (will replace placeholder when ready)
  try {
    const queueId = await queueTripImageGeneration(tripId, defaultStyle.id);
    console.log(`[finalizeDraftTrip] Image generation queued: ${queueId}`);
  } catch (error) {
    // Don't fail the whole operation if image queuing fails
    console.error("[finalizeDraftTrip] Failed to queue image generation:", error);
  }

  // Revalidate paths
  revalidatePath("/manage");
  revalidatePath(`/view1/${tripId}`);

  return { 
    success: true, 
    status: TripStatus.PLANNING,
    styleId: defaultStyle.id,
    styleName: defaultStyle.name,
    placeholderImageUrl,
  };
}
