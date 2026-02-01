"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { localToUTC, stringToPgDate } from "@/lib/utils/local-time";

export async function updateSegmentSimple(segmentId: string, updates: {
  name?: string;
  /** @deprecated Use localStartDate instead */
  startTime?: string;
  /** @deprecated Use localEndDate instead */
  endTime?: string;
  /** Local start date in YYYY-MM-DD format */
  localStartDate?: string;
  /** Local end date in YYYY-MM-DD format */
  localEndDate?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, trip: { userId: session.user.id } },
  });

  if (!segment) {
    throw new Error("Segment not found");
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  
  // Handle local date fields (new approach)
  if (updates.localStartDate) {
    updateData.wall_start_date = stringToPgDate(updates.localStartDate);
    if (segment.startTimeZoneId) {
      updateData.startTime = localToUTC(updates.localStartDate, null, segment.startTimeZoneId, false);
    }
  } else if (updates.startTime) {
    // Fall back to old approach
    updateData.startTime = new Date(updates.startTime);
  }
  
  if (updates.localEndDate) {
    updateData.wall_end_date = stringToPgDate(updates.localEndDate);
    const endTz = segment.endTimeZoneId || segment.startTimeZoneId;
    if (endTz) {
      updateData.endTime = localToUTC(updates.localEndDate, null, endTz, true);
    }
  } else if (updates.endTime) {
    // Fall back to old approach
    updateData.endTime = new Date(updates.endTime);
  }

  await prisma.segment.update({
    where: { id: segmentId },
    data: updateData,
  });

  return { success: true };
}
