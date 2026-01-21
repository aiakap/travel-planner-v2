"use server";

import { prisma } from "@/lib/prisma";

/**
 * Add an image generation job to the queue
 */
export async function queueImageGeneration(
  entityType: "trip" | "segment" | "reservation",
  entityId: string,
  prompt: string,
  promptId?: string
): Promise<string> {
  console.log(`[queueImageGeneration] Starting - entityType: ${entityType}, entityId: ${entityId}`);
  console.log(`[queueImageGeneration] Prompt length: ${prompt.length}, promptId: ${promptId}`);
  
  try {
    // Check if there's already a pending/in-progress job for this entity
    console.log(`[queueImageGeneration] Checking for existing job...`);
    const existingJob = await prisma.imageQueue.findFirst({
      where: {
        entityType,
        entityId,
        status: { in: ["waiting", "in_progress"] },
      },
    });

    if (existingJob) {
      console.log(`[queueImageGeneration] Found existing job: ${existingJob.id}, updating...`);
      // Update the existing job with new prompt
      await prisma.imageQueue.update({
        where: { id: existingJob.id },
        data: {
          prompt,
          promptId,
          updatedAt: new Date(),
        },
      });
      console.log(`[queueImageGeneration] Updated existing job: ${existingJob.id}`);
      return existingJob.id;
    }

    // Create new queue entry
    console.log(`[queueImageGeneration] No existing job found, creating new entry...`);
    console.log(`[queueImageGeneration] Creating with data:`, {
      entityType,
      entityId,
      promptLength: prompt.length,
      promptId,
      status: "waiting"
    });
    
    const queueEntry = await prisma.imageQueue.create({
      data: {
        entityType,
        entityId,
        prompt,
        promptId,
        status: "waiting",
        notes: `[${new Date().toISOString()}] Queued for processing`,
      },
    });

    console.log(`[queueImageGeneration] ✓ Successfully created queue entry with ID: ${queueEntry.id}`);
    console.log(`[queueImageGeneration] Entry details:`, {
      id: queueEntry.id,
      entityType: queueEntry.entityType,
      entityId: queueEntry.entityId,
      status: queueEntry.status
    });
    
    return queueEntry.id;
  } catch (error: any) {
    console.error(`[queueImageGeneration] ❌ ERROR:`, error.message);
    console.error(`[queueImageGeneration] Stack:`, error.stack);
    throw error;
  }
}

/**
 * Check if an entity has a pending/completed image in the queue
 */
export async function getImageQueueStatus(
  entityType: "trip" | "segment" | "reservation",
  entityId: string
) {
  const queueEntry = await prisma.imageQueue.findFirst({
    where: {
      entityType,
      entityId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return queueEntry;
}

/**
 * Get the next waiting job from the queue
 */
export async function getNextQueuedJob() {
  return await prisma.imageQueue.findFirst({
    where: {
      status: "waiting",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Update queue entry status and notes
 */
export async function updateQueueStatus(
  queueId: string,
  status: "waiting" | "in_progress" | "failed" | "completed",
  notes?: string,
  imageUrl?: string
) {
  const currentEntry = await prisma.imageQueue.findUnique({
    where: { id: queueId },
    select: { notes: true, attempts: true },
  });

  const timestamp = new Date().toISOString();
  const newNote = `[${timestamp}] ${notes || status}`;
  const updatedNotes = currentEntry?.notes
    ? `${currentEntry.notes}\n${newNote}`
    : newNote;

  return await prisma.imageQueue.update({
    where: { id: queueId },
    data: {
      status,
      notes: updatedNotes,
      imageUrl: imageUrl || undefined,
      attempts: status === "in_progress" ? (currentEntry?.attempts || 0) + 1 : undefined,
      updatedAt: new Date(),
    },
  });
}

/**
 * Process a single queue entry
 */
export async function processQueueEntry(queueId: string) {
  const entry = await prisma.imageQueue.findUnique({
    where: { id: queueId },
  });

  if (!entry) {
    throw new Error("Queue entry not found");
  }

  if (entry.status !== "waiting") {
    throw new Error(`Cannot process entry with status: ${entry.status}`);
  }

  try {
    // Mark as in progress
    await updateQueueStatus(queueId, "in_progress", "Starting image generation");

    // Import image generation functions (server-side only)
    const { generateImageWithDALLE, uploadImageToStorage } = await import("./image-generation");

    // Generate image with DALL-E
    const dalleImageUrl = await generateImageWithDALLE(entry.prompt);
    await updateQueueStatus(queueId, "in_progress", `Generated DALL-E image: ${dalleImageUrl}`);

    // Upload to permanent storage
    const permanentUrl = await uploadImageToStorage(
      dalleImageUrl,
      `${entry.entityType}-${entry.entityId}`
    );
    await updateQueueStatus(queueId, "in_progress", `Uploaded to storage: ${permanentUrl}`);

    // Update the entity with the new image URL
    await updateEntityImage(entry.entityType, entry.entityId, permanentUrl);
    await updateQueueStatus(
      queueId,
      "completed",
      `Successfully updated ${entry.entityType} with new image`,
      permanentUrl
    );

    return { success: true, imageUrl: permanentUrl };
  } catch (error: any) {
    await updateQueueStatus(queueId, "failed", `Error: ${error.message}`);
    throw error;
  }
}

/**
 * Update the entity (trip/segment/reservation) with the generated image URL
 */
async function updateEntityImage(
  entityType: "trip" | "segment" | "reservation",
  entityId: string,
  imageUrl: string
) {
  switch (entityType) {
    case "trip":
      await prisma.trip.update({
        where: { id: entityId },
        data: { imageUrl, imageIsCustom: false },
      });
      break;
    case "segment":
      await prisma.segment.update({
        where: { id: entityId },
        data: { imageUrl, imageIsCustom: false },
      });
      break;
    case "reservation":
      await prisma.reservation.update({
        where: { id: entityId },
        data: { imageUrl, imageIsCustom: false },
      });
      break;
  }
}

/**
 * Process all waiting queue entries (for background job/cron)
 */
export async function processImageQueue(maxJobs: number = 5) {
  const results = [];

  for (let i = 0; i < maxJobs; i++) {
    const job = await getNextQueuedJob();
    if (!job) break;

    try {
      const result = await processQueueEntry(job.id);
      results.push({ id: job.id, success: true, ...result });
    } catch (error: any) {
      results.push({ id: job.id, success: false, error: error.message });
    }
  }

  return results;
}
