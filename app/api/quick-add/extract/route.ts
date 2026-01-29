import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { flightExtractionSchema } from "@/lib/schemas/flight-extraction-schema";
import { hotelExtractionSchema } from "@/lib/schemas/hotel-extraction-schema";
import { carRentalExtractionSchema } from "@/lib/schemas/car-rental-extraction-schema";
import { FLIGHT_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/flight-extraction-plugin";

/**
 * POST /api/quick-add/extract
 * 
 * Extracts reservation details from confirmation text using AI
 * Uses gpt-4o-mini for fast, cost-effective extraction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, type } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    if (!type || !["flight", "hotel", "car-rental"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reservation type. Must be 'flight', 'hotel', or 'car-rental'" },
        { status: 400 }
      );
    }

    // Select schema and prompt based on type
    let schema;
    let prompt;
    let systemPrompt = "You are an expert at extracting structured reservation data from confirmation emails and booking texts.";

    switch (type) {
      case "flight":
        schema = flightExtractionSchema;
        prompt = `${FLIGHT_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common airline date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Thu, Jan 29, 2026" → "2026-01-29"
- "January 29, 2026" → "2026-01-29"
- "29-Jan-2026" → "2026-01-29"
- "01/29/2026" → "2026-01-29"
- "2026-01-29" → "2026-01-29" (already correct)

STEP-BY-STEP PARSING:
1. Find the date text (e.g., "Thu, Jan 29, 2026")
2. Extract: Month="Jan", Day="29", Year="2026"
3. Convert month name to number: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12
4. Format as: YYYY-MM-DD → "2026-01-29"

TIMES must be in 12-hour format with AM/PM (e.g., "10:15 AM", "2:45 PM")

REAL EXAMPLE FROM UNITED AIRLINES:
Input text:
  Flight 1 of 4 UA875
  Thu, Jan 29, 2026    Fri, Jan 30, 2026
  10:15 AM             02:50 PM
  San Francisco, CA, US (SFO)    Tokyo, JP (HND)

Expected output:
{
  "flightNumber": "UA875",
  "carrier": "United Airlines",
  "carrierCode": "UA",
  "departureAirport": "SFO",
  "departureCity": "San Francisco, CA, US",
  "departureDate": "2026-01-29",  // Parsed from "Thu, Jan 29, 2026"
  "departureTime": "10:15 AM",
  "arrivalAirport": "HND",
  "arrivalCity": "Tokyo, JP",
  "arrivalDate": "2026-01-30",    // Parsed from "Fri, Jan 30, 2026"
  "arrivalTime": "02:50 PM"
}

IMPORTANT: Every flight MUST have valid departureDate, departureTime, arrivalDate, and arrivalTime. If you cannot find these in the text, the extraction has failed.

Extract all flight information from the following confirmation:

${text}`;
        break;
      case "hotel":
        schema = hotelExtractionSchema;
        prompt = `Extract hotel booking information from the confirmation text.

Required information:
- Confirmation number
- Guest name
- Hotel name and address
- Check-in and check-out dates and times
- Room type and number of guests
- Total cost and currency

Extract all hotel information from the following text:

${text}`;
        break;
      case "car-rental":
        schema = carRentalExtractionSchema;
        prompt = `Extract car rental booking information from the confirmation text.

Required information:
- Confirmation number
- Guest name
- Rental company
- Vehicle type/class
- Pickup and return locations, dates, and times
- Flight number if applicable
- Total cost and currency
- Options/accessories (GPS, insurance, etc.)

Extract all car rental information from the following text:

${text}`;
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported reservation type" },
          { status: 400 }
        );
    }

    // Use AI to extract structured data with strict mode for 100% schema compliance
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema,
      prompt,
      system: systemPrompt,
      schemaName: type === "flight" ? "FlightExtraction" : type === "hotel" ? "HotelExtraction" : "CarRentalExtraction",
      schemaDescription: `Extract ${type} booking information with guaranteed schema compliance`,
      mode: "json",
    });

    // Validate flight dates if type is flight
    if (type === "flight" && result.object.flights) {
      console.log('[Extract] Validating flights:', JSON.stringify(result.object.flights, null, 2));
      
      for (let i = 0; i < result.object.flights.length; i++) {
        const flight = result.object.flights[i];
        const flightId = flight.flightNumber || `Flight ${i + 1}`;
        const route = `${flight.departureAirport || '???'} → ${flight.arrivalAirport || '???'}`;
        
        // Check for empty or invalid dates
        if (!flight.departureDate || flight.departureDate.trim() === '') {
          console.error(`[Extract] ${flightId} missing departure date:`, flight);
          throw new Error(
            `Could not extract departure date for ${flightId} (${route}). ` +
            `The confirmation text may be incomplete or in an unexpected format. ` +
            `Please ensure the flight departure date is clearly visible in the confirmation.`
          );
        }
        if (!flight.departureTime || flight.departureTime.trim() === '') {
          console.error(`[Extract] ${flightId} missing departure time:`, flight);
          throw new Error(
            `Could not extract departure time for ${flightId} (${route}). ` +
            `Found departure date: ${flight.departureDate}. ` +
            `Please ensure the flight departure time is clearly visible in the confirmation.`
          );
        }
        if (!flight.arrivalDate || flight.arrivalDate.trim() === '') {
          console.error(`[Extract] ${flightId} missing arrival date:`, flight);
          throw new Error(
            `Could not extract arrival date for ${flightId} (${route}). ` +
            `Found departure: ${flight.departureDate} ${flight.departureTime}. ` +
            `Please ensure the flight arrival date is clearly visible in the confirmation.`
          );
        }
        if (!flight.arrivalTime || flight.arrivalTime.trim() === '') {
          console.error(`[Extract] ${flightId} missing arrival time:`, flight);
          throw new Error(
            `Could not extract arrival time for ${flightId} (${route}). ` +
            `Found arrival date: ${flight.arrivalDate}. ` +
            `Please ensure the flight arrival time is clearly visible in the confirmation.`
          );
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(flight.departureDate.trim())) {
          console.error(`[Extract] ${flightId} invalid departure date format:`, flight.departureDate);
          throw new Error(
            `Invalid departure date format for ${flightId}: "${flight.departureDate}". ` +
            `Expected format: YYYY-MM-DD (e.g., "2026-01-29"). ` +
            `The date may not have been parsed correctly from the confirmation text.`
          );
        }
        if (!dateRegex.test(flight.arrivalDate.trim())) {
          console.error(`[Extract] ${flightId} invalid arrival date format:`, flight.arrivalDate);
          throw new Error(
            `Invalid arrival date format for ${flightId}: "${flight.arrivalDate}". ` +
            `Expected format: YYYY-MM-DD (e.g., "2026-01-30"). ` +
            `The date may not have been parsed correctly from the confirmation text.`
          );
        }
        
        console.log(`[Extract] ${flightId} validation passed:`, {
          flightNumber: flight.flightNumber,
          route: route,
          departureDate: flight.departureDate,
          departureTime: flight.departureTime,
          arrivalDate: flight.arrivalDate,
          arrivalTime: flight.arrivalTime,
        });
      }
    }

    // Prepare response
    let count = 1;
    if (type === "flight" && result.object.flights) {
      count = result.object.flights.length;
    }

    return NextResponse.json({
      type,
      data: result.object,
      count,
    });
  } catch (error) {
    console.error("[Quick Add Extract] Error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to extract reservation details" },
      { status: 500 }
    );
  }
}
