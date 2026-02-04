"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { AITripSuggestion } from "./generate-trip-suggestions";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";

// ============================================================================
// SCHEMAS
// ============================================================================

const LocationSchema = z.object({
  name: z.string().describe("Location name (city, neighborhood, or venue)"),
  lat: z.number().describe("Latitude coordinate"),
  lng: z.number().describe("Longitude coordinate"),
  timezone: z.string().describe("IANA timezone (e.g., 'America/New_York', 'Europe/Paris')"),
  iataCode: z.string().nullable().describe("IATA airport code if applicable (e.g., 'JFK', 'CDG'), null if not an airport"),
});

const FlightSearchSchema = z.object({
  origin: z.string().describe("Origin IATA airport code (e.g., 'SFO')"),
  destination: z.string().describe("Destination IATA airport code (e.g., 'FCO')"),
  date: z.string().describe("Departure date in YYYY-MM-DD format"),
  preferredAirlines: z.array(z.string()).nullable().describe("Preferred airlines from profile, null if no preference"),
  travelClass: z.string().nullable().describe("Travel class preference: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST, null if no preference"),
  explanation: z.string().describe("Why this flight/route was chosen based on profile"),
  profileReferences: z.array(z.string()).describe("Profile item IDs that influenced this choice"),
});

const HotelSearchSchema = z.object({
  location: z.string().describe("City or area name for hotel search"),
  cityCode: z.string().nullable().describe("IATA city code if known (e.g., 'PAR' for Paris), null if unknown"),
  checkIn: z.string().describe("Check-in date in YYYY-MM-DD format"),
  checkOut: z.string().describe("Check-out date in YYYY-MM-DD format"),
  style: z.enum(["budget", "mid-range", "boutique", "luxury", "resort"]).describe("Hotel style preference"),
  amenities: z.array(z.string()).nullable().describe("Desired amenities from profile, null if no specific requirements"),
  explanation: z.string().describe("Why this hotel style was chosen based on profile"),
  profileReferences: z.array(z.string()).describe("Profile item IDs that influenced this choice"),
});

const ActivitySearchSchema = z.object({
  type: z.string().describe("Activity type (museum, tour, outdoor, culinary, wellness, etc.)"),
  query: z.string().describe("Search query for activity (e.g., 'Uffizi Gallery Florence', 'wine tasting Chianti')"),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]).describe("Best time for this activity"),
  date: z.string().describe("Activity date in YYYY-MM-DD format"),
  estimatedDuration: z.number().describe("Estimated duration in hours"),
  estimatedCost: z.number().nullable().describe("Estimated cost in USD, null if unknown"),
  explanation: z.string().describe("Why this activity was chosen based on profile"),
  profileReferences: z.array(z.string()).describe("Profile item IDs that influenced this choice"),
});

const RestaurantSearchSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner"]).describe("Type of meal"),
  cuisineType: z.string().describe("Cuisine preference (e.g., 'Italian', 'Japanese', 'Farm-to-table')"),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).describe("Price range"),
  date: z.string().describe("Meal date in YYYY-MM-DD format"),
  location: z.string().describe("Area/neighborhood for restaurant search"),
  dietaryRestrictions: z.array(z.string()).nullable().describe("Dietary restrictions from profile, null if none"),
  explanation: z.string().describe("Why this cuisine/style was chosen based on profile"),
  profileReferences: z.array(z.string()).describe("Profile item IDs that influenced this choice"),
});

const SegmentSchema = z.object({
  type: z.enum(["Travel", "Stay", "Tour", "Retreat", "Road Trip"]).describe("Segment type - use 'Stay' for destination segments (most common)"),
  name: z.string().describe("Segment name - use the destination name (e.g., 'Half Moon Bay', 'Florence', 'Paris')"),
  startLocation: LocationSchema,
  endLocation: LocationSchema,
  startTime: z.string().describe("Segment start time in ISO format"),
  endTime: z.string().describe("Segment end time in ISO format"),
  
  segmentExplanation: z.object({
    reason: z.string().describe("Why this location/segment was chosen (2-3 sentences)"),
    profileReferences: z.array(z.string()).describe("Profile item IDs that influenced this segment"),
  }),
  
  flightSearch: FlightSearchSchema.nullable().describe("Flight search params if this is a travel segment, null otherwise"),
  hotelSearch: HotelSearchSchema.nullable().describe("Hotel search params if staying overnight, null otherwise"),
  activitySearches: z.array(ActivitySearchSchema).describe("Activities for this segment"),
  restaurantSearches: z.array(RestaurantSearchSchema).describe("Restaurant recommendations for this segment"),
});

const TripExplanationSchema = z.object({
  summary: z.string().describe("High-level summary of why this trip was crafted (2-3 sentences)"),
  parameters: z.object({
    duration: z.string().describe("Trip duration (e.g., '7 days')"),
    budget: z.string().describe("Budget level (e.g., 'moderate', 'luxury')"),
    travelStyle: z.string().describe("Travel style (e.g., 'cultural exploration', 'relaxation')"),
    keyInterests: z.array(z.string()).describe("Key interests this trip addresses"),
    companions: z.string().describe("Who the trip is designed for (e.g., 'couple', 'solo', 'family')"),
  }),
  profileReferences: z.array(z.string()).describe("All profile item IDs that influenced the overall trip"),
});

const AIGeneratedItinerarySchema = z.object({
  title: z.string().describe("Trip title"),
  description: z.string().describe("Trip description (2-3 sentences)"),
  startDate: z.string().describe("Trip start date in YYYY-MM-DD format"),
  endDate: z.string().describe("Trip end date in YYYY-MM-DD format"),
  tripExplanation: TripExplanationSchema,
  segments: z.array(SegmentSchema).describe("Trip segments in chronological order"),
});

export type AIGeneratedItinerary = z.infer<typeof AIGeneratedItinerarySchema>;
export type SegmentData = z.infer<typeof SegmentSchema>;
export type FlightSearchParams = z.infer<typeof FlightSearchSchema>;
export type HotelSearchParams = z.infer<typeof HotelSearchSchema>;
export type ActivitySearchParams = z.infer<typeof ActivitySearchSchema>;
export type RestaurantSearchParams = z.infer<typeof RestaurantSearchSchema>;

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export interface GenerateSampleItineraryParams {
  suggestion: AITripSuggestion;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    city: string | null;
    country: string | null;
    dateOfBirth: Date | null;
  };
  startDate?: string; // Optional override, defaults to 2 weeks from now
}

/**
 * Generate a detailed sample itinerary with search parameters for real data lookup
 */
export async function generateSampleItinerary(
  params: GenerateSampleItineraryParams
): Promise<AIGeneratedItinerary> {
  const { suggestion, profileItems, userProfile, startDate } = params;
  
  // Calculate trip dates
  const tripStartDate = startDate || getDefaultStartDate(suggestion.bestTimeToVisit);
  const tripDays = parseDuration(suggestion.duration);
  const tripEndDate = addDays(tripStartDate, tripDays);
  
  // Build profile summary for the AI
  const profileSummary = buildProfileSummary(profileItems, userProfile);
  
  // Determine home airport
  const homeLocation = userProfile.city && userProfile.country 
    ? `${userProfile.city}, ${userProfile.country}`
    : "San Francisco, USA";
  
  const prompt = `Generate a detailed day-by-day itinerary for this trip suggestion.

## TRIP TO GENERATE
**Title**: ${suggestion.title}
**Destination**: ${suggestion.destination}
**Duration**: ${suggestion.duration} (${tripDays} days)
**Trip Type**: ${suggestion.tripType}
**Transport**: ${suggestion.transportMode}
**Budget**: ${suggestion.estimatedBudget}
**Best Time**: ${suggestion.bestTimeToVisit}
**Highlights**: ${suggestion.highlights.join(", ")}
**Why Perfect**: ${suggestion.why}

## TRAVELER PROFILE
${profileSummary}

## HOME LOCATION
${homeLocation}

## TRIP DATES
Start: ${tripStartDate}
End: ${tripEndDate}

## REQUIREMENTS

1. **Segments = Destinations (CRITICAL)**:
   - Create ONE segment per distinct destination/city where the traveler spends time
   - For single-destination trips (weekend getaway, city visit), create just ONE segment
   - Only create a NEW segment when traveling to a DIFFERENT city/region requiring:
     - A flight, OR
     - A train journey of 2+ hours, OR
     - A drive of 2+ hours
   - Day trips from a base location stay within that base segment (NOT a separate segment)
   - Name segments after the destination (e.g., "Half Moon Bay", "Florence", "Paris")
   - Use "Stay" type for destination segments (most common)
   - Use "Travel" type ONLY for transit-only segments (very rare - only for long layovers)
   - Use "Road Trip" for multi-stop driving adventures
   - Include ALL reservations for a destination within its segment (flights, hotels, restaurants, activities)

2. **Flights** (included IN the destination segment they arrive at):
   - Use real IATA codes
   - Origin from closest major airport to ${homeLocation}
   - Realistic departure/arrival times
   - Note why this routing fits their profile
   - The outbound flight goes in the FIRST destination segment
   - The return flight goes in the LAST destination segment

3. **Hotels** (one per segment where they stay overnight):
   - Match style to their preferences (${getHotelPreference(profileItems)})
   - Include realistic check-in/check-out dates
   - Explain why this style suits them

4. **Activities** (2-4 per day):
   - Match their hobbies and interests
   - Include specific venue names when possible
   - Vary morning/afternoon/evening
   - Each activity needs an explanation linking to their profile

5. **Restaurants** (2-3 per day):
   - Match their cuisine preferences
   - Vary price ranges appropriately
   - Include breakfast/lunch/dinner options
   - Explain cuisine choices based on their profile

6. **Profile References**: For EVERY choice (flights, hotels, activities, restaurants), include:
   - \`explanation\`: A sentence explaining WHY this was chosen for this specific traveler
   - \`profileReferences\`: Array of profile item IDs that influenced the choice (e.g., "hobbies-photography", "travel-preferences-boutique-hotels")

7. **Duration Guidelines (CRITICAL)**:
   - Weekend trips: MINIMUM 2 nights (Friday-Sunday or Saturday-Monday)
   - Short trips (3-5 days): Match the full duration with appropriate nights (3 days = 2-3 nights)
   - Week trips: 6-7 nights
   - Hotels should span the ENTIRE stay at each destination
   - Check-in on arrival day, check-out on departure day
   - Example: A "Weekend in Tahoe" should have Fri night + Sat night hotel stay at minimum

8. **Location Coordinates (CRITICAL)**:
   - startLocation: Where the traveler departs FROM (their home city, e.g., San Francisco)
   - endLocation: The ACTUAL destination where they'll stay and explore
   - Use coordinates of the DESTINATION town/area, NOT the nearest major airport
   - For Lake Tahoe: use South Lake Tahoe coordinates (~38.94, -119.97), NOT Sacramento
   - For coastal towns: use the town center, NOT nearby cities
   - For small destinations: use the actual town center coordinates
   - The segment's endLocation determines where restaurants and activities are searched

## PROFILE ITEM ID FORMAT
Use the format: "category-value" where:
- category: hobbies, travel-preferences, family, spending-priorities, travel-style, destinations, dining
- value: The specific item in kebab-case (e.g., "photography", "boutique-hotels", "italian-cuisine")

Example profileReferences: ["hobbies-photography", "hobbies-art-history", "travel-preferences-boutique-hotels"]

## IMPORTANT
- Be SPECIFIC with venue names, not generic
- Use REAL places that exist
- Make explanations PERSONAL, citing specific profile items
- Ensure all dates are in YYYY-MM-DD format
- Ensure all times are in ISO format with timezone
- The itinerary should feel tailor-made, not generic`;

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: AIGeneratedItinerarySchema,
    prompt,
  });

  return result.object;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildProfileSummary(profileItems: ProfileGraphItem[], userProfile: any): string {
  const grouped: Record<string, string[]> = {};
  
  for (const item of profileItems) {
    const category = item.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item.value);
  }
  
  const lines: string[] = [];
  
  if (userProfile.name) {
    lines.push(`**Name**: ${userProfile.name}`);
  }
  
  if (grouped['hobbies']?.length) {
    lines.push(`**Hobbies/Interests**: ${grouped['hobbies'].join(', ')}`);
  }
  
  if (grouped['travel-preferences']?.length) {
    lines.push(`**Travel Preferences**: ${grouped['travel-preferences'].join(', ')}`);
  }
  
  if (grouped['travel-style']?.length) {
    lines.push(`**Travel Style**: ${grouped['travel-style'].join(', ')}`);
  }
  
  if (grouped['family']?.length) {
    lines.push(`**Traveling With**: ${grouped['family'].join(', ')}`);
  }
  
  if (grouped['spending-priorities']?.length) {
    lines.push(`**Budget Priorities**: ${grouped['spending-priorities'].join(', ')}`);
  }
  
  if (grouped['destinations']?.length) {
    lines.push(`**Favorite Destinations**: ${grouped['destinations'].join(', ')}`);
  }
  
  // Check for dining/culinary preferences
  const diningItems = profileItems.filter(p => 
    p.category === 'dining' || 
    p.metadata?.subcategory?.includes('cuisine') ||
    p.metadata?.subcategory?.includes('food')
  );
  if (diningItems.length > 0) {
    lines.push(`**Dining Preferences**: ${diningItems.map(d => d.value).join(', ')}`);
  }
  
  return lines.join('\n');
}

function getHotelPreference(profileItems: ProfileGraphItem[]): string {
  const prefs = profileItems.filter(p => 
    p.category === 'travel-preferences' && 
    (p.value.toLowerCase().includes('hotel') || 
     p.value.toLowerCase().includes('boutique') ||
     p.value.toLowerCase().includes('luxury') ||
     p.value.toLowerCase().includes('budget'))
  );
  
  if (prefs.length > 0) {
    return prefs.map(p => p.value).join(', ');
  }
  
  // Check spending priorities
  const budget = profileItems.find(p => p.category === 'spending-priorities');
  if (budget) {
    return `based on ${budget.value} priorities`;
  }
  
  return 'mid-range, comfortable';
}

function parseDuration(duration: string): number {
  // Parse duration string like "3-5 days", "Weekend", "1-2 weeks"
  const lower = duration.toLowerCase();
  
  if (lower.includes('week')) {
    const match = lower.match(/(\d+)/);
    if (match) {
      const weeks = parseInt(match[1]);
      return weeks * 7;
    }
    return 7; // Default 1 week
  }
  
  if (lower.includes('weekend')) {
    return 3;
  }
  
  if (lower.includes('day')) {
    const match = lower.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  if (lower.includes('hour')) {
    return 1; // Same day trip
  }
  
  // Try to extract any number
  const match = lower.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return 5; // Default 5 days
}

function getDefaultStartDate(bestTimeToVisit: string): string {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  // For simplicity, use 2 weeks from now
  // In a production system, you'd parse bestTimeToVisit and find the next appropriate date
  return twoWeeksFromNow.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  FlightSearchParams as FlightSearch,
  HotelSearchParams as HotelSearch,
  ActivitySearchParams as ActivitySearch,
  RestaurantSearchParams as RestaurantSearch,
};
