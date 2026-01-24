"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  
  if (updates.startTime !== undefined) {
    updateData.startTime = updates.startTime ? new Date(updates.startTime) : null;
  }
  if (updates.endTime !== undefined) {
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
