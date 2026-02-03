/**
 * Flight Assignment Logic
 * 
 * Categorizes flights as outbound, in-trip, or return based on trip dates
 * and determines segment creation/matching strategy
 */

import { findClosestTravelSegment } from "./segment-matching";

export type FlightCategory = 'outbound' | 'in-trip' | 'return';

export interface FlightAssignment {
  category: FlightCategory;
  shouldCreateSegment: boolean;
  segmentId?: string; // If matching existing segment
  reason: string;
}

export interface FlightDateInfo {
  departureDate: Date;
  arrivalDate: Date;
  departureLocation?: string;
  arrivalLocation?: string;
}

export interface TripDateInfo {
  startDate: Date;
  endDate: Date;
}

export interface SegmentForAssignment {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  startTitle?: string | null;
  endTitle?: string | null;
  segmentTypeName?: string | null;
}

/**
 * Categorizes a flight based on trip dates
 * 
 * Rules:
 * - Outbound: Arrival date is before or at trip start
 * - Return: Departure date is after or at trip end
 * - In-Trip: Occurs during the trip
 */
export function categorizeFlightByDate(
  flight: FlightDateInfo,
  trip: TripDateInfo
): FlightCategory {
  const { departureDate, arrivalDate } = flight;
  const { startDate, endDate } = trip;

  // Validate dates are valid Date objects
  if (!departureDate || !(departureDate instanceof Date) || isNaN(departureDate.getTime())) {
    throw new Error(`Invalid departure date in flight categorization: ${departureDate}`);
  }
  if (!arrivalDate || !(arrivalDate instanceof Date) || isNaN(arrivalDate.getTime())) {
    throw new Error(`Invalid arrival date in flight categorization: ${arrivalDate}`);
  }
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
    console.error('[FlightAssignment] Invalid trip start date:', {
      value: startDate,
      type: typeof startDate,
      isDate: startDate instanceof Date,
      isNaN: startDate ? isNaN(new Date(startDate as any).getTime()) : 'N/A',
    });
    throw new Error(
      `Invalid trip start date: ${startDate} (type: ${typeof startDate}). ` +
      `Expected a valid Date object but received ${startDate instanceof Date ? 'invalid Date' : typeof startDate}.`
    );
  }
  if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
    console.error('[FlightAssignment] Invalid trip end date:', {
      value: endDate,
      type: typeof endDate,
      isDate: endDate instanceof Date,
      isNaN: endDate ? isNaN(new Date(endDate as any).getTime()) : 'N/A',
    });
    throw new Error(
      `Invalid trip end date: ${endDate} (type: ${typeof endDate}). ` +
      `Expected a valid Date object but received ${endDate instanceof Date ? 'invalid Date' : typeof endDate}.`
    );
  }

  // Normalize to start of day for comparison
  const arrivalDay = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate());
  const departureDay = new Date(departureDate.getFullYear(), departureDate.getMonth(), departureDate.getDate());
  const tripStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const tripEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  // Outbound: Arrives on or before trip start
  if (arrivalDay <= tripStartDay) {
    return 'outbound';
  }

  // Return: Departs on or after trip end
  if (departureDay >= tripEndDay) {
    return 'return';
  }

  // In-trip: Everything else
  return 'in-trip';
}

/**
 * Determines if a flight should create a new segment or match an existing one
 * 
 * For outbound/return flights: Always create new segments (travel to/from trip)
 * For in-trip flights: Assign to segment ending closest to (but before) flight departure
 */
export function determineSegmentStrategy(
  category: FlightCategory,
  allSegments: SegmentForAssignment[],
  flightDeparture: Date,
  flightArrival: Date,
  flightLocations?: { startLocation?: string; endLocation?: string }
): Pick<FlightAssignment, 'shouldCreateSegment' | 'segmentId' | 'reason'> {
  const travelMatch = findClosestTravelSegment(
    {
      startTime: flightDeparture,
      endTime: flightArrival,
      startLocation: flightLocations?.startLocation || '',
      endLocation: flightLocations?.endLocation || '',
    },
    allSegments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      startTitle: segment.startTitle || '',
      endTitle: segment.endTitle || '',
      startTime: segment.startTime ? segment.startTime.toISOString() : null,
      endTime: segment.endTime ? segment.endTime.toISOString() : null,
      segmentType: { name: segment.segmentTypeName || '' },
      order: 0,
    }))
  );

  if (travelMatch) {
    return {
      shouldCreateSegment: false,
      segmentId: travelMatch.segmentId,
      reason: `Assigned to closest Travel segment "${travelMatch.segmentName}"`,
    };
  }

  // Outbound and return flights always get new segments
  if (category === 'outbound') {
    return {
      shouldCreateSegment: true,
      reason: 'Outbound flight requires new segment before trip start',
    };
  }

  if (category === 'return') {
    return {
      shouldCreateSegment: true,
      reason: 'Return flight requires new segment after trip end',
    };
  }

  // In-trip flights: Find segment ending closest to (but before) flight departure
  const segmentsBeforeFlight = allSegments
    .filter(seg => seg.endTime <= flightDeparture)
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime()); // Descending order

  if (segmentsBeforeFlight.length > 0) {
    const closestSegment = segmentsBeforeFlight[0];
    return {
      shouldCreateSegment: false,
      segmentId: closestSegment.id,
      reason: `Assigned to segment "${closestSegment.name}" (ends closest to departure)`,
    };
  }

  // No segment before flight, create new one
  return {
    shouldCreateSegment: true,
    reason: 'No segment found before flight departure',
  };
}

/**
 * Assigns a flight to a category and determines segment strategy
 */
export function assignFlight(
  flight: FlightDateInfo,
  trip: TripDateInfo,
  allSegments: SegmentForAssignment[]
): FlightAssignment {
  const category = categorizeFlightByDate(flight, trip);
  const segmentStrategy = determineSegmentStrategy(
    category,
    allSegments,
    flight.departureDate,
    flight.arrivalDate,
    {
      startLocation: flight.departureLocation,
      endLocation: flight.arrivalLocation,
    }
  );

  return {
    category,
    ...segmentStrategy,
  };
}

/**
 * Checks if trip dates need to be extended to accommodate flights
 * 
 * Returns new trip dates if extension is needed, or null if no extension needed
 */
export function calculateTripExtension(
  flights: FlightDateInfo[],
  currentTripDates: TripDateInfo
): { newStartDate: Date; newEndDate: Date } | null {
  if (flights.length === 0) {
    return null;
  }

  let needsExtension = false;
  let newStartDate = new Date(currentTripDates.startDate);
  let newEndDate = new Date(currentTripDates.endDate);

  for (const flight of flights) {
    // Check if we need to extend trip start
    if (flight.departureDate < newStartDate) {
      newStartDate = new Date(flight.departureDate);
      needsExtension = true;
    }

    // Check if we need to extend trip end
    if (flight.arrivalDate > newEndDate) {
      newEndDate = new Date(flight.arrivalDate);
      needsExtension = true;
    }
  }

  return needsExtension ? { newStartDate, newEndDate } : null;
}

/**
 * Assigns multiple flights and provides trip extension info
 */
export function assignFlights(
  flights: FlightDateInfo[],
  trip: TripDateInfo,
  allSegments: SegmentForAssignment[]
): {
  assignments: FlightAssignment[];
  tripExtension: { newStartDate: Date; newEndDate: Date } | null;
} {
  console.log('[FlightAssignment] assignFlights called with:', {
    flightCount: flights.length,
    tripStartDate: trip.startDate,
    tripStartDateType: typeof trip.startDate,
    tripStartDateIsDate: trip.startDate instanceof Date,
    tripEndDate: trip.endDate,
    tripEndDateType: typeof trip.endDate,
    tripEndDateIsDate: trip.endDate instanceof Date,
  });

  const tripExtension = calculateTripExtension(flights, trip);
  const effectiveTripDates: TripDateInfo = tripExtension 
    ? { startDate: tripExtension.newStartDate, endDate: tripExtension.newEndDate }
    : trip;

  const assignments = flights.map(flight =>
    assignFlight(flight, effectiveTripDates, allSegments)
  );

  return {
    assignments,
    tripExtension,
  };
}
