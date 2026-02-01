"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { localToUTC, stringToPgDate, stringToPgTime, parseToLocalComponents } from "@/lib/utils/local-time";

export async function updateReservationSimple(rawReservationId: string | number, updates: {
  name?: string;
  confirmationNumber?: string;
  cost?: number;
  startTime?: string;
  endTime?: string;
  /** Local start date in YYYY-MM-DD format (new approach) */
  localStartDate?: string;
  /** Local start time in HH:mm format (new approach) */
  localStartTime?: string;
  /** Local end date in YYYY-MM-DD format (new approach) */
  localEndDate?: string;
  /** Local end time in HH:mm format (new approach) */
  localEndTime?: string;
  vendor?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timeZoneId?: string;
  timeZoneName?: string;
  imageUrl?: string;
  imageIsCustom?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  notes?: string;
  cancellationPolicy?: string;
  reservationStatusId?: string;
}) {
  // Ensure ID is always a string (defensive type conversion)
  const reservationId = String(rawReservationId);
  
  // Validate it's a valid ID
  if (!reservationId || reservationId === 'undefined' || reservationId === 'null') {
    throw new Error("Invalid reservation ID");
  }

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      segment: { trip: { userId: session.user.id } },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.confirmationNumber !== undefined) 
    updateData.confirmationNumber = updates.confirmationNumber;
  if (updates.cost !== undefined) updateData.cost = updates.cost;
  if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
  if (updates.location !== undefined) updateData.location = updates.location;
  
  // Get effective timezone
  const effectiveTimeZoneId = updates.timeZoneId || reservation.timeZoneId;
  
  // Handle local date/time fields (new approach)
  if (updates.localStartDate !== undefined) {
    updateData.wall_start_date = updates.localStartDate ? stringToPgDate(updates.localStartDate) : null;
    updateData.wall_start_time = updates.localStartTime ? stringToPgTime(updates.localStartTime) : null;
    if (updates.localStartDate && effectiveTimeZoneId) {
      updateData.startTime = localToUTC(updates.localStartDate, updates.localStartTime || null, effectiveTimeZoneId, false);
    }
  } else if (updates.startTime) {
    // Fall back to old approach - parse datetime-local string
    const startComponents = parseToLocalComponents(updates.startTime);
    if (startComponents.date) {
      updateData.wall_start_date = stringToPgDate(startComponents.date);
      updateData.wall_start_time = stringToPgTime(startComponents.time);
      if (effectiveTimeZoneId) {
        updateData.startTime = localToUTC(startComponents.date, startComponents.time, effectiveTimeZoneId, false);
      } else {
        updateData.startTime = new Date(updates.startTime);
      }
    }
  }
  
  if (updates.localEndDate !== undefined) {
    updateData.wall_end_date = updates.localEndDate ? stringToPgDate(updates.localEndDate) : null;
    updateData.wall_end_time = updates.localEndTime ? stringToPgTime(updates.localEndTime) : null;
    if (updates.localEndDate && effectiveTimeZoneId) {
      updateData.endTime = localToUTC(updates.localEndDate, updates.localEndTime || null, effectiveTimeZoneId, true);
    }
  } else if (updates.endTime) {
    // Fall back to old approach
    const endComponents = parseToLocalComponents(updates.endTime);
    if (endComponents.date) {
      updateData.wall_end_date = stringToPgDate(endComponents.date);
      updateData.wall_end_time = stringToPgTime(endComponents.time);
      if (effectiveTimeZoneId) {
        updateData.endTime = localToUTC(endComponents.date, endComponents.time, effectiveTimeZoneId, true);
      } else {
        updateData.endTime = new Date(updates.endTime);
      }
    }
  }
  
  // Validate coordinates if provided
  if (updates.latitude !== undefined) {
    if (updates.latitude < -90 || updates.latitude > 90) {
      throw new Error("Invalid latitude: must be between -90 and 90");
    }
    updateData.latitude = updates.latitude;
  }
  if (updates.longitude !== undefined) {
    if (updates.longitude < -180 || updates.longitude > 180) {
      throw new Error("Invalid longitude: must be between -180 and 180");
    }
    updateData.longitude = updates.longitude;
  }
  
  if (updates.timeZoneId !== undefined) updateData.timeZoneId = updates.timeZoneId;
  if (updates.timeZoneName !== undefined) updateData.timeZoneName = updates.timeZoneName;
  if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
  if (updates.imageIsCustom !== undefined) updateData.imageIsCustom = updates.imageIsCustom;
  if (updates.contactPhone !== undefined) updateData.contactPhone = updates.contactPhone;
  if (updates.contactEmail !== undefined) updateData.contactEmail = updates.contactEmail;
  if (updates.website !== undefined) updateData.url = updates.website;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.cancellationPolicy !== undefined) updateData.cancellationPolicy = updates.cancellationPolicy;
  if (updates.reservationStatusId !== undefined) updateData.reservationStatusId = updates.reservationStatusId;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
  });

  return { success: true };
}
