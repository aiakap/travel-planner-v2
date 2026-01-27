"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CarRentalExtraction } from "@/lib/schemas/car-rental-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { createCarRentalCluster } from "@/lib/utils/car-rental-clustering";
import { findBestSegmentForCarRental } from "@/lib/utils/segment-matching";
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

  // Fallback to default coordinates
  return { lat: 0, lng: 0, formatted: location };
}

/**
 * Safely parse date and time into a valid Date object
 * Handles various date formats and provides fallbacks
 */
function parseDateTime(dateStr: string, timeStr: string, defaultTime: string = "12:00:00"): Date {
  // Normalize the date string to ISO format if needed
  let isoDate = dateStr;
  
  // If not already in ISO format (YYYY-MM-DD), try to parse it
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      // Successfully parsed, convert to ISO date
      isoDate = parsed.toISOString().split('T')[0];
    } else {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
  }
  
  // Get normalized time (convertTo24Hour handles empty strings)
  const normalizedTime = convertTo24Hour(timeStr || "");
  
  // Construct the datetime string
  const dateTimeStr = `${isoDate}T${normalizedTime}`;
  const result = new Date(dateTimeStr);
  
  // Validate the result
  if (isNaN(result.getTime())) {
    throw new Error(`Invalid datetime: ${dateTimeStr} (from date: ${dateStr}, time: ${timeStr})`);
  }
  
  return result;
}

interface AddCarRentalOptions {
  autoMatch?: boolean;
  minScore?: number;
  createSuggestedSegments?: boolean;
}

export async function addCarRentalToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  carRentalData: CarRentalExtraction;
  options?: AddCarRentalOptions;
}) {
  const { tripId, segmentId, carRentalData, options = {} } = params;
  const { autoMatch = false, minScore = 70, createSuggestedSegments = false } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

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

  let targetSegmentId = segmentId;

  // If no segment provided and autoMatch is enabled, try to find best match
  if (!targetSegmentId && autoMatch) {
    console.log('🔍 Auto-matching car rental to segment...');
    
    const carRentalCluster = createCarRentalCluster(carRentalData);
    const match = findBestSegmentForCarRental(carRentalCluster, trip.segments, minScore);
    
    if (match) {
      targetSegmentId = match.segmentId;
      console.log(`✅ Auto-matched to segment: ${match.segmentName} (score: ${match.score})`);
    } else if (createSuggestedSegments) {
      console.log('⭐ No match found, creating new "Drive" segment...');
      
      // Create a new "Drive" segment for this car rental
      const driveType = await prisma.segmentType.findFirst({
        where: { 
          OR: [
            { name: 'Drive' },
            { name: 'Road Trip' }
          ]
        }
      });
      
      // Extract city from pickup address
      const pickupCity = extractCityFromAddress(carRentalData.pickupAddress, carRentalData.pickupLocation);
      const returnCity = extractCityFromAddress(carRentalData.returnAddress, carRentalData.returnLocation);
      
      // Geocode locations
      const startGeo = await geocodeLocation(pickupCity);
      const endGeo = await geocodeLocation(returnCity);
      
      if (!startGeo || !endGeo) {
        throw new Error('Could not geocode pickup/return locations');
      }
      
      // Determine segment name based on one-way vs round-trip
      const isOneWay = carRentalData.pickupLocation !== carRentalData.returnLocation || 
                       carRentalData.oneWayCharge > 0;
      const segmentName = isOneWay 
        ? `Drive from ${pickupCity} to ${returnCity}`
        : `Drive in ${pickupCity}`;
      
      const startTime = new Date(`${carRentalData.pickupDate}T${convertTo24Hour(carRentalData.pickupTime)}`);
      const endTime = new Date(`${carRentalData.returnDate}T${convertTo24Hour(carRentalData.returnTime)}`);
      
      // Fetch timezone information for segment
      const timezones = await getSegmentTimeZones(
        startGeo.lat,
        startGeo.lng,
        endGeo.lat,
        endGeo.lng,
        startTime,
        endTime
      );
      
      const newSegment = await prisma.segment.create({
        data: {
          tripId,
          name: segmentName,
          startTitle: pickupCity,
          startLat: startGeo.lat,
          startLng: startGeo.lng,
          endTitle: returnCity,
          endLat: endGeo.lat,
          endLng: endGeo.lng,
          startTime,
          endTime,
          startTimeZoneId: timezones.start?.timeZoneId ?? null,
          startTimeZoneName: timezones.start?.timeZoneName ?? null,
          endTimeZoneId: timezones.end?.timeZoneId ?? null,
          endTimeZoneName: timezones.end?.timeZoneName ?? null,
          order: trip.segments.length,
          segmentTypeId: driveType?.id
        }
      });
      
      targetSegmentId = newSegment.id;
      console.log(`✅ Created new segment: ${newSegment.name}`);
    } else {
      throw new Error('No matching segment found and segment creation is disabled. Please select a segment manually.');
    }
  }

  // Verify we have a target segment
  if (!targetSegmentId) {
    throw new Error('No segment specified. Please provide a segmentId or enable autoMatch.');
  }

  // Verify segment belongs to this trip
  const segment = trip.segments.find(s => s.id === targetSegmentId);
  if (!segment) {
    throw new Error("Segment not found or does not belong to this trip");
  }

  // Get cached reservation type and status
  const carRentalType = await getReservationType("Travel", "Car Rental");
  const confirmedStatus = await getReservationStatus("Confirmed");

  // Calculate rental duration in days
  const pickupDate = new Date(carRentalData.pickupDate);
  const returnDate = new Date(carRentalData.returnDate);
  const rentalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

  // Build notes from car rental details
  const notes = [
    carRentalData.vehicleClass && carRentalData.vehicleClass !== "" ? `Vehicle Class: ${carRentalData.vehicleClass}` : null,
    carRentalData.vehicleModel && carRentalData.vehicleModel !== "" ? `Model: ${carRentalData.vehicleModel}` : null,
    carRentalData.pickupFlightNumber && carRentalData.pickupFlightNumber !== "" ? `Arrival Flight: ${carRentalData.pickupFlightNumber}` : null,
    rentalDays > 0 ? `Rental Days: ${rentalDays}` : null,
    carRentalData.options && carRentalData.options.length > 0 ? `Options: ${carRentalData.options.join(', ')}` : null,
    carRentalData.oneWayCharge > 0 ? `One-way Charge: ${carRentalData.currency} ${carRentalData.oneWayCharge}` : null,
    carRentalData.bookingDate && carRentalData.bookingDate !== "" ? `Booked: ${carRentalData.bookingDate}` : null,
  ].filter(Boolean).join('\n');

  // Build metadata JSON
  const metadata = {
    company: carRentalData.company,
    vehicleClass: carRentalData.vehicleClass,
    vehicleModel: carRentalData.vehicleModel,
    pickupLocation: carRentalData.pickupLocation,
    pickupAddress: carRentalData.pickupAddress,
    pickupFlightNumber: carRentalData.pickupFlightNumber,
    returnLocation: carRentalData.returnLocation,
    returnAddress: carRentalData.returnAddress,
    options: carRentalData.options,
    oneWayCharge: carRentalData.oneWayCharge,
    isOneWay: carRentalData.pickupLocation !== carRentalData.returnLocation || carRentalData.oneWayCharge > 0,
    bookingDate: carRentalData.bookingDate
  };

  // Create the car rental reservation with detailed logging
  console.log('📝 Creating car rental reservation with data:', {
    name: `${carRentalData.company} - ${carRentalData.vehicleClass || 'Car Rental'}`,
    pickupDate: carRentalData.pickupDate,
    pickupTime: carRentalData.pickupTime,
    returnDate: carRentalData.returnDate,
    returnTime: carRentalData.returnTime,
  });

  try {
    const startDateTime = parseDateTime(carRentalData.pickupDate, carRentalData.pickupTime, "09:00:00");
    const endDateTime = parseDateTime(carRentalData.returnDate, carRentalData.returnTime, "11:00:00");
    
    console.log('✅ Parsed datetimes:', {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    });

    const reservation = await prisma.reservation.create({
      data: {
        name: `${carRentalData.company} - ${carRentalData.vehicleClass || 'Car Rental'}`,
        confirmationNumber: carRentalData.confirmationNumber,
        reservationTypeId: carRentalType.id,
        reservationStatusId: confirmedStatus.id,
        segmentId: targetSegmentId,
        startTime: startDateTime,
        endTime: endDateTime,
        startLocation: carRentalData.pickupLocation,
        endLocation: carRentalData.returnLocation,
        notes: notes || null,
        metadata: metadata as any,
        cost: carRentalData.totalCost > 0 ? carRentalData.totalCost : null,
        currency: carRentalData.currency || null,
      },
    });

    console.log(`✅ Car rental reservation created: ${reservation.id}`);

    return {
      success: true,
      reservationIds: [reservation.id],
      segmentId: targetSegmentId,
      message: "Car rental reservation added successfully"
    };
  } catch (error: any) {
    console.error('❌ Failed to create car rental reservation:', error);
    console.error('   Input data:', {
      pickupDate: carRentalData.pickupDate,
      pickupTime: carRentalData.pickupTime,
      returnDate: carRentalData.returnDate,
      returnTime: carRentalData.returnTime,
    });
    throw new Error(`Failed to create car rental reservation: ${error.message}`);
  }
}

/**
 * Helper to convert "3:00 PM" or "14:00" to "HH:MM:SS" format
 */
function convertTo24Hour(time: string): string {
  if (!time || time === "") return "12:00:00"; // Default time
  
  // Check if already in 24-hour format (HH:MM or HH:MM:SS)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
    const parts = time.split(':');
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1];
    const seconds = parts[2] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Parse 12-hour format (e.g., "3:00 PM")
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "12:00:00";
  
  let [_, hours, minutes, period] = match;
  let h = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  
  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
}

/**
 * Extract city/region from address for segment naming
 */
function extractCityFromAddress(address: string, locationName: string): string {
  if (!address || address === "") return locationName;
  
  // Try to extract city name from address
  // Common patterns: "City, State", "City-shi", "City, Country"
  const parts = address.split(',');
  if (parts.length >= 2) {
    // Return the first significant part (usually city)
    return parts[0].trim();
  }
  
  // For Japanese addresses with -shi, -ku, etc.
  const japaneseMatch = address.match(/([^,]+)(-shi|-ku|-cho|-machi)/i);
  if (japaneseMatch) {
    return japaneseMatch[1].trim() + japaneseMatch[2];
  }
  
  return locationName;
}
