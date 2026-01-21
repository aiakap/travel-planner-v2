"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { queueReservationImageGeneration } from "./queue-image-generation";

export async function updateReservation(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const reservationId = formData.get("reservationId")?.toString();
  const name = formData.get("name")?.toString();
  const reservationTypeId = formData.get("reservationTypeId")?.toString();
  const reservationStatusId = formData.get("reservationStatusId")?.toString();
  const confirmationNumber = formData.get("confirmationNumber")?.toString();
  const notes = formData.get("notes")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const cost = formData.get("cost")?.toString();
  const currency = formData.get("currency")?.toString();
  const location = formData.get("location")?.toString();
  const url = formData.get("url")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();

  // Flight-specific fields
  const departureLocation = formData.get("departureLocation")?.toString();
  const departureTimezone = formData.get("departureTimezone")?.toString();
  const arrivalLocation = formData.get("arrivalLocation")?.toString();
  const arrivalTimezone = formData.get("arrivalTimezone")?.toString();

  if (!reservationId || !name || !reservationTypeId || !reservationStatusId) {
    throw new Error("Missing required fields");
  }

  // Verify reservation belongs to user via segment -> trip
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      segment: {
        trip: {
          userId: session.user.id,
        },
      },
    },
    include: {
      segment: {
        include: {
          trip: true,
        },
      },
      reservationType: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!existingReservation) {
    throw new Error("Reservation not found or unauthorized");
  }

  // Check if relevant fields changed
  const relevantFieldsChanged =
    name !== existingReservation.name ||
    notes !== existingReservation.notes ||
    location !== existingReservation.location;

  // Prepare update data
  const updateData: any = {
    name,
    confirmationNumber: confirmationNumber || null,
    notes: notes || null,
    reservationTypeId,
    reservationStatusId,
    startTime: startTime ? new Date(startTime) : null,
    endTime: endTime ? new Date(endTime) : null,
    cost: cost ? parseFloat(cost) : null,
    currency: currency || null,
    location: location || null,
    url: url || null,
    // Flight-specific fields
    departureLocation: departureLocation || null,
    departureTimezone: departureTimezone || null,
    arrivalLocation: arrivalLocation || null,
    arrivalTimezone: arrivalTimezone || null,
  };

  // Handle image logic
  if (imageUrl && imageUrl !== existingReservation.imageUrl) {
    // User uploaded new custom image
    updateData.imageUrl = imageUrl;
    updateData.imageIsCustom = true;
  }

  // Update the reservation
  await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
  });

  // Queue image regeneration if it's not a custom image
  if (!imageUrl || imageUrl === existingReservation.imageUrl) {
    if (!existingReservation.imageIsCustom) {
      try {
        await queueReservationImageGeneration(reservationId);
      } catch (error) {
        console.error("Failed to queue reservation image:", error);
      }
    }
  }

  revalidatePath(`/trips/${existingReservation.segment.trip.id}`);
  redirect(`/trips/${existingReservation.segment.trip.id}`);
}
