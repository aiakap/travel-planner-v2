"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TripStatus, TripPermission } from "@/app/generated/prisma";

// Geocoding helper (copied from create-segment.ts to keep isolated)
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

/**
 * Create a new trip in DRAFT status
 */
export async function createDraftTrip({
  title,
  description,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate dates
  if (end < start) {
    throw new Error("End date must be after start date");
  }

  // Create trip with DRAFT status
  const trip = await prisma.trip.create({
    data: {
      title: title || "Untitled Trip",
      description: description || "",
      startDate: start,
      endDate: end,
      userId: session.user.id,
      status: TripStatus.DRAFT,
      permissions: TripPermission.PRIVATE,
      imageUrl: null,
      imageIsCustom: false,
    },
  });

  return trip.id;
}

/**
 * Update trip metadata (title, description, dates)
 */
export async function updateTripMetadata(
  tripId: string,
  updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('❌ updateTripMetadata: Unauthorized - no session user');
    throw new Error("Unauthorized");
  }

  console.log(`🔍 updateTripMetadata: Looking for trip ${tripId} for user ${session.user.id}`);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
  });

  if (!trip) {
    console.error(`❌ updateTripMetadata: Trip not found - tripId=${tripId}, userId=${session.user.id}`);
    throw new Error(`Trip not found: ${tripId}`);
  }
  
  console.log(`✅ updateTripMetadata: Found trip ${tripId}`);

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.startDate) updateData.startDate = new Date(updates.startDate);
  if (updates.endDate) updateData.endDate = new Date(updates.endDate);

  await prisma.trip.update({
    where: { id: tripId },
    data: updateData,
  });

  return { success: true };
}

/**
 * Sync segments - bulk upsert (create/update/delete)
 */
export async function syncSegments(
  tripId: string,
  segments: Array<{
    id: string; // UI temp ID or DB ID
    dbId?: string; // Actual DB ID if exists
    type: string;
    name: string;
    days: number;
    start_location: string;
    end_location: string;
    start_image: string | null;
    end_image: string | null;
    order: number;
    startTime: string;
    endTime: string;
  }>,
  segmentTypeMap: Record<string, string> // Map of type name to DB ID
) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('❌ syncSegments: Unauthorized - no session user');
    throw new Error("Unauthorized");
  }

  console.log(`🔍 syncSegments: Looking for trip ${tripId} for user ${session.user.id}, syncing ${segments.length} segments`);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: { segments: true },
  });

  if (!trip) {
    console.error(`❌ syncSegments: Trip not found - tripId=${tripId}, userId=${session.user.id}`);
    throw new Error(`Trip not found: ${tripId}`);
  }

  console.log(`✅ syncSegments: Found trip ${tripId} with ${trip.segments.length} existing segments`);

  // Get existing segment IDs from DB
  const existingSegmentIds = new Set(trip.segments.map(s => s.id));
  const incomingDbIds = new Set(segments.filter(s => s.dbId).map(s => s.dbId!));

  // Delete segments that are no longer in the incoming list
  const segmentsToDelete = trip.segments.filter(s => !incomingDbIds.has(s.id));
  if (segmentsToDelete.length > 0) {
    await prisma.segment.deleteMany({
      where: {
        id: { in: segmentsToDelete.map(s => s.id) },
      },
    });
  }

  // Upsert segments
  for (const segment of segments) {
    const segmentTypeId = segmentTypeMap[segment.type];
    if (!segmentTypeId) {
      console.error(`Unknown segment type: ${segment.type}`);
      continue;
    }

    // Geocode locations if they exist
    let startGeo = null;
    let endGeo = null;

    if (segment.start_location) {
      startGeo = await geocodeLocation(segment.start_location);
    }
    if (segment.end_location) {
      endGeo = await geocodeLocation(segment.end_location);
    }

    const segmentData = {
      name: segment.name,
      tripId,
      segmentTypeId,
      startTitle: segment.start_location || "",
      startLat: startGeo?.lat || 0,
      startLng: startGeo?.lng || 0,
      endTitle: segment.end_location || "",
      endLat: endGeo?.lat || 0,
      endLng: endGeo?.lng || 0,
      startTime: new Date(segment.startTime),
      endTime: new Date(segment.endTime),
      order: segment.order,
      imageUrl: segment.start_image || segment.end_image || null,
      notes: null,
    };

    if (segment.dbId && existingSegmentIds.has(segment.dbId)) {
      // Update existing segment
      await prisma.segment.update({
        where: { id: segment.dbId },
        data: segmentData,
      });
    } else {
      // Create new segment
      const created = await prisma.segment.create({
        data: segmentData,
      });
      // Update the segment with the DB ID for future updates
      segment.dbId = created.id;
    }
  }

  return { success: true, segments };
}

/**
 * Reorder segments efficiently
 */
export async function reorderSegments(
  tripId: string,
  segmentIds: string[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('❌ reorderSegments: Unauthorized - no session user');
    throw new Error("Unauthorized");
  }

  console.log(`🔍 reorderSegments: Looking for trip ${tripId} for user ${session.user.id}`);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
  });

  if (!trip) {
    console.error(`❌ reorderSegments: Trip not found - tripId=${tripId}, userId=${session.user.id}`);
    throw new Error(`Trip not found: ${tripId}`);
  }
  
  console.log(`✅ reorderSegments: Found trip ${tripId}, reordering ${segmentIds.length} segments`);

  // Update order for each segment
  await Promise.all(
    segmentIds.map((id, index) =>
      prisma.segment.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return { success: true };
}

/**
 * Load existing draft trip (if any)
 */
export async function loadDraftTrip() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  // Find most recent draft trip
  const trip = await prisma.trip.findFirst({
    where: {
      userId: session.user.id,
      status: TripStatus.DRAFT,
    },
    include: {
      segments: {
        orderBy: { order: 'asc' },
        include: {
          segmentType: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return trip;
}
