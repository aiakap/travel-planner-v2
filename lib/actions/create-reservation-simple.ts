"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queueReservationImageGeneration } from "./queue-image-generation";

export interface CreateReservationSimpleParams {
  segmentId: string;
  name: string;
  category: string;
  type: string;
  status?: string; // "Pending", "Confirmed", "Cancelled" - defaults to "Pending"
  cost?: number;
  currency?: string;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  url?: string;
  confirmationNumber?: string;
  contactPhone?: string;
}

/**
 * Create a reservation with any status
 * Generic, status-agnostic reservation creation
 * Works for Suggested (Pending), Planned (Pending), Confirmed, etc.
 */
export async function createReservationSimple({
  segmentId,
  name,
  category,
  type,
  status = "Pending", // Default to "Pending" (UI shows as "Suggested")
  cost,
  currency = "USD",
  notes,
  startTime,
  endTime,
  location,
  url,
  confirmationNumber,
  contactPhone,
}: CreateReservationSimpleParams): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify segment belongs to user's trip
  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      trip: {
        userId: session.user.id,
      },
    },
    include: {
      trip: true,
    },
  });

  if (!segment) {
    throw new Error("Segment not found or unauthorized");
  }

  // Get reservation type
  const reservationType = await prisma.reservationType.findFirst({
    where: {
      name: type,
      category: {
        name: category,
      },
    },
  });

  if (!reservationType) {
    throw new Error(`Reservation type "${type}" in category "${category}" not found`);
  }

  // Get reservation status
  const reservationStatus = await prisma.reservationStatus.findFirst({
    where: { name: status },
  });

  if (!reservationStatus) {
    throw new Error(`Status "${status}" not found`);
  }

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      name,
      segmentId,
      reservationTypeId: reservationType.id,
      reservationStatusId: reservationStatus.id,
      confirmationNumber: confirmationNumber || null,
      notes: notes || null,
      cost: cost || null,
      currency: cost ? currency : null,
      location: location || null,
      url: url || null,
      startTime: startTime || null,
      endTime: endTime || null,
      contactPhone: contactPhone || null,
      imageUrl: null,
      imageIsCustom: false,
    },
  });

  // Queue image generation
  try {
    const queueId = await queueReservationImageGeneration(reservation.id);
    console.log(`✓ Queued reservation image generation: ${queueId}`);
  } catch (error) {
    console.error("❌ Failed to queue reservation image generation:", error);
    // Don't fail the reservation creation if queue fails
  }

  return reservation.id;
}
