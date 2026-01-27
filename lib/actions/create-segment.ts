"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSegmentTimeZones } from "./timezone";

// Geocoding helper
async function geocodeLocation(location: string): Promise<{
  lat: number;
  lng: number;
  formatted: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
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

  return null;
}

export interface CreateSegmentParams {
  tripId: string;
  name: string;
  startLocation: string;
  endLocation: string;
  startTime?: Date;
  endTime?: Date;
  segmentType?: string;
  notes?: string;
}

/**
 * Create a segment for a trip
 * Similar to add_segment tool but as a server action
 */
export async function createSegment({
  tripId,
  name,
  startLocation,
  endLocation,
  startTime,
  endTime,
  segmentType = "Other",
  notes,
}: CreateSegmentParams): Promise<string> {
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

  // Geocode locations
  const startGeo = await geocodeLocation(startLocation);
  const endGeo = await geocodeLocation(endLocation);

  if (!startGeo || !endGeo) {
    throw new Error(`Could not geocode locations. Please provide specific city/country names.`);
  }

  // Fetch timezone information for start and end locations
  const timezones = await getSegmentTimeZones(
    startGeo.lat,
    startGeo.lng,
    endGeo.lat,
    endGeo.lng,
    startTime,
    endTime
  );

  // Get segment type ID
  let segmentTypeRecord = await prisma.segmentType.findFirst({
    where: { name: segmentType },
  });

  // If segment type doesn't exist, create it or use "Other"
  if (!segmentTypeRecord) {
    segmentTypeRecord = await prisma.segmentType.findFirst({
      where: { name: "Other" },
    });

    if (!segmentTypeRecord) {
      // Create "Other" segment type if it doesn't exist
      segmentTypeRecord = await prisma.segmentType.create({
        data: { name: "Other" },
      });
    }
  }

  // Get the next order number
  const existingSegments = await prisma.segment.findMany({
    where: { tripId },
    orderBy: { order: "desc" },
    take: 1,
  });
  const nextOrder = existingSegments.length > 0 ? existingSegments[0].order + 1 : 0;

  // Create segment
  const segment = await prisma.segment.create({
    data: {
      name,
      tripId,
      segmentTypeId: segmentTypeRecord.id,
      startTitle: startGeo.formatted,
      startLat: startGeo.lat,
      startLng: startGeo.lng,
      endTitle: endGeo.formatted,
      endLat: endGeo.lat,
      endLng: endGeo.lng,
      startTime: startTime || null,
      endTime: endTime || null,
      startTimeZoneId: timezones.start?.timeZoneId ?? null,
      startTimeZoneName: timezones.start?.timeZoneName ?? null,
      endTimeZoneId: timezones.end?.timeZoneId ?? null,
      endTimeZoneName: timezones.end?.timeZoneName ?? null,
      notes: notes || null,
      order: nextOrder,
    },
  });

  return segment.id;
}
