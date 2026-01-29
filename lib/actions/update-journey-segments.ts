"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSegmentTimeZones } from "./timezone";
import { generateTripDescription } from "@/lib/utils/trip-description";

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

interface NewSegmentData {
  name: string;
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime: Date;
  segmentType: string;
  order: number;
}

interface UpdatedSegmentData {
  id: string;
  name?: string;
  startTime: Date;
  endTime: Date;
  order: number;
}

interface UpdateJourneySegmentsParams {
  tripId: string;
  deletedSegmentIds: string[];
  newSegments: NewSegmentData[];
  updatedSegments: UpdatedSegmentData[];
  tripStartDate: Date;
  tripEndDate: Date;
}

/**
 * Atomically update all journey segments in a single transaction
 * Handles deletes, creates, updates, and trip date changes
 * All-or-nothing: if any operation fails, all changes are rolled back
 */
export async function updateJourneySegments({
  tripId,
  deletedSegmentIds,
  newSegments,
  updatedSegments,
  tripStartDate,
  tripEndDate,
}: UpdateJourneySegmentsParams): Promise<{
  success: true;
  segmentsAffected: number;
  segmentsDeleted: number;
  segmentsCreated: number;
  segmentsUpdated: number;
}> {
  // Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Validate dates
  if (tripStartDate >= tripEndDate) {
    throw new Error("Invalid dates: Start date must be before end date");
  }

  // Authorization check - verify trip belongs to user
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      segments: {
        select: { id: true },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found or unauthorized");
  }

  // Validate that all segments to update/delete belong to this trip
  const tripSegmentIds = new Set(trip.segments.map((s) => s.id));
  
  for (const segmentId of deletedSegmentIds) {
    if (!tripSegmentIds.has(segmentId)) {
      throw new Error(`Segment ${segmentId} not found in trip`);
    }
  }
  
  for (const segment of updatedSegments) {
    if (!tripSegmentIds.has(segment.id)) {
      throw new Error(`Segment ${segment.id} not found in trip`);
    }
  }

  // Execute all operations in a single transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      // Step 1: Delete removed segments
      if (deletedSegmentIds.length > 0) {
        const deleteResult = await tx.segment.deleteMany({
          where: {
            id: { in: deletedSegmentIds },
            tripId: tripId, // Extra safety check
          },
        });
        deletedCount = deleteResult.count;
      }

      // Step 2: Create new segments (from splits)
      for (const newSeg of newSegments) {
        try {
          // Geocode locations
          const startGeo = await geocodeLocation(newSeg.startLocation);
          const endGeo = await geocodeLocation(newSeg.endLocation);

          if (!startGeo || !endGeo) {
            throw new Error(
              `Could not geocode locations for segment "${newSeg.name}". Start: ${newSeg.startLocation}, End: ${newSeg.endLocation}`
            );
          }

          // Get timezone information
          const timezones = await getSegmentTimeZones(
            startGeo.lat,
            startGeo.lng,
            endGeo.lat,
            endGeo.lng,
            newSeg.startTime,
            newSeg.endTime
          );

          // Get or create segment type
          let segmentTypeRecord = await tx.segmentType.findFirst({
            where: { name: newSeg.segmentType },
          });

          if (!segmentTypeRecord) {
            segmentTypeRecord = await tx.segmentType.findFirst({
              where: { name: "Other" },
            });

            if (!segmentTypeRecord) {
              segmentTypeRecord = await tx.segmentType.create({
                data: { name: "Other" },
              });
            }
          }

          // Create the segment
          await tx.segment.create({
            data: {
              name: newSeg.name,
              tripId: tripId,
              segmentTypeId: segmentTypeRecord.id,
              startTitle: startGeo.formatted,
              startLat: startGeo.lat,
              startLng: startGeo.lng,
              endTitle: endGeo.formatted,
              endLat: endGeo.lat,
              endLng: endGeo.lng,
              startTime: newSeg.startTime,
              endTime: newSeg.endTime,
              startTimeZoneId: timezones.start?.timeZoneId ?? null,
              startTimeZoneName: timezones.start?.timeZoneName ?? null,
              endTimeZoneId: timezones.end?.timeZoneId ?? null,
              endTimeZoneName: timezones.end?.timeZoneName ?? null,
              order: newSeg.order,
            },
          });
          createdCount++;
        } catch (error) {
          // Provide context about which segment failed
          throw new Error(
            `Failed to create segment "${newSeg.name}": ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      // Step 3: Update existing segments
      for (const updatedSeg of updatedSegments) {
        try {
          const updateData: any = {
            startTime: updatedSeg.startTime,
            endTime: updatedSeg.endTime,
            order: updatedSeg.order,
          };
          
          // Include name if provided
          if (updatedSeg.name !== undefined) {
            updateData.name = updatedSeg.name;
          }
          
          await tx.segment.update({
            where: { id: updatedSeg.id },
            data: updateData,
          });
          updatedCount++;
        } catch (error) {
          throw new Error(
            `Failed to update segment ${updatedSeg.id}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      // Step 4: Update trip dates and potentially description
      // First, check if description is custom
      const tripData = await tx.trip.findUnique({
        where: { id: tripId },
        select: { descriptionIsCustom: true },
      });

      const updateData: any = {
        startDate: tripStartDate,
        endDate: tripEndDate,
      };

      // If description is not custom and segments were modified, regenerate it
      if (!tripData?.descriptionIsCustom && (deletedCount > 0 || createdCount > 0)) {
        // Fetch all segments to regenerate description
        const allSegments = await tx.segment.findMany({
          where: { tripId: tripId },
          orderBy: { order: 'asc' },
          select: {
            startTitle: true,
            endTitle: true,
            order: true,
          },
        });

        if (allSegments.length > 0) {
          updateData.description = generateTripDescription(allSegments);
        }
      }

      await tx.trip.update({
        where: { id: tripId },
        data: updateData,
      });

      return {
        deletedCount,
        createdCount,
        updatedCount,
      };
    });

    // Return success with details
    return {
      success: true,
      segmentsAffected: result.deletedCount + result.createdCount + result.updatedCount,
      segmentsDeleted: result.deletedCount,
      segmentsCreated: result.createdCount,
      segmentsUpdated: result.updatedCount,
    };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
    throw new Error(`Transaction failed: ${String(error)}`);
  }
}
