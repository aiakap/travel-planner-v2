"use server";

import { prisma } from "@/lib/prisma";
import { PlaceSuggestion } from "@/lib/types/place-suggestion";

interface TimeSlot {
  day: number;
  startTime: string;
  endTime: string;
}

interface SchedulingSuggestion {
  day: number;
  startTime: string;
  endTime: string;
  reason: string;
}

/**
 * Parse time context from suggestion to determine suggested time
 */
function parseTimeContext(suggestion: PlaceSuggestion): Partial<TimeSlot> | null {
  const context = suggestion.context;
  if (!context) return null;

  const result: Partial<TimeSlot> = {};

  // If day number is specified
  if (context.dayNumber) {
    result.day = context.dayNumber;
  }

  // If specific time is mentioned
  if (context.specificTime) {
    result.startTime = context.specificTime;
    return result;
  }

  // Otherwise use time of day defaults
  if (context.timeOfDay) {
    switch (context.timeOfDay) {
      case "morning":
        result.startTime = "09:00";
        break;
      case "afternoon":
        result.startTime = "14:00";
        break;
      case "evening":
        result.startTime = "19:00";
        break;
      case "night":
        result.startTime = "21:00";
        break;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Get default time based on reservation type
 */
function getDefaultTimeForType(
  category: string,
  type: string
): { startTime: string; endTime: string; duration: number } {
  switch (category) {
    case "Dining":
      if (type.toLowerCase().includes("breakfast")) {
        return { startTime: "08:00", endTime: "09:00", duration: 1 };
      }
      if (type.toLowerCase().includes("lunch")) {
        return { startTime: "12:00", endTime: "13:30", duration: 1.5 };
      }
      // Default to dinner
      return { startTime: "19:00", endTime: "21:00", duration: 2 };

    case "Activity":
      if (type.toLowerCase().includes("tour")) {
        return { startTime: "10:00", endTime: "13:00", duration: 3 };
      }
      if (type.toLowerCase().includes("museum")) {
        return { startTime: "10:00", endTime: "12:00", duration: 2 };
      }
      // Default activity
      return { startTime: "14:00", endTime: "16:00", duration: 2 };

    case "Stay":
      // Hotel check-in
      return { startTime: "15:00", endTime: "15:30", duration: 0.5 };

    case "Travel":
      // Default travel time
      return { startTime: "10:00", endTime: "12:00", duration: 2 };

    default:
      return { startTime: "10:00", endTime: "12:00", duration: 2 };
  }
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Add duration (in hours) to a time string
 */
function addDuration(time: string, durationHours: number): string {
  const minutes = timeToMinutes(time);
  const newMinutes = minutes + durationHours * 60;
  return minutesToTime(newMinutes);
}

/**
 * Find available time slots in a day, considering existing reservations
 */
async function findAvailableSlots(
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

/**
 * Suggest optimal day and time for a place suggestion
 */
export async function suggestScheduling(
  suggestion: PlaceSuggestion,
  tripId: string
): Promise<SchedulingSuggestion> {
  // Priority 1: Use context from chat if available
  const contextTime = parseTimeContext(suggestion);
  if (contextTime?.day && contextTime?.startTime) {
    const defaults = getDefaultTimeForType(suggestion.category, suggestion.type);
    return {
      day: contextTime.day,
      startTime: contextTime.startTime,
      endTime: addDuration(contextTime.startTime, defaults.duration),
      reason: "Based on your conversation",
    };
  }

  // Get default time for this type
  const defaults = getDefaultTimeForType(suggestion.category, suggestion.type);

  // Priority 2: If day is specified but not time, find best slot in that day
  if (contextTime?.day) {
    const slots = await findAvailableSlots(
      tripId,
      contextTime.day,
      defaults.duration
    );

    if (slots.length > 0) {
      // Use the first available slot
      return {
        day: contextTime.day,
        startTime: slots[0].startTime,
        endTime: addDuration(slots[0].startTime, defaults.duration),
        reason: "Next available time on that day",
      };
    }

    // No slots available, use default time anyway
    return {
      day: contextTime.day,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      reason: "Default time for this activity",
    };
  }

  // Priority 3: Smart scheduling - find next available day with a good slot
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    // Fallback if trip not found
    return {
      day: 1,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      reason: "Default time",
    };
  }

  const tripDuration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Try each day to find a good slot
  for (let day = 1; day <= tripDuration; day++) {
    const slots = await findAvailableSlots(tripId, day, defaults.duration);

    if (slots.length > 0) {
      // Find a slot that matches the default time preference
      const preferredSlot = slots.find((slot) => {
        const slotStart = timeToMinutes(slot.startTime);
        const defaultStart = timeToMinutes(defaults.startTime);
        return Math.abs(slotStart - defaultStart) < 120; // Within 2 hours
      });

      if (preferredSlot) {
        return {
          day,
          startTime: preferredSlot.startTime,
          endTime: addDuration(preferredSlot.startTime, defaults.duration),
          reason: "Optimal time slot found",
        };
      }

      // Use first available slot
      return {
        day,
        startTime: slots[0].startTime,
        endTime: addDuration(slots[0].startTime, defaults.duration),
        reason: "Next available time",
      };
    }
  }

  // Fallback: Use day 1 with default time
  return {
    day: 1,
    startTime: defaults.startTime,
    endTime: defaults.endTime,
    reason: "Default suggestion",
  };
}

/**
 * Get trip dates for day selection
 */
export async function getTripDays(tripId: string): Promise<
  Array<{
    day: number;
    date: string;
    dayOfWeek: string;
  }>
> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) return [];

  const days: Array<{ day: number; date: string; dayOfWeek: string }> = [];
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  let currentDate = new Date(startDate);
  let dayNumber = 1;

  while (currentDate <= endDate) {
    days.push({
      day: dayNumber,
      date: currentDate.toISOString().split("T")[0],
      dayOfWeek: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
    });

    currentDate.setDate(currentDate.getDate() + 1);
    dayNumber++;
  }

  return days;
}
