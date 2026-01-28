"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface SegmentAdjustment {
  id: string;
  startDate: Date;
  endDate: Date;
}

export async function adjustSegmentDates(
  segmentId: string,
  newStartDate: Date,
  newEndDate: Date,
  adjustmentStrategy: "extend-trip" | "adjust-segments",
  segmentAdjustments?: SegmentAdjustment[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify segment belongs to user
  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      trip: { userId: session.user.id },
    },
    include: {
      trip: {
        include: {
          segments: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!segment) {
    throw new Error("Segment not found");
  }

  const trip = segment.trip;

  // Validate dates
  if (newStartDate >= newEndDate) {
    throw new Error("Start date must be before end date");
  }

  try {
    if (adjustmentStrategy === "extend-trip") {
      // Update trip boundaries if needed
      const updates: any = {};
      
      if (newStartDate < trip.startDate) {
        updates.startDate = newStartDate;
      }
      
      if (newEndDate > trip.endDate) {
        updates.endDate = newEndDate;
      }

      // Update trip dates if needed
      if (Object.keys(updates).length > 0) {
        await prisma.trip.update({
          where: { id: trip.id },
          data: updates,
        });
      }

      // Update the segment
      await prisma.segment.update({
        where: { id: segmentId },
        data: {
          startTime: newStartDate,
          endTime: newEndDate,
        },
      });
    } else if (adjustmentStrategy === "adjust-segments" && segmentAdjustments) {
      // Batch update multiple segments
      const updatePromises = segmentAdjustments.map((adjustment) =>
        prisma.segment.update({
          where: { id: adjustment.id },
          data: {
            startTime: adjustment.startDate,
            endTime: adjustment.endDate,
          },
        })
      );

      // Also update the current segment
      updatePromises.push(
        prisma.segment.update({
          where: { id: segmentId },
          data: {
            startTime: newStartDate,
            endTime: newEndDate,
          },
        })
      );

      await Promise.all(updatePromises);
    }

    return { success: true };
  } catch (error) {
    console.error("Error adjusting segment dates:", error);
    throw new Error("Failed to adjust segment dates");
  }
}

/**
 * Detect if segment date change causes conflicts
 */
export async function detectDateConflicts(
  segmentId: string,
  newStartDate: Date,
  newEndDate: Date
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      trip: { userId: session.user.id },
    },
    include: {
      trip: {
        include: {
          segments: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!segment) {
    throw new Error("Segment not found");
  }

  const trip = segment.trip;
  const conflicts: {
    type: "overlap" | "trip-boundary" | "gap";
    message: string;
    affectedSegments: string[];
  }[] = [];

  // Check trip boundaries
  if (newStartDate < trip.startDate || newEndDate > trip.endDate) {
    conflicts.push({
      type: "trip-boundary",
      message: `Segment dates extend beyond trip boundaries (${trip.startDate.toLocaleDateString()} - ${trip.endDate.toLocaleDateString()})`,
      affectedSegments: [],
    });
  }

  // Check for overlaps with adjacent segments
  const segmentIndex = trip.segments.findIndex((s) => s.id === segmentId);
  
  if (segmentIndex > 0) {
    const prevSegment = trip.segments[segmentIndex - 1];
    if (prevSegment.endTime && newStartDate < prevSegment.endTime) {
      conflicts.push({
        type: "overlap",
        message: `Overlaps with previous segment "${prevSegment.name}"`,
        affectedSegments: [prevSegment.id],
      });
    }
  }

  if (segmentIndex < trip.segments.length - 1) {
    const nextSegment = trip.segments[segmentIndex + 1];
    if (nextSegment.startTime && newEndDate > nextSegment.startTime) {
      conflicts.push({
        type: "overlap",
        message: `Overlaps with next segment "${nextSegment.name}"`,
        affectedSegments: [nextSegment.id],
      });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    trip: {
      id: trip.id,
      startDate: trip.startDate,
      endDate: trip.endDate,
    },
    adjacentSegments: {
      previous: segmentIndex > 0 ? trip.segments[segmentIndex - 1] : null,
      next:
        segmentIndex < trip.segments.length - 1
          ? trip.segments[segmentIndex + 1]
          : null,
    },
  };
}
