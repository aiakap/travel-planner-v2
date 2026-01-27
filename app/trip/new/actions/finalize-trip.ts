"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TripStatus } from "@/app/generated/prisma";
import { generateAndUploadImageImmediate } from "@/lib/image-generation";

export async function finalizeTrip(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 1. Verify trip ownership
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: {
      segments: {
        orderBy: { order: 'asc' },
        include: { segmentType: true }
      }
    }
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // 2. Update status to PLANNING
  await prisma.trip.update({
    where: { id: tripId },
    data: { status: TripStatus.PLANNING }
  });

  // 3. Generate image in background (don't await - fire and forget)
  generateTripImageBackground(trip).catch(error => {
    console.error("Background image generation failed:", error);
  });

  return { success: true };
}

async function generateTripImageBackground(trip: any) {
  try {
    console.log(`🎨 Starting image generation for trip: ${trip.id}`);
    const result = await generateAndUploadImageImmediate(trip, "trip");
    
    // Update trip with generated image
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        imageUrl: result.imageUrl,
        imagePromptId: result.promptId,
        imageIsCustom: false
      }
    });
    
    console.log(`✅ Trip image generated: ${result.imageUrl}`);
  } catch (error) {
    console.error(`❌ Failed to generate trip image:`, error);
  }
}
