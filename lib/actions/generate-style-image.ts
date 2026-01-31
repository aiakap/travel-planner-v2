"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queueTripImageGeneration } from "./queue-image-generation";
import { revalidatePath } from "next/cache";

/**
 * Queue image generation for a specific style on a trip
 * This is called when a user clicks "generate" on an ungenerated style
 */
export async function generateStyleImage(tripId: string, styleId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify user owns the trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Verify style exists
  const style = await prisma.imagePromptStyle.findUnique({
    where: { id: styleId },
  });

  if (!style) {
    throw new Error("Style not found");
  }

  // Queue image generation with the specific style
  await queueTripImageGeneration(tripId, styleId);

  // Revalidate the view1 page
  revalidatePath(`/view1/${tripId}`);
  revalidatePath(`/view1`);

  return {
    success: true,
    styleName: style.name,
  };
}
