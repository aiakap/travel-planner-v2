"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { queueReservationImageGeneration } from "./queue-image-generation";

export async function createReservation(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const segmentId = formData.get("segmentId")?.toString();
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

  if (!segmentId || !name || !reservationTypeId || !reservationStatusId) {
    throw new Error("Missing required fields");
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

  // Determine image handling
  const finalImageUrl = imageUrl || null;
  const imageIsCustom = !!imageUrl;

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      name,
      confirmationNumber: confirmationNumber || null,
      notes: notes || null,
      reservationTypeId,
      reservationStatusId,
      segmentId,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      cost: cost ? parseFloat(cost) : null,
      currency: currency || null,
      location: location || null,
      url: url || null,
      imageUrl: finalImageUrl,
      imageIsCustom,
      // Flight-specific fields
      departureLocation: departureLocation || null,
      departureTimezone: departureTimezone || null,
      arrivalLocation: arrivalLocation || null,
      arrivalTimezone: arrivalTimezone || null,
    },
  });

  // Queue image generation if user didn't upload one
  if (!imageUrl) {
    try {
      const queueId = await queueReservationImageGeneration(reservation.id);
      console.log(`✓ Queued reservation image generation: ${queueId}`);
    } catch (error) {
      console.error("❌ Failed to queue reservation image generation:", error);
      console.error("Error details:", error);
      // Don't fail the reservation creation if queue fails
    }
  }

  revalidatePath(`/trips/${segment.trip.id}`);
  redirect(`/trips/${segment.trip.id}`);
}
