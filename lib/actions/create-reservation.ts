"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { queueReservationImageGeneration } from "./queue-image-generation";
import { GooglePlaceData } from "@/lib/types/place-suggestion";

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

/**
 * Create a reservation from a place suggestion with Google Places data
 */
export async function createReservationFromSuggestion({
  tripId,
  placeName,
  placeData,
  day,
  startTime,
  endTime,
  cost,
  category,
  type,
  status: statusType = "suggested",
}: {
  tripId: string;
  placeName: string;
  placeData: GooglePlaceData | null;
  day: number;
  startTime: string;
  endTime: string;
  cost: number;
  category: string;
  type: string;
  status?: "suggested" | "planned" | "confirmed";
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify trip belongs to user
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      segments: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found or unauthorized");
  }

  // Calculate the actual date for the day
  const tripStartDate = new Date(trip.startDate);
  const targetDate = new Date(tripStartDate);
  targetDate.setDate(targetDate.getDate() + day - 1);

  // Parse time and create full datetime
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startDateTime = new Date(targetDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(targetDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  // Find appropriate segment for this day
  // Try to find a segment that overlaps with this day
  let targetSegment = trip.segments.find((segment) => {
    if (!segment.startTime) return false;
    const segmentDate = new Date(segment.startTime);
    return (
      segmentDate.getFullYear() === targetDate.getFullYear() &&
      segmentDate.getMonth() === targetDate.getMonth() &&
      segmentDate.getDate() === targetDate.getDate()
    );
  });

  // If no segment found for this day, use the first segment
  if (!targetSegment && trip.segments.length > 0) {
    targetSegment = trip.segments[0];
  }

  // If no segment exists at all, create a default one
  if (!targetSegment) {
    console.log(`Creating default segment for trip ${tripId} (no segments exist)`);
    
    // Get or create default segment type
    const segmentType = await prisma.segmentType.findFirst({
      where: { name: "General" },
    }) || await prisma.segmentType.create({
      data: { name: "General" },
    });
    
    // Use place location if available, otherwise use a default location
    const lat = placeData?.geometry?.location?.lat || 0;
    const lng = placeData?.geometry?.location?.lng || 0;
    const locationName = placeData?.formattedAddress?.split(",")[0] || "Location";
    
    targetSegment = await prisma.segment.create({
      data: {
        tripId: tripId,
        name: "Main Itinerary",
        startTitle: locationName,
        startLat: lat,
        startLng: lng,
        endTitle: locationName,
        endLat: lat,
        endLng: lng,
        startTime: tripStartDate,
        endTime: new Date(trip.endDate),
        segmentTypeId: segmentType.id,
      },
    });
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

  // Map status type to database status name
  const statusNameMap = {
    suggested: "Pending",
    planned: "Pending", 
    confirmed: "Confirmed",
  };

  const statusName = statusNameMap[statusType];

  // Get reservation status
  const status = await prisma.reservationStatus.findFirst({
    where: { name: statusName },
  });

  if (!status) {
    throw new Error(`Could not find ${statusName} status`);
  }

  // Extract contact info from Google Places data
  const contactPhone = placeData?.phoneNumber || null;
  const website = placeData?.website || null;
  const address = placeData?.formattedAddress || null;
  const imageUrl = placeData?.photos?.[0]?.url || null;

  // Create reservation with Google Places data
  const reservation = await prisma.reservation.create({
    data: {
      name: placeName,
      segmentId: targetSegment.id,
      reservationTypeId: reservationType.id,
      reservationStatusId: status.id,
      startTime: startDateTime,
      endTime: endDateTime,
      cost: cost > 0 ? cost : null,
      currency: cost > 0 ? "USD" : null,
      location: address,
      url: website,
      imageUrl: imageUrl,
      imageIsCustom: !!imageUrl,
      contactPhone: contactPhone,
      notes: placeData?.openingHours?.weekdayText?.join("\n") || null,
    },
  });

  // Queue image generation if no image from Google Places
  if (!imageUrl) {
    try {
      const queueId = await queueReservationImageGeneration(reservation.id);
      console.log(`✓ Queued reservation image generation: ${queueId}`);
    } catch (error) {
      console.error("❌ Failed to queue reservation image generation:", error);
      // Don't fail the reservation creation if queue fails
    }
  }

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/experience-builder");

  return reservation;
}
