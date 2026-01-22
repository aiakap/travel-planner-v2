"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { PlaceSuggestion } from "@/lib/types/place-pipeline";

// Zod schema for structured output
const TripSuggestionWithPlacesSchema = z.object({
  text: z.string().describe("Natural language trip description (2-3 paragraphs)"),
  places: z.array(z.object({
    suggestedName: z.string().describe("Exact place name"),
    category: z.enum(["Stay", "Eat", "Do", "Transport"]),
    type: z.string().describe("Specific type like Hotel, Restaurant, Museum"),
    searchQuery: z.string().describe("Optimized Google Places search query"),
  })),
  tripSuggestion: z.object({
    title: z.string(),
    destination: z.string(),
    duration: z.string(),
    description: z.string(),
    why: z.string(),
    highlights: z.array(z.string()),
    estimatedBudget: z.string(),
    bestTimeToVisit: z.string(),
    combinedInterests: z.array(z.string()),
    tripType: z.enum(["local_experience", "road_trip", "single_destination", "multi_destination"]),
    transportMode: z.string(),
    imageQuery: z.string(),
    destinationKeywords: z.array(z.string()),
    destinationLat: z.number(),
    destinationLng: z.number(),
    keyLocations: z.array(z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
    })),
  }),
});

// Trip suggestion metadata schema (kept for map/card display)
export interface AITripSuggestion {
  title: string;
  destination: string;
  duration: string;
  description: string;
  why: string;
  highlights: string[];
  estimatedBudget: string;
  bestTimeToVisit: string;
  combinedInterests: string[];
  tripType: "local_experience" | "road_trip" | "single_destination" | "multi_destination";
  transportMode: string;
  imageQuery: string;
  destinationKeywords: string[];
  destinationLat: number;
  destinationLng: number;
  keyLocations: Array<{ name: string; lat: number; lng: number }>;
}

// Pipeline output: text + places + trip metadata
export interface TripSuggestionWithPlaces {
  text: string;
  places: PlaceSuggestion[];
  tripSuggestion: AITripSuggestion;
}

export async function generateSingleTripSuggestion(
  destination: string,
  profileData?: {
    hobbies: Array<{ hobby: { name: string; category: string | null } }>;
    preferences: Array<{ preferenceType: { name: string }; option: { value: string; label: string } }>;
    relationships: Array<{ relationshipType: string; nickname: string | null }>;
    profile: { city: string | null; country: string | null } | null;
  } | null
): Promise<TripSuggestionWithPlaces> {
  
  // Build profile summary for AI (if available)
  let profileContext = "";
  if (profileData) {
    console.log("🔍 [Profile Data] Checking profile data structure...");
    console.log("   Has hobbies:", !!profileData.hobbies);
    console.log("   Has preferences:", !!profileData.preferences);
    console.log("   Has relationships:", !!profileData.relationships);
    
    const hobbiesList = profileData.hobbies?.map(h => h.hobby.name).join(", ") || "";
    const preferencesList = profileData.preferences
      ?.map(p => `${p.preferenceType.name}: ${p.option.label}`)
      .join("; ") || "";
    const relationshipsList = profileData.relationships
      ?.map(r => `${r.relationshipType}${r.nickname ? ` (${r.nickname})` : ""}`)
      .join(", ") || "";
    
    console.log("   Hobbies count:", profileData.hobbies?.length || 0);
    console.log("   Preferences count:", profileData.preferences?.length || 0);
    console.log("   Relationships count:", profileData.relationships?.length || 0);
    
    profileContext = `
**Traveler Profile**:
- Hobbies/Interests: ${hobbiesList || "None specified"}
- Travel Preferences: ${preferencesList || "None specified"}
- Traveling with: ${relationshipsList || "Solo"}
`;
  } else {
    profileContext = "**Traveler Profile**: General traveler (no specific profile provided)";
  }

  const prompt = `Generate a trip suggestion for ${destination}.

${profileContext}

You MUST output valid JSON with exactly THREE fields: "text", "places", and "tripSuggestion".

1. "text": Natural language trip description (2-3 paragraphs). Write engaging prose about the trip.

2. "places": Array of specific places mentioned in the text. For EACH place you mention in "text", include an entry with:
   - suggestedName: Exact name as written in text (e.g., "Hotel Plaza Athénée")
   - category: "Stay" | "Eat" | "Do" | "Transport"
   - type: Specific type (e.g., "Hotel", "Restaurant", "Museum", "Flight")
   - searchQuery: Optimized query for Google Places (e.g., "Hotel Plaza Athenee Paris France")
   - context: { dayNumber, timeOfDay, notes } (optional but helpful)

3. "tripSuggestion": Trip metadata including:
   - title: Catchy trip title
   - destination: "${destination}"
   - duration: e.g., "3 days", "Weekend", "1 week"
   - description: 2-3 sentence overview
   - why: Why this trip matches the profile (3-4 sentences)
   - highlights: Array of 2-4 key experiences
   - estimatedBudget: e.g., "$500-1000", "$2000-3000"
   - bestTimeToVisit: e.g., "Spring", "Year-round"
   - combinedInterests: Array of hobbies/preferences this combines
   - tripType: "local_experience" | "road_trip" | "single_destination" | "multi_destination"
   - transportMode: e.g., "Plane", "Car", "Train"
   - imageQuery: Primary landmark for image search
   - destinationKeywords: Array of 2-3 visual keywords
   - destinationLat: Latitude (number)
   - destinationLng: Longitude (number)
   - keyLocations: Array of {name, lat, lng} for multi-destination, or [] for single

CRITICAL: Every place name in "text" MUST appear in "places" array with exact matching suggestedName.

Example output structure:
{
  "text": "For your Paris adventure, I recommend staying at Hotel Plaza Athénée for luxury accommodations. Start your mornings with breakfast at Café de Flore, a historic Left Bank café. Then explore the Louvre Museum to see world-class art...",
  "places": [
    {
      "suggestedName": "Hotel Plaza Athénée",
      "category": "Stay",
      "type": "Hotel",
      "searchQuery": "Hotel Plaza Athenee Paris France",
      "context": { "dayNumber": 1, "timeOfDay": "evening", "notes": "Luxury 5-star hotel" }
    },
    {
      "suggestedName": "Café de Flore",
      "category": "Eat",
      "type": "Cafe",
      "searchQuery": "Cafe de Flore Paris",
      "context": { "dayNumber": 1, "timeOfDay": "morning" }
    },
    {
      "suggestedName": "Louvre Museum",
      "category": "Do",
      "type": "Museum",
      "searchQuery": "Louvre Museum Paris",
      "context": { "dayNumber": 1, "timeOfDay": "afternoon" }
    }
  ],
  "tripSuggestion": {
    "title": "Parisian Art & Cuisine Weekend",
    "destination": "${destination}",
    "duration": "3 days",
    "description": "Experience Paris through art, cuisine, and culture...",
    "why": "This trip combines your interests in...",
    "highlights": ["Visit world-class museums", "Dine at historic cafés", "Explore charming neighborhoods"],
    "estimatedBudget": "$2000-3000",
    "bestTimeToVisit": "Spring or Fall",
    "combinedInterests": ["Art", "Food", "History"],
    "tripType": "single_destination",
    "transportMode": "Plane",
    "imageQuery": "Eiffel Tower Paris",
    "destinationKeywords": ["romantic", "culture", "architecture"],
    "destinationLat": 48.8566,
    "destinationLng": 2.3522,
    "keyLocations": []
  }
}`;

  console.log("🤖 [Stage 1] Generating trip suggestion with AI");
  console.log("   Destination:", destination);
  console.log("   Has profile data:", !!profileData);

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: TripSuggestionWithPlacesSchema,
    prompt: prompt,
    temperature: 0.7,
  });

  console.log("✅ [Stage 1] Structured response received");
  console.log("   Places count:", result.object.places.length);
  console.log("   Place names:", result.object.places.map(p => p.suggestedName));

  return result.object;
}
