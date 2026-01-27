import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { PlaceSuggestion, TransportSuggestion, HotelSuggestion, Stage1Output } from "@/lib/types/amadeus-pipeline";

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

CRITICAL INSTRUCTIONS:
1. You MUST output PURE JSON (no markdown, no code fences, no \`\`\`json tags)
2. Output valid JSON with exactly FOUR fields: "text", "places", "transport", and "hotels"
3. The "text" field contains your full natural language response
4. The "places" field contains restaurants, attractions, and general venues (for Google Places lookup)
5. The "transport" field contains flights and transfers (for Amadeus API lookup)
6. The "hotels" field contains hotels with date spans (for Amadeus hotel availability lookup)
7. IMPORTANT: Every place/flight/hotel name you mention in "text" MUST appear EXACTLY as written in the respective array's "suggestedName" field
8. Use the EXACT same spelling, capitalization, and formatting in both fields
9. Items can appear in MULTIPLE arrays (e.g., a hotel in both "places" for Google info AND "hotels" for Amadeus availability)
10. DO NOT wrap your response in markdown code blocks or backticks - output raw JSON only

Example output structure:
{
  "text": "I recommend flying from JFK to Paris on the Air France flight, staying at Hôtel Plaza Athénée, and dining at Le Meurice.",
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

  console.log("🤖 [Stage 1] Generating place suggestions with AI");
  console.log("   Query:", userQuery);
  
  let result;
  try {
    result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: customSystemPrompt || SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 2000,
      // Force JSON output mode
      experimental_providerMetadata: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });
  } catch (error) {
    console.error("❌ [Stage 1] AI API call failed:", error);
    throw new Error(`AI API call failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  console.log("✅ [Stage 1] Raw AI response:", result.text.substring(0, 200));

  // Clean the response - remove markdown code fences if present
  let cleanedText = result.text.trim();
  
  // Remove ```json and ``` wrappers
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  cleanedText = cleanedText.trim();

  // Parse the JSON response
  let parsed: { text: string; places: any[]; transport: any[]; hotels: any[] };
  try {
    parsed = JSON.parse(cleanedText);
  } catch (error) {
    console.error("❌ [Stage 1] Failed to parse JSON:", error);
    console.error("❌ [Stage 1] Original response:", result.text.substring(0, 500));
    console.error("❌ [Stage 1] Cleaned response:", cleanedText.substring(0, 500));
    throw new Error(`AI did not return valid JSON: ${error instanceof Error ? error.message : "Parse error"}`);
  }

  // Validate the structure
  if (!parsed.text) {
    console.error("❌ [Stage 1] Invalid JSON structure:", parsed);
    throw new Error("AI returned JSON with incorrect structure");
  }

  // Validate and type the places array
  const places: PlaceSuggestion[] = (parsed.places || []).map((place, idx) => {
    if (!place.suggestedName || !place.category || !place.type || !place.searchQuery) {
      const missingFields = [];
      if (!place.suggestedName) missingFields.push('suggestedName');
      if (!place.category) missingFields.push('category');
      if (!place.type) missingFields.push('type');
      if (!place.searchQuery) missingFields.push('searchQuery');
      console.warn(`⚠️  [Stage 1] Place ${idx} missing required fields: ${missingFields.join(', ')}`);
      console.warn(`   Place data:`, place);
      throw new Error(`Place ${idx} is missing required fields: ${missingFields.join(', ')}`);
    }

    return {
      suggestedName: place.suggestedName,
      category: place.category,
      type: place.type,
      searchQuery: place.searchQuery,
      context: place.context || {},
      segmentId: place.segmentId, // Preserve segmentId if present (though shouldn't be at this stage)
    };
  });

  // Validate and type the transport array - defensive approach
  const transport: TransportSuggestion[] = (parsed.transport || [])
    .map((item, idx) => {
      // Check for required fields
      const missingFields: string[] = [];
      if (!item.suggestedName) missingFields.push('suggestedName');
      if (!item.type) missingFields.push('type');
      if (!item.origin) missingFields.push('origin');
      if (!item.destination) missingFields.push('destination');
      if (!item.departureDate) missingFields.push('departureDate');
      
      if (missingFields.length > 0) {
        console.warn(`⚠️  [Stage 1] Skipping transport ${idx} - missing required fields:`, {
          missing: missingFields,
          provided: Object.keys(item),
          item
        });
        return null;
      }

      return {
        suggestedName: item.suggestedName,
        type: item.type,
        origin: item.origin,
        destination: item.destination,
        departureDate: item.departureDate,
        departureTime: item.departureTime,
        returnDate: item.returnDate,
        adults: item.adults || 1,
        travelClass: item.travelClass,
        transferType: item.transferType,
      };
    })
    .filter((item): item is TransportSuggestion => item !== null);

  // Validate and type the hotels array - defensive approach
  const hotels: HotelSuggestion[] = (parsed.hotels || [])
    .map((hotel, idx) => {
      // Check for required fields
      const missingFields: string[] = [];
      if (!hotel.suggestedName) missingFields.push('suggestedName');
      if (!hotel.location) missingFields.push('location');
      if (!hotel.checkInDate) missingFields.push('checkInDate');
      if (!hotel.checkOutDate) missingFields.push('checkOutDate');
      
      if (missingFields.length > 0) {
        console.warn(`⚠️  [Stage 1] Skipping hotel ${idx} - missing required fields:`, {
          missing: missingFields,
          provided: Object.keys(hotel),
          hotel
        });
        return null;
      }

      return {
        suggestedName: hotel.suggestedName,
        location: hotel.location,
        checkInDate: hotel.checkInDate,
        checkOutDate: hotel.checkOutDate,
        guests: hotel.guests || 2,
        rooms: hotel.rooms || 1,
        searchQuery: hotel.searchQuery || `hotel in ${hotel.location}`,
      };
    })
    .filter((item): item is HotelSuggestion => item !== null);

  // Calculate skipped items
  const transportSkipped = (parsed.transport?.length || 0) - transport.length;
  const hotelsSkipped = (parsed.hotels?.length || 0) - hotels.length;
  
  console.log(`✅ [Stage 1] Successfully generated:`);
  console.log(`   - ${places.length} place suggestions`);
  console.log(`   - ${transport.length} transport suggestions${transportSkipped > 0 ? ` (${transportSkipped} skipped due to missing fields)` : ''}`);
  console.log(`   - ${hotels.length} hotel suggestions${hotelsSkipped > 0 ? ` (${hotelsSkipped} skipped due to missing fields)` : ''}`);

  return {
    text: parsed.text,
    places,
    transport,
    hotels,
  };
}
