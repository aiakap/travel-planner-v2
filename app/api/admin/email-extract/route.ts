import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { 
  flightExtractionSchema, 
  validateFlightExtraction 
} from "@/lib/schemas/flight-extraction-schema";
import {
  hotelExtractionSchema,
  validateHotelExtraction
} from "@/lib/schemas/hotel-extraction-schema";
import { 
  validateOpenAISchema, 
  isOpenAICompatible 
} from "@/lib/schemas/validate-openai-schema";

type ReservationType = "flight" | "hotel";

// Detect reservation type from email content
function detectReservationType(emailText: string): ReservationType {
  const lowerText = emailText.toLowerCase();
  
  // Keywords for hotel/accommodation
  const hotelKeywords = [
    'hotel', 'reservation', 'check-in', 'check-out', 'room', 'guest', 'nights',
    'accommodation', 'booking', 'stay', 'resort', 'inn', 'lodge'
  ];
  
  // Keywords for flights
  const flightKeywords = [
    'flight', 'airline', 'boarding', 'departure', 'arrival', 'terminal', 
    'gate', 'seat', 'passenger', 'aircraft', 'aviation'
  ];
  
  const hotelScore = hotelKeywords.filter(keyword => lowerText.includes(keyword)).length;
  const flightScore = flightKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Log detection for debugging
  console.log(`🔍 Type detection - Hotel score: ${hotelScore}, Flight score: ${flightScore}`);
  
  // Return type with higher score
  return hotelScore > flightScore ? 'hotel' : 'flight';
}

export async function POST(request: NextRequest) {
  try {
    const { emailText } = await request.json();

    if (!emailText) {
      return NextResponse.json(
        { error: "Email text is required" },
        { status: 400 }
      );
    }

    // Detect reservation type
    const reservationType = detectReservationType(emailText);
    console.log(`📋 Detected reservation type: ${reservationType}`);

    // Select appropriate schema and validator
    const schema = reservationType === 'hotel' ? hotelExtractionSchema : flightExtractionSchema;
    const validator = reservationType === 'hotel' ? validateHotelExtraction : validateFlightExtraction;
    
    // Validate schema compatibility in development mode
    if (process.env.NODE_ENV === 'development') {
      const schemaValidation = validateOpenAISchema(
        schema, 
        `${reservationType}ExtractionSchema`
      );
      
      if (!schemaValidation.compatible) {
        console.error('❌ Schema compatibility errors:', schemaValidation.errors);
        console.warn('⚠️ Schema warnings:', schemaValidation.warnings);
      } else if (schemaValidation.warnings.length > 0) {
        console.warn('⚠️ Schema warnings:', schemaValidation.warnings);
      } else {
        console.log('✅ Schema is OpenAI compatible');
      }
    }

    // Create type-specific prompt
    const prompt = reservationType === 'hotel' 
      ? `Extract hotel booking information from the following email.

Parse all reservation details, guest information, and stay information.

IMPORTANT DATE FORMAT:
- All dates MUST be in ISO format: YYYY-MM-DD (e.g., "2026-01-28")
- Convert any date format you see to ISO format
- Examples: "Jan 28, 2026" → "2026-01-28", "January 28, 2026" → "2026-01-28", "Thu, Jan 29, 2026" → "2026-01-29"

IMPORTANT TIME FORMAT:
- Keep times in 12-hour format with AM/PM (e.g., "3:00 PM", "10:15 AM")
- Do not convert to 24-hour format

IMPORTANT: If any optional information is not available in the email, use an empty string ("") for text fields and 0 for numeric fields. Do NOT use null.

Email content:
${emailText}`
      : `Extract flight booking information from the following email.

Parse all flight segments, passenger details, and booking information.

IMPORTANT DATE FORMAT:
- All dates MUST be in ISO format: YYYY-MM-DD (e.g., "2026-01-28")
- Convert any date format you see to ISO format
- Examples: "Jan 28, 2026" → "2026-01-28", "January 28, 2026" → "2026-01-28", "Thu, Jan 29, 2026" → "2026-01-29"

IMPORTANT TIME FORMAT:
- Keep times in 12-hour format with AM/PM (e.g., "10:15 AM", "02:50 PM")
- Do not convert to 24-hour format

IMPORTANT: If any optional information is not available in the email, use an empty string ("") for text fields and 0 for numeric fields. Do NOT use null.

Email content:
${emailText}`;

    const startTime = Date.now();
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema,
      prompt,
    });
    const duration = Date.now() - startTime;

    // Validate the extracted data
    const validation = validator(result.object);
    
    if (!validation.success) {
      console.error('❌ Validation failed for extracted data:', validation.error);
      return NextResponse.json(
        { 
          error: "Extracted data validation failed",
          details: validation.error,
        },
        { status: 500 }
      );
    }

    // Log success with type-specific message
    if (reservationType === 'hotel') {
      console.log(`✅ Successfully extracted hotel booking in ${duration}ms`);
    } else {
      console.log(`✅ Successfully extracted ${(validation.data as any).flights.length} flight(s) in ${duration}ms`);
    }

    return NextResponse.json({
      success: true,
      type: reservationType,
      data: validation.data,
      usage: result.usage,
      metadata: {
        duration,
        ...(reservationType === 'flight' && { flightCount: (validation.data as any).flights.length }),
      }
    });
  } catch (error: any) {
    console.error("❌ Email extraction error:", error);
    
    // Provide helpful error messages based on error type
    if (error.message?.includes('required') || error.message?.includes('Missing')) {
      return NextResponse.json(
        { 
          error: "Schema validation error - the AI response didn't match the expected format",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          suggestion: "This might be due to an incompatible schema. Please contact support."
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: "API configuration error",
          details: "OpenAI API key is missing or invalid"
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          details: "Too many requests. Please try again in a moment."
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to extract reservation data",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
