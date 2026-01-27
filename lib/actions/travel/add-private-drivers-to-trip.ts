"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrivateDriverExtraction } from "@/lib/schemas/extraction/travel/private-driver-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";

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

  // Build private-driver-specific notes
  const notes = [
    `Driver: ${driverData.driverName}`,
    driverData.driverPhone ? `Driver Phone: ${driverData.driverPhone}` : null,
    `Vehicle: ${driverData.vehicleType}`,
    driverData.plateNumber ? `Plate Number: ${driverData.plateNumber}` : null,
    `Meeting Instructions: ${driverData.waitingInstructions}`,
    driverData.pickupInstructions ? `Pickup: ${driverData.pickupInstructions}` : null,
    driverData.transferDuration ? `Transfer Duration: ${driverData.transferDuration}` : null,
    driverData.passengerCount > 1 ? `Passengers: ${driverData.passengerCount}` : null,
    driverData.luggageDetails ? `Luggage: ${driverData.luggageDetails}` : null,
    driverData.meetAndGreet ? 'Meet and Greet Service Included' : null,
    driverData.specialRequests ? `Special Requests: ${driverData.specialRequests}` : null,
    driverData.notes ? `Additional Notes: ${driverData.notes}` : null,
  ].filter(Boolean).join('\n');

  // Parse pickup datetime
  const pickupDateTime = parseDateTime(driverData.pickupDate, driverData.pickupTime);

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
      
      // Timing
      startTime: pickupDateTime,
      // endTime calculated if we have transfer duration - could enhance this
      
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
    },
  });

  console.log(`✅ Private driver reservation created: ${reservation.id}`);
  
  return {
    success: true,
    reservation,
    message: `Private driver transfer added to trip: ${driverData.driverName} from ${driverData.pickupLocation} to ${driverData.dropoffLocation}`,
  };
}
