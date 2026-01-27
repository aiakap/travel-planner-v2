import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Schema for flight extraction
const flightSchema = z.object({
  type: z.literal("flight"),
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
  origin: z.object({
    airport: z.string(),
    code: z.string().optional(),
    city: z.string().optional(),
  }),
  destination: z.object({
    airport: z.string(),
    code: z.string().optional(),
    city: z.string().optional(),
  }),
  departure: z.object({
    date: z.string(),
    time: z.string().optional(),
  }),
  arrival: z.object({
    date: z.string().optional(),
    time: z.string().optional(),
  }),
  passengers: z.array(z.string()).optional(),
  confirmationCode: z.string().optional(),
  seatNumbers: z.array(z.string()).optional(),
});

// Schema for hotel extraction
const hotelSchema = z.object({
  type: z.literal("hotel"),
  name: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  checkIn: z.object({
    date: z.string(),
    time: z.string().optional(),
  }),
  checkOut: z.object({
    date: z.string(),
    time: z.string().optional(),
  }),
  guests: z.array(z.string()).optional(),
  roomType: z.string().optional(),
  confirmationCode: z.string().optional(),
  nights: z.number().optional(),
});

// Schema for activity extraction
const activitySchema = z.object({
  type: z.literal("activity"),
  name: z.string(),
  location: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  duration: z.string().optional(),
  participants: z.array(z.string()).optional(),
  confirmationCode: z.string().optional(),
  price: z.string().optional(),
});

// Combined schema
const extractionSchema = z.object({
  reservations: z.array(
    z.discriminatedUnion("type", [flightSchema, hotelSchema, activitySchema])
  ),
  summary: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { text, extractionType = "auto", model = "gpt-4o" } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Check if model supports structured output
    if (model.startsWith("o1")) {
      return NextResponse.json(
        { error: "o1 models do not support structured output. Please use gpt-4o or gpt-4o-mini." },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const result = await generateObject({
      model: openai(model),
      schema: extractionSchema,
      prompt: `Extract all travel reservation information from the following text. 
      
Identify flights, hotels, and activities with as much detail as possible including:
- Confirmation codes
- Dates and times
- Locations and addresses
- Passenger/guest names
- Any other relevant details

Text to analyze:
${text}`,
    });

    const duration_ms = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.object,
      model,
      usage: {
        promptTokens: result.usage?.inputTokens || 0,
        completionTokens: result.usage?.outputTokens || 0,
        totalTokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
      },
      duration: duration_ms,
      extractionType,
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to extract data",
        details: error.details,
      },
      { status: 500 }
    );
  }
}
