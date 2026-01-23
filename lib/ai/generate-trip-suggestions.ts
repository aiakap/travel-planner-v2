"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const TripSuggestionSchema = z.object({
  title: z.string().describe("Catchy trip title (e.g., 'Sunset Hike & Jazz Night' or 'Tuscan Wine & Photography Retreat')"),
  destination: z.string().describe("Destination (can be local neighborhood, nearby city, or international)"),
  duration: z.string().describe("Duration (e.g., 'Evening (4-6 hours)', '1 day', 'Weekend', '3-5 days', '1-2 weeks', '2-3 weeks')"),
  description: z.string().describe("2-3 sentence trip overview"),
  why: z.string().describe("Detailed explanation (3-4 sentences) of why this trip perfectly matches their profile, citing specific hobbies, preferences, or relationships"),
  highlights: z.array(z.string()).describe("2-4 key experiences/activities"),
  estimatedBudget: z.string().describe("Budget range per person (e.g., '$50-100', '$200-400', '$1,500-2,500', '$5,000+')"),
  bestTimeToVisit: z.string().describe("Optimal timing (e.g., 'This weekend', 'Spring', 'Year-round', 'September-October')"),
  combinedInterests: z.array(z.string()).describe("Which hobbies/preferences this trip combines"),
  tripType: z.enum(["local_experience", "road_trip", "single_destination", "multi_destination"]).describe("Type of trip"),
  transportMode: z.string().describe("How to get there (e.g., 'Walking/Uber', 'Car', 'Plane', 'Train', 'Plane + Car')"),
  imageQuery: z.string().describe("Primary landmark/location for image search (e.g., 'Eiffel Tower Paris', 'Big Sur coastline', 'Tokyo nightlife', 'Golden Gate Bridge San Francisco')"),
  destinationKeywords: z.array(z.string()).describe("2-3 visual keywords for fallback image search (e.g., ['sunset', 'beach', 'tropical'])"),
  destinationLat: z.number().describe("Primary destination latitude for map display (approximate is fine)"),
  destinationLng: z.number().describe("Primary destination longitude for map display (approximate is fine)"),
  keyLocations: z.array(z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  })).describe("For multi-destination trips, provide 2-4 key stops with coordinates. For single destination, use empty array []"),
});

export type AITripSuggestion = z.infer<typeof TripSuggestionSchema>;

export async function generateAITripSuggestions(profileData: {
  hobbies: Array<{ hobby: { name: string; category: string | null } }>;
  preferences: Array<{ preferenceType: { name: string }; option: { value: string; label: string } }>;
  relationships: Array<{ relationshipType: string; nickname: string | null }>;
  profile: { 
    name: string | null;
    dateOfBirth: Date | string | null;
    city: string | null; 
    country: string | null;
  } | null;
}): Promise<AITripSuggestion[]> {
  
  // Build profile summary for AI
  const hobbiesList = profileData.hobbies.map(h => h.hobby.name).join(", ");
  const preferencesList = profileData.preferences
    .map(p => `${p.preferenceType.name}: ${p.option.label}`)
    .join("; ");
  const relationshipsList = profileData.relationships
    .map(r => `${r.relationshipType}${r.nickname ? ` (${r.nickname})` : ""}`)
    .join(", ");
  const location = profileData.profile?.city 
    ? `${profileData.profile.city}${profileData.profile.country ? `, ${profileData.profile.country}` : ""}`
    : "Unknown";
  
  // Calculate age from date of birth if available
  let ageInfo = "";
  if (profileData.profile?.dateOfBirth) {
    const dob = new Date(profileData.profile.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    ageInfo = ` (Age: ${age})`;
  }
  
  const travelerName = profileData.profile?.name || "Traveler";

  const prompt = `Generate 4 DIVERSE personalized trip suggestions for this traveler:

**Traveler**: ${travelerName}${ageInfo}
**Hobbies/Interests**: ${hobbiesList || "None specified"}
**Travel Preferences**: ${preferencesList || "None specified"}
**Traveling with**: ${relationshipsList || "Solo"}
**Home Location**: ${location}

CRITICAL - Generate diverse trip types:
1. **Local Experience** (4-8 hours, within 30 min of home): Like "Hike + Dinner + Concert" or "Brewery Tour + BBQ + Live Music". Use actual local places near ${location}. Budget: $50-300.

2. **Road Trip** (2-4 days, car travel, overnight stay): Within 3-5 hours driving. Real destinations accessible by car. Budget varies.

3. **Single Destination** (3-7 days, plane/train): One city/resort, deep dive. Could be budget ($500) or luxury ($3,000+).

4. **Multi-Destination** (1-3 weeks, plane + car/train): Epic journey across region/country. Mix cheap and expensive options.

Requirements:
- Vary budget dramatically: cheap ($50), moderate ($500), expensive ($2,000), luxury ($5,000+)
- Mix local and international
- Mix short (hours) and long (weeks)
- Combine 2-3 of their interests when possible
- Consider who they're traveling with
- Use REAL, bookable destinations
- Be specific about transport (walking, car, plane, train)
- Make titles creative and actionable
- Provide SPECIFIC imageQuery with recognizable landmarks/locations for photo search
- Include visual destinationKeywords that capture the trip's aesthetic
- Provide ACCURATE coordinates (latitude/longitude) for the primary destination
- For multi-destination trips, include keyLocations array with 2-4 stops and their coordinates
- For single destination trips, set keyLocations to empty array []

Examples of diversity:
- "Sunset Hike at [Local Peak] + Farm-to-Table Dinner + Jazz at [Venue]" ($80, 6 hours)
- "Big Sur Coastal Drive & Glamping Weekend" ($400, 3 days, car)
- "Week in Kyoto: Temples, Tea & Kaiseki" ($2,000, 7 days, plane)
- "3-Week South America Adventure: Lima → Cusco → Patagonia" ($4,500, 21 days, planes + buses)

Be specific and personal in the reasoning. Don't use generic phrases.`;

  // #region agent log
  await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-trip-suggestions.ts:beforeAI',message:'About to call OpenAI',data:{promptLength:prompt.length,hasHobbies:hobbiesList.length>0,hasPrefs:preferencesList.length>0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      suggestions: z.array(TripSuggestionSchema).length(4),
    }),
    prompt,
  });

  // #region agent log
  await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-trip-suggestions.ts:afterAI',message:'OpenAI response received',data:{hasResult:!!result,hasObject:!!result?.object,hasSuggestions:!!result?.object?.suggestions,count:result?.object?.suggestions?.length,firstHasLat:!!(result?.object?.suggestions?.[0]?.destinationLat)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  return result.object.suggestions;
}
