"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HotelExtraction } from "@/lib/schemas/hotel-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { createHotelCluster } from "@/lib/utils/hotel-clustering";
import { findBestSegmentForHotel } from "@/lib/utils/segment-matching";
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

interface AddHotelsOptions {
  autoMatch?: boolean;
  minScore?: number;
  createSuggestedSegments?: boolean;
}

export async function addHotelsToTrip(params: {
  tripId: string;
  segmentId?: string | null;
  hotelData: HotelExtraction;
  options?: AddHotelsOptions;
}) {
  const { tripId, segmentId, hotelData, options = {} } = params;
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
    console.log('🔍 Auto-matching hotel to segment...');
    
    const hotelCluster = createHotelCluster(hotelData);
    const match = findBestSegmentForHotel(hotelCluster, trip.segments, minScore);
    
    if (match) {
      targetSegmentId = match.segmentId;
      console.log(`✅ Auto-matched to segment: ${match.segmentName} (score: ${match.score})`);
    } else if (createSuggestedSegments) {
      console.log('⭐ No match found, creating new "Stay" segment...');
      
      // Create a new "Stay" segment for this hotel
      const stayType = await prisma.segmentType.findFirst({
        where: { 
          OR: [
            { name: 'Stay' },
            { name: 'Accommodation' }
          ]
        }
      });
      
      // Get city from address (simple extraction)
      const cityMatch = hotelData.address.match(/([^,]+),/);
      const city = cityMatch ? cityMatch[1].trim() : hotelData.hotelName;
      
      // Geocode location
      const geo = await geocodeLocation(city);
      if (!geo) {
        throw new Error('Could not geocode hotel location');
      }
      
      const startTime = new Date(`${hotelData.checkInDate}T15:00:00`);
      const endTime = new Date(`${hotelData.checkOutDate}T11:00:00`);
      
      // Fetch timezone information for segment
      const timezones = await getSegmentTimeZones(
        geo.lat,
        geo.lng,
        geo.lat,
        geo.lng,
        startTime,
        endTime
      );
      
      const newSegment = await prisma.segment.create({
        data: {
          tripId,
          name: `Stay in ${city}`,
          startTitle: city,
          startLat: geo.lat,
          startLng: geo.lng,
          endTitle: city,
          endLat: geo.lat,
          endLng: geo.lng,
          startTime,
          endTime,
          startTimeZoneId: timezones.start?.timeZoneId ?? null,
          startTimeZoneName: timezones.start?.timeZoneName ?? null,
          endTimeZoneId: timezones.end?.timeZoneId ?? null,
          endTimeZoneName: timezones.end?.timeZoneName ?? null,
          order: trip.segments.length,
          segmentTypeId: stayType?.id
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
  const hotelType = await getReservationType("Stay", "Hotel");
  const confirmedStatus = await getReservationStatus("Confirmed");

  // Helper to convert "3:00 PM" to "15:00:00"
  function convertTo24Hour(time: string): string {
    if (!time || time === "") return "15:00:00"; // Default check-in time
    
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "15:00:00";
    
    let [_, hours, minutes, period] = match;
    let h = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    
    return `${h.toString().padStart(2, '0')}:${minutes}:00`;
  }

  // Calculate number of nights
  const checkIn = new Date(hotelData.checkInDate);
  const checkOut = new Date(hotelData.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  // Build notes from hotel details
  const notes = [
    hotelData.roomType && hotelData.roomType !== "" ? `Room Type: ${hotelData.roomType}` : null,
    hotelData.numberOfRooms > 0 ? `Rooms: ${hotelData.numberOfRooms}` : null,
    hotelData.numberOfGuests > 0 ? `Guests: ${hotelData.numberOfGuests}` : null,
    nights > 0 ? `Nights: ${nights}` : null,
    hotelData.bookingDate && hotelData.bookingDate !== "" ? `Booked: ${hotelData.bookingDate}` : null,
  ].filter(Boolean).join('\n');

  // Create the hotel reservation
  const reservation = await prisma.reservation.create({
    data: {
      name: hotelData.hotelName,
      confirmationNumber: hotelData.confirmationNumber,
      reservationTypeId: hotelType.id,
      reservationStatusId: confirmedStatus.id,
      segmentId: targetSegmentId,
      startTime: new Date(`${hotelData.checkInDate}T${convertTo24Hour(hotelData.checkInTime)}`),
      endTime: new Date(`${hotelData.checkOutDate}T${convertTo24Hour(hotelData.checkOutTime || "11:00 AM")}`),
      cost: hotelData.totalCost && hotelData.totalCost !== 0 ? hotelData.totalCost : undefined,
      currency: hotelData.currency && hotelData.currency !== "" ? hotelData.currency : undefined,
      location: hotelData.address && hotelData.address !== "" ? hotelData.address : undefined,
      notes: notes || undefined,
    },
  });

  return {
    success: true,
    count: 1,
    reservation,
    segmentId: targetSegmentId,
    segmentName: segment.name,
  };
}
