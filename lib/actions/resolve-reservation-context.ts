"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NaturalLanguageReservation } from "@/lib/schemas/natural-language-reservation-schema";
import { resolveRelativeDate, parseAbsoluteDate, parseTime } from "@/lib/utils/date-resolution";
import { isWithinInterval, parseISO } from "date-fns";

export interface ResolvedContext {
  success: boolean;
  
  // Resolved date/time
  date?: Date;
  time?: { hours: number; minutes: number };
  endDate?: Date;
  endTime?: { hours: number; minutes: number };
  
  // Location context
  locationContext?: string;
  segmentId: string;
  segmentName: string;
  
  // Confidence and clarification
  confidence: "high" | "medium" | "low";
  needsClarification: boolean;
  clarificationQuestions?: Array<{
    type: "date" | "time" | "location" | "place";
    question: string;
    options?: Array<{
      value: string;
      label: string;
      metadata?: any;
    }>;
  }>;
  
  // Error handling
  error?: string;
}

/**
 * Resolve natural language reservation data into concrete context
 * Handles date resolution, location inference, and clarification needs
 */
export async function resolveReservationContext(
  parsed: NaturalLanguageReservation,
  segmentId: string,
  tripId?: string
): Promise<ResolvedContext> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Not authenticated",
      segmentId,
      segmentName: "",
      confidence: "low",
      needsClarification: false,
    };
  }

  // Fetch segment and trip data
  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      trip: {
        userId: session.user.id,
      },
    },
    include: {
      trip: {
        include: {
          segments: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              startTitle: true,
              endTitle: true,
              startTime: true,
              endTime: true,
              startTimeZoneId: true,
            },
          },
        },
      },
    },
  });

  if (!segment) {
    return {
      success: false,
      error: "Segment not found or unauthorized",
      segmentId,
      segmentName: "",
      confidence: "low",
      needsClarification: false,
    };
  }

  const trip = segment.trip;
  const timezone = segment.startTimeZoneId || "UTC";
  
  // Prepare segment data for date resolution
  const allSegments = trip.segments
    .filter(s => s.startTime && s.endTime)
    .map(s => ({
      id: s.id,
      name: s.name,
      startDate: s.startTime!,
      endDate: s.endTime!,
    }));

  const clarificationQuestions: Array<{
    type: "date" | "time" | "location" | "place";
    question: string;
    options?: Array<{ value: string; label: string; metadata?: any }>;
  }> = [];

  let resolvedDate: Date | undefined;
  let resolvedTime: { hours: number; minutes: number } | undefined;
  let confidence = parsed.confidence;
  let needsClarification = false;

  // Resolve date
  if (parsed.dateInfo.type === "relative") {
    const contextDate = segment.startTime || new Date();
    const resolution = resolveRelativeDate(
      parsed.dateInfo.value,
      contextDate,
      trip.startDate,
      trip.endDate,
      allSegments,
      timezone
    );

    resolvedDate = resolution.resolvedDate;
    
    if (resolution.needsClarification && resolution.alternatives && resolution.alternatives.length > 1) {
      needsClarification = true;
      clarificationQuestions.push({
        type: "date",
        question: resolution.clarificationMessage || "Which date did you mean?",
        options: resolution.alternatives.map(alt => ({
          value: alt.date.toISOString(),
          label: `${alt.label}${alt.segmentName ? ` (${alt.segmentName})` : ""}`,
          metadata: { segmentName: alt.segmentName },
        })),
      });
      confidence = "medium";
    } else if (resolution.needsClarification) {
      needsClarification = true;
      clarificationQuestions.push({
        type: "date",
        question: resolution.clarificationMessage || "Please clarify the date",
      });
      confidence = "low";
    }
  } else if (parsed.dateInfo.type === "absolute") {
    const contextYear = trip.startDate.getFullYear();
    const parsedDate = parseAbsoluteDate(parsed.dateInfo.value, contextYear, timezone);
    
    if (parsedDate) {
      resolvedDate = parsedDate;
      
      // Check if date is within trip range
      if (!isWithinInterval(parsedDate, { start: trip.startDate, end: trip.endDate })) {
        needsClarification = true;
        clarificationQuestions.push({
          type: "date",
          question: `The date you specified (${parsed.dateInfo.value}) is outside your trip dates. Would you like to extend your trip or choose a different date?`,
        });
        confidence = "medium";
      }
    } else {
      needsClarification = true;
      clarificationQuestions.push({
        type: "date",
        question: `I couldn't parse the date "${parsed.dateInfo.value}". Please provide a valid date.`,
      });
      confidence = "low";
    }
  } else {
    // Ambiguous - use segment start date as default
    resolvedDate = segment.startTime || new Date();
    needsClarification = true;
    clarificationQuestions.push({
      type: "date",
      question: "When would you like this reservation?",
    });
    confidence = "low";
  }

  // Resolve time
  if (parsed.dateInfo.time) {
    const parsedTime = parseTime(parsed.dateInfo.time);
    if (parsedTime) {
      resolvedTime = parsedTime;
    } else {
      needsClarification = true;
      clarificationQuestions.push({
        type: "time",
        question: `I couldn't parse the time "${parsed.dateInfo.time}". Please provide a valid time.`,
      });
      confidence = "low";
    }
  } else {
    // No time specified - use default based on reservation type
    if (parsed.reservationType === "restaurant") {
      // Default to dinner time if no time specified
      resolvedTime = { hours: 19, minutes: 0 }; // 7 PM
    } else if (parsed.reservationType === "hotel") {
      // Default check-in time
      resolvedTime = { hours: 15, minutes: 0 }; // 3 PM
    } else {
      // Default to morning
      resolvedTime = { hours: 9, minutes: 0 };
    }
  }

  // Resolve location context
  const locationContext = segment.startTitle === segment.endTitle
    ? segment.endTitle
    : segment.endTitle; // Use destination as primary context

  // Check if place name is too generic
  const genericPlaceNames = ["restaurant", "hotel", "lunch", "dinner", "breakfast", "activity"];
  if (genericPlaceNames.some(generic => parsed.placeName.toLowerCase().includes(generic))) {
    needsClarification = true;
    clarificationQuestions.push({
      type: "place",
      question: `"${parsed.placeName}" is too generic. Which specific place did you have in mind?`,
    });
    confidence = "low";
  }

  // Add any clarifications from the parser
  if (parsed.clarificationNeeded && parsed.clarificationNeeded.length > 0) {
    for (const clarification of parsed.clarificationNeeded) {
      clarificationQuestions.push({
        type: "place",
        question: clarification,
      });
    }
    needsClarification = true;
  }

  return {
    success: true,
    date: resolvedDate,
    time: resolvedTime,
    locationContext,
    segmentId: segment.id,
    segmentName: segment.name,
    confidence,
    needsClarification,
    clarificationQuestions: clarificationQuestions.length > 0 ? clarificationQuestions : undefined,
  };
}
