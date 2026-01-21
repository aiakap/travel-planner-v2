"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { queueSegmentImageGeneration } from "./queue-image-generation";

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

  if (!name || !startAddress || !endAddress || !segmentTypeId) {
    throw new Error(
      "Name, start address, end address, and segment type are required"
    );
  }

  const [startGeo, endGeo] = await Promise.all([
    geocodeAddress(startAddress),
    geocodeAddress(endAddress),
  ]);

  const count = await prisma.segment.count({
    where: { tripId },
  });

  const imageIsCustom = !!imageUrl;

  const segment = await prisma.segment.create({
    data: {
      startTitle: startGeo.formatted,
      startLat: startGeo.lat,
      startLng: startGeo.lng,
      endTitle: endGeo.formatted,
      endLat: endGeo.lat,
      endLng: endGeo.lng,
      name,
      imageUrl: imageUrl || null,
      imageIsCustom,
      notes: notes || null,
      startTime: startTimeStr ? new Date(startTimeStr) : null,
      endTime: endTimeStr ? new Date(endTimeStr) : null,
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
