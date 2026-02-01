"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { queueSegmentImageGeneration } from "./queue-image-generation";
import { getSegmentTimeZones } from "./timezone";
import { localToUTC, stringToPgDate } from "@/lib/utils/local-time";

async function geocodeAddress(address: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  const firstResult = data.results?.[0];
  if (!firstResult?.geometry?.location) {
    throw new Error("No results found for that address");
  }

  const { lat, lng } = firstResult.geometry.location;
  return { lat, lng, formatted: firstResult.formatted_address ?? address };
}

export async function addSegment(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name")?.toString();
  const startAddress = formData.get("startAddress")?.toString();
  const endAddress = formData.get("endAddress")?.toString();
  const notes = formData.get("notes")?.toString();
  const startTimeStr = formData.get("startTime")?.toString();
  const endTimeStr = formData.get("endTime")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();
  const segmentTypeId = formData.get("segmentTypeId")?.toString();
  // Local date strings (new approach)
  const localStartDate = formData.get("localStartDate")?.toString();
  const localEndDate = formData.get("localEndDate")?.toString();

  if (!name || !startAddress || !endAddress || !segmentTypeId) {
    throw new Error(
      "Name, start address, end address, and segment type are required"
    );
  }

  const [startGeo, endGeo] = await Promise.all([
    geocodeAddress(startAddress),
    geocodeAddress(endAddress),
  ]);

  // Fetch timezone information for start and end locations
  const startTime = startTimeStr ? new Date(startTimeStr) : undefined;
  const endTime = endTimeStr ? new Date(endTimeStr) : undefined;
  
  const timezones = await getSegmentTimeZones(
    startGeo.lat,
    startGeo.lng,
    endGeo.lat,
    endGeo.lng,
    startTime,
    endTime
  );

  const count = await prisma.segment.count({
    where: { tripId },
  });

  const imageIsCustom = !!imageUrl;
  
  // Prepare timezone IDs
  const startTzId = timezones.start?.timeZoneId || null;
  const endTzId = timezones.end?.timeZoneId || startTzId;
  
  // Calculate local and UTC dates
  let wallStartDate: Date | null = null;
  let wallEndDate: Date | null = null;
  let utcStartTime: Date | null = startTime || null;
  let utcEndTime: Date | null = endTime || null;
  
  // If local date strings are provided, use them for wall_* fields and calculate UTC
  if (localStartDate) {
    wallStartDate = stringToPgDate(localStartDate);
    if (startTzId) {
      utcStartTime = localToUTC(localStartDate, null, startTzId, false);
    }
  }
  
  if (localEndDate) {
    wallEndDate = stringToPgDate(localEndDate);
    if (endTzId) {
      utcEndTime = localToUTC(localEndDate, null, endTzId, true);
    }
  }

  const segment = await prisma.segment.create({
    data: {
      startTitle: startGeo.formatted,
      startLat: startGeo.lat,
      startLng: startGeo.lng,
      startTimeZoneId: startTzId,
      startTimeZoneName: timezones.start?.timeZoneName,
      endTitle: endGeo.formatted,
      endLat: endGeo.lat,
      endLng: endGeo.lng,
      endTimeZoneId: endTzId,
      endTimeZoneName: timezones.end?.timeZoneName,
      name,
      imageUrl: imageUrl || null,
      imageIsCustom,
      notes: notes || null,
      // Local time fields (primary)
      wall_start_date: wallStartDate,
      wall_end_date: wallEndDate,
      // UTC fields (for sorting)
      startTime: utcStartTime,
      endTime: utcEndTime,
      segmentTypeId,
      tripId,
      order: count,
    },
  });

  // Queue image generation if user didn't upload one
  if (!imageUrl) {
    try {
      const queueId = await queueSegmentImageGeneration(segment.id);
      console.log(`✓ Queued segment image generation: ${queueId}`);
    } catch (error) {
      console.error("❌ Failed to queue segment image generation:", error);
      console.error("Error details:", error);
      // Don't fail the segment creation if queue fails
    }
  }

  redirect(`/trips/${tripId}`);
}
