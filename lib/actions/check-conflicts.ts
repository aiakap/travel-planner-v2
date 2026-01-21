"use server";

import { prisma } from "@/lib/prisma";

interface TimeConflict {
  hasConflict: boolean;
  conflictingReservations: Array<{
    id: string;
    name: string;
    startTime: Date;
    endTime: Date | null;
    category: string;
  }>;
}

/**
 * Check if a proposed time slot conflicts with existing reservations
 */
export async function checkTimeConflict(
  tripId: string,
  day: number,
  startTime: string,
  endTime: string
): Promise<TimeConflict> {
  try {
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
              include: {
                reservationType: {
                  include: {
                    category: true,
                  },
                },
              },
              orderBy: { startTime: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!trip) {
      return { hasConflict: false, conflictingReservations: [] };
    }

    // Calculate the date for this day
    const tripStartDate = new Date(trip.startDate);
    const targetDate = new Date(tripStartDate);
    targetDate.setDate(targetDate.getDate() + day - 1);

    // Parse the proposed times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const proposedStart = new Date(targetDate);
    proposedStart.setHours(startHour, startMinute, 0, 0);

    const proposedEnd = new Date(targetDate);
    proposedEnd.setHours(endHour, endMinute, 0, 0);

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
      });

    // Check for conflicts
    const conflictingReservations = dayReservations.filter((res) => {
      const resStart = new Date(res.startTime!);
      const resEnd = res.endTime ? new Date(res.endTime) : new Date(resStart.getTime() + 60 * 60 * 1000); // Default 1 hour if no end time

      // Check if time ranges overlap
      // Overlap occurs if: proposed start < existing end AND proposed end > existing start
      return proposedStart < resEnd && proposedEnd > resStart;
    });

    return {
      hasConflict: conflictingReservations.length > 0,
      conflictingReservations: conflictingReservations.map((res) => ({
        id: res.id,
        name: res.name,
        startTime: res.startTime!,
        endTime: res.endTime,
        category: res.reservationType.category.name,
      })),
    };
  } catch (error) {
    console.error("Error checking time conflicts:", error);
    return { hasConflict: false, conflictingReservations: [] };
  }
}

/**
 * Get alternative time slots when conflicts exist
 */
export async function getAlternativeTimeSlots(
  tripId: string,
  day: number,
  durationHours: number,
  preferredStartTime?: string
): Promise<Array<{ startTime: string; endTime: string; reason: string }>> {
  try {
    // Import functions
    const { findAvailableSlots } = await import("@/lib/smart-scheduling-helpers");
    const { addDuration } = await import("@/lib/time-utils");
    
    const slots = await findAvailableSlots(tripId, day, durationHours);

    // Convert to time strings and add reasons
    const alternatives = slots.slice(0, 3).map((slot, idx) => {
      let reason = "Available time slot";
      
      if (preferredStartTime) {
        const prefMinutes = timeToMinutes(preferredStartTime);
        const slotMinutes = timeToMinutes(slot.startTime);
        const diff = Math.abs(slotMinutes - prefMinutes);
        
        if (diff < 60) {
          reason = "Close to your preferred time";
        } else if (idx === 0) {
          reason = "Next available slot";
        } else {
          reason = "Alternative option";
        }
      }

      return {
        startTime: slot.startTime,
        endTime: addDuration(slot.startTime, durationHours),
        reason,
      };
    });

    return alternatives;
  } catch (error) {
    console.error("Error getting alternative time slots:", error);
    return [];
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
