import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { naturalLanguageReservationSchema } from "@/lib/schemas/natural-language-reservation-schema";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reservations/parse-natural-language
 * 
 * Parses natural language input to extract reservation details
 * Uses gpt-4o-mini for fast, cost-effective extraction with trip context
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, segmentId, tripId } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    if (!segmentId || typeof segmentId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'segmentId' parameter" },
        { status: 400 }
      );
    }

    // Fetch segment and trip context for better parsing
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
              },
            },
          },
        },
        segmentType: true,
      },
    });

    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found or unauthorized" },
        { status: 404 }
      );
    }

    const trip = segment.trip;

    // Build context for the AI
    const contextInfo = {
      currentSegment: {
        name: segment.name,
        location: segment.startTitle === segment.endTitle 
          ? segment.endTitle 
          : `${segment.startTitle} to ${segment.endTitle}`,
        startDate: segment.startTime?.toISOString().split('T')[0],
        endDate: segment.endTime?.toISOString().split('T')[0],
        timezone: segment.startTimeZoneId || "UTC",
      },
      trip: {
        title: trip.title,
        startDate: trip.startDate.toISOString().split('T')[0],
        endDate: trip.endDate.toISOString().split('T')[0],
        segments: trip.segments.map(s => ({
          name: s.name,
          location: s.startTitle === s.endTitle ? s.endTitle : `${s.startTitle} to ${s.endTitle}`,
          startDate: s.startTime?.toISOString().split('T')[0],
          endDate: s.endTime?.toISOString().split('T')[0],
        })),
      },
    };

    // Build the prompt
    const systemPrompt = `You are an expert at extracting structured reservation data from natural language input.
You help users create travel reservations by understanding their intent and extracting key details.

CRITICAL CONTEXT:
The user is currently viewing this segment of their trip:
- Segment: ${contextInfo.currentSegment.name}
- Location: ${contextInfo.currentSegment.location}
- Dates: ${contextInfo.currentSegment.startDate} to ${contextInfo.currentSegment.endDate}
- Timezone: ${contextInfo.currentSegment.timezone}

Full trip context:
- Trip: ${contextInfo.trip.title}
- Trip dates: ${contextInfo.trip.startDate} to ${contextInfo.trip.endDate}
- All segments:
${contextInfo.trip.segments.map(s => `  * ${s.name} (${s.location}): ${s.startDate} to ${s.endDate}`).join('\n')}

INSTRUCTIONS:
1. Extract the place name - this is the most important piece of information
2. Determine the reservation type based on context clues (dinner = restaurant, hotel = hotel, etc.)
3. Parse date/time information:
   - If they say "Friday" or day of week, mark as "relative" (we'll resolve which Friday based on context)
   - If they say "tomorrow", "next week", mark as "relative"
   - If they give a specific date like "Jan 31" or "January 31", mark as "absolute"
   - If no date mentioned, mark as "ambiguous"
4. Extract any additional details (party size, duration, notes)
5. Assess confidence:
   - HIGH: place name clear, date/time clear, type obvious
   - MEDIUM: place name clear but date ambiguous or type unclear
   - LOW: place name unclear or multiple pieces missing
6. List clarifications needed if confidence is not high

EXAMPLES:

Input: "dinner at Chez Panisse at 5 PM on Friday"
Output: {
  placeName: "Chez Panisse",
  reservationType: "restaurant",
  dateInfo: { type: "relative", value: "Friday", time: "5 PM" },
  confidence: "high"
}

Input: "book a hotel for 3 nights starting Jan 31"
Output: {
  placeName: "hotel",
  reservationType: "hotel",
  dateInfo: { type: "absolute", value: "Jan 31", endDate: "Feb 3" },
  additionalInfo: { duration: "3 nights" },
  confidence: "medium",
  clarificationNeeded: ["Which hotel would you like to book?"]
}

Input: "lunch tomorrow"
Output: {
  placeName: "lunch",
  reservationType: "restaurant",
  dateInfo: { type: "relative", value: "tomorrow", time: "12:00 PM" },
  confidence: "low",
  clarificationNeeded: ["Where would you like to have lunch?"]
}`;

    const userPrompt = `Parse this reservation request:

"${text}"

Extract all relevant information and assess what clarifications are needed.`;

    // Use AI to extract structured data
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: naturalLanguageReservationSchema,
      prompt: userPrompt,
      system: systemPrompt,
      schemaName: "NaturalLanguageReservation",
      schemaDescription: "Extract reservation details from natural language with context awareness",
      mode: "json",
    });

    console.log('[Parse NL] Input:', text);
    console.log('[Parse NL] Context:', contextInfo.currentSegment);
    console.log('[Parse NL] Result:', JSON.stringify(result.object, null, 2));

    return NextResponse.json({
      parsed: result.object,
      context: contextInfo,
    });
  } catch (error) {
    console.error("[Parse Natural Language] Error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to parse natural language input" },
      { status: 500 }
    );
  }
}
