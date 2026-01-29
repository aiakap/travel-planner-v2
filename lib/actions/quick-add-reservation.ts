"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { assignFlights } from "@/lib/utils/flight-assignment";
import { updateMetadataForType } from "@/lib/utils/reservation-metadata";
import { enrichSegment } from "./enrich-segment";
import { enrichReservation } from "./enrich-reservation";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";
import type { HotelExtraction } from "@/lib/schemas/hotel-extraction-schema";
import type { CarRentalExtraction } from "@/lib/schemas/car-rental-extraction-schema";
import type { ReservationMetadata } from "@/lib/reservation-metadata-types";

/**
 * Process and create flight reservations from extracted data
 */
async function processFlightReservations(
  tripId: string,
  extractedData: FlightExtraction,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<string[]> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      segments: {
        include: { segmentType: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  console.log('[QuickAdd] Prisma query result:', {
    tripFound: !!trip,
    tripId: trip?.id,
    hasStartDate: 'startDate' in (trip || {}),
    hasEndDate: 'endDate' in (trip || {}),
    startDateValue: trip?.startDate,
    endDateValue: trip?.endDate,
  });

  console.log('[QuickAdd] Trip fetched:', {
    id: trip.id,
    startDate: trip.startDate,
    startDateType: typeof trip.startDate,
    startDateIsDate: trip.startDate instanceof Date,
    endDate: trip.endDate,
    endDateType: typeof trip.endDate,
    endDateIsDate: trip.endDate instanceof Date,
  });

  const flightType = await getReservationType("Travel", "Flight");
  const confirmedStatus = await getReservationStatus("Confirmed");

  // Get Travel segment type for segment creation
  const travelSegmentType = await prisma.segmentType.findFirst({
    where: { name: "Travel" },
  });

  if (!travelSegmentType) {
    throw new Error("Travel segment type not found. Please run db:seed.");
  }

  // Parse flight dates
  const flightsWithDates = extractedData.flights.map((flight) => {
    // Ensure dates are valid strings before parsing
    const departureDate = flight.departureDate || new Date().toISOString().split('T')[0];
    const arrivalDate = flight.arrivalDate || new Date().toISOString().split('T')[0];
    const departureTime = flight.departureTime || "12:00 PM";
    const arrivalTime = flight.arrivalTime || "12:00 PM";

    const departureDateTime = new Date(`${departureDate}T${convertTo24Hour(departureTime)}`);
    const arrivalDateTime = new Date(`${arrivalDate}T${convertTo24Hour(arrivalTime)}`);

    // Validate that dates are valid
    if (isNaN(departureDateTime.getTime())) {
      throw new Error(`Invalid departure date/time for flight ${flight.flightNumber || 'unknown'}: ${departureDate} ${departureTime}`);
    }
    if (isNaN(arrivalDateTime.getTime())) {
      throw new Error(`Invalid arrival date/time for flight ${flight.flightNumber || 'unknown'}: ${arrivalDate} ${arrivalTime}`);
    }

    return {
      ...flight,
      departureDateTime,
      arrivalDateTime,
    };
  });

  // Only do automatic assignment if segmentAssignments not provided
  let assignments: any[] = [];
  let tripExtension: any = null;

  if (!segmentAssignments) {
    // Assign flights to categories (outbound, in-trip, return) - automatic mode
    const allSegmentsForAssignment = trip.segments.map((s) => ({
      id: s.id,
      name: s.name,
      startTime: s.startTime || new Date(),
      endTime: s.endTime || new Date(),
    }));

    // Ensure trip dates are Date objects (handle both Prisma Date and serialized strings)
    const ensureDate = (date: Date | string | null | undefined, fieldName: string): Date => {
      console.log(`[QuickAdd] ensureDate called for ${fieldName}:`, {
        value: date,
        type: typeof date,
        isDate: date instanceof Date,
        isNull: date === null,
        isUndefined: date === undefined,
      });

      if (!date) {
        throw new Error(`Date value is null or undefined for field: ${fieldName}`);
      }
      if (date instanceof Date) return date;
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date value: ${date} for field: ${fieldName}`);
      }
      return parsed;
    };

    const result = assignFlights(
      flightsWithDates.map((f) => ({
        departureDate: f.departureDateTime,
        arrivalDate: f.arrivalDateTime,
      })),
      {
        startDate: ensureDate(trip.startDate, 'trip.startDate'),
        endDate: ensureDate(trip.endDate, 'trip.endDate'),
      },
      allSegmentsForAssignment
    );

    assignments = result.assignments;
    tripExtension = result.tripExtension;

    // Update trip dates if needed
    if (tripExtension) {
      await prisma.trip.update({
        where: { id: tripId },
        data: {
          startDate: tripExtension.newStartDate,
          endDate: tripExtension.newEndDate,
        },
      });
    }
  }

  // Create reservations and segments
  const reservationIds: string[] = [];

  for (let i = 0; i < flightsWithDates.length; i++) {
    const flight = flightsWithDates[i];
    let segmentId: string | undefined;

    // Use provided segment assignment if available, otherwise use automatic assignment
    if (segmentAssignments && segmentAssignments[i]) {
      const userAssignment = segmentAssignments[i];
      
      if (userAssignment.action === 'create') {
        // Create new segment with user's custom name
        const segmentsBeforeFlight = trip.segments.filter(
          (s) => s.startTime && s.startTime < flight.departureDateTime
        );
        const order = segmentsBeforeFlight.length;

        const segment = await prisma.segment.create({
          data: {
            name: userAssignment.segmentName,
            trip: {
              connect: { id: trip.id }
            },
            segmentType: {
              connect: { id: travelSegmentType.id }
            },
            startTitle: flight.departureCity,
            endTitle: flight.arrivalCity,
            startTime: flight.departureDateTime,
            endTime: flight.arrivalDateTime,
            order,
            startLat: null,
            startLng: null,
            endLat: null,
            endLng: null,
          },
        });

        segmentId = segment.id;

        // Trigger async enrichment
        enrichSegment(segment.id, {
          geocode: true,
          timezone: true,
          image: false,
          airportCode: flight.departureAirport,
        }).catch((error) => {
          console.error(`[QuickAdd] Enrichment failed for segment ${segment.id}:`, error);
        });
      } else if (userAssignment.action === 'match' && userAssignment.segmentId) {
        // Use existing segment
        segmentId = userAssignment.segmentId;
      }
    } else if (assignments[i]) {
      // Fallback to automatic assignment
      const assignment = assignments[i];
      segmentId = assignment.segmentId;

      if (assignment.shouldCreateSegment) {
        let segmentName: string;
        let order: number;

        if (assignment.category === "outbound") {
          segmentName = `Travel to ${flight.arrivalCity}`;
          order = 0;
        } else if (assignment.category === "return") {
          const maxOrder = Math.max(...trip.segments.map((s) => s.order), -1);
          segmentName = `Return to ${flight.arrivalCity}`;
          order = maxOrder + 1;
        } else {
          const segmentsBeforeFlight = trip.segments.filter(
            (s) => s.startTime && s.startTime < flight.departureDateTime
          );
          order = segmentsBeforeFlight.length;
          segmentName = `Flight to ${flight.arrivalCity}`;
        }

        const segment = await prisma.segment.create({
          data: {
            name: segmentName,
            trip: {
              connect: { id: trip.id }
            },
            segmentType: {
              connect: { id: travelSegmentType.id }
            },
            startTitle: flight.departureCity,
            endTitle: flight.arrivalCity,
            startTime: flight.departureDateTime,
            endTime: flight.arrivalDateTime,
            order,
            startLat: null,
            startLng: null,
            endLat: null,
            endLng: null,
          },
        });

        segmentId = segment.id;

        enrichSegment(segment.id, {
          geocode: true,
          timezone: true,
          image: false,
          airportCode: flight.departureAirport,
        }).catch((error) => {
          console.error(`[QuickAdd] Enrichment failed for segment ${segment.id}:`, error);
        });
      }
    }

    if (!segmentId) {
      throw new Error(`Failed to determine segment for flight ${i + 1}`);
    }

    // Prepare metadata
    const metadata: ReservationMetadata = {
      flight: {
        flightNumber: flight.flightNumber || undefined,
        airlineCode: flight.carrierCode || undefined,
        cabin: flight.cabin || undefined,
        seatNumber: flight.seatNumber || undefined,
        operatedBy: flight.operatedBy || undefined,
        eTicketNumber: extractedData.eTicketNumber || undefined,
      },
    };

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        name: `${flight.carrier} ${flight.flightNumber} - ${flight.departureAirport} to ${flight.arrivalAirport}`,
        startTime: flight.departureDateTime,
        departureLocation: flight.departureCity,
        endTime: flight.arrivalDateTime,
        arrivalLocation: flight.arrivalCity,
        confirmationNumber: extractedData.confirmationNumber || undefined,
        cost: extractedData.totalCost || undefined,
        currency: extractedData.currency || undefined,
        segmentId: segmentId,
        reservationTypeId: flightType.id,
        reservationStatusId: confirmedStatus.id,
        metadata: metadata as any,
      },
    });

    // Trigger async enrichment for timezone correction
    enrichReservation(reservation.id, {
      departure: flight.departureAirport,
      arrival: flight.arrivalAirport
    }).catch((error) => {
      console.error(`[QuickAdd] Enrichment failed for reservation ${reservation.id}:`, error);
    });

    reservationIds.push(reservation.id);
  }

  return reservationIds;
}

/**
 * Process and create hotel reservations from extracted data
 */
async function processHotelReservations(
  tripId: string,
  extractedData: HotelExtraction
): Promise<string[]> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      segments: {
        include: { segmentType: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const hotelType = await getReservationType("Stay", "Hotel");
  const confirmedStatus = await getReservationStatus("Confirmed");

  const checkInDate = new Date(extractedData.checkInDate);
  const checkOutDate = new Date(extractedData.checkOutDate);

  // Find matching Stay segment
  const matchingSegment = trip.segments.find((segment) => {
    if (segment.segmentType.name !== "Stay") return false;
    if (!segment.startTime || !segment.endTime) return false;

    const segmentStart = new Date(segment.startTime);
    const segmentEnd = new Date(segment.endTime);

    // Check if hotel dates overlap with segment
    return checkInDate <= segmentEnd && checkOutDate >= segmentStart;
  });

  if (!matchingSegment) {
    throw new Error(
      "No matching Stay segment found for these dates. Please create a Stay segment in your itinerary first."
    );
  }

  // Prepare metadata
  const metadata: ReservationMetadata = {
    hotel: {
      roomType: extractedData.roomType || undefined,
      guestCount: extractedData.numberOfGuests || undefined,
      checkInTime: extractedData.checkInTime || undefined,
      checkOutTime: extractedData.checkOutTime || undefined,
    },
  };

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: extractedData.hotelName,
      startTime: checkInDate,
      location: extractedData.address || extractedData.hotelName,
      endTime: checkOutDate,
      confirmationNumber: extractedData.confirmationNumber || undefined,
      cost: extractedData.totalCost || undefined,
      currency: extractedData.currency || undefined,
      segmentId: matchingSegment.id,
      reservationTypeId: hotelType.id,
      reservationStatusId: confirmedStatus.id,
      metadata: metadata as any,
    },
  });

  return [reservation.id];
}

/**
 * Process and create car rental reservations from extracted data
 */
async function processCarRentalReservations(
  tripId: string,
  extractedData: CarRentalExtraction
): Promise<string[]> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      segments: {
        include: { segmentType: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const carRentalType = await getReservationType("Travel", "Car Rental");
  const confirmedStatus = await getReservationStatus("Confirmed");

  const pickupDate = new Date(extractedData.pickupDate);
  const returnDate = new Date(extractedData.returnDate);

  // Find segment at pickup date (prefer Travel segments)
  const matchingSegment = trip.segments
    .filter((segment) => {
      if (!segment.startTime) return false;
      const segmentStart = new Date(segment.startTime);
      const dayDiff = Math.abs(segmentStart.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24);
      return dayDiff <= 1; // Within 1 day
    })
    .sort((a, b) => {
      // Prefer Travel segments
      if (a.segmentType.name === "Travel" && b.segmentType.name !== "Travel") return -1;
      if (a.segmentType.name !== "Travel" && b.segmentType.name === "Travel") return 1;
      return 0;
    })[0];

  if (!matchingSegment) {
    throw new Error(
      "No matching segment found for pickup date. Please create a segment in your itinerary first."
    );
  }

  // Prepare metadata
  const metadata: ReservationMetadata = {
    carRental: {
      vehicleType: extractedData.vehicleClass || undefined,
      vehicleModel: extractedData.vehicleModel || undefined,
      insurance: extractedData.options.includes("Insurance") ? "Yes" : undefined,
      fuelPolicy: "Full to Full", // Default assumption
      pickupInstructions: extractedData.pickupLocation,
      dropoffInstructions: extractedData.returnLocation,
    },
  };

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: `${extractedData.company} - ${extractedData.vehicleClass || "Car Rental"}`,
      startTime: pickupDate,
      departureLocation: extractedData.pickupLocation,
      endTime: returnDate,
      arrivalLocation: extractedData.returnLocation,
      confirmationNumber: extractedData.confirmationNumber || undefined,
      cost: extractedData.totalCost || undefined,
      currency: extractedData.currency || undefined,
      segmentId: matchingSegment.id,
      reservationTypeId: carRentalType.id,
      reservationStatusId: confirmedStatus.id,
      metadata: metadata as any,
    },
  });

  return [reservation.id];
}

/**
 * Main entry point for quick-add reservation processing
 */
export async function quickAddReservation(
  tripId: string,
  type: "flight" | "hotel" | "car-rental",
  extractedData: FlightExtraction | HotelExtraction | CarRentalExtraction,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<{ reservationIds: string[]; message: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify trip belongs to user
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
  });

  if (!trip) {
    throw new Error("Trip not found or unauthorized");
  }

  let reservationIds: string[];

  switch (type) {
    case "flight":
      reservationIds = await processFlightReservations(tripId, extractedData as FlightExtraction, segmentAssignments);
      break;
    case "hotel":
      reservationIds = await processHotelReservations(tripId, extractedData as HotelExtraction);
      break;
    case "car-rental":
      reservationIds = await processCarRentalReservations(tripId, extractedData as CarRentalExtraction);
      break;
    default:
      throw new Error("Unsupported reservation type");
  }

  return {
    reservationIds,
    message: `Successfully added ${reservationIds.length} ${type} reservation${reservationIds.length > 1 ? "s" : ""} to your trip`,
  };
}

/**
 * Convert 12-hour time to 24-hour format for Date parsing
 */
function convertTo24Hour(time: string): string {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "12:00"; // Fallback

  let [, hours, minutes, period] = match;
  let hour = parseInt(hours);

  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minutes}`;
}

/**
 * Create a draft reservation with error information
 * Used when validation fails during background processing
 */
export async function createDraftReservation(
  tripId: string,
  flightData: any,
  segmentAssignment: any,
  errorMessage: string
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Get or create Draft status
  const draftStatus = await prisma.reservationStatus.upsert({
    where: { name: "Draft" },
    create: { name: "Draft" },
    update: {}
  });

  // Get flight type
  const flightType = await getReservationType("Travel", "Flight");

  // Get Travel segment type
  const travelSegmentType = await prisma.segmentType.findFirst({
    where: { name: "Travel" }
  });

  if (!travelSegmentType) {
    throw new Error("Travel segment type not found");
  }

  // Parse dates
  const departureDate = flightData.departureDate || new Date().toISOString().split('T')[0];
  const arrivalDate = flightData.arrivalDate || new Date().toISOString().split('T')[0];
  const departureTime = flightData.departureTime || "12:00 PM";
  const arrivalTime = flightData.arrivalTime || "12:00 PM";

  const departureDateTime = new Date(`${departureDate}T${convertTo24Hour(departureTime)}`);
  const arrivalDateTime = new Date(`${arrivalDate}T${convertTo24Hour(arrivalTime)}`);

  // Create or use segment
  let segmentId: string;
  
  if (segmentAssignment?.action === 'match' && segmentAssignment.segmentId) {
    segmentId = segmentAssignment.segmentId;
  } else {
    // Create a temporary segment
    const segment = await prisma.segment.create({
      data: {
        name: segmentAssignment?.segmentName || `Flight to ${flightData.arrivalCity} - NEEDS ATTENTION`,
        trip: { connect: { id: tripId } },
        segmentType: { connect: { id: travelSegmentType.id } },
        startTitle: flightData.departureCity || "Unknown",
        endTitle: flightData.arrivalCity || "Unknown",
        startTime: departureDateTime,
        endTime: arrivalDateTime,
        order: 999, // High order to put at end
        startLat: null,
        startLng: null,
        endLat: null,
        endLng: null,
      }
    });
    segmentId = segment.id;
  }

  // Prepare metadata with error info
  const metadata: ReservationMetadata = {
    flight: {
      flightNumber: flightData.flightNumber || undefined,
      airlineCode: flightData.carrierCode || undefined,
      cabin: flightData.cabin || undefined,
      seatNumber: flightData.seatNumber || undefined,
      operatedBy: flightData.operatedBy || undefined,
    },
    validationError: errorMessage,
    needsAttention: true
  };

  // Create draft reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: `${flightData.carrier || 'Unknown'} ${flightData.flightNumber || ''} - NEEDS ATTENTION`,
      startTime: departureDateTime,
      departureLocation: flightData.departureCity || "Unknown",
      endTime: arrivalDateTime,
      arrivalLocation: flightData.arrivalCity || "Unknown",
      notes: `VALIDATION ERROR: ${errorMessage}\n\nPlease review and fix the issues below, then save to continue.`,
      segmentId,
      reservationTypeId: flightType.id,
      reservationStatusId: draftStatus.id,
      metadata: metadata as any,
    }
  });

  // Enrich even draft reservations with timezone data
  if (flightData.departureAirport || flightData.arrivalAirport) {
    enrichReservation(reservation.id, {
      departure: flightData.departureAirport,
      arrival: flightData.arrivalAirport
    }).catch((error) => {
      console.error(`[QuickAdd] Draft enrichment failed for ${reservation.id}:`, error);
    });
  }

  return reservation.id;
}

/**
 * Create a single flight reservation
 * Used by background processor to create flights one at a time
 */
export async function createSingleFlight(
  tripId: string,
  flightData: any,
  extractedData: any,
  segmentAssignment?: any
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id
    },
    include: {
      segments: {
        include: { segmentType: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!trip) {
    throw new Error("Trip not found or unauthorized");
  }

  const flightType = await getReservationType("Travel", "Flight");
  const confirmedStatus = await getReservationStatus("Confirmed");
  const travelSegmentType = await prisma.segmentType.findFirst({
    where: { name: "Travel" }
  });

  if (!travelSegmentType) {
    throw new Error("Travel segment type not found");
  }

  // Parse dates
  const departureDate = flightData.departureDate || new Date().toISOString().split('T')[0];
  const arrivalDate = flightData.arrivalDate || new Date().toISOString().split('T')[0];
  const departureTime = flightData.departureTime || "12:00 PM";
  const arrivalTime = flightData.arrivalTime || "12:00 PM";

  const departureDateTime = new Date(`${departureDate}T${convertTo24Hour(departureTime)}`);
  const arrivalDateTime = new Date(`${arrivalDate}T${convertTo24Hour(arrivalTime)}`);

  // Validate dates
  if (isNaN(departureDateTime.getTime())) {
    throw new Error(`Invalid departure date/time: ${departureDate} ${departureTime}`);
  }
  if (isNaN(arrivalDateTime.getTime())) {
    throw new Error(`Invalid arrival date/time: ${arrivalDate} ${arrivalTime}`);
  }

  // Handle segment assignment
  let segmentId: string;

  if (segmentAssignment?.action === 'match' && segmentAssignment.segmentId) {
    segmentId = segmentAssignment.segmentId;
  } else if (segmentAssignment?.action === 'create') {
    // Create new segment
    const segmentsBeforeFlight = trip.segments.filter(
      (s) => s.startTime && s.startTime < departureDateTime
    );
    const order = segmentsBeforeFlight.length;

    const segment = await prisma.segment.create({
      data: {
        name: segmentAssignment.segmentName,
        trip: { connect: { id: trip.id } },
        segmentType: { connect: { id: travelSegmentType.id } },
        startTitle: flightData.departureCity,
        endTitle: flightData.arrivalCity,
        startTime: departureDateTime,
        endTime: arrivalDateTime,
        order,
        startLat: null,
        startLng: null,
        endLat: null,
        endLng: null,
      }
    });

    segmentId = segment.id;

    // Trigger async enrichment
    enrichSegment(segment.id, {
      geocode: true,
      timezone: true,
      image: false,
      airportCode: flightData.departureAirport,
    }).catch((error) => {
      console.error(`[QuickAdd] Enrichment failed for segment ${segment.id}:`, error);
    });
  } else {
    throw new Error("Invalid segment assignment");
  }

  // Prepare metadata
  const metadata: ReservationMetadata = {
    flight: {
      flightNumber: flightData.flightNumber || undefined,
      airlineCode: flightData.carrierCode || undefined,
      cabin: flightData.cabin || undefined,
      seatNumber: flightData.seatNumber || undefined,
      operatedBy: flightData.operatedBy || undefined,
      eTicketNumber: extractedData.eTicketNumber || undefined,
    },
  };

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: `${flightData.carrier} ${flightData.flightNumber} - ${flightData.departureAirport} to ${flightData.arrivalAirport}`,
      startTime: departureDateTime,
      departureLocation: flightData.departureCity,
      endTime: arrivalDateTime,
      arrivalLocation: flightData.arrivalCity,
      confirmationNumber: extractedData.confirmationNumber || undefined,
      cost: extractedData.totalCost || undefined,
      currency: extractedData.currency || undefined,
      segmentId,
      reservationTypeId: flightType.id,
      reservationStatusId: confirmedStatus.id,
      metadata: metadata as any,
    },
  });

  // Trigger async enrichment for timezone correction
  enrichReservation(reservation.id, {
    departure: flightData.departureAirport,
    arrival: flightData.arrivalAirport
  }).catch((error) => {
    console.error(`[QuickAdd] Enrichment failed for reservation ${reservation.id}:`, error);
  });

  return reservation.id;
}
