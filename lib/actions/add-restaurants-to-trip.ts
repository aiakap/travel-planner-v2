"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RestaurantExtraction } from "@/lib/schemas/restaurant-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { getSegmentTimeZones } from "./timezone";
import { enrichReservation } from "./enrich-reservation";

// Geocoding helper
async function geocodeLocation(location: string): Promise<{
  lat: number;
  lng: number;
  formatted: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Google Maps API key not configured, using default coordinates");
    return { lat: 0, lng: 0, formatted: location };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address,
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return { lat: 0, lng: 0, formatted: location };
}

interface AddRestaurantsOptions {
  autoMatch?: boolean;
  minScore?: number;
  createSuggestedSegments?: boolean;
}

/**
 * Add restaurant reservation to a trip
 * 
 * Creates a reservation for a restaurant booking.
 * Can auto-match to existing segments or create new ones.
 */
export async function addRestaurantsToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  restaurantData: RestaurantExtraction;
  options?: AddRestaurantsOptions;
}) {
  const { tripId, segmentId, restaurantData, options = {} } = params;
  const { autoMatch = false, minScore = 70, createSuggestedSegments = false } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log(`🍽️ Adding restaurant reservation to trip ${tripId}: ${restaurantData.restaurantName}`);

  // Verify trip ownership and get segments
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: { 
      segments: {
        include: {
          segmentType: true
        },
        orderBy: { order: 'asc' }
      }
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Get reservation type and status
  const restaurantType = await getReservationType("Dining", "Restaurant");
  const confirmedStatus = await getReservationStatus("Confirmed");

  let targetSegmentId = segmentId;

  // If no segment provided and autoMatch is enabled, try to find best match by date/location
  if (!targetSegmentId && autoMatch) {
    console.log('🔍 Auto-matching restaurant to segment...');
    
    const reservationDateTime = new Date(`${restaurantData.reservationDate}T${restaurantData.reservationTime.includes(':') ? restaurantData.reservationTime : '19:00'}`);
    
    // Find segment that overlaps with reservation date
    const matchingSegment = trip.segments.find(segment => {
      if (!segment.startTime || !segment.endTime) return false;
      
      const segmentStart = new Date(segment.startTime);
      const segmentEnd = new Date(segment.endTime);
      
      return reservationDateTime >= segmentStart && reservationDateTime <= segmentEnd;
    });

    if (matchingSegment) {
      targetSegmentId = matchingSegment.id;
      console.log(`✅ Auto-matched to segment: ${matchingSegment.name}`);
    } else if (createSuggestedSegments) {
      console.log('⭐ No match found, creating new segment for dining...');
      
      // Create a new segment for this restaurant
      const segmentType = await prisma.segmentType.findFirst({
        where: { name: "Stay" } // Use Stay as default, or could be Tour/Travel
      });

      if (!segmentType) {
        throw new Error("Segment type not found. Run database seed.");
      }

      // Extract city from address
      const cityMatch = restaurantData.address.match(/([^,]+),/);
      const city = cityMatch ? cityMatch[1].trim() : "Dining";
      const segmentName = `${city}`;

      // Geocode the restaurant location
      const geocoded = await geocodeLocation(restaurantData.address || restaurantData.restaurantName);

      // Create segment for the day of the reservation
      const reservationDate = new Date(restaurantData.reservationDate);
      const segmentStart = new Date(reservationDate);
      segmentStart.setHours(0, 0, 0, 0);
      const segmentEnd = new Date(reservationDate);
      segmentEnd.setHours(23, 59, 59, 999);

      // Fetch timezone information for segment
      const timezones = geocoded ? await getSegmentTimeZones(
        geocoded.lat,
        geocoded.lng,
        geocoded.lat,
        geocoded.lng,
        segmentStart,
        segmentEnd
      ) : { start: null, end: null, hasTimeZoneChange: false };

      const newSegment = await prisma.segment.create({
        data: {
          name: segmentName,
          tripId: trip.id,
          segmentTypeId: segmentType.id,
          startTitle: city,
          startLat: geocoded?.lat || 0,
          startLng: geocoded?.lng || 0,
          endTitle: city,
          endLat: geocoded?.lat || 0,
          endLng: geocoded?.lng || 0,
          startTime: segmentStart,
          endTime: segmentEnd,
          startTimeZoneId: timezones.start?.timeZoneId ?? null,
          startTimeZoneName: timezones.start?.timeZoneName ?? null,
          endTimeZoneId: timezones.end?.timeZoneId ?? null,
          endTimeZoneName: timezones.end?.timeZoneName ?? null,
          order: trip.segments.length,
        },
      });

      targetSegmentId = newSegment.id;
      console.log(`✅ Created new segment: ${segmentName}`);
    }
  }

  if (!targetSegmentId) {
    throw new Error("No segment specified and auto-matching failed. Please select a segment manually.");
  }

  // Geocode the restaurant location
  const geocoded = await geocodeLocation(restaurantData.address || restaurantData.restaurantName);

  // Build notes with additional details
  const notesLines = [];
  if (restaurantData.partySize) notesLines.push(`Party size: ${restaurantData.partySize}`);
  if (restaurantData.specialRequests) notesLines.push(`Special requests: ${restaurantData.specialRequests}`);
  if (restaurantData.phone) notesLines.push(`Phone: ${restaurantData.phone}`);
  if (restaurantData.platform) notesLines.push(`Booked via: ${restaurantData.platform}`);
  if (restaurantData.cancellationPolicy) notesLines.push(`Cancellation policy: ${restaurantData.cancellationPolicy}`);

  const notes = notesLines.join('\n');

  // Parse reservation time for startTime
  const reservationDateTime = new Date(`${restaurantData.reservationDate}T${restaurantData.reservationTime.includes(':') ? restaurantData.reservationTime : '19:00'}`);
  
  // Assume 2 hour dining duration
  const endDateTime = new Date(reservationDateTime);
  endDateTime.setHours(endDateTime.getHours() + 2);

  // Create the reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: restaurantData.restaurantName,
      confirmationNumber: restaurantData.confirmationNumber,
      notes,
      reservationTypeId: restaurantType.id,
      reservationStatusId: confirmedStatus.id,
      segmentId: targetSegmentId,
      startTime: reservationDateTime,
      endTime: endDateTime,
      cost: restaurantData.cost || undefined,
      currency: restaurantData.currency || undefined,
      location: restaurantData.address || restaurantData.restaurantName,
      latitude: geocoded?.lat,
      longitude: geocoded?.lng,
      contactPhone: restaurantData.phone || undefined,
    },
  });

  // Trigger async enrichment for image
  const locationQuery = restaurantData.address 
    ? `${restaurantData.restaurantName} ${restaurantData.address}`
    : restaurantData.restaurantName;
  
  enrichReservation(reservation.id, {
    locationQuery,
  }).catch((error) => {
    console.error(`[AddRestaurants] Enrichment failed for reservation ${reservation.id}:`, error);
  });

  console.log(`✅ Created restaurant reservation: ${restaurantData.restaurantName}`);

  return {
    success: true,
    reservation,
  };
}
