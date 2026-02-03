"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventExtraction } from "@/lib/schemas/event-extraction-schema";
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

interface AddEventsOptions {
  autoMatch?: boolean;
  minScore?: number;
  createSuggestedSegments?: boolean;
}

/**
 * Add event/attraction tickets to a trip
 * 
 * Creates a reservation for event or attraction tickets.
 * Can auto-match to existing segments or create new ones.
 */
export async function addEventsToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  eventData: EventExtraction;
  options?: AddEventsOptions;
}) {
  const { tripId, segmentId, eventData, options = {} } = params;
  const { autoMatch = false, minScore = 70, createSuggestedSegments = false } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log(`🎫 Adding event tickets to trip ${tripId}: ${eventData.eventName}`);

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

  // Determine reservation type based on event type
  let reservationType;
  const eventTypeLower = eventData.eventType.toLowerCase();
  
  if (eventTypeLower.includes('museum') || eventTypeLower.includes('tour') || 
      eventTypeLower.includes('attraction') || eventTypeLower.includes('theme park')) {
    // Try to get specific type, fall back to generic
    try {
      reservationType = await getReservationType("Activity", "Museum");
    } catch {
      reservationType = await getReservationType("Activity", "Tour");
    }
  } else {
    // Default to Event Tickets or Tour
    try {
      reservationType = await getReservationType("Activity", "Event Tickets");
    } catch {
      reservationType = await getReservationType("Activity", "Tour");
    }
  }
  
  const confirmedStatus = await getReservationStatus("Confirmed");

  let targetSegmentId = segmentId;

  // If no segment provided and autoMatch is enabled, try to find best match by date/location
  if (!targetSegmentId && autoMatch) {
    console.log('🔍 Auto-matching event to segment...');
    
    const eventDateTime = new Date(`${eventData.eventDate}T${eventData.eventTime || '12:00'}`);
    
    // Find segment that overlaps with event date
    const matchingSegment = trip.segments.find(segment => {
      if (!segment.startTime || !segment.endTime) return false;
      
      const segmentStart = new Date(segment.startTime);
      const segmentEnd = new Date(segment.endTime);
      
      return eventDateTime >= segmentStart && eventDateTime <= segmentEnd;
    });

    if (matchingSegment) {
      targetSegmentId = matchingSegment.id;
      console.log(`✅ Auto-matched to segment: ${matchingSegment.name}`);
    } else if (createSuggestedSegments) {
      console.log('⭐ No match found, creating new segment for event...');
      
      // Create a new segment for this event
      const segmentType = await prisma.segmentType.findFirst({
        where: { name: "Tour" } // Use Tour for activities
      });

      if (!segmentType) {
        throw new Error("Segment type not found. Run database seed.");
      }

      // Extract city from address
      const cityMatch = eventData.address.match(/([^,]+),/);
      const city = cityMatch ? cityMatch[1].trim() : eventData.venueName;
      const segmentName = `${city}`;

      // Geocode the venue location
      const geocoded = await geocodeLocation(eventData.address || eventData.venueName);

      // Create segment for the day of the event
      const eventDate = new Date(eventData.eventDate);
      const segmentStart = new Date(eventDate);
      segmentStart.setHours(0, 0, 0, 0);
      const segmentEnd = new Date(eventDate);
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

  // Geocode the venue location
  const geocoded = await geocodeLocation(eventData.address || eventData.venueName);

  // Build notes with ticket and event details
  const notesLines = [];
  notesLines.push(`Venue: ${eventData.venueName}`);
  if (eventData.eventType) notesLines.push(`Type: ${eventData.eventType}`);
  if (eventData.doorsOpenTime) notesLines.push(`Doors open: ${eventData.doorsOpenTime}`);
  
  // Add ticket details
  const totalTickets = eventData.tickets.reduce((sum, t) => sum + t.quantity, 0);
  notesLines.push(`Total tickets: ${totalTickets}`);
  eventData.tickets.forEach(ticket => {
    const ticketLine = `${ticket.quantity}x ${ticket.ticketType}`;
    if (ticket.seatInfo) {
      notesLines.push(`${ticketLine} - ${ticket.seatInfo}`);
    } else {
      notesLines.push(ticketLine);
    }
  });
  
  if (eventData.platform) notesLines.push(`Booked via: ${eventData.platform}`);
  if (eventData.specialInstructions) notesLines.push(`Instructions: ${eventData.specialInstructions}`);

  const notes = notesLines.join('\n');

  // Parse event time for startTime
  const eventDateTime = new Date(`${eventData.eventDate}T${eventData.eventTime || '12:00'}`);
  
  // Assume 3 hour event duration (can vary widely)
  const endDateTime = new Date(eventDateTime);
  endDateTime.setHours(endDateTime.getHours() + 3);

  // Create the reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: eventData.eventName,
      confirmationNumber: eventData.confirmationNumber,
      notes,
      reservationTypeId: reservationType.id,
      reservationStatusId: confirmedStatus.id,
      segmentId: targetSegmentId,
      startTime: eventDateTime,
      endTime: endDateTime,
      cost: eventData.totalCost || undefined,
      currency: eventData.currency || undefined,
      location: eventData.address || eventData.venueName,
      latitude: geocoded?.lat,
      longitude: geocoded?.lng,
      vendor: eventData.platform || undefined,
    },
  });

  // Trigger async enrichment for image
  const locationQuery = eventData.address 
    ? `${eventData.eventName} ${eventData.venueName} ${eventData.address}`
    : `${eventData.eventName} ${eventData.venueName}`;
  
  enrichReservation(reservation.id, {
    locationQuery,
  }).catch((error) => {
    console.error(`[AddEvents] Enrichment failed for reservation ${reservation.id}:`, error);
  });

  console.log(`✅ Created event reservation: ${eventData.eventName}`);

  return {
    success: true,
    reservation,
  };
}
