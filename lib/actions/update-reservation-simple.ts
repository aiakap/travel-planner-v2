"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";

export async function updateReservationSimple(reservationId: string, updates: {
  name?: string;
  confirmationNumber?: string;
  cost?: number;
  startTime?: string;
  endTime?: string;
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
}) {
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
  if (updates.startTime) updateData.startTime = new Date(updates.startTime);
  if (updates.endTime) updateData.endTime = new Date(updates.endTime);
  if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
  if (updates.location !== undefined) updateData.location = updates.location;
  
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

  await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
  });

  return { success: true };
}
