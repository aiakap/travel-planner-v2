"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queueTripImageGeneration } from "./queue-image-generation";
import { revalidatePath } from "next/cache";

export async function regenerateTemplateImage(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify user owns the trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
    include: {
      imagePromptStyle: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (!trip.imagePromptStyleId) {
    throw new Error("No style selected for this trip");
  }

  // Queue new image generation with current style
  // This will overwrite the existing cached image
  await queueTripImageGeneration(tripId, trip.imagePromptStyleId);

  // Revalidate the view1 page
  revalidatePath(`/view1/${tripId}`);
  revalidatePath(`/view1`);

  return {
    success: true,
    styleName: trip.imagePromptStyle?.name || "Unknown",
  };
}
