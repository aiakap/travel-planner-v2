"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrivateDriverExtraction } from "@/lib/schemas/extraction/travel/private-driver-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { TransportMetadata, ReservationMetadata } from "@/lib/reservation-metadata-types";
import { enrichReservation } from "@/lib/actions/enrich-reservation";

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

/**
 * Normalize time string to HH:mm:ss format
 * Handles formats like "18:35", "6:35 PM", "2:00 PM", "14:00"
 */
function normalizeTimeString(timeStr: string): string {
  if (!timeStr || timeStr.trim() === '') {
    return '';
  }
  
  const cleaned = timeStr.trim().toUpperCase();
  
  // Check for AM/PM format
  const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }
  
  // Check for 24-hour format (HH:mm or HH:mm:ss)
  const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (h24Match) {
    const hours = h24Match[1].padStart(2, '0');
    const minutes = h24Match[2];
    const seconds = h24Match[3] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Return empty if we can't parse
  return '';
}

/**
 * Get the effective pickup time for an airport transfer
 * Prefers flight arrival time over explicit pickup time for airport pickups
 */
function getEffectivePickupTime(driverData: PrivateDriverExtraction): string {
  const isAirportPickup = driverData.pickupLocation.toLowerCase().includes('airport');
  
  // For airport pickups, prefer flight arrival time (driver waits for flight)
  if (isAirportPickup && driverData.flightArrivalTime) {
    const normalized = normalizeTimeString(driverData.flightArrivalTime);
    if (normalized) {
      console.log(`✈️ Using flight arrival time as pickup: ${driverData.flightArrivalTime} → ${normalized}`);
      return normalized;
    }
  }
  
  // Fall back to explicit pickup time
  if (driverData.pickupTime) {
    const normalized = normalizeTimeString(driverData.pickupTime);
    if (normalized) {
      return normalized;
    }
  }
  
  // Default to noon if nothing else
  return '12:00:00';
}

/**
 * Parse transfer duration string and calculate end time
 * Handles formats like "2-2.5 hours", "2.5 hours", "45 minutes", "2 hrs"
 */
function calculateEndTime(startTime: Date, durationStr: string): Date | null {
  if (!durationStr || durationStr.trim() === '') {
    return null;
  }
  
  const cleaned = durationStr.toLowerCase().trim();
  
  // Try to extract hours - take the maximum if a range is given
  // "2-2.5 hours" -> 2.5, "2.5 hours" -> 2.5, "2 hrs" -> 2
  const hourMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*(?:hours?|hrs?)/);
  if (hourMatch) {
    // If it's a range like "2-2.5 hours", use the higher value
    const hours = hourMatch[2] ? parseFloat(hourMatch[2]) : parseFloat(hourMatch[1]);
    if (!isNaN(hours) && hours > 0) {
      const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
      return endTime;
    }
  }
  
  // Try minutes format
  const minMatch = cleaned.match(/(\d+)\s*(?:minutes?|mins?)/);
  if (minMatch) {
    const minutes = parseInt(minMatch[1], 10);
    if (!isNaN(minutes) && minutes > 0) {
      const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);
      return endTime;
    }
  }
  
  return null;
}

/**
 * Safely parse date and time into a valid Date object
 */
function parseDateTime(dateStr: string, timeStr: string, defaultTime: string = "12:00:00"): Date {
  let isoDate = dateStr;
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      isoDate = parsed.toISOString().split('T')[0];
    } else {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
  }
  
  const normalizedTime = timeStr || defaultTime;
  const dateTimeStr = `${isoDate}T${normalizedTime}`;
  const result = new Date(dateTimeStr);
  
  if (isNaN(result.getTime())) {
    throw new Error(`Invalid datetime: ${dateTimeStr}`);
  }
  
  return result;
}

/**
 * Find best segment for private driver transfer based on pickup date/time and locations
 */
async function findBestSegmentForPrivateDriver(
  segments: any[],
  driverData: PrivateDriverExtraction
): Promise<{ segmentId: string; confidence: number } | null> {
  if (segments.length === 0) return null;
  
  const pickupDate = new Date(driverData.pickupDate);
  
  // Find segment that overlaps with pickup date
  const matchingSegments = segments.filter(segment => {
    const segmentStart = new Date(segment.startTime);
    const segmentEnd = segment.endTime ? new Date(segment.endTime) : null;
    
    // Check if pickup date falls within segment dates
    if (segmentEnd) {
      return pickupDate >= segmentStart && pickupDate <= segmentEnd;
    } else {
      // If no end time, just check if after start
      return pickupDate >= segmentStart;
    }
  });
  
  if (matchingSegments.length === 0) {
    // No matching segment, return the first segment as fallback
    return { segmentId: segments[0].id, confidence: 30 };
  }
  
  // Return the first matching segment with high confidence
  return { segmentId: matchingSegments[0].id, confidence: 90 };
}

export async function addPrivateDriverToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  driverData: PrivateDriverExtraction;
}) {
  const { tripId, segmentId, driverData } = params;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log('🚗 Adding private driver transfer to trip:', {
    tripId,
    driver: driverData.driverName,
    pickup: driverData.pickupLocation,
    dropoff: driverData.dropoffLocation,
  });

  // Verify trip ownership and get segments
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { segments: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.userId !== session.user.id) {
    throw new Error("Unauthorized - trip does not belong to user");
  }

  // Determine target segment
  let targetSegmentId = segmentId;
  
  if (!targetSegmentId && trip.segments.length > 0) {
    // Try to find best matching segment
    const match = await findBestSegmentForPrivateDriver(trip.segments, driverData);
    if (match && match.confidence > 50) {
      targetSegmentId = match.segmentId;
      console.log(`📍 Auto-matched to segment with ${match.confidence}% confidence`);
    } else {
      targetSegmentId = trip.segments[0].id;
      console.log('📍 Using first segment as fallback');
    }
  }

  if (!targetSegmentId) {
    throw new Error("No segment available - please create a segment first");
  }

  // Verify segment belongs to this trip
  const segment = trip.segments.find(s => s.id === targetSegmentId);
  if (!segment) {
    throw new Error("Segment not found or does not belong to this trip");
  }

  // Get the Private Driver reservation type (NOT Car Rental!)
  const privateDriverType = await getReservationType("Travel", "Private Driver");
  const confirmedStatus = await getReservationStatus("Confirmed");

  // Geocode pickup and dropoff locations
  console.log('🗺️  Geocoding pickup and dropoff locations...');
  const pickupGeo = await geocodeLocation(driverData.pickupLocation);
  const dropoffGeo = await geocodeLocation(driverData.dropoffLocation);

  // Build private-driver-specific notes (human-readable summary)
  const notes = [
    driverData.driverName ? `Driver: ${driverData.driverName}` : null,
    driverData.driverPhone ? `Driver Phone: ${driverData.driverPhone}` : null,
    driverData.vehicleType ? `Vehicle: ${driverData.vehicleType}` : null,
    driverData.plateNumber ? `Plate Number: ${driverData.plateNumber}` : null,
    driverData.waitingInstructions ? `Meeting Instructions: ${driverData.waitingInstructions}` : null,
    driverData.pickupInstructions ? `Pickup: ${driverData.pickupInstructions}` : null,
    driverData.flightNumber ? `Flight: ${driverData.flightNumber}${driverData.flightArrivalTime ? ` (ETA ${driverData.flightArrivalTime})` : ''}` : null,
    driverData.transferDuration ? `Transfer Duration: ${driverData.transferDuration}` : null,
    driverData.passengerCount > 1 ? `Passengers: ${driverData.passengerCount}` : null,
    driverData.luggageDetails ? `Luggage: ${driverData.luggageDetails}` : null,
    driverData.meetAndGreet ? 'Meet and Greet Service Included' : null,
    driverData.specialRequests ? `Special Requests: ${driverData.specialRequests}` : null,
    driverData.notes ? `Additional Notes: ${driverData.notes}` : null,
  ].filter(Boolean).join('\n');

  // Build structured metadata for transport
  const transportMetadata: TransportMetadata = {
    vehicleType: driverData.vehicleType || undefined,
    driverName: driverData.driverName || undefined,
    driverPhone: driverData.driverPhone || undefined,
    licensePlate: driverData.plateNumber || undefined,
    pickupInstructions: driverData.pickupInstructions || undefined,
    meetingInstructions: driverData.waitingInstructions || undefined,
    estimatedDuration: driverData.transferDuration || undefined,
    flightNumber: driverData.flightNumber || undefined,
    flightArrivalTime: driverData.flightArrivalTime || undefined,
    passengerCount: driverData.passengerCount > 0 ? driverData.passengerCount : undefined,
    luggageDetails: driverData.luggageDetails || undefined,
  };
  
  // Only include metadata if we have at least some data
  const hasMetadata = Object.values(transportMetadata).some(v => v !== undefined);
  const metadata: ReservationMetadata | null = hasMetadata ? { transport: transportMetadata } : null;

  // Get effective pickup time (prefers flight arrival time for airport pickups)
  const effectivePickupTime = getEffectivePickupTime(driverData);
  
  // Parse pickup datetime with effective time
  const pickupDateTime = parseDateTime(driverData.pickupDate, effectivePickupTime);
  
  // Calculate end time if we have transfer duration
  const endDateTime = calculateEndTime(pickupDateTime, driverData.transferDuration);
  if (endDateTime) {
    console.log(`⏱️ Calculated end time: ${endDateTime.toISOString()} (from duration: ${driverData.transferDuration})`);
  }

  console.log('📝 Creating private driver reservation...');
  
  // Create the private driver reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: `Private Transfer: ${driverData.pickupLocation} → ${driverData.dropoffLocation}`,
      confirmationNumber: driverData.confirmationNumber,
      notes,
      reservationTypeId: privateDriverType.id,  // ← Correct type: "Private Driver"
      reservationStatusId: confirmedStatus.id,
      segmentId: targetSegmentId,
      
      // Timing (both startTime/endTime AND wall_* fields for form compatibility)
      startTime: pickupDateTime,
      endTime: endDateTime,
      wall_start_date: pickupDateTime,
      wall_start_time: pickupDateTime,
      wall_end_date: endDateTime,
      wall_end_time: endDateTime,
      
      // Financial
      cost: driverData.cost,
      currency: driverData.currency,
      
      // Locations
      departureLocation: pickupGeo?.formatted || driverData.pickupLocation,
      arrivalLocation: dropoffGeo?.formatted || driverData.dropoffLocation,
      latitude: dropoffGeo?.lat,
      longitude: dropoffGeo?.lng,
      
      // Vendor
      vendor: driverData.company,
      
      // Contact
      contactEmail: driverData.contactEmail,
      contactPhone: driverData.contactPhone || driverData.driverPhone,
      
      // Structured metadata
      metadata: metadata,
    },
  });

  console.log(`✅ Private driver reservation created: ${reservation.id}`);
  
  // Trigger async enrichment for image (dropoff location is usually more interesting than airport)
  const locationQuery = driverData.dropoffLocation || driverData.pickupLocation;
  
  enrichReservation(reservation.id, {
    locationQuery,
  }).catch((error) => {
    console.error(`[AddPrivateDriver] Enrichment failed for reservation ${reservation.id}:`, error);
  });
  
  return {
    success: true,
    reservation,
    message: `Private driver transfer added to trip: ${driverData.driverName} from ${driverData.pickupLocation} to ${driverData.dropoffLocation}`,
  };
}
