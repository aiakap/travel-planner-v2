"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Update trip start and/or end dates
 */
export async function updateTripDates(
  tripId: string,
  updates: {
    startDate?: Date;
    endDate?: Date;
  }
) {
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
    throw new Error("Trip not found");
  }

  // Validate dates
  const newStartDate = updates.startDate || trip.startDate;
  const newEndDate = updates.endDate || trip.endDate;

  if (newStartDate >= newEndDate) {
    throw new Error("Start date must be before end date");
  }

  try {
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(updates.startDate && { startDate: updates.startDate }),
        ...(updates.endDate && { endDate: updates.endDate }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating trip dates:", error);
    throw new Error("Failed to update trip dates");
  }
}

/**
 * Auto-adjust trip dates based on segment dates
 * Expands trip boundaries if any segment extends beyond current boundaries
 */
export async function autoAdjustTripDates(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Get trip with all segments
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      segments: {
        where: {
          startTime: { not: null },
          endTime: { not: null },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.segments.length === 0) {
    return { success: true, updated: false };
  }

  // Find earliest start and latest end across all segments
  let earliestStart = trip.segments[0].startTime!;
  let latestEnd = trip.segments[0].endTime!;

  for (const segment of trip.segments) {
    if (segment.startTime && segment.startTime < earliestStart) {
      earliestStart = segment.startTime;
    }
    if (segment.endTime && segment.endTime > latestEnd) {
      latestEnd = segment.endTime;
    }
  }

  // Check if trip dates need adjustment
  const needsUpdate =
    earliestStart < trip.startDate || latestEnd > trip.endDate;

  if (!needsUpdate) {
    return { success: true, updated: false };
  }

  // Update trip dates
  try {
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        startDate: earliestStart < trip.startDate ? earliestStart : trip.startDate,
        endDate: latestEnd > trip.endDate ? latestEnd : trip.endDate,
      },
    });

    return {
      success: true,
      updated: true,
      oldDates: {
        startDate: trip.startDate,
        endDate: trip.endDate,
      },
      newDates: {
        startDate: earliestStart < trip.startDate ? earliestStart : trip.startDate,
        endDate: latestEnd > trip.endDate ? latestEnd : trip.endDate,
      },
    };
  } catch (error) {
    console.error("Error auto-adjusting trip dates:", error);
    throw new Error("Failed to auto-adjust trip dates");
  }
}
