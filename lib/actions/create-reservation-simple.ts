"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queueReservationImageGeneration } from "./queue-image-generation";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { localToUTC, stringToPgDate, stringToPgTime } from "@/lib/utils/local-time";

export interface CreateReservationSimpleParams {
  segmentId: string;
  name: string;
  category: string;
  type: string;
  status?: string; // "Pending", "Confirmed", "Cancelled" - defaults to "Pending"
  cost?: number;
  currency?: string;
  notes?: string;
  /** @deprecated Use localStartDate + localStartTime instead */
  startTime?: Date;
  /** @deprecated Use localEndDate + localEndTime instead */
  endTime?: Date;
  /** Local start date in YYYY-MM-DD format */
  localStartDate?: string;
  /** Local start time in HH:mm format */
  localStartTime?: string;
  /** Local end date in YYYY-MM-DD format */
  localEndDate?: string;
  /** Local end time in HH:mm format */
  localEndTime?: string;
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
  localStartDate,
  localStartTime,
  localEndDate,
  localEndTime,
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

  // Get cached reservation type and status
  const reservationType = await getReservationType(category, type);
  const reservationStatus = await getReservationStatus(status);
  
  // Get timezone from segment
  const effectiveTimeZoneId = segment.startTimeZoneId || null;
  
  // Calculate local and UTC dates
  let wallStartDate: Date | null = null;
  let wallStartTime: Date | null = null;
  let wallEndDate: Date | null = null;
  let wallEndTime: Date | null = null;
  let utcStartTime: Date | null = startTime || null;
  let utcEndTime: Date | null = endTime || null;
  
  // If local date/time strings are provided, use them for wall_* fields and calculate UTC
  if (localStartDate) {
    wallStartDate = stringToPgDate(localStartDate);
    wallStartTime = localStartTime ? stringToPgTime(localStartTime) : null;
    if (effectiveTimeZoneId) {
      utcStartTime = localToUTC(localStartDate, localStartTime || null, effectiveTimeZoneId, false);
    }
  }
  
  if (localEndDate) {
    wallEndDate = stringToPgDate(localEndDate);
    wallEndTime = localEndTime ? stringToPgTime(localEndTime) : null;
    if (effectiveTimeZoneId) {
      utcEndTime = localToUTC(localEndDate, localEndTime || null, effectiveTimeZoneId, true);
    }
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
      // Local time fields (primary)
      wall_start_date: wallStartDate,
      wall_start_time: wallStartTime,
      wall_end_date: wallEndDate,
      wall_end_time: wallEndTime,
      // UTC fields (for sorting)
      startTime: utcStartTime,
      endTime: utcEndTime,
      // Timezone
      timeZoneId: effectiveTimeZoneId,
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
