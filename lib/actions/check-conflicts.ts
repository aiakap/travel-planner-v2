"use server";

import { prisma } from "@/lib/prisma";
import { getTravelTime, TransportMode } from "./route-optimization";

interface TimeConflict {
  hasConflict: boolean;
  conflictingReservations: Array<{
    id: string;
    name: string;
    startTime: Date;
    endTime: Date | null;
    category: string;
  }>;
  travelTimeIssues?: Array<{
    from: string;
    to: string;
    requiredTime: number;
    availableTime: number;
    shortfall: number;
    travelTimeText: string;
  }>;
}

/**
 * Check if a proposed time slot conflicts with existing reservations
 * Now includes travel time validation between locations
 */
export async function checkTimeConflict(
  tripId: string,
  day: number,
  startTime: string,
  endTime: string,
  proposedLat?: number,
  proposedLng?: number,
  transportMode: TransportMode = "WALK"
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

    // Check for travel time issues if location is provided
    const travelTimeIssues: TimeConflict["travelTimeIssues"] = [];
    
    if (proposedLat && proposedLng) {
      // Find the reservation immediately before this proposed time
      const reservationsBefore = dayReservations
        .filter((res) => {
          const resEnd = res.endTime ? new Date(res.endTime) : new Date(new Date(res.startTime!).getTime() + 60 * 60 * 1000);
          return resEnd <= proposedStart;
        })
        .sort((a, b) => {
          const aEnd = a.endTime ? new Date(a.endTime).getTime() : new Date(a.startTime!).getTime() + 60 * 60 * 1000;
          const bEnd = b.endTime ? new Date(b.endTime).getTime() : new Date(b.startTime!).getTime() + 60 * 60 * 1000;
          return bEnd - aEnd;
        });

      const previousReservation = reservationsBefore[0];

      if (previousReservation && previousReservation.latitude && previousReservation.longitude) {
        // Calculate travel time from previous reservation
        const travelInfo = await getTravelTime(
          previousReservation.latitude,
          previousReservation.longitude,
          proposedLat,
          proposedLng,
          transportMode
        );

        if (travelInfo) {
          const prevEnd = previousReservation.endTime 
            ? new Date(previousReservation.endTime) 
            : new Date(new Date(previousReservation.startTime!).getTime() + 60 * 60 * 1000);
          
          const availableMinutes = (proposedStart.getTime() - prevEnd.getTime()) / (1000 * 60);
          const requiredMinutes = travelInfo.duration / 60;

          if (requiredMinutes > availableMinutes) {
            travelTimeIssues.push({
              from: previousReservation.vendor,
              to: "Proposed location",
              requiredTime: requiredMinutes,
              availableTime: availableMinutes,
              shortfall: requiredMinutes - availableMinutes,
              travelTimeText: travelInfo.durationText,
            });
          }
        }
      }

      // Find the reservation immediately after this proposed time
      const reservationsAfter = dayReservations
        .filter((res) => {
          const resStart = new Date(res.startTime!);
          return resStart >= proposedEnd;
        })
        .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());

      const nextReservation = reservationsAfter[0];

      if (nextReservation && nextReservation.latitude && nextReservation.longitude) {
        // Calculate travel time to next reservation
        const travelInfo = await getTravelTime(
          proposedLat,
          proposedLng,
          nextReservation.latitude,
          nextReservation.longitude,
          transportMode
        );

        if (travelInfo) {
          const nextStart = new Date(nextReservation.startTime!);
          const availableMinutes = (nextStart.getTime() - proposedEnd.getTime()) / (1000 * 60);
          const requiredMinutes = travelInfo.duration / 60;

          if (requiredMinutes > availableMinutes) {
            travelTimeIssues.push({
              from: "Proposed location",
              to: nextReservation.vendor,
              requiredTime: requiredMinutes,
              availableTime: availableMinutes,
              shortfall: requiredMinutes - availableMinutes,
              travelTimeText: travelInfo.durationText,
            });
          }
        }
      }
    }

    return {
      hasConflict: conflictingReservations.length > 0 || travelTimeIssues.length > 0,
      conflictingReservations: conflictingReservations.map((res) => ({
        id: res.id,
        name: res.name,
        startTime: res.startTime!,
        endTime: res.endTime,
        category: res.reservationType.category.name,
      })),
      travelTimeIssues: travelTimeIssues.length > 0 ? travelTimeIssues : undefined,
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
