import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { flightExtractionSchema } from "@/lib/schemas/flight-extraction-schema";
import { hotelExtractionSchema } from "@/lib/schemas/hotel-extraction-schema";
import { carRentalExtractionSchema } from "@/lib/schemas/car-rental-extraction-schema";
import { trainExtractionSchema } from "@/lib/schemas/train-extraction-schema";
import { restaurantExtractionSchema } from "@/lib/schemas/restaurant-extraction-schema";
import { eventExtractionSchema } from "@/lib/schemas/event-extraction-schema";
import { cruiseExtractionSchema } from "@/lib/schemas/cruise-extraction-schema";
import { genericReservationSchema } from "@/lib/schemas/generic-reservation-schema";
import { privateDriverExtractionSchema } from "@/lib/schemas/extraction/travel/private-driver-extraction-schema";
import { FLIGHT_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/flight-extraction-plugin";
import { HOTEL_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/hotel-extraction-plugin";
import { CAR_RENTAL_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/car-rental-extraction-plugin";
import { TRAIN_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/train-extraction-plugin";
import { RESTAURANT_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/restaurant-extraction-plugin";
import { EVENT_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/event-extraction-plugin";
import { CRUISE_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/cruise-extraction-plugin";
import { GENERIC_RESERVATION_PROMPT } from "@/lib/email-extraction/plugins/generic-reservation-plugin";
import { PRIVATE_DRIVER_EXTRACTION_PROMPT } from "@/lib/email-extraction/plugins/travel/private-driver-extraction-plugin";

/**
 * POST /api/quick-add/extract
 * 
 * Extracts reservation details from confirmation text using AI
 * Uses gpt-4o-mini for fast, cost-effective extraction
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { text, type } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    if (!type || !["flight", "hotel", "car-rental", "train", "restaurant", "event", "cruise", "private-driver", "generic"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reservation type. Must be one of: flight, hotel, car-rental, train, restaurant, event, cruise, private-driver, generic" },
        { status: 400 }
      );
    }

    // TIER 1: Try structured data extraction first (if HTML is present)
    const hasHTML = /<[a-z][\s\S]*>/i.test(text);
    if (hasHTML) {
      console.log('[Extract] HTML detected, trying structured data extraction...');
      
      try {
        const extractServiceUrl = process.env.EXTRUCT_SERVICE_URL || 'http://localhost:8001';
        const extractResponse = await fetch(`${extractServiceUrl}/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: text, type }),
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (extractResponse.ok) {
          const extractResult = await extractResponse.json();
          
          if (extractResult.success && extractResult.completeness >= 0.8) {
            const duration = Date.now() - startTime;
            console.log(`[Extract] ✅ Structured data extraction successful (${extractResult.method}, ${duration}ms)`);
            console.log(`[Extract] Completeness: ${extractResult.completeness.toFixed(2)}`);
            
            // Return structured data with metadata
            return NextResponse.json({
              type,
              data: extractResult.data,
              count: extractResult.data.flights?.length || extractResult.data.trains?.length || 1,
              method: 'structured',
              extractionMethod: extractResult.method,
              completeness: extractResult.completeness,
              duration: duration,
            });
          } else {
            console.log('[Extract] Structured data incomplete, falling back to AI');
          }
        } else {
          console.log('[Extract] Extruct service error, falling back to AI');
        }
      } catch (error) {
        // Extruct service unavailable or timeout - fall back to AI
        console.log('[Extract] Extruct service unavailable, falling back to AI:', error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      console.log('[Extract] No HTML detected, using AI extraction');
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
        prompt = `${HOTEL_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common hotel date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Friday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "January 30, 2026" → "2026-01-30"
- "30-Jan-2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"

STEP-BY-STEP PARSING:
1. Find the date text (e.g., "Friday, January 30, 2026")
2. Extract: Month="January", Day="30", Year="2026"
3. Convert month name to number: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12
4. Format as: YYYY-MM-DD → "2026-01-30"

IMPORTANT: Every hotel booking MUST have valid checkInDate and checkOutDate. If you cannot find these in the text, the extraction has failed.

Extract all hotel information from the following confirmation:

${text}`;
        break;
      case "car-rental":
        schema = carRentalExtractionSchema;
        prompt = `${CAR_RENTAL_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common car rental date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Thursday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "January 30, 2026" → "2026-01-30"
- "30-Jan-2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"

STEP-BY-STEP PARSING:
1. Find the date text (e.g., "Thursday, January 30, 2026")
2. Extract: Month="January", Day="30", Year="2026"
3. Convert month name to number: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12
4. Format as: YYYY-MM-DD → "2026-01-30"

IMPORTANT: Every car rental MUST have valid pickupDate and returnDate. If you cannot find these in the text, the extraction has failed.

Extract all car rental information from the following confirmation:

${text}`;
        break;
      case "train":
        schema = trainExtractionSchema;
        prompt = `${TRAIN_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common train date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Monday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "30-Jan-2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"
- "30/01/2026" → "2026-01-30" (European format)

STEP-BY-STEP PARSING:
1. Find the date text
2. Extract: Month, Day, Year
3. Convert month name to number: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12
4. Format as: YYYY-MM-DD

IMPORTANT: Every train segment MUST have valid departureDate, departureTime, arrivalDate, and arrivalTime. If you cannot find these in the text, the extraction has failed.

Extract all train information from the following confirmation:

${text}`;
        break;
      case "restaurant":
        schema = restaurantExtractionSchema;
        prompt = `${RESTAURANT_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common restaurant reservation date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Friday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"

STEP-BY-STEP PARSING:
1. Find the date text
2. Extract: Month, Day, Year
3. Convert month name to number
4. Format as: YYYY-MM-DD

IMPORTANT: Every restaurant reservation MUST have valid reservationDate and reservationTime. If you cannot find these in the text, the extraction has failed.

Extract all restaurant reservation information from the following confirmation:

${text}`;
        break;
      case "event":
        schema = eventExtractionSchema;
        prompt = `${EVENT_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common event ticket date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Saturday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"

STEP-BY-STEP PARSING:
1. Find the date text
2. Extract: Month, Day, Year
3. Convert month name to number
4. Format as: YYYY-MM-DD

IMPORTANT: Every event MUST have valid eventDate. If you cannot find this in the text, the extraction has failed.

Extract all event ticket information from the following confirmation:

${text}`;
        break;
      case "cruise":
        schema = cruiseExtractionSchema;
        prompt = `${CRUISE_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common cruise date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Saturday, February 15, 2026" → "2026-02-15"
- "Feb 15, 2026" → "2026-02-15"
- "02/15/2026" → "2026-02-15"

STEP-BY-STEP PARSING:
1. Find the date text
2. Extract: Month, Day, Year
3. Convert month name to number
4. Format as: YYYY-MM-DD

IMPORTANT: Every cruise MUST have valid embarkationDate and disembarkationDate. If you cannot find these in the text, the extraction has failed.

Extract all cruise booking information from the following confirmation:

${text}`;
        break;
      case "private-driver":
        schema = privateDriverExtractionSchema;
        prompt = `${PRIVATE_DRIVER_EXTRACTION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common transfer service date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Thursday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"

STEP-BY-STEP PARSING:
1. Find the date text
2. Extract: Month, Day, Year
3. Convert month name to number
4. Format as: YYYY-MM-DD

IMPORTANT: Every transfer MUST have valid pickupDate. If you cannot find this in the text, the extraction has failed.

Extract all private driver/transfer information from the following confirmation:

${text}`;
        break;
      case "generic":
        schema = genericReservationSchema;
        prompt = `${GENERIC_RESERVATION_PROMPT}

CRITICAL DATE/TIME PARSING INSTRUCTIONS:

You MUST convert dates to ISO format YYYY-MM-DD. Here are common date formats and how to parse them:

EXAMPLE CONVERSIONS:
- "Wednesday, January 30, 2026" → "2026-01-30"
- "Jan 30, 2026" → "2026-01-30"
- "01/30/2026" → "2026-01-30"
- "30/01/2026" → "2026-01-30" (European format)

STEP-BY-STEP PARSING:
1. Find the date text
2. Extract: Month, Day, Year
3. Convert month name to number: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12
4. Format as: YYYY-MM-DD

IMPORTANT: Every reservation MUST have valid startDate. If you cannot find this in the text, the extraction has failed.

Extract all reservation information from the following confirmation:

${text}`;
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported reservation type" },
          { status: 400 }
        );
    }

    // Use AI to extract structured data with strict mode for 100% schema compliance
    const schemaNameMap: Record<string, string> = {
      "flight": "FlightExtraction",
      "hotel": "HotelExtraction",
      "car-rental": "CarRentalExtraction",
      "train": "TrainExtraction",
      "restaurant": "RestaurantExtraction",
      "event": "EventExtraction",
      "cruise": "CruiseExtraction",
      "private-driver": "PrivateDriverExtraction",
      "generic": "GenericReservation",
    };

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema,
      prompt,
      system: systemPrompt,
      schemaName: schemaNameMap[type] || "ReservationExtraction",
      schemaDescription: `Extract ${type} booking information with guaranteed schema compliance`,
      mode: "json",
    });

    // Validate extracted data based on type
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (type === "flight" && result.object.flights) {
      console.log('[Extract] Validating flights:', JSON.stringify(result.object.flights, null, 2));
      
      // Log extracted times prominently for debugging timezone issues
      console.log('[Extract] ⏰ EXTRACTED TIMES (should match email verbatim):');
      for (const f of result.object.flights) {
        console.log(`[Extract]   ${f.flightNumber}: DEP ${f.departureTime} (${f.departureAirport}) → ARR ${f.arrivalTime} (${f.arrivalAirport})`);
      }
      
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
    } else if (type === "hotel") {
      console.log('[Extract] Validating hotel:', JSON.stringify(result.object, null, 2));
      const hotel = result.object;
      
      if (!hotel.checkInDate || hotel.checkInDate.trim() === '') {
        throw new Error('Could not extract check-in date. Please ensure the check-in date is clearly visible in the confirmation.');
      }
      if (!hotel.checkOutDate || hotel.checkOutDate.trim() === '') {
        throw new Error('Could not extract check-out date. Please ensure the check-out date is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(hotel.checkInDate.trim())) {
        throw new Error(`Invalid check-in date format: "${hotel.checkInDate}". Expected format: YYYY-MM-DD.`);
      }
      if (!dateRegex.test(hotel.checkOutDate.trim())) {
        throw new Error(`Invalid check-out date format: "${hotel.checkOutDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Hotel validation passed');
    } else if (type === "car-rental") {
      console.log('[Extract] Validating car rental:', JSON.stringify(result.object, null, 2));
      const rental = result.object;
      
      if (!rental.pickupDate || rental.pickupDate.trim() === '') {
        throw new Error('Could not extract pickup date. Please ensure the pickup date is clearly visible in the confirmation.');
      }
      if (!rental.returnDate || rental.returnDate.trim() === '') {
        throw new Error('Could not extract return date. Please ensure the return date is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(rental.pickupDate.trim())) {
        throw new Error(`Invalid pickup date format: "${rental.pickupDate}". Expected format: YYYY-MM-DD.`);
      }
      if (!dateRegex.test(rental.returnDate.trim())) {
        throw new Error(`Invalid return date format: "${rental.returnDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Car rental validation passed');
    } else if (type === "train" && result.object.trains) {
      console.log('[Extract] Validating trains:', JSON.stringify(result.object.trains, null, 2));
      
      for (let i = 0; i < result.object.trains.length; i++) {
        const train = result.object.trains[i];
        const trainId = train.trainNumber || `Train ${i + 1}`;
        const route = `${train.departureCity || '???'} → ${train.arrivalCity || '???'}`;
        
        if (!train.departureDate || train.departureDate.trim() === '') {
          throw new Error(`Could not extract departure date for ${trainId} (${route}). Please ensure the departure date is clearly visible.`);
        }
        if (!train.departureTime || train.departureTime.trim() === '') {
          throw new Error(`Could not extract departure time for ${trainId} (${route}). Please ensure the departure time is clearly visible.`);
        }
        if (!train.arrivalDate || train.arrivalDate.trim() === '') {
          throw new Error(`Could not extract arrival date for ${trainId} (${route}). Please ensure the arrival date is clearly visible.`);
        }
        if (!train.arrivalTime || train.arrivalTime.trim() === '') {
          throw new Error(`Could not extract arrival time for ${trainId} (${route}). Please ensure the arrival time is clearly visible.`);
        }
        if (!dateRegex.test(train.departureDate.trim())) {
          throw new Error(`Invalid departure date format for ${trainId}: "${train.departureDate}". Expected format: YYYY-MM-DD.`);
        }
        if (!dateRegex.test(train.arrivalDate.trim())) {
          throw new Error(`Invalid arrival date format for ${trainId}: "${train.arrivalDate}". Expected format: YYYY-MM-DD.`);
        }
        
        console.log(`[Extract] ${trainId} validation passed`);
      }
    } else if (type === "restaurant") {
      console.log('[Extract] Validating restaurant:', JSON.stringify(result.object, null, 2));
      const restaurant = result.object;
      
      if (!restaurant.reservationDate || restaurant.reservationDate.trim() === '') {
        throw new Error('Could not extract reservation date. Please ensure the reservation date is clearly visible in the confirmation.');
      }
      if (!restaurant.reservationTime || restaurant.reservationTime.trim() === '') {
        throw new Error('Could not extract reservation time. Please ensure the reservation time is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(restaurant.reservationDate.trim())) {
        throw new Error(`Invalid reservation date format: "${restaurant.reservationDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Restaurant validation passed');
    } else if (type === "event") {
      console.log('[Extract] Validating event:', JSON.stringify(result.object, null, 2));
      const event = result.object;
      
      if (!event.eventDate || event.eventDate.trim() === '') {
        throw new Error('Could not extract event date. Please ensure the event date is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(event.eventDate.trim())) {
        throw new Error(`Invalid event date format: "${event.eventDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Event validation passed');
    } else if (type === "cruise") {
      console.log('[Extract] Validating cruise:', JSON.stringify(result.object, null, 2));
      const cruise = result.object;
      
      if (!cruise.embarkationDate || cruise.embarkationDate.trim() === '') {
        throw new Error('Could not extract embarkation date. Please ensure the embarkation/boarding date is clearly visible in the confirmation.');
      }
      if (!cruise.disembarkationDate || cruise.disembarkationDate.trim() === '') {
        throw new Error('Could not extract disembarkation date. Please ensure the disembarkation/departure date is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(cruise.embarkationDate.trim())) {
        throw new Error(`Invalid embarkation date format: "${cruise.embarkationDate}". Expected format: YYYY-MM-DD.`);
      }
      if (!dateRegex.test(cruise.disembarkationDate.trim())) {
        throw new Error(`Invalid disembarkation date format: "${cruise.disembarkationDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Cruise validation passed');
    } else if (type === "private-driver") {
      console.log('[Extract] Validating private driver:', JSON.stringify(result.object, null, 2));
      const driver = result.object;
      
      if (!driver.pickupDate || driver.pickupDate.trim() === '') {
        throw new Error('Could not extract pickup date. Please ensure the pickup date is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(driver.pickupDate.trim())) {
        throw new Error(`Invalid pickup date format: "${driver.pickupDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Private driver validation passed');
    } else if (type === "generic") {
      console.log('[Extract] Validating generic reservation:', JSON.stringify(result.object, null, 2));
      const reservation = result.object;
      
      if (!reservation.startDate || reservation.startDate.trim() === '') {
        throw new Error('Could not extract start date. Please ensure the date is clearly visible in the confirmation.');
      }
      if (!dateRegex.test(reservation.startDate.trim())) {
        throw new Error(`Invalid start date format: "${reservation.startDate}". Expected format: YYYY-MM-DD.`);
      }
      
      console.log('[Extract] Generic reservation validation passed');
    }

    // Prepare response - count items based on type
    let count = 1;
    if (type === "flight" && result.object.flights) {
      count = result.object.flights.length;
    } else if (type === "train" && result.object.trains) {
      count = result.object.trains.length;
    } else if (type === "event" && result.object.tickets) {
      count = result.object.tickets.length;
    } else if (type === "cruise" && result.object.portsOfCall) {
      count = result.object.portsOfCall.length + 1; // Ports + cruise itself
    }

    const duration = Date.now() - startTime;
    console.log(`[Extract] ✅ AI extraction successful (${duration}ms)`);

    return NextResponse.json({
      type,
      data: result.object,
      count,
      method: 'ai',
      duration,
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
