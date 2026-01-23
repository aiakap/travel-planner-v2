import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Stage 2: XML Extraction AI
 * 
 * Takes Stage 1 output and creates:
 * 1. XML-marked text with inline tags and context attributes
 * 2. Three separate entity lists (places, transport, hotels)
 * 
 * Context attributes improve Google Places API accuracy significantly.
 */

const SYSTEM_PROMPT = `You are a structured data extraction assistant. Your job is to:

1. Take natural language travel content with LOOKUP_REQUIREMENTS
2. Mark up entities with XML tags that include context attributes
3. Generate three lists of entities for API lookups

OUTPUT FORMAT - You MUST return valid JSON (no markdown, no code fences):

{
  "markedText": "text with XML tags",
  "places": [...],
  "transport": [...],
  "hotels": [...]
}

XML TAG FORMATS:

<place id="unique-id" context="full location context" type="category">Display Name</place>
<hotel id="unique-id" context="full location context" dates="YYYY-MM-DD:YYYY-MM-DD">Display Name</hotel>
<flight id="unique-id" route="XXX-YYY" dates="YYYY-MM-DD:YYYY-MM-DD" class="ECONOMY">Display Name</flight>

CRITICAL RULES FOR XML TAGS:

1. IDs must be unique, lowercase, hyphenated (e.g., "le-meurice-1", "jfk-cdg-flight")
2. Context attribute MUST include: city, country, and district/neighborhood when available
   - Good: context="Paris France 1st arrondissement"
   - Good: context="Paris France near Louvre Museum"
   - Bad: context="Paris" (missing country and district)
3. Wrap the EXACT text that appears in the natural language section
4. Use self-descriptive display names that match the natural language
5. Every item in LOOKUP_REQUIREMENTS must appear as both an XML tag AND in the appropriate list

ENTITY LIST FORMATS:

places: [
  {
    "id": "le-meurice-1",
    "name": "Le Meurice",
    "context": "Paris France 1st arrondissement",
    "type": "Restaurant",
    "searchQuery": "Le Meurice restaurant Paris France 1st arrondissement"
  }
]

transport: [
  {
    "id": "jfk-cdg-flight",
    "name": "JFK to Paris flight",
    "type": "Flight",
    "origin": "JFK",
    "destination": "CDG",
    "departureDate": "2026-01-24",
    "returnDate": "2026-01-31",
    "adults": 2,
    "travelClass": "ECONOMY"
  }
]

hotels: [
  {
    "id": "hotel-plaza-1",
    "name": "Hôtel Plaza Athénée",
    "context": "Paris France 8th arrondissement near Champs-Élysées",
    "location": "Paris",
    "checkInDate": "2026-01-24",
    "checkOutDate": "2026-01-27",
    "guests": 2,
    "rooms": 1,
    "searchQuery": "Hotel Plaza Athenee Paris France 8th arrondissement Champs-Elysees"
  }
]

EXAMPLE INPUT:

I recommend staying at Hôtel Plaza Athénée in Paris. For dinner, try Le Meurice.

LOOKUP_REQUIREMENTS:
- HOTEL: Hôtel Plaza Athénée, location: Paris France 8th arrondissement, check-in: 2026-01-24, check-out: 2026-01-27, guests: 2, rooms: 1
- PLACE: Le Meurice, location: Paris France 1st arrondissement, type: Restaurant

EXAMPLE OUTPUT:

{
  "markedText": "I recommend staying at <hotel id=\\"hotel-plaza-1\\" context=\\"Paris France 8th arrondissement\\" dates=\\"2026-01-24:2026-01-27\\">Hôtel Plaza Athénée</hotel> in Paris. For dinner, try <place id=\\"le-meurice-1\\" context=\\"Paris France 1st arrondissement\\" type=\\"Restaurant\\">Le Meurice</place>.",
  "places": [
    {
      "id": "le-meurice-1",
      "name": "Le Meurice",
      "context": "Paris France 1st arrondissement",
      "type": "Restaurant",
      "searchQuery": "Le Meurice restaurant Paris France 1st arrondissement"
    }
  ],
  "transport": [],
  "hotels": [
    {
      "id": "hotel-plaza-1",
      "name": "Hôtel Plaza Athénée",
      "context": "Paris France 8th arrondissement",
      "location": "Paris",
      "checkInDate": "2026-01-24",
      "checkOutDate": "2026-01-27",
      "guests": 2,
      "rooms": 1,
      "searchQuery": "Hotel Plaza Athenee Paris France 8th arrondissement"
    }
  ]
}

IMPORTANT:
- DO NOT wrap your response in markdown code blocks
- Output PURE JSON only
- Generate unique IDs for each entity
- Build searchQuery by combining name + type + context
- Parse dates from LOOKUP_REQUIREMENTS carefully
- If an item doesn't have dates, don't put it in hotels/transport arrays
`;

export interface PlaceEntity {
  id: string;
  name: string;
  context: string;
  type: string;
  searchQuery: string;
}

export interface TransportEntity {
  id: string;
  name: string;
  type: "Flight" | "Transfer" | "Train" | "Bus";
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: string;
}

export interface HotelEntity {
  id: string;
  name: string;
  context: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms: number;
  searchQuery: string;
}

export interface XmlExtractionOutput {
  markedText: string;
  places: PlaceEntity[];
  transport: TransportEntity[];
  hotels: HotelEntity[];
}

export async function extractXmlMarkup(
  naturalLanguageText: string,
  lookupRequirements: string
): Promise<XmlExtractionOutput> {
  console.log("🏷️  [Stage 2] Extracting XML markup with AI");
  console.log("   Input text length:", naturalLanguageText.length);
  console.log("   Lookup requirements:", lookupRequirements.substring(0, 200));

  const prompt = `${naturalLanguageText}\n\n${lookupRequirements}`;

  let result;
  try {
    result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.3, // Lower temperature for more consistent structured output
      maxTokens: 3000,
      experimental_providerMetadata: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });
  } catch (error) {
    console.error("❌ [Stage 2] AI API call failed:", error);
    throw new Error(`XML extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Clean response - remove markdown code fences if present
  let cleanedText = result.text.trim();
  
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  cleanedText = cleanedText.trim();

  // Parse JSON response
  let parsed: XmlExtractionOutput;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (error) {
    console.error("❌ [Stage 2] Failed to parse JSON:", error);
    console.error("❌ [Stage 2] Raw response:", result.text.substring(0, 500));
    throw new Error(`XML extraction returned invalid JSON: ${error instanceof Error ? error.message : "Parse error"}`);
  }

  // Validate structure
  if (!parsed.markedText || !Array.isArray(parsed.places) || !Array.isArray(parsed.transport) || !Array.isArray(parsed.hotels)) {
    console.error("❌ [Stage 2] Invalid structure:", parsed);
    throw new Error("XML extraction returned incomplete data structure");
  }

  console.log(`✅ [Stage 2] XML extraction complete`);
  console.log(`   Marked text: ${parsed.markedText.length} chars`);
  console.log(`   Places: ${parsed.places.length}`);
  console.log(`   Transport: ${parsed.transport.length}`);
  console.log(`   Hotels: ${parsed.hotels.length}`);

  return parsed;
}
