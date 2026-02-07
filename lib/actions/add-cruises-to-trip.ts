"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CruiseExtraction } from "@/lib/schemas/cruise-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { enrichReservation } from "./enrich-reservation";
import { stringToPgDate, stringToPgTime } from "@/lib/utils/local-time";

interface AddCruisesOptions {
  autoMatch?: boolean;
  createSuggestedSegments?: boolean;
}

/**
 * Add cruise booking to a trip
 * 
 * Creates a reservation for a cruise booking.
 * Can auto-match to existing segments or create new ones.
 */
export async function addCruisesToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  cruiseData: CruiseExtraction;
  options?: AddCruisesOptions;
}) {
  const { tripId, segmentId, cruiseData, options = {} } = params;
  const { autoMatch = false, createSuggestedSegments = false } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log(`🚢 Adding cruise booking to trip ${tripId}: ${cruiseData.shipName}`);

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

  // Try to get Cruise type, fall back to Ferry or generic Travel
  let reservationType;
  try {
    reservationType = await getReservationType("Travel", "Cruise");
  } catch {
    try {
      reservationType = await getReservationType("Travel", "Ferry");
    } catch {
      reservationType = await getReservationType("Travel", "Flight"); // Last resort
    }
  }
  
  const confirmedStatus = await getReservationStatus("Confirmed");

  let targetSegmentId = segmentId;

  // If no segment provided and autoMatch is enabled, try to find best match by date
  if (!targetSegmentId && autoMatch) {
    console.log('🔍 Auto-matching cruise to segment...');
    
    const embarkationDateTime = new Date(`${cruiseData.embarkationDate}T${cruiseData.embarkationTime || '12:00'}`);
    const disembarkationDateTime = new Date(`${cruiseData.disembarkationDate}T${cruiseData.disembarkationTime || '12:00'}`);
    
    // Find segment that overlaps with cruise dates
    const matchingSegment = trip.segments.find(segment => {
      if (!segment.startTime || !segment.endTime) return false;
      
      const segmentStart = new Date(segment.startTime);
      const segmentEnd = new Date(segment.endTime);
      
      // Check if cruise overlaps with segment
      return (embarkationDateTime >= segmentStart && embarkationDateTime <= segmentEnd) ||
             (disembarkationDateTime >= segmentStart && disembarkationDateTime <= segmentEnd) ||
             (embarkationDateTime <= segmentStart && disembarkationDateTime >= segmentEnd);
    });

    if (matchingSegment) {
      targetSegmentId = matchingSegment.id;
      console.log(`✅ Auto-matched to segment: ${matchingSegment.name}`);
    } else if (createSuggestedSegments) {
      console.log('⭐ No match found, creating new segment for cruise...');
      
      // Create a new "Travel" segment for this cruise
      const travelType = await prisma.segmentType.findFirst({
        where: { name: "Travel" }
      });

      if (!travelType) {
        throw new Error("Travel segment type not found. Run database seed.");
      }

      // Determine segment name
      const segmentName = `${cruiseData.cruiseLine} Cruise`;

      // Create the segment spanning the cruise duration
      const newSegment = await prisma.segment.create({
        data: {
          name: segmentName,
          tripId: trip.id,
          segmentTypeId: travelType.id,
          startTitle: cruiseData.embarkationPort,
          startLat: 0, // TODO: Could geocode port locations
          startLng: 0,
          endTitle: cruiseData.disembarkationPort,
          endLat: 0,
          endLng: 0,
          // Wall date fields (source of truth)
          wall_start_date: stringToPgDate(cruiseData.embarkationDate),
          wall_end_date: stringToPgDate(cruiseData.disembarkationDate),
          // Note: startTime/endTime auto-calculated by database trigger
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

  // Build comprehensive notes
  const notesLines = [];
  notesLines.push(`Ship: ${cruiseData.shipName}`);
  notesLines.push(`Cruise Line: ${cruiseData.cruiseLine}`);
  notesLines.push(`Cabin: ${cruiseData.cabinNumber} (${cruiseData.cabinType})`);
  if (cruiseData.deck) notesLines.push(`Deck: ${cruiseData.deck}`);
  
  // Add guest information
  if (cruiseData.guests.length > 0) {
    notesLines.push(`Guests: ${cruiseData.guests.map(g => g.name).join(', ')}`);
  }
  
  // Add dining information
  if (cruiseData.diningTime) notesLines.push(`Dining: ${cruiseData.diningTime}`);
  if (cruiseData.specialRequests) notesLines.push(`Special Requests: ${cruiseData.specialRequests}`);
  
  // Add ports of call
  if (cruiseData.portsOfCall.length > 0) {
    notesLines.push(`\nPorts of Call:`);
    cruiseData.portsOfCall.forEach(port => {
      notesLines.push(`  • ${port.portName}, ${port.portLocation} (${port.arrivalDate})`);
    });
  }

  const notes = notesLines.join('\n');

  // Create the reservation
  const embarkTime = cruiseData.embarkationTime || '12:00';
  const disembarkTime = cruiseData.disembarkationTime || '12:00';
  
  const reservation = await prisma.reservation.create({
    data: {
      name: `${cruiseData.cruiseLine} - ${cruiseData.shipName}`,
      confirmationNumber: cruiseData.confirmationNumber,
      notes,
      reservationTypeId: reservationType.id,
      reservationStatusId: confirmedStatus.id,
      segmentId: targetSegmentId,
      // Wall clock fields (source of truth)
      wall_start_date: stringToPgDate(cruiseData.embarkationDate),
      wall_start_time: stringToPgTime(embarkTime),
      wall_end_date: stringToPgDate(cruiseData.disembarkationDate),
      wall_end_time: stringToPgTime(disembarkTime),
      // Note: startTime/endTime auto-calculated by database trigger
      cost: cruiseData.totalCost || undefined,
      currency: cruiseData.currency || undefined,
      departureLocation: `${cruiseData.embarkationPort} (${cruiseData.embarkationLocation})`,
      arrivalLocation: `${cruiseData.disembarkationPort} (${cruiseData.disembarkationLocation})`,
      vendor: cruiseData.cruiseLine,
    },
  });

  // Trigger async enrichment for image (use cruise ship name)
  enrichReservation(reservation.id, {
    locationQuery: `${cruiseData.cruiseLine} ${cruiseData.shipName} cruise ship`,
  }).catch((error) => {
    console.error(`[AddCruises] Enrichment failed for reservation ${reservation.id}:`, error);
  });

  console.log(`✅ Created cruise reservation: ${cruiseData.shipName}`);

  return {
    success: true,
    reservation,
  };
}
