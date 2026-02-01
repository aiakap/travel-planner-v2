"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { queueReservationImageGeneration } from "./queue-image-generation";
import { GooglePlaceData } from "@/lib/types/place-suggestion";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { localToUTC, stringToPgDate, stringToPgTime, parseToLocalComponents } from "@/lib/utils/local-time";

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
  // Timezone field
  const timeZoneId = formData.get("timeZoneId")?.toString();

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

  // Get timezone from form or fall back to segment timezone
  const effectiveTimeZoneId = timeZoneId || segment.startTimeZoneId || null;
  
  // Parse datetime-local values into local date/time components
  let wallStartDate: Date | null = null;
  let wallStartTime: Date | null = null;
  let wallEndDate: Date | null = null;
  let wallEndTime: Date | null = null;
  let utcStartTime: Date | null = null;
  let utcEndTime: Date | null = null;
  
  if (startTime) {
    const startComponents = parseToLocalComponents(startTime);
    if (startComponents.date) {
      wallStartDate = stringToPgDate(startComponents.date);
      wallStartTime = stringToPgTime(startComponents.time);
      if (effectiveTimeZoneId) {
        utcStartTime = localToUTC(startComponents.date, startComponents.time, effectiveTimeZoneId, false);
      } else {
        utcStartTime = new Date(startTime);
      }
    }
  }
  
  if (endTime) {
    const endComponents = parseToLocalComponents(endTime);
    if (endComponents.date) {
      wallEndDate = stringToPgDate(endComponents.date);
      wallEndTime = stringToPgTime(endComponents.time);
      if (effectiveTimeZoneId) {
        utcEndTime = localToUTC(endComponents.date, endComponents.time, effectiveTimeZoneId, true);
      } else {
        utcEndTime = new Date(endTime);
      }
    }
  }

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      name,
      confirmationNumber: confirmationNumber || null,
      notes: notes || null,
      reservationTypeId,
      reservationStatusId,
      segmentId,
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
  segmentId,
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
  segmentId?: string;
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
  console.log(`[createReservationFromSuggestion] Trip dates:`, {
    startDate: trip.startDate,
    endDate: trip.endDate,
    day: day,
  });
  
  const tripStartDate = new Date(trip.startDate);
  
  // Validate trip start date
  if (isNaN(tripStartDate.getTime())) {
    console.error(`[createReservationFromSuggestion] Invalid trip start date:`, trip.startDate);
    throw new Error(`Invalid trip start date: ${trip.startDate}. Please ensure the trip has valid dates.`);
  }
  
  const targetDate = new Date(tripStartDate);
  targetDate.setDate(targetDate.getDate() + day - 1);
  
  console.log(`[createReservationFromSuggestion] Calculated dates:`, {
    tripStartDate: tripStartDate.toISOString(),
    targetDate: targetDate.toISOString(),
    startTime,
    endTime,
  });

  // Parse time and create full datetime
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let startDateTime: Date;
  let endDateTime: Date;

  // For hotels (Stay category), span the entire segment if segmentId is provided
  if (category === "Stay" && segmentId) {
    // Find the segment to get its start and end dates
    const segment = trip.segments.find((s) => s.id === segmentId);
    
    if (segment && segment.startTime && segment.endTime) {
      // Use segment start date for check-in
      startDateTime = new Date(segment.startTime);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      // Use segment end date for check-out
      endDateTime = new Date(segment.endTime);
      endDateTime.setHours(endHour, endMinute, 0, 0);
    } else {
      // Fallback to same-day if segment dates not available
      startDateTime = new Date(targetDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      endDateTime = new Date(targetDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
    }
  } else {
    // For non-hotel items, use same-day reservation
    startDateTime = new Date(targetDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    endDateTime = new Date(targetDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
  }

  // Find appropriate segment for this reservation
  let targetSegment;
  
  // For hotels with segmentId, use the specified segment
  if (category === "Stay" && segmentId) {
    targetSegment = trip.segments.find((s) => s.id === segmentId);
  }
  
  // If no segment specified or not found, find a segment for this day
  if (!targetSegment) {
    targetSegment = trip.segments.find((segment) => {
      if (!segment.startTime) return false;
      const segmentDate = new Date(segment.startTime);
      return (
        segmentDate.getFullYear() === targetDate.getFullYear() &&
        segmentDate.getMonth() === targetDate.getMonth() &&
        segmentDate.getDate() === targetDate.getDate()
      );
    });
  }

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

  // Get cached reservation type
  const reservationType = await getReservationType(category, type);

  // Map status type to database status name
  const statusNameMap = {
    suggested: "Pending",
    planned: "Pending", 
    confirmed: "Confirmed",
  };

  const statusName = statusNameMap[statusType];

  // Get cached reservation status
  const status = await getReservationStatus(statusName);

  // Extract contact info and location from Google Places data
  const contactPhone = placeData?.phoneNumber || null;
  const website = placeData?.website || null;
  const address = placeData?.formattedAddress || null;
  const imageUrl = placeData?.photos?.[0]?.url || null;
  const latitude = placeData?.geometry?.location?.lat || null;
  const longitude = placeData?.geometry?.location?.lng || null;

  // Fetch timezone for the location
  let timeZoneId: string | null = null;
  let timeZoneName: string | null = null;
  
  if (latitude && longitude) {
    try {
      const { getTimeZoneForLocation } = await import("./timezone");
      const tzInfo = await getTimeZoneForLocation(latitude, longitude);
      if (tzInfo) {
        timeZoneId = tzInfo.timeZoneId;
        timeZoneName = tzInfo.timeZoneName;
        console.log(`[createReservationFromSuggestion] Fetched timezone for ${placeName}:`, {
          timeZoneId,
          timeZoneName
        });
      }
    } catch (error) {
      console.warn(`[createReservationFromSuggestion] Failed to fetch timezone:`, error);
    }
  }
  
  // Fallback to segment timezone if no location timezone
  if (!timeZoneId && targetSegment) {
    const segment = await prisma.segment.findUnique({
      where: { id: targetSegment.id },
      select: { startTimeZoneId: true, startTimeZoneName: true }
    });
    if (segment?.startTimeZoneId) {
      timeZoneId = segment.startTimeZoneId;
      timeZoneName = segment.startTimeZoneName;
      console.log(`[createReservationFromSuggestion] Using segment timezone:`, {
        timeZoneId,
        timeZoneName
      });
    }
  }

  // Calculate local date/time strings for wall_* fields
  const formatDateForPg = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const formatTimeForPg = (d: Date): string => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const wallStartDateStr = formatDateForPg(startDateTime);
  const wallStartTimeStr = formatTimeForPg(startDateTime);
  const wallEndDateStr = formatDateForPg(endDateTime);
  const wallEndTimeStr = formatTimeForPg(endDateTime);
  
  // Calculate UTC times for sorting
  let utcStartTime = startDateTime;
  let utcEndTime = endDateTime;
  if (timeZoneId) {
    utcStartTime = localToUTC(wallStartDateStr, wallStartTimeStr, timeZoneId, false);
    utcEndTime = localToUTC(wallEndDateStr, wallEndTimeStr, timeZoneId, true);
  }

  // Create reservation with Google Places data and timezone
  const reservation = await prisma.reservation.create({
    data: {
      name: placeName,
      segmentId: targetSegment.id,
      reservationTypeId: reservationType.id,
      reservationStatusId: status.id,
      // Local time fields (primary)
      wall_start_date: stringToPgDate(wallStartDateStr),
      wall_start_time: stringToPgTime(wallStartTimeStr),
      wall_end_date: stringToPgDate(wallEndDateStr),
      wall_end_time: stringToPgTime(wallEndTimeStr),
      // UTC fields (for sorting)
      startTime: utcStartTime,
      endTime: utcEndTime,
      timeZoneId,
      timeZoneName,
      latitude,
      longitude,
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
