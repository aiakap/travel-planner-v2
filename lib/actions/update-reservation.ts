"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { queueReservationImageGeneration } from "./queue-image-generation";
import { localToUTC, stringToPgDate, stringToPgTime, parseToLocalComponents } from "@/lib/utils/local-time";

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
  const returnTo = formData.get("returnTo")?.toString();
  const contactPhone = formData.get("contactPhone")?.toString();
  const contactEmail = formData.get("contactEmail")?.toString();
  const cancellationPolicy = formData.get("cancellationPolicy")?.toString();
  const vendor = formData.get("vendor")?.toString();
  const latitude = formData.get("latitude")?.toString();
  const longitude = formData.get("longitude")?.toString();
  const timeZoneId = formData.get("timeZoneId")?.toString();
  const timeZoneName = formData.get("timeZoneName")?.toString();

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

  // Get effective timezone
  const effectiveTimeZoneId = timeZoneId || existingReservation.timeZoneId || existingReservation.segment.startTimeZoneId || null;

  // Prepare update data
  const updateData: any = {
    name,
    confirmationNumber: confirmationNumber || null,
    notes: notes || null,
    reservationTypeId,
    reservationStatusId,
    cost: cost ? parseFloat(cost) : null,
    currency: currency || null,
    location: location || null,
    url: url || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
    cancellationPolicy: cancellationPolicy || null,
    vendor: vendor || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    timeZoneId: effectiveTimeZoneId,
    timeZoneName: timeZoneName || null,
    // Flight-specific fields
    departureLocation: departureLocation || null,
    departureTimezone: departureTimezone || null,
    arrivalLocation: arrivalLocation || null,
    arrivalTimezone: arrivalTimezone || null,
  };

  // Parse datetime-local values into local date/time components
  if (startTime) {
    const startComponents = parseToLocalComponents(startTime);
    if (startComponents.date) {
      updateData.wall_start_date = stringToPgDate(startComponents.date);
      updateData.wall_start_time = stringToPgTime(startComponents.time);
      if (effectiveTimeZoneId) {
        updateData.startTime = localToUTC(startComponents.date, startComponents.time, effectiveTimeZoneId, false);
      } else {
        updateData.startTime = new Date(startTime);
      }
    }
  } else {
    updateData.wall_start_date = null;
    updateData.wall_start_time = null;
    updateData.startTime = null;
  }
  
  if (endTime) {
    const endComponents = parseToLocalComponents(endTime);
    if (endComponents.date) {
      updateData.wall_end_date = stringToPgDate(endComponents.date);
      updateData.wall_end_time = stringToPgTime(endComponents.time);
      if (effectiveTimeZoneId) {
        updateData.endTime = localToUTC(endComponents.date, endComponents.time, effectiveTimeZoneId, true);
      } else {
        updateData.endTime = new Date(endTime);
      }
    }
  } else {
    updateData.wall_end_date = null;
    updateData.wall_end_time = null;
    updateData.endTime = null;
  }

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
  
  // Redirect to returnTo if provided, otherwise default to trip page
  if (returnTo) {
    redirect(returnTo);
  } else {
    redirect(`/trips/${existingReservation.segment.trip.id}`);
  }
}
