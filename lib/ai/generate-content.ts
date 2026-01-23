import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Stage 1: Content Generation AI
 * 
 * Generates natural language travel recommendations with clear intentions.
 * Simple prompt focused on natural language - no complex JSON schemas.
 * 
 * Output includes:
 * - Natural language response
 * - LOOKUP_REQUIREMENTS section with structured data about what to look up
 */

const SYSTEM_PROMPT = `You are a travel planning assistant. Generate natural, helpful travel recommendations.

Your response should have TWO parts:

1. NATURAL LANGUAGE SECTION - Write friendly, detailed travel advice as you normally would. Be specific about:
   - Flight routes and dates
   - Hotel locations with neighborhoods/districts
   - Restaurant names with location context
   - Activities and attractions

2. LOOKUP_REQUIREMENTS SECTION - At the end, add a structured section starting with "LOOKUP_REQUIREMENTS:" that lists all items that need API lookups.

Format for LOOKUP_REQUIREMENTS:
- FLIGHT: [name], origin: [IATA], destination: [IATA], departure: [date], return: [date or one-way], adults: [number], class: [ECONOMY/BUSINESS/FIRST]
- HOTEL: [name], location: [full location with district], check-in: [date], check-out: [date], guests: [number], rooms: [number]
- PLACE: [name], location: [full location with district], type: [Restaurant/Museum/Attraction/etc]

IMPORTANT DATE RULES:
- Today is ${new Date().toISOString().split('T')[0]}
- Use actual dates (YYYY-MM-DD format) for tomorrow and future dates
- If user says "tomorrow", calculate tomorrow's date
- If user says "next week", calculate 7 days from today
- If no specific dates, use [tomorrow] and [+3 days] or [+7 days] as placeholders
- ALWAYS use near future dates (1-30 days from today)

LOCATION CONTEXT RULES:
- Always include full context: "Le Meurice, Paris France 1st arrondissement, Restaurant"
- Include neighborhood/district when known: "8th arrondissement", "near Louvre"
- Include country: "Paris France" not just "Paris"
- Be specific about hotel locations: "near Champs-Élysées" or "8th arrondissement"

Example Response:

I recommend booking a roundtrip flight from JFK to Paris CDG departing tomorrow and returning in 7 days. This gives you plenty of time to explore the city.

For accommodations, I suggest staying at Hôtel Plaza Athénée in the 8th arrondissement near the Champs-Élysées. It's a luxury 5-star hotel with exceptional service.

For dining, you must visit Le Meurice in the 1st arrondissement. It's a Michelin-starred restaurant serving exceptional French cuisine.

Don't miss the Louvre Museum in the 1st arrondissement - plan at least 3 hours for your visit.

LOOKUP_REQUIREMENTS:
- FLIGHT: JFK to Paris, origin: JFK, destination: CDG, departure: ${getTomorrowDate()}, return: ${get7DaysLaterDate()}, adults: 2, class: ECONOMY
- HOTEL: Hôtel Plaza Athénée, location: Paris France 8th arrondissement near Champs-Élysées, check-in: ${getTomorrowDate()}, check-out: ${get3DaysLaterDate()}, guests: 2, rooms: 1
- PLACE: Le Meurice, location: Paris France 1st arrondissement, type: Restaurant
- PLACE: Louvre Museum, location: Paris France 1st arrondissement, type: Museum
`;

// Helper functions for date calculations
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

export interface ContentGenerationOutput {
  text: string; // Full response including LOOKUP_REQUIREMENTS
  naturalLanguageSection: string; // Just the natural language part
  lookupRequirements: string; // Just the LOOKUP_REQUIREMENTS section
}

export async function generateContent(
  userQuery: string,
  tripContext?: {
    tripId?: string;
    segmentId?: string;
    location?: string;
    dateRange?: { start: Date; end: Date };
  }
): Promise<ContentGenerationOutput> {
  console.log("📝 [Stage 1] Generating travel content with AI");
  console.log("   Query:", userQuery);

  // Build context for the AI
  let contextPrompt = "";
  if (tripContext?.location) {
    contextPrompt += `\nTrip location: ${tripContext.location}`;
  }
  if (tripContext?.dateRange) {
    contextPrompt += `\nTrip dates: ${tripContext.dateRange.start.toLocaleDateString()} - ${tripContext.dateRange.end.toLocaleDateString()}`;
  }

  const userPrompt = `${userQuery}${contextPrompt}`;

  let result;
  try {
    result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });
  } catch (error) {
    console.error("❌ [Stage 1] AI API call failed:", error);
    throw new Error(`Content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  const fullText = result.text.trim();

  // Split into natural language and lookup requirements
  const lookupIndex = fullText.indexOf("LOOKUP_REQUIREMENTS:");
  
  let naturalLanguageSection: string;
  let lookupRequirements: string;

  if (lookupIndex !== -1) {
    naturalLanguageSection = fullText.substring(0, lookupIndex).trim();
    lookupRequirements = fullText.substring(lookupIndex).trim();
  } else {
    // Fallback if AI didn't include LOOKUP_REQUIREMENTS section
    console.warn("⚠️  [Stage 1] No LOOKUP_REQUIREMENTS section found");
    naturalLanguageSection = fullText;
    lookupRequirements = "LOOKUP_REQUIREMENTS:\n(none generated)";
  }

  console.log(`✅ [Stage 1] Content generated (${fullText.length} chars)`);
  console.log(`   Natural language: ${naturalLanguageSection.length} chars`);
  console.log(`   Lookup requirements: ${lookupRequirements.length} chars`);

  return {
    text: fullText,
    naturalLanguageSection,
    lookupRequirements,
  };
}
