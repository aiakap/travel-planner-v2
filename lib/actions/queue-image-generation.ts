"use server";

import { prisma } from "@/lib/prisma";
import { queueImageGeneration } from "@/lib/image-queue";

/**
 * Helper to build and queue image generation for a trip
 * Note: Should only be called from authenticated server actions
 */
export async function queueTripImageGeneration(tripId: string, specificStyleId?: string) {
  console.log(`[queueTripImageGeneration] Starting for trip: ${tripId}`);
  
  try {
    // Get trip data (no auth check needed - called from authenticated actions)
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { segments: true },
    });

    if (!trip) {
      console.error(`[queueTripImageGeneration] Trip not found: ${tripId}`);
      throw new Error("Trip not found");
    }
    console.log(`[queueTripImageGeneration] Found trip: ${trip.title}`);

    // Select prompt
    console.log(`[queueTripImageGeneration] Importing image-generation module...`);
    const { buildContextualPrompt, selectBestPromptForTrip, logImageGeneration } = await import("@/lib/image-generation");
    
    console.log(`[queueTripImageGeneration] Selecting best prompt...`);
    const selectionResult = await selectBestPromptForTrip(trip, specificStyleId);
    const prompt = selectionResult.prompt;
    console.log(`[queueTripImageGeneration] Selected prompt: ${prompt.name}`);
    
    console.log(`[queueTripImageGeneration] Building contextual prompt...`);
    const fullPrompt = buildContextualPrompt(prompt, trip, "trip");
    console.log(`[queueTripImageGeneration] Prompt built, length: ${fullPrompt.length} chars`);

    // Log the generation attempt
    console.log(`[queueTripImageGeneration] Creating image generation log...`);
    const log = await logImageGeneration({
      entityType: "trip",
      entityId: trip.id,
      entityName: trip.title,
      promptId: prompt.id,
      promptName: prompt.name,
      promptStyle: prompt.style?.name || null,
      fullPrompt: fullPrompt,
      aiReasoning: selectionResult.reasoning,
      selectionReason: specificStyleId ? "Manually selected style" : `Default style for trip: ${trip.title}`,
      callerFunction: "queueTripImageGeneration",
      callerSource: specificStyleId ? "regenerate" : "trip-creation",
      status: "in_progress",
      imageProvider: process.env.IMAGE_PROVIDER || "imagen",
    });
    console.log(`[queueTripImageGeneration] Log created with ID: ${log.id}`);

    // Queue the generation
    console.log(`[queueTripImageGeneration] Calling queueImageGeneration...`);
    const queueId = await queueImageGeneration("trip", tripId, fullPrompt, prompt.id, log.id);
    console.log(`[queueTripImageGeneration] Successfully queued with ID: ${queueId}`);
    
    return queueId;
  } catch (error: any) {
    console.error(`[queueTripImageGeneration] ERROR:`, error.message);
    console.error(`[queueTripImageGeneration] Stack:`, error.stack);
    throw error;
  }
}

/**
 * Helper to build and queue image generation for a segment
 * Note: Should only be called from authenticated server actions
 */
export async function queueSegmentImageGeneration(segmentId: string) {
  console.log(`[queueSegmentImageGeneration] Starting for segment: ${segmentId}`);
  
  try {
    // Get segment data (no auth check needed - called from authenticated actions)
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
      },
      include: {
        trip: true,
        segmentType: true,
      },
    });

    if (!segment) {
      console.error(`[queueSegmentImageGeneration] Segment not found: ${segmentId}`);
      throw new Error("Segment not found");
    }
    console.log(`[queueSegmentImageGeneration] Found segment: ${segment.name}`);

    // Select prompt and build full prompt
    console.log(`[queueSegmentImageGeneration] Importing image-generation module...`);
    const { buildContextualPrompt, selectBestPromptForSegment, logImageGeneration } = await import("@/lib/image-generation");
    
    console.log(`[queueSegmentImageGeneration] Selecting best prompt...`);
    const selectionResult = await selectBestPromptForSegment(segment);
    const prompt = selectionResult.prompt;
    console.log(`[queueSegmentImageGeneration] Selected prompt: ${prompt.name}`);
    
    console.log(`[queueSegmentImageGeneration] Building contextual prompt...`);
    const fullPrompt = buildContextualPrompt(prompt, segment, "segment");
    console.log(`[queueSegmentImageGeneration] Prompt built, length: ${fullPrompt.length} chars`);

    // Log the generation attempt
    console.log(`[queueSegmentImageGeneration] Creating image generation log...`);
    const log = await logImageGeneration({
      entityType: "segment",
      entityId: segment.id,
      entityName: segment.name,
      promptId: prompt.id,
      promptName: prompt.name,
      promptStyle: prompt.style?.name || null,
      fullPrompt: fullPrompt,
      aiReasoning: selectionResult.reasoning,
      selectionReason: `Default prompt for segment: ${segment.name}`,
      callerFunction: "queueSegmentImageGeneration",
      callerSource: "segment-creation",
      status: "in_progress",
      imageProvider: process.env.IMAGE_PROVIDER || "imagen",
    });
    console.log(`[queueSegmentImageGeneration] Log created with ID: ${log.id}`);

    // Queue the generation
    console.log(`[queueSegmentImageGeneration] Calling queueImageGeneration...`);
    const queueId = await queueImageGeneration("segment", segmentId, fullPrompt, prompt.id, log.id);
    console.log(`[queueSegmentImageGeneration] Successfully queued with ID: ${queueId}`);
    
    return queueId;
  } catch (error: any) {
    console.error(`[queueSegmentImageGeneration] ERROR:`, error.message);
    console.error(`[queueSegmentImageGeneration] Stack:`, error.stack);
    throw error;
  }
}

/**
 * Helper to build and queue image generation for a reservation
 * Note: Should only be called from authenticated server actions
 */
export async function queueReservationImageGeneration(reservationId: string) {
  console.log(`[queueReservationImageGeneration] Starting for reservation: ${reservationId}`);
  
  try {
    // Get reservation data (no auth check needed - called from authenticated actions)
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
      },
      include: {
        segment: { include: { trip: true } },
        reservationType: true,
      },
    });

    if (!reservation) {
      console.error(`[queueReservationImageGeneration] Reservation not found: ${reservationId}`);
      throw new Error("Reservation not found");
    }
    console.log(`[queueReservationImageGeneration] Found reservation: ${reservation.name}`);

    // Select prompt and build full prompt
    console.log(`[queueReservationImageGeneration] Importing image-generation module...`);
    const { buildContextualPrompt, selectBestPromptForReservation, logImageGeneration } = await import("@/lib/image-generation");
    
    console.log(`[queueReservationImageGeneration] Selecting best prompt...`);
    const selectionResult = await selectBestPromptForReservation(reservation);
    const prompt = selectionResult.prompt;
    console.log(`[queueReservationImageGeneration] Selected prompt: ${prompt.name}`);
    
    console.log(`[queueReservationImageGeneration] Building contextual prompt...`);
    const fullPrompt = buildContextualPrompt(prompt, reservation, "reservation");
    console.log(`[queueReservationImageGeneration] Prompt built, length: ${fullPrompt.length} chars`);

    // Log the generation attempt
    console.log(`[queueReservationImageGeneration] Creating image generation log...`);
    const log = await logImageGeneration({
      entityType: "reservation",
      entityId: reservation.id,
      entityName: reservation.name,
      promptId: prompt.id,
      promptName: prompt.name,
      promptStyle: prompt.style?.name || null,
      fullPrompt: fullPrompt,
      aiReasoning: selectionResult.reasoning,
      selectionReason: `Default prompt for reservation: ${reservation.name}`,
      callerFunction: "queueReservationImageGeneration",
      callerSource: "reservation-creation",
      status: "in_progress",
      imageProvider: process.env.IMAGE_PROVIDER || "imagen",
    });
    console.log(`[queueReservationImageGeneration] Log created with ID: ${log.id}`);

    // Queue the generation
    console.log(`[queueReservationImageGeneration] Calling queueImageGeneration...`);
    const queueId = await queueImageGeneration("reservation", reservationId, fullPrompt, prompt.id, log.id);
    console.log(`[queueReservationImageGeneration] Successfully queued with ID: ${queueId}`);
    
    return queueId;
  } catch (error: any) {
    console.error(`[queueReservationImageGeneration] ERROR:`, error.message);
    console.error(`[queueReservationImageGeneration] Stack:`, error.stack);
    throw error;
  }
}

/**
 * Queue image generation for multiple entities at once
 */
export async function queueBulkImageGeneration(params: {
  tripIds?: string[];
  segmentIds?: string[];
  reservationIds?: string[];
}) {
  const results = {
    trips: { success: 0, failed: 0 },
    segments: { success: 0, failed: 0 },
    reservations: { success: 0, failed: 0 }
  };
  
  // Queue trips
  if (params.tripIds) {
    for (const tripId of params.tripIds) {
      try {
        await queueTripImageGeneration(tripId);
        results.trips.success++;
      } catch (error) {
        console.error(`Failed to queue trip ${tripId}:`, error);
        results.trips.failed++;
      }
    }
  }
  
  // Queue segments
  if (params.segmentIds) {
    for (const segmentId of params.segmentIds) {
      try {
        await queueSegmentImageGeneration(segmentId);
        results.segments.success++;
      } catch (error) {
        console.error(`Failed to queue segment ${segmentId}:`, error);
        results.segments.failed++;
      }
    }
  }
  
  // Queue reservations
  if (params.reservationIds) {
    for (const reservationId of params.reservationIds) {
      try {
        await queueReservationImageGeneration(reservationId);
        results.reservations.success++;
      } catch (error) {
        console.error(`Failed to queue reservation ${reservationId}:`, error);
        results.reservations.failed++;
      }
    }
  }
  
  return results;
}
