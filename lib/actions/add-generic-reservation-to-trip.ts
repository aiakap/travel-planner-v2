"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GenericReservation } from "@/lib/schemas/generic-reservation-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { getSegmentTimeZones } from "./timezone";

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

interface AddGenericReservationOptions {
  autoMatch?: boolean;
  minScore?: number;
  createSuggestedSegments?: boolean;
}

/**
 * Add generic reservation to a trip
 * 
 * Handles any type of reservation that doesn't fit specific plugins.
 * Maps AI-determined type/category to database reservation types.
 */
export async function addGenericReservationToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  reservationData: GenericReservation;
  options?: AddGenericReservationOptions;
}) {
  const { tripId, segmentId, reservationData, options = {} } = params;
  const { autoMatch = false, minScore = 70, createSuggestedSegments = false } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log(`📋 Adding generic reservation to trip ${tripId}: ${reservationData.name}`);
  console.log(`   Type: ${reservationData.reservationType}, Category: ${reservationData.category}`);

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

  // Map AI-determined category to database category
  const categoryMap: Record<string, string> = {
    'Travel': 'Travel',
    'Stay': 'Stay',
    'Activity': 'Activity',
    'Dining': 'Dining',
    'Other': 'Activity', // Default "Other" to Activity
  };

  const dbCategory = categoryMap[reservationData.category] || 'Activity';

  // Try to get the specific reservation type, with fallbacks
  let reservationType;
  try {
    // First try the AI-determined type
    reservationType = await getReservationType(dbCategory, reservationData.reservationType);
    console.log(`✅ Found exact match for type: ${dbCategory}/${reservationData.reservationType}`);
  } catch {
    // If that fails, try common fallbacks based on category
    console.log(`⚠️ Type ${reservationData.reservationType} not found, trying fallbacks...`);
    
    try {
      if (dbCategory === 'Travel') {
        reservationType = await getReservationType('Travel', 'Bus'); // Generic transport
      } else if (dbCategory === 'Stay') {
        reservationType = await getReservationType('Stay', 'Hotel'); // Generic stay
      } else if (dbCategory === 'Dining') {
        reservationType = await getReservationType('Dining', 'Restaurant'); // Generic dining
      } else {
        reservationType = await getReservationType('Activity', 'Tour'); // Generic activity
      }
      console.log(`✅ Using fallback type: ${reservationType.categoryName}/${reservationType.name}`);
    } catch {
      // Last resort: just use the first available type in the category
      console.error(`❌ Could not find reservation type. Category: ${dbCategory}, Type: ${reservationData.reservationType}`);
      throw new Error(`Reservation type not found. Please ensure database is seeded with reservation types.`);
    }
  }
  
  const confirmedStatus = await getReservationStatus("Confirmed");

  let targetSegmentId = segmentId;

  // If no segment provided and autoMatch is enabled, try to find best match by date
  if (!targetSegmentId && autoMatch) {
    console.log('🔍 Auto-matching reservation to segment...');
    
    const startDateTime = new Date(`${reservationData.startDate}T${reservationData.startTime || '12:00'}`);
    
    // Find segment that overlaps with reservation date
    const matchingSegment = trip.segments.find(segment => {
      if (!segment.startTime || !segment.endTime) return false;
      
      const segmentStart = new Date(segment.startTime);
      const segmentEnd = new Date(segment.endTime);
      
      return startDateTime >= segmentStart && startDateTime <= segmentEnd;
    });

    if (matchingSegment) {
      targetSegmentId = matchingSegment.id;
      console.log(`✅ Auto-matched to segment: ${matchingSegment.name}`);
    } else if (createSuggestedSegments) {
      console.log('⭐ No match found, creating new segment...');
      
      // Determine segment type based on category
      const segmentTypeMap: Record<string, string> = {
        'Travel': 'Travel',
        'Stay': 'Stay',
        'Activity': 'Tour',
        'Dining': 'Stay', // Put dining in a stay segment
      };
      
      const segmentTypeName = segmentTypeMap[dbCategory] || 'Tour';
      
      const segmentType = await prisma.segmentType.findFirst({
        where: { name: segmentTypeName }
      });

      if (!segmentType) {
        throw new Error(`Segment type ${segmentTypeName} not found. Run database seed.`);
      }

      // Extract location for segment name
      const cityMatch = reservationData.address.match(/([^,]+),/);
      const city = cityMatch ? cityMatch[1].trim() : reservationData.location;
      const segmentName = city;

      // Geocode the location
      const geocoded = await geocodeLocation(reservationData.address || reservationData.location);

      // Create segment for the reservation period
      const startDate = new Date(reservationData.startDate);
      const endDate = new Date(reservationData.endDate || reservationData.startDate);
      
      const segmentStart = new Date(startDate);
      segmentStart.setHours(0, 0, 0, 0);
      const segmentEnd = new Date(endDate);
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

  // Geocode the location
  const geocoded = await geocodeLocation(reservationData.address || reservationData.location);

  // Build comprehensive notes
  const notesLines = [];
  notesLines.push(`Type: ${reservationData.reservationType}`);
  if (reservationData.vendor) notesLines.push(`Provider: ${reservationData.vendor}`);
  if (reservationData.participants > 1) notesLines.push(`Participants: ${reservationData.participants}`);
  if (reservationData.notes) notesLines.push(`Details: ${reservationData.notes}`);
  if (reservationData.cancellationPolicy) notesLines.push(`Cancellation: ${reservationData.cancellationPolicy}`);

  const notes = notesLines.join('\n');

  // Parse start and end times
  const startDateTime = new Date(`${reservationData.startDate}T${reservationData.startTime || '12:00'}`);
  const endDateTime = reservationData.endTime 
    ? new Date(`${reservationData.endDate}T${reservationData.endTime}`)
    : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  // Create the reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: reservationData.name,
      confirmationNumber: reservationData.confirmationNumber,
      notes,
      reservationTypeId: reservationType.id,
      reservationStatusId: confirmedStatus.id,
      segmentId: targetSegmentId,
      startTime: startDateTime,
      endTime: endDateTime,
      cost: reservationData.cost || undefined,
      currency: reservationData.currency || undefined,
      location: reservationData.address || reservationData.location,
      latitude: geocoded?.lat,
      longitude: geocoded?.lng,
      vendor: reservationData.vendor || undefined,
      contactPhone: reservationData.contactPhone || undefined,
      contactEmail: reservationData.contactEmail || undefined,
      cancellationPolicy: reservationData.cancellationPolicy || undefined,
    },
  });

  console.log(`✅ Created generic reservation: ${reservationData.name}`);

  return {
    success: true,
    reservation,
  };
}
