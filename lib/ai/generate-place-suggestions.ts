import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { PlaceSuggestion, TransportSuggestion, HotelSuggestion, Stage1Output } from "@/lib/types/amadeus-pipeline";
import { expResponseSchema, type ExpResponse } from "@/lib/schemas/exp-response-schema";

/**
 * Stage 1: AI Structured Generation
 * 
 * Uses GPT-4o with JSON mode to generate both a natural language response
 * and a structured list of place suggestions.
 * 
 * CRITICAL: The AI must use the EXACT place names in both the text and the places array
 * for Stage 3 matching to work.
 */

// ============================================================================
// Date Helper Functions for AI Prompt
// ============================================================================

function getTomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

function get3DaysLaterDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
}

function get7DaysLaterDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

const SYSTEM_PROMPT = `You are a travel planning assistant that suggests specific places, flights, and hotels.

CRITICAL OUTPUT FORMAT:
You will return a structured JSON object with these fields:
1. "text" - Your natural language response (WITHOUT embedded card syntax)
2. "cards" - Array of structured card objects (not string syntax)
3. "places" - Array of place suggestions for Google Places lookup
4. "transport" - Array of transport suggestions for Amadeus API
5. "hotels" - Array of hotel suggestions for Amadeus API

The response format is enforced by JSON Schema - you cannot deviate from the structure.

IMPORTANT: Every place/flight/hotel name you mention in "text" MUST appear EXACTLY in the respective array's "suggestedName" field.

Example output structure:
{
  "text": "I recommend flying from JFK to Paris, staying at Hôtel Plaza Athénée, and dining at Le Meurice.",
  "cards": [],
  "places": [
    {
      "suggestedName": "Hôtel Plaza Athénée",
      "category": "Stay",
      "type": "Hotel",
      "searchQuery": "Hotel Plaza Athenee Paris France",
      "context": {
        "dayNumber": 1,
        "notes": "Luxury hotel in 8th arrondissement"
      }
    },
    {
      "suggestedName": "Le Meurice",
      "category": "Eat",
      "type": "Restaurant",
      "searchQuery": "Le Meurice restaurant Paris",
      "context": {
        "dayNumber": 1,
        "timeOfDay": "evening",
        "specificTime": "7:00 PM"
      }
    }
  ],
  "transport": [
    {
      "suggestedName": "JFK to Paris flight",
      "type": "Flight",
      "origin": "JFK",
      "destination": "CDG",
      "departureDate": "${getTomorrowDate()}",
      "departureTime": "18:30",
      "returnDate": "${get7DaysLaterDate()}",
      "adults": 2,
      "travelClass": "ECONOMY"
    }
  ],
  "hotels": [
    {
      "suggestedName": "Hôtel Plaza Athénée",
      "location": "Paris",
      "checkInDate": "${getTomorrowDate()}",
      "checkOutDate": "${get3DaysLaterDate()}",
      "guests": 2,
      "rooms": 1,
      "searchQuery": "Hotel Plaza Athenee Paris France"
    }
  ]
}

WHEN TO INCLUDE IN EACH ARRAY:

"places" array - Include ALL of these:
- Restaurants, cafes, dining venues
- Museums, attractions, landmarks
- Activities, tours
- Hotels (for Google Places info like address, rating, photos)
- ANY venue you want Google Places details for

"transport" array - Include ONLY when dates are mentioned:
- Flights with specific routes and dates
- Airport transfers with pickup times
- Train/bus bookings with departure times

"hotels" array - Include ONLY when dates are mentioned:
- Hotels with check-in/check-out dates specified
- SKIP if user just asks "suggest hotels" without dates

IMPORTANT: Hotels should appear in BOTH "places" (for Google info) AND "hotels" (for Amadeus availability) when dates are provided.

IMPORTANT DATE HANDLING:
- Today's date is ${getTodayDate()}
- ALWAYS use dates in the NEAR future (tomorrow to 30 days out)
- If user says "March 15-20" and we're past that, use NEXT year
- If user says "tomorrow" or "next week", calculate actual dates
- If no dates provided for hotels, DO NOT add to "hotels" array
- Default dates: check-in = tomorrow (${getTomorrowDate()}), check-out = 3 days later (${get3DaysLaterDate()})
- Flight departure default = tomorrow, return = 7 days later

Categories:
- "Stay": Hotels, accommodations
- "Eat": Restaurants, cafes
- "Do": Activities, museums, attractions
- "Transport": Flights, transfers

Transport Types: "Flight", "Transfer", "Train", "Bus"
Transfer Types: "PRIVATE", "SHARED", "TAXI", "AIRPORT_EXPRESS"
Travel Classes: "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"
`;

export async function generatePlaceSuggestions(
  userQuery: string,
  tripContext?: {
    tripId?: string;
    segmentId?: string;
    location?: string;
    dateRange?: { start: Date; end: Date };
  },
  suggestionContext?: {
    destination?: string;
    profileData?: any;
  },
  customSystemPrompt?: string
): Promise<Stage1Output> {
  // If destination provided, use trip suggestion generator
  if (suggestionContext?.destination) {
    const { generateSingleTripSuggestion } = await import("./generate-single-trip-suggestion");
    const result = await generateSingleTripSuggestion(
      suggestionContext.destination,
      suggestionContext.profileData
    );
    return {
      text: result.text,
      places: result.places,
      transport: [], // Trip suggestions don't include transport yet
      hotels: [], // Trip suggestions don't include hotels yet
      tripSuggestion: result.tripSuggestion,
    };
  }
  // Build context for the AI
  let contextPrompt = "";
  if (tripContext?.location) {
    contextPrompt += `\nTrip location: ${tripContext.location}`;
  }
  if (tripContext?.dateRange) {
    contextPrompt += `\nTrip dates: ${tripContext.dateRange.start.toLocaleDateString()} - ${tripContext.dateRange.end.toLocaleDateString()}`;
  }

  const userPrompt = `${userQuery}${contextPrompt}`;

  console.log("🤖 [Stage 1] Generating place suggestions with AI (using structured outputs)");
  console.log("   Query:", userQuery);
  
  let result;
  try {
    result = await generateObject({
      model: openai("gpt-4o-2024-11-20"),
      schema: expResponseSchema,
      system: customSystemPrompt || SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });
  } catch (error) {
    console.error("❌ [Stage 1] AI API call failed:", error);
    throw new Error(`AI API call failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  console.log("✅ [Stage 1] Structured AI response received");
  console.log("   Text length:", result.object.text.length);
  console.log("   Cards:", result.object.cards.length);
  console.log("   Places:", result.object.places.length);
  console.log("   Transport:", result.object.transport.length);
  console.log("   Hotels:", result.object.hotels.length);

  // VALIDATION: Check if place names appear in text
  const placesArray = result.object.places || [];
  const responseText = result.object.text;
  const missingNames: string[] = [];

  for (const place of placesArray) {
    if (!responseText.includes(place.suggestedName)) {
      missingNames.push(place.suggestedName);
    }
  }

  if (missingNames.length > 0 && placesArray.length > 0) {
    console.warn(`⚠️  [Stage 1] AI did not mention ${missingNames.length}/${placesArray.length} places in text:`);
    console.warn(`   Missing: ${missingNames.join(', ')}`);
    console.warn(`   Text was: "${responseText}"`);
    console.warn(`   Retrying with stronger prompt...`);
    
    // Use the same system prompt that was used in the first attempt
    const baseSystemPrompt = customSystemPrompt || SYSTEM_PROMPT;
    
    // Build a retry prompt that explicitly lists the names
    const retryPrompt = `${baseSystemPrompt}

⚠️ CRITICAL ERROR IN PREVIOUS RESPONSE:
You listed places in the "places" array but did not mention them by name in the "text" field.

YOU MUST mention these exact names in your response text: ${missingNames.join(', ')}

DO NOT write: "Here are some hotel options"
INSTEAD write: "Consider ${missingNames[0]}${missingNames[1] ? `, ${missingNames[1]}` : ''}${missingNames[2] ? `, and ${missingNames[2]}` : ''} for your stay."

The system requires exact name matches to create clickable links.`;

    try {
      const retryResult = await generateObject({
        model: openai("gpt-4o-2024-11-20"),
        schema: expResponseSchema,
        system: retryPrompt,
        prompt: userPrompt,
        temperature: 0.3,
        experimental_providerMetadata: {
          openai: {
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "travel_response",
                strict: true,
              },
            },
          },
        },
      });
      
      result = retryResult;
      console.log(`✅ [Stage 1] Retry successful - text length: ${result.object.text.length}`);
      console.log(`   Retry text: "${result.object.text}"`);
    } catch (retryError) {
      console.error("❌ [Stage 1] Retry failed:", retryError);
      // Continue with original response even though it's not ideal
    }
  }

  // Response is already typed and validated by Zod!
  const parsed = result.object;

  // Map Zod-validated schema types to existing pipeline types
  const places: PlaceSuggestion[] = parsed.places.map((place) => ({
    suggestedName: place.suggestedName,
    category: place.category,
    type: place.type,
    searchQuery: place.searchQuery,
    context: {
      dayNumber: place.context.dayNumber || undefined,
      timeOfDay: place.context.timeOfDay || undefined,
      specificTime: place.context.specificTime || undefined,
      notes: place.context.notes || undefined,
    },
    segmentId: place.segmentId || undefined,
  }));

  const transport: TransportSuggestion[] = parsed.transport.map((item) => ({
    suggestedName: item.suggestedName,
    type: item.type,
    origin: item.origin,
    destination: item.destination,
    departureDate: item.departureDate,
    departureTime: item.departureTime || undefined,
    returnDate: item.returnDate || undefined,
    adults: item.adults,
    travelClass: item.travelClass || undefined,
    transferType: item.transferType || undefined,
  }));

  const hotels: HotelSuggestion[] = parsed.hotels.map((hotel) => ({
    suggestedName: hotel.suggestedName,
    location: hotel.location,
    checkInDate: hotel.checkInDate,
    checkOutDate: hotel.checkOutDate,
    guests: hotel.guests,
    rooms: hotel.rooms,
    searchQuery: hotel.searchQuery,
  }));
  
  console.log(`✅ [Stage 1] Successfully generated:`);
  console.log(`   - ${places.length} place suggestions`);
  console.log(`   - ${transport.length} transport suggestions`);
  console.log(`   - ${hotels.length} hotel suggestions`);
  console.log(`   - ${parsed.cards.length} cards`);

  return {
    text: parsed.text,
    places,
    transport,
    hotels,
    cards: parsed.cards as any, // Type will be updated in place-pipeline.ts
  };
}
