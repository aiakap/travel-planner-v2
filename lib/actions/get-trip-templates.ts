"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface TripTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  isCurrent: boolean;
  isGenerating?: boolean;
}

export async function getTripTemplates(tripId: string): Promise<TripTemplate[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify user owns the trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
    select: {
      imageUrl: true,
      imagePromptStyleId: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Get all active image prompt styles
  const styles = await prisma.imagePromptStyle.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Get all successful image generations for this trip from ImageGenerationLog
  const generatedImages = await prisma.imageGenerationLog.findMany({
    where: {
      entityType: "trip",
      entityId: tripId,
      status: "success",
      imageUrl: { not: null },
    },
    select: {
      promptStyle: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get any images currently being generated
  const generatingImages = await prisma.imageQueue.findMany({
    where: {
      entityType: "trip",
      entityId: tripId,
      status: { in: ["waiting", "in_progress"] },
    },
    select: {
      notes: true,
    },
  });

  // Extract style slugs from generating images (format: "styleSlug:value|...")
  const generatingSlugs = generatingImages
    .map((img) => {
      const match = img.notes?.match(/^styleSlug:([^|]+)/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];

  // Create a map of style names to their cached image URLs
  const imageCache = new Map<string, string>();
  generatedImages.forEach((img) => {
    if (img.promptStyle && img.imageUrl && !imageCache.has(img.promptStyle)) {
      imageCache.set(img.promptStyle, img.imageUrl);
    }
  });

  // Build templates with accurate cache detection
  const templates: TripTemplate[] = styles.map((style) => {
    const imageUrl = imageCache.get(style.name) || null;
    const hasImage = !!imageUrl;
    const isCurrent = trip.imagePromptStyleId === style.id;
    const isGenerating = generatingSlugs.includes(style.slug);

    return {
      id: style.id,
      name: style.name,
      slug: style.slug,
      description: style.description,
      hasImage,
      imageUrl,
      isCurrent,
      isGenerating,
    };
  });

  return templates;
}
