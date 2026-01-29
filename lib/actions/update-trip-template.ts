"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queueTripImageGeneration } from "./queue-image-generation";
import { revalidatePath } from "next/cache";

export async function updateTripTemplate(tripId: string, styleId: string) {
  console.log(`[updateTripTemplate] Starting for trip ${tripId}, style ${styleId}`);
  
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify user owns the trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
    include: {
      ImagePromptStyle: true,
    },
  });

  if (!trip) {
    console.error(`[updateTripTemplate] Trip not found: ${tripId}`);
    throw new Error("Trip not found");
  }

  // Get the new style
  const newStyle = await prisma.imagePromptStyle.findUnique({
    where: { id: styleId },
  });

  if (!newStyle) {
    console.error(`[updateTripTemplate] Style not found: ${styleId}`);
    throw new Error("Style not found");
  }

  console.log(`[updateTripTemplate] Switching to style: ${newStyle.name} (${newStyle.slug})`);

  // Get the prompt for this style + trip category
  const prompt = await prisma.imagePrompt.findFirst({
    where: {
      styleId: styleId,
      category: "trip",
      isActive: true,
    },
  });

  if (!prompt) {
    console.error(`[updateTripTemplate] No prompt found for style ${newStyle.name} and category "trip"`);
    console.error(`[updateTripTemplate] Available prompts for this style:`, 
      await prisma.imagePrompt.findMany({ 
        where: { styleId },
        select: { id: true, name: true, category: true, isActive: true }
      })
    );
    throw new Error(`This style (${newStyle.name}) is not yet configured for trips. Please contact support.`);
  }

  // Check if we have a cached image for this style in ImageGenerationLog
  console.log(`[updateTripTemplate] Checking for cached image in ImageGenerationLog...`);
  const cachedImage = await prisma.imageGenerationLog.findFirst({
    where: {
      entityType: "trip",
      entityId: tripId,
      promptStyle: newStyle.name,
      status: "success",
      imageUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: { imageUrl: true },
  });

  if (cachedImage?.imageUrl) {
    // Image already exists, update both style reference AND imageUrl
    console.log(`[updateTripTemplate] ✓ Found cached image: ${cachedImage.imageUrl}`);
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        imageUrl: cachedImage.imageUrl,
        imagePromptStyleId: styleId,
        imagePromptId: prompt.id,
      },
    });

    // Revalidate the view1 page
    revalidatePath(`/view1/${tripId}`);
    revalidatePath(`/view1`);

    console.log(`[updateTripTemplate] ✓ Successfully switched to cached style`);
    return {
      success: true,
      hasExistingImage: true,
      styleName: newStyle.name,
    };
  } else {
    // No existing image, queue generation
    console.log(`[updateTripTemplate] No cached image found, queuing generation...`);
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        imagePromptStyleId: styleId,
        imagePromptId: prompt.id,
      },
    });

    // Queue image generation with the new style
    await queueTripImageGeneration(tripId, styleId);

    // Revalidate the view1 page
    revalidatePath(`/view1/${tripId}`);
    revalidatePath(`/view1`);

    console.log(`[updateTripTemplate] ✓ Queued image generation`);
    return {
      success: true,
      hasExistingImage: false,
      styleName: newStyle.name,
    };
  }
}
