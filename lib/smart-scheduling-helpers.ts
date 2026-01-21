"use server";

import { prisma } from "@/lib/prisma";
import { timeToMinutes, minutesToTime } from "@/lib/time-utils";

export interface TimeSlot {
  day: number;
  startTime: string;
  endTime: string;
}

/**
 * Find available time slots in a day, considering existing reservations
 */
export async function findAvailableSlots(
  tripId: string,
  day: number,
  durationHours: number
): Promise<TimeSlot[]> {
  // Get trip to calculate the actual date for this day
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      segments: {
        include: {
          reservations: {
            where: {
              startTime: { not: null },
            },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!trip) return [];

  // Calculate the date for this day
  const tripStartDate = new Date(trip.startDate);
  const targetDate = new Date(tripStartDate);
  targetDate.setDate(targetDate.getDate() + day - 1);

  // Get all reservations for this day
  const dayReservations = trip.segments
    .flatMap((seg) => seg.reservations)
    .filter((res) => {
      if (!res.startTime) return false;
      const resDate = new Date(res.startTime);
      return (
        resDate.getFullYear() === targetDate.getFullYear() &&
        resDate.getMonth() === targetDate.getMonth() &&
        resDate.getDate() === targetDate.getDate()
      );
    })
    .sort((a, b) => {
      return new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime();
    });

  // Find gaps between reservations
  const slots: TimeSlot[] = [];
  const dayStart = timeToMinutes("08:00"); // Start looking from 8 AM
  const dayEnd = timeToMinutes("23:00"); // End at 11 PM
  const minGapMinutes = durationHours * 60 + 30; // Duration + 30 min buffer

  if (dayReservations.length === 0) {
    // No reservations, entire day is available
    slots.push({
      day,
      startTime: "08:00",
      endTime: "23:00",
    });
    return slots;
  }

  // Check gap before first reservation
  const firstResTime = new Date(dayReservations[0].startTime!);
  const firstResMinutes = timeToMinutes(
    `${firstResTime.getHours()}:${firstResTime.getMinutes()}`
  );

  if (firstResMinutes - dayStart >= minGapMinutes) {
    slots.push({
      day,
      startTime: minutesToTime(dayStart),
      endTime: minutesToTime(firstResMinutes - 30),
    });
  }

  // Check gaps between reservations
  for (let i = 0; i < dayReservations.length - 1; i++) {
    const currentEnd = dayReservations[i].endTime || dayReservations[i].startTime!;
    const nextStart = dayReservations[i + 1].startTime!;

    const currentEndMinutes = timeToMinutes(
      `${new Date(currentEnd).getHours()}:${new Date(currentEnd).getMinutes()}`
    );
    const nextStartMinutes = timeToMinutes(
      `${new Date(nextStart).getHours()}:${new Date(nextStart).getMinutes()}`
    );

    const gapMinutes = nextStartMinutes - currentEndMinutes;

    if (gapMinutes >= minGapMinutes) {
      slots.push({
        day,
        startTime: minutesToTime(currentEndMinutes + 30), // 30 min buffer
        endTime: minutesToTime(nextStartMinutes - 30),
      });
    }
  }

  // Check gap after last reservation
  const lastRes = dayReservations[dayReservations.length - 1];
  const lastEndTime = lastRes.endTime || lastRes.startTime!;
  const lastEndMinutes = timeToMinutes(
    `${new Date(lastEndTime).getHours()}:${new Date(lastEndTime).getMinutes()}`
  );

  if (dayEnd - lastEndMinutes >= minGapMinutes) {
    slots.push({
      day,
      startTime: minutesToTime(lastEndMinutes + 30),
      endTime: minutesToTime(dayEnd),
    });
  }

  return slots;
}
