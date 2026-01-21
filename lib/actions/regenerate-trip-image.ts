"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAndUploadImage } from "@/lib/image-generation";

export async function regenerateTripImageWithTheme(
  tripId: string,
  imagePromptId?: string // Optional: if not provided, AI picks best theme
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
    include: { segments: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Generate image with selected or AI-picked theme
  const result = await generateAndUploadImage(
    trip,
    "trip",
    imagePromptId // Pass specific prompt ID if provided
  );

  // Update trip with new image and track which theme was used
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      imageUrl: result.imageUrl,
      imageIsCustom: false,
      imagePromptId: result.promptId,
    },
  });

  return { imageUrl: result.imageUrl, promptName: result.promptName };
}
