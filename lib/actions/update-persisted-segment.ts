"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { localToUTC, stringToPgDate } from "@/lib/utils/local-time";

export async function updatePersistedSegment(segmentId: string, updates: any) {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  // Verify segment belongs to user
  const existingSegment = await prisma.segment.findFirst({
    where: { id: segmentId, trip: { userId: session.user?.id } },
    include: { segmentType: true },
  });

  if (!existingSegment) {
    throw new Error("Segment not found");
  }

  // Prepare update data
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;
  if (updates.startTitle !== undefined) updateData.startTitle = updates.startTitle;
  if (updates.endTitle !== undefined) updateData.endTitle = updates.endTitle;
  if (updates.startLat !== undefined) updateData.startLat = updates.startLat;
  if (updates.startLng !== undefined) updateData.startLng = updates.startLng;
  if (updates.endLat !== undefined) updateData.endLat = updates.endLat;
  if (updates.endLng !== undefined) updateData.endLng = updates.endLng;
  if (updates.startTimeZoneId !== undefined) updateData.startTimeZoneId = updates.startTimeZoneId;
  if (updates.startTimeZoneName !== undefined) updateData.startTimeZoneName = updates.startTimeZoneName;
  if (updates.endTimeZoneId !== undefined) updateData.endTimeZoneId = updates.endTimeZoneId;
  if (updates.endTimeZoneName !== undefined) updateData.endTimeZoneName = updates.endTimeZoneName;
  
  // Get timezone IDs for local time conversion
  const startTzId = updates.startTimeZoneId || existingSegment.startTimeZoneId;
  const endTzId = updates.endTimeZoneId || existingSegment.endTimeZoneId || startTzId;
  
  // Handle local date fields (new approach)
  if (updates.localStartDate !== undefined) {
    updateData.wall_start_date = stringToPgDate(updates.localStartDate);
    if (updates.localStartDate && startTzId) {
      updateData.startTime = localToUTC(updates.localStartDate, null, startTzId, false);
    }
  } else if (updates.startTime !== undefined) {
    // Fall back to old approach
    updateData.startTime = updates.startTime ? new Date(updates.startTime) : null;
  }
  
  if (updates.localEndDate !== undefined) {
    updateData.wall_end_date = stringToPgDate(updates.localEndDate);
    if (updates.localEndDate && endTzId) {
      updateData.endTime = localToUTC(updates.localEndDate, null, endTzId, true);
    }
  } else if (updates.endTime !== undefined) {
    // Fall back to old approach
    updateData.endTime = updates.endTime ? new Date(updates.endTime) : null;
  }

  // Handle segment type change
  if (updates.segmentType !== undefined) {
    const segmentType = await prisma.segmentType.findFirst({
      where: { name: updates.segmentType },
    });
    if (segmentType) {
      updateData.segmentTypeId = segmentType.id;
    }
  }

  // Update the segment
  await prisma.segment.update({
    where: { id: segmentId },
    data: updateData,
  });

  return { success: true };
}
