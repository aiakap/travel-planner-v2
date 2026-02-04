"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";
import type { WizardAnswers, AssistedTripResult, TripAlternative } from "@/lib/types/assisted-wizard";
import type { AITripSuggestion } from "./generate-trip-suggestions";

// Schema for the main suggestion (same as existing)
const MainSuggestionSchema = z.object({
  title: z.string().describe("Catchy trip title (e.g., 'Sunset Hike & Jazz Night' or 'Tuscan Wine & Photography Retreat')"),
  destination: z.string().describe("Destination (can be local neighborhood, nearby city, or international)"),
  duration: z.string().describe("Duration (e.g., 'Evening (4-6 hours)', '1 day', 'Weekend', '3-5 days', '1-2 weeks', '2-3 weeks')"),
  description: z.string().describe("2-3 sentence trip overview"),
  why: z.string().describe("Detailed explanation (3-4 sentences) of why this trip perfectly matches their preferences and answers"),
  highlights: z.array(z.string()).describe("3-5 key experiences/activities"),
  estimatedBudget: z.string().describe("Budget range per person (e.g., '$50-100', '$200-400', '$1,500-2,500', '$5,000+')"),
  bestTimeToVisit: z.string().describe("Optimal timing based on their preferences"),
  combinedInterests: z.array(z.string()).describe("Which hobbies/preferences this trip combines"),
  tripType: z.enum(["local_experience", "road_trip", "single_destination", "multi_destination"]).describe("Type of trip"),
  transportMode: z.string().describe("How to get there (e.g., 'Walking/Uber', 'Car', 'Plane', 'Train', 'Plane + Car')"),
  imageQuery: z.string().describe("Primary landmark/location for image search"),
  destinationKeywords: z.array(z.string()).describe("2-3 visual keywords for fallback image search"),
  destinationLat: z.number().describe("Primary destination latitude"),
  destinationLng: z.number().describe("Primary destination longitude"),
  keyLocations: z.array(z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  })).describe("For multi-destination trips, provide 2-4 key stops"),
});

// Schema for alternatives
const AlternativeSchema = z.object({
  title: z.string().describe("Trip title"),
  destination: z.string().describe("Destination"),
  duration: z.string().describe("Duration"),
  estimatedBudget: z.string().describe("Budget range"),
  whyDifferent: z.string().describe("Brief explanation of how this differs (e.g., 'Lower budget option', 'Different destination style', 'Shorter trip')"),
});

// Combined response schema
const AssistedTripResponseSchema = z.object({
  mainSuggestion: MainSuggestionSchema,
  alternatives: z.array(AlternativeSchema).length(2),
});

export interface AssistedTripInput {
  answers: WizardAnswers;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    dateOfBirth: Date | string | null;
    city: string | null;
    country: string | null;
  };
}

// Helper to format wizard answers into readable text
function formatAnswers(answers: WizardAnswers): string {
  const parts: string[] = [];

  // When
  if (answers.when.customValue) {
    parts.push(`**When**: ${answers.when.customValue}`);
  } else if (answers.when.selectedChips.length > 0) {
    parts.push(`**When**: ${answers.when.selectedChips.join(", ")}`);
  }

  // Where
  if (answers.where.customValue) {
    parts.push(`**Where**: ${answers.where.customValue}`);
  } else if (answers.where.selectedChips.length > 0) {
    parts.push(`**Where**: ${answers.where.selectedChips.join(", ")}`);
  }

  // Budget
  if (answers.budget.customValue) {
    parts.push(`**Budget**: ${answers.budget.customValue}`);
  } else if (answers.budget.selectedChips.length > 0) {
    parts.push(`**Budget**: ${answers.budget.selectedChips.join(", ")}`);
  }

  // Who
  if (answers.who.customValue) {
    parts.push(`**Traveling with**: ${answers.who.customValue}`);
  } else if (answers.who.selectedChips.length > 0) {
    parts.push(`**Traveling with**: ${answers.who.selectedChips.join(", ")}`);
  }

  // What (trip style/interests)
  if (answers.what.customValue) {
    parts.push(`**Trip style**: ${answers.what.customValue}`);
  } else if (answers.what.selectedChips.length > 0) {
    parts.push(`**Trip style**: ${answers.what.selectedChips.join(", ")}`);
  }

  return parts.join("\n");
}

// Helper to extract profile context
function formatProfileContext(profileItems: ProfileGraphItem[]): string {
  const categoryGroups: Record<string, string[]> = {};

  for (const item of profileItems) {
    const category = item.category || "other";
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(item.value);
  }

  const parts: string[] = [];
  for (const [category, values] of Object.entries(categoryGroups)) {
    parts.push(`**${category}**: ${values.slice(0, 5).join(", ")}`);
  }

  return parts.join("\n");
}

export async function generateAssistedTripSuggestion(
  input: AssistedTripInput
): Promise<AssistedTripResult> {
  const { answers, profileItems, userProfile } = input;

  // Calculate age if available
  let ageInfo = "";
  if (userProfile.dateOfBirth) {
    const dob = new Date(userProfile.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    ageInfo = ` (Age: ${age})`;
  }

  const travelerName = userProfile.name || "Traveler";
  const homeLocation = userProfile.city
    ? `${userProfile.city}${userProfile.country ? `, ${userProfile.country}` : ""}`
    : "Unknown";

  const formattedAnswers = formatAnswers(answers);
  const profileContext = formatProfileContext(profileItems);

  const prompt = `Generate a personalized trip suggestion based on the traveler's specific preferences:

**Traveler**: ${travelerName}${ageInfo}
**Home Location**: ${homeLocation}

## Their Trip Preferences (from wizard):
${formattedAnswers}

## Additional Profile Context:
${profileContext || "No additional profile data available"}

---

INSTRUCTIONS:

1. **Main Suggestion**: Create ONE highly personalized trip that perfectly matches ALL their stated preferences:
   - Match the EXACT timing they specified
   - Match the destination type/region they want
   - Stay within their budget range
   - Accommodate who they're traveling with
   - Incorporate their desired trip style/experiences
   - Use REAL, bookable destinations with accurate coordinates
   - Provide a compelling "why" that references their specific preferences

2. **Two Alternatives**: Provide 2 brief alternatives that offer variety:
   - Alternative 1: A different budget tier (higher or lower)
   - Alternative 2: A different destination style or region
   - Each alternative should still respect most of their preferences but offer a meaningful difference

3. **Trip Type Selection**:
   - "local_experience": Under 8 hours, close to home
   - "road_trip": 2-7 days, driving distance
   - "single_destination": Fly to one place
   - "multi_destination": Multiple cities/countries

4. **Be Specific**:
   - Use actual place names, not generic descriptions
   - Provide accurate GPS coordinates
   - Include specific activities and experiences
   - Make the highlights actionable and bookable

5. **Image Query**:
   - Use the most recognizable landmark or scene at the destination
   - Be specific (e.g., "Eiffel Tower Paris" not just "Paris")`;

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: AssistedTripResponseSchema,
    prompt,
  });

  return {
    mainSuggestion: result.object.mainSuggestion as AITripSuggestion,
    alternatives: result.object.alternatives as TripAlternative[],
  };
}
