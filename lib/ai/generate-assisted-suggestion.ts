"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";
import { DEFAULT_SUGGESTIONS, type WizardAnswers, type AssistedTripResult, type TripAlternative, type WizardStepId } from "@/lib/types/assisted-wizard";
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

// Schema for alternatives - includes tripType for expansion
const AlternativeSchema = z.object({
  title: z.string().describe("Trip title"),
  destination: z.string().describe("Destination"),
  duration: z.string().describe("Duration"),
  estimatedBudget: z.string().describe("Budget range"),
  whyDifferent: z.string().describe("Brief explanation of how this differs (e.g., 'Lower budget option', 'Different destination style', 'Shorter trip')"),
  tripType: z.enum(["local_experience", "road_trip", "single_destination", "multi_destination"]).describe("Type of trip for this alternative"),
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

// Generic destination types that are preferences, not specific places
const GENERIC_DESTINATION_TYPES = [
  "beach", "beach & sun", "city", "city break", "mountains", 
  "europe", "asia", "surprise", "surprise me", "anywhere",
  "tropical", "coastal", "rural", "urban"
];

// Helper to check if destination is a specific place vs general preference
function isSpecificDestination(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return !GENERIC_DESTINATION_TYPES.some(generic => 
    normalized === generic || normalized.includes(generic)
  );
}

// Helper to resolve chip IDs to their labels
function resolveChipLabels(
  chipIds: string[],
  stepId: WizardStepId,
  profileItems: ProfileGraphItem[]
): string[] {
  return chipIds.map(chipId => {
    // Profile items: "profile-abc123" -> find item with id "abc123"
    if (chipId.startsWith("profile-")) {
      const itemId = chipId.replace("profile-", "");
      const item = profileItems.find(p => p.id === itemId);
      return item?.value || chipId; // Fallback to chipId if not found
    }
    // Suggested destinations: "suggest-xxx" -> extract the label part
    if (chipId.startsWith("suggest-")) {
      // These are generated in the wizard like "suggest-swiss-alps" -> "Swiss Alps"
      const labelPart = chipId.replace("suggest-", "");
      // Convert kebab-case to Title Case
      return labelPart.split("-").map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" ");
    }
    // Default suggestions: "beach" -> "Beach & Sun"
    const defaultChips = DEFAULT_SUGGESTIONS[stepId];
    const defaultChip = defaultChips?.find(c => c.id === chipId);
    return defaultChip?.label || chipId; // Fallback to chipId if not found
  });
}

// Helper to format wizard answers into readable text with mandatory flags
function formatAnswers(
  answers: WizardAnswers,
  profileItems: ProfileGraphItem[]
): { formatted: string; hasSpecificDestination: boolean; hasMultipleDestinations: boolean } {
  const parts: string[] = [];
  let hasSpecificDestination = false;
  let hasMultipleDestinations = false;

  // When - REQUIRED (resolve chip labels)
  if (answers.when.customValue) {
    parts.push(`**TIMING (REQUIRED)**: ${answers.when.customValue}`);
  } else if (answers.when.selectedChips.length > 0) {
    const whenLabels = resolveChipLabels(answers.when.selectedChips, "when", profileItems);
    parts.push(`**TIMING (REQUIRED)**: ${whenLabels.join(", ")}`);
  }
  // Also include duration if specified
  if (answers.when.durationDays) {
    parts.push(`**DURATION**: ${answers.when.durationDays} days`);
  }

  // Where - Resolve labels and handle multiple places
  const whereChipLabels = resolveChipLabels(answers.where.selectedChips, "where", profileItems);
  const customPlaces = answers.where.customPlaces || [];
  const customTypes = answers.where.customTypes || [];
  const customValue = answers.where.customValue ? [answers.where.customValue] : [];
  
  // Combine all destination inputs
  const allPlaces = [...whereChipLabels, ...customPlaces, ...customTypes, ...customValue].filter(Boolean);
  
  if (allPlaces.length > 0) {
    // Separate specific destinations from generic preferences
    const specificPlaces = allPlaces.filter(p => isSpecificDestination(p));
    const genericPreferences = allPlaces.filter(p => !isSpecificDestination(p));
    
    if (specificPlaces.length > 1) {
      // Multiple specific destinations - include ALL in logical order
      hasSpecificDestination = true;
      hasMultipleDestinations = true;
      parts.push(`**DESTINATIONS (ALL REQUIRED - VISIT IN LOGICAL ORDER)**: ${specificPlaces.join(", ")} - The trip MUST include ALL these locations. Arrange them in a sensible geographic order for efficient travel.`);
    } else if (specificPlaces.length === 1) {
      // Single specific destination
      hasSpecificDestination = true;
      parts.push(`**DESTINATION (MANDATORY - DO NOT CHANGE)**: ${specificPlaces[0]} - The trip MUST be to this EXACT location. Do NOT substitute with a different city, region, or country.`);
    }
    
    // Add generic preferences if any
    if (genericPreferences.length > 0) {
      if (specificPlaces.length > 0) {
        parts.push(`**Destination Style Preferences**: ${genericPreferences.join(", ")} (incorporate these styles into the trip)`);
      } else {
        parts.push(`**Destination Style**: ${genericPreferences.join(", ")} (you may suggest a specific destination matching this style)`);
      }
    }
  }

  // Budget - REQUIRED (resolve chip labels)
  if (answers.budget.customValue) {
    parts.push(`**BUDGET (REQUIRED)**: ${answers.budget.customValue}`);
  } else if (answers.budget.selectedChips.length > 0) {
    const budgetLabels = resolveChipLabels(answers.budget.selectedChips, "budget", profileItems);
    // Also include the actual budget values if available
    if (answers.budget.budgetPerDay) {
      parts.push(`**BUDGET (REQUIRED)**: ${budgetLabels.join(", ")} (~$${answers.budget.budgetPerDay}/day)`);
    } else {
      parts.push(`**BUDGET (REQUIRED)**: ${budgetLabels.join(", ")}`);
    }
  }

  // Who - REQUIRED (resolve chip labels)
  if (answers.who.customValue) {
    parts.push(`**TRAVELERS (REQUIRED)**: ${answers.who.customValue}`);
  } else if (answers.who.selectedChips.length > 0) {
    const whoLabels = resolveChipLabels(answers.who.selectedChips, "who", profileItems);
    parts.push(`**TRAVELERS (REQUIRED)**: ${whoLabels.join(", ")}`);
  }

  // What (trip style/interests) - REQUIRED (resolve chip labels)
  if (answers.what.customValue) {
    parts.push(`**TRIP STYLE (REQUIRED)**: ${answers.what.customValue}`);
  } else if (answers.what.selectedChips.length > 0) {
    const whatLabels = resolveChipLabels(answers.what.selectedChips, "what", profileItems);
    parts.push(`**TRIP STYLE (REQUIRED)**: ${whatLabels.join(", ")}`);
  }

  return { formatted: parts.join("\n"), hasSpecificDestination, hasMultipleDestinations };
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

  const { formatted: formattedAnswers, hasSpecificDestination, hasMultipleDestinations } = formatAnswers(answers, profileItems);
  const profileContext = formatProfileContext(profileItems);

  // Build destination constraint text based on whether a specific place was selected
  let destinationConstraint = "";
  if (hasMultipleDestinations) {
    destinationConstraint = `
## CRITICAL - MULTIPLE DESTINATIONS CONSTRAINT
The user has selected MULTIPLE specific destinations. You MUST include ALL of them in the trip.
- Include EVERY destination they specified - do not omit any
- Arrange the destinations in a logical geographic order for efficient travel
- The trip type should be "multi_destination"
- For alternatives, keep the same destinations but vary budget/duration/style`;
  } else if (hasSpecificDestination) {
    destinationConstraint = `
## CRITICAL - MANDATORY DESTINATION CONSTRAINT
The user has selected a SPECIFIC destination. You MUST plan the trip to that EXACT location.
- Do NOT substitute with a similar city, country, or region
- Do NOT suggest an alternative location for the main suggestion
- The destination field MUST match exactly what they specified
- For alternatives, you may suggest different trips but clearly explain the difference`;
  }

  const prompt = `Generate a personalized trip suggestion based on the traveler's specific preferences:

**Traveler**: ${travelerName}${ageInfo}
**Home Location**: ${homeLocation}

## Their Trip Preferences (from wizard):
${formattedAnswers}

## Additional Profile Context:
${profileContext || "No additional profile data available"}
${destinationConstraint}

---

## CRITICAL REQUIREMENTS - ALL ARE NON-NEGOTIABLE:

1. **DESTINATION**: If marked as "MANDATORY - DO NOT CHANGE", the trip MUST be to that EXACT city/place. 
   For example, if they said "Hong Kong", the destination MUST be "Hong Kong" - not Tokyo, Singapore, or "Asia".

2. **TIMING**: Use their exact dates or timeframe as specified.

3. **BUDGET**: Stay within their specified budget range.

4. **TRAVELERS**: Plan activities appropriate for their travel group.

5. **TRIP STYLE**: Incorporate ALL their selected experiences/interests.

---

## MAIN SUGGESTION:
Create ONE trip that satisfies ALL the above requirements:
- Use REAL, bookable destinations with accurate GPS coordinates
- Provide a compelling "why" that references their specific preferences
- Include 3-5 specific, actionable highlights

## TWO ALTERNATIVES:
Provide 2 alternatives that offer meaningful variety while ${hasSpecificDestination ? "keeping the same destination" : "respecting their preferences"}:
- Alternative 1: Different budget tier (higher or lower) ${hasSpecificDestination ? "in the same destination" : ""}
- Alternative 2: Different trip duration or style ${hasSpecificDestination ? "in the same destination" : "or a different destination"}
- Each must clearly explain how it differs

## TRIP TYPE SELECTION:
- "local_experience": Under 8 hours, close to home
- "road_trip": 2-7 days, driving distance  
- "single_destination": Fly to one place
- "multi_destination": Multiple cities/countries

## IMAGE QUERY:
Use the most recognizable landmark at the destination (e.g., "Victoria Peak Hong Kong" not just "Hong Kong")`;

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

// Input for expanding an alternative to a full suggestion
export interface ExpandAlternativeInput {
  alternative: TripAlternative;
  originalAnswers: WizardAnswers;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    dateOfBirth: Date | string | null;
    city: string | null;
    country: string | null;
  };
}

/**
 * Expands a brief alternative suggestion into a full AITripSuggestion
 */
export async function expandAlternativeToFullSuggestion(
  input: ExpandAlternativeInput
): Promise<AITripSuggestion> {
  const { alternative, originalAnswers, profileItems, userProfile } = input;

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

  const { formatted: formattedAnswers } = formatAnswers(originalAnswers, profileItems);
  const profileContext = formatProfileContext(profileItems);

  const prompt = `Expand this alternative trip suggestion into a full, detailed trip plan:

## Alternative to Expand:
- **Title**: ${alternative.title}
- **Destination**: ${alternative.destination}
- **Duration**: ${alternative.duration}
- **Budget**: ${alternative.estimatedBudget}
- **Trip Type**: ${alternative.tripType}
- **Why Different**: ${alternative.whyDifferent}

## Traveler Info:
**Name**: ${travelerName}${ageInfo}
**Home Location**: ${homeLocation}

## Original Preferences (from wizard):
${formattedAnswers}

## Profile Context:
${profileContext || "No additional profile data available"}

---

## INSTRUCTIONS:

Create a FULL trip suggestion based on the alternative above. The trip MUST:
1. Use the EXACT destination, duration, and budget from the alternative
2. Match the trip type specified
3. Incorporate the traveler's interests and preferences where possible
4. Provide REAL, bookable experiences with accurate GPS coordinates
5. Include 3-5 specific, actionable highlights
6. Use a recognizable landmark for the image query

The "why" explanation should reference both why this alternative differs AND how it still suits the traveler's interests.`;

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: MainSuggestionSchema,
    prompt,
  });

  return result.object as AITripSuggestion;
}
