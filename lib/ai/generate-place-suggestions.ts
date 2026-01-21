import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { PlaceSuggestion, Stage1Output } from "@/lib/types/place-pipeline";

/**
 * Stage 1: AI Structured Generation
 * 
 * Uses GPT-4o with JSON mode to generate both a natural language response
 * and a structured list of place suggestions.
 * 
 * CRITICAL: The AI must use the EXACT place names in both the text and the places array
 * for Stage 3 matching to work.
 */

const SYSTEM_PROMPT = `You are a travel planning assistant that suggests specific places (hotels, restaurants, activities, transportation).

CRITICAL INSTRUCTIONS:
1. You MUST output valid JSON with exactly two fields: "text" and "places"
2. The "text" field contains your full natural language response
3. The "places" field contains an array of place suggestions
4. IMPORTANT: Every place name you mention in "text" MUST appear EXACTLY as written in the "places" array "suggestedName" field
5. Use the EXACT same spelling, capitalization, and formatting in both fields

Example output structure:
{
  "text": "I recommend staying at Hôtel Plaza Athénée for luxury accommodations. For dinner, try Le Meurice which offers exceptional French cuisine.",
  "places": [
    {
      "suggestedName": "Hôtel Plaza Athénée",
      "category": "Stay",
      "type": "Hotel",
      "searchQuery": "Hotel Plaza Athenee Paris France",
      "context": {
        "dayNumber": 1,
        "timeOfDay": "evening",
        "notes": "Luxury hotel with exceptional service"
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
        "specificTime": "7:00 PM",
        "notes": "Fine dining French cuisine"
      }
    }
  ]
}

Categories:
- "Stay": Hotels, accommodations, lodging
- "Eat": Restaurants, cafes, dining
- "Do": Activities, museums, tours, attractions
- "Transport": Flights, trains, buses, car rentals

Types: Be specific (e.g., "Hotel", "Restaurant", "Museum", "Flight", "Train")

SearchQuery: Optimize for Google Places API (include location, type, and any distinguishing features)`;

export async function generatePlaceSuggestions(
  userQuery: string,
  tripContext?: {
    tripId?: string;
    segmentId?: string;
    location?: string;
    dateRange?: { start: Date; end: Date };
  }
): Promise<Stage1Output> {
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
      system: SYSTEM_PROMPT,
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

  // Parse the JSON response
  let parsed: { text: string; places: any[] };
  try {
    parsed = JSON.parse(result.text);
  } catch (error) {
    console.error("❌ [Stage 1] Failed to parse JSON:", error);
    console.error("❌ [Stage 1] Full response:", result.text);
    throw new Error(`AI did not return valid JSON: ${error instanceof Error ? error.message : "Parse error"}`);
  }

  // Validate the structure
  if (!parsed.text || !Array.isArray(parsed.places)) {
    console.error("❌ [Stage 1] Invalid JSON structure:", parsed);
    throw new Error("AI returned JSON with incorrect structure");
  }

  // Validate and type the places array
  const places: PlaceSuggestion[] = parsed.places.map((place, idx) => {
    if (!place.suggestedName || !place.category || !place.type || !place.searchQuery) {
      console.warn(`⚠️  [Stage 1] Place ${idx} missing required fields:`, place);
      throw new Error(`Place ${idx} is missing required fields`);
    }

    return {
      suggestedName: place.suggestedName,
      category: place.category,
      type: place.type,
      searchQuery: place.searchQuery,
      context: place.context || {},
    };
  });

  console.log(`✅ [Stage 1] Successfully generated ${places.length} place suggestions`);
  console.log("   Place names:", places.map(p => p.suggestedName));

  return {
    text: parsed.text,
    places,
  };
}
