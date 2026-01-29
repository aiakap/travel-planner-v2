import { addDays, addWeeks, nextDay, parseISO, format, isWithinInterval } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Utility functions for resolving relative dates to absolute dates
 * Used by the natural language reservation creator
 */

export interface DateResolutionResult {
  resolvedDate: Date;
  confidence: "high" | "medium" | "low";
  alternatives?: Array<{
    date: Date;
    label: string;
    segmentName?: string;
  }>;
  needsClarification?: boolean;
  clarificationMessage?: string;
}

/**
 * Resolve a relative date reference to an absolute date
 * @param dateValue - The relative date string (e.g., "Friday", "tomorrow", "next week")
 * @param contextDate - The reference date (usually current segment start date)
 * @param tripStartDate - Trip start date
 * @param tripEndDate - Trip end date
 * @param allSegments - All segments in the trip for context
 * @param timezone - Timezone for date calculations
 */
export function resolveRelativeDate(
  dateValue: string,
  contextDate: Date,
  tripStartDate: Date,
  tripEndDate: Date,
  allSegments: Array<{
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }>,
  timezone: string = "UTC"
): DateResolutionResult {
  const lowerValue = dateValue.toLowerCase().trim();

  // Handle "today"
  if (lowerValue === "today") {
    return {
      resolvedDate: contextDate,
      confidence: "high",
    };
  }

  // Handle "tomorrow"
  if (lowerValue === "tomorrow") {
    const tomorrow = addDays(contextDate, 1);
    if (isWithinInterval(tomorrow, { start: tripStartDate, end: tripEndDate })) {
      return {
        resolvedDate: tomorrow,
        confidence: "high",
      };
    } else {
      return {
        resolvedDate: tomorrow,
        confidence: "low",
        needsClarification: true,
        clarificationMessage: `Tomorrow (${format(tomorrow, "MMM d")}) is outside your trip dates. Would you like to extend your trip?`,
      };
    }
  }

  // Handle "next week"
  if (lowerValue.includes("next week")) {
    const nextWeek = addWeeks(contextDate, 1);
    return {
      resolvedDate: nextWeek,
      confidence: "medium",
      needsClarification: true,
      clarificationMessage: "Which day next week did you mean?",
    };
  }

  // Handle day of week (e.g., "Friday", "Monday")
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = daysOfWeek.findIndex(day => lowerValue.includes(day));
  
  if (dayIndex !== -1) {
    // Find all occurrences of this day of week in the trip
    const alternatives: Array<{ date: Date; label: string; segmentName?: string }> = [];
    
    // Start from context date and find next occurrence
    let currentDate = contextDate;
    const maxIterations = 60; // ~2 months
    let iterations = 0;
    
    while (iterations < maxIterations && currentDate <= addDays(tripEndDate, 7)) {
      if (currentDate.getDay() === dayIndex && currentDate >= tripStartDate && currentDate <= tripEndDate) {
        // Find which segment this date belongs to
        const segment = allSegments.find(s => 
          isWithinInterval(currentDate, { start: s.startDate, end: s.endDate })
        );
        
        alternatives.push({
          date: new Date(currentDate),
          label: format(currentDate, "EEEE, MMM d"),
          segmentName: segment?.name,
        });
      }
      currentDate = addDays(currentDate, 1);
      iterations++;
    }

    if (alternatives.length === 0) {
      // No matching day in trip - find next occurrence after trip
      const nextOccurrence = nextDay(tripEndDate, dayIndex);
      return {
        resolvedDate: nextOccurrence,
        confidence: "low",
        needsClarification: true,
        clarificationMessage: `No ${daysOfWeek[dayIndex]} found in your trip. Did you mean ${format(nextOccurrence, "EEEE, MMM d")}?`,
      };
    } else if (alternatives.length === 1) {
      return {
        resolvedDate: alternatives[0].date,
        confidence: "high",
      };
    } else {
      // Multiple matches - need clarification
      return {
        resolvedDate: alternatives[0].date, // Default to first
        confidence: "medium",
        alternatives,
        needsClarification: true,
        clarificationMessage: `I found ${alternatives.length} ${daysOfWeek[dayIndex]}s in your trip. Which one did you mean?`,
      };
    }
  }

  // Handle "this weekend"
  if (lowerValue.includes("weekend")) {
    const saturday = nextDay(contextDate, 6); // 6 = Saturday
    return {
      resolvedDate: saturday,
      confidence: "medium",
      needsClarification: true,
      clarificationMessage: "Did you mean Saturday or Sunday?",
    };
  }

  // If we can't resolve, return context date with low confidence
  return {
    resolvedDate: contextDate,
    confidence: "low",
    needsClarification: true,
    clarificationMessage: `I couldn't understand the date "${dateValue}". Please specify a date.`,
  };
}

/**
 * Parse an absolute date string to a Date object
 * Handles formats like "Jan 31", "January 31", "1/31", "2026-01-31"
 */
export function parseAbsoluteDate(
  dateValue: string,
  contextYear: number,
  timezone: string = "UTC"
): Date | null {
  const lowerValue = dateValue.toLowerCase().trim();

  // Try parsing ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return parseISO(dateValue);
  }

  // Try parsing M/D or MM/DD format
  const slashMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    const [, month, day] = slashMatch;
    return new Date(contextYear, parseInt(month) - 1, parseInt(day));
  }

  // Try parsing "Month Day" format (e.g., "Jan 31", "January 31")
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  
  for (let i = 0; i < monthNames.length; i++) {
    const fullName = monthNames[i];
    const abbr = monthAbbr[i];
    
    // Try full month name
    let match = lowerValue.match(new RegExp(`${fullName}\\s+(\\d{1,2})`));
    if (match) {
      return new Date(contextYear, i, parseInt(match[1]));
    }
    
    // Try abbreviated month name
    match = lowerValue.match(new RegExp(`${abbr}\\s+(\\d{1,2})`));
    if (match) {
      return new Date(contextYear, i, parseInt(match[1]));
    }
  }

  return null;
}

/**
 * Parse a time string to hours and minutes
 * Handles formats like "5 PM", "17:00", "5:30 PM", "morning", "afternoon"
 */
export function parseTime(timeValue: string): { hours: number; minutes: number } | null {
  const lowerValue = timeValue.toLowerCase().trim();

  // Handle time of day keywords
  if (lowerValue.includes("morning")) return { hours: 9, minutes: 0 };
  if (lowerValue.includes("afternoon")) return { hours: 14, minutes: 0 };
  if (lowerValue.includes("evening")) return { hours: 18, minutes: 0 };
  if (lowerValue.includes("night")) return { hours: 20, minutes: 0 };
  if (lowerValue.includes("noon") || lowerValue.includes("midday")) return { hours: 12, minutes: 0 };
  if (lowerValue.includes("midnight")) return { hours: 0, minutes: 0 };

  // Handle 12-hour format with AM/PM
  const ampmMatch = timeValue.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    const period = ampmMatch[3].toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  // Handle 24-hour format (HH:MM)
  const twentyFourMatch = timeValue.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    return {
      hours: parseInt(twentyFourMatch[1]),
      minutes: parseInt(twentyFourMatch[2]),
    };
  }

  return null;
}
