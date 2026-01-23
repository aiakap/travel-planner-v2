import { PlaceSuggestion } from "@/lib/types/place-suggestion";

export interface ParsedIntent {
  shouldCreateTrip: boolean;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  title?: string;
  description?: string;
  hotels: string[];
  restaurants: string[];
  activities: string[];
}

/**
 * Parse AI response text and place suggestions to determine if a trip should be created
 * Uses simple heuristics to detect trip creation intent
 */
export function parseIntentFromResponse(
  text: string,
  places: PlaceSuggestion[]
): ParsedIntent {
  const lowerText = text.toLowerCase();
  
  // Check for trip creation indicators
  const hasCreatedLanguage = 
    lowerText.includes("created") ||
    lowerText.includes("i've created") ||
    lowerText.includes("i have created") ||
    lowerText.includes("here's your trip") ||
    lowerText.includes("here is your trip");
    
  const hasTripLanguage =
    lowerText.includes("trip to") ||
    lowerText.includes("itinerary") ||
    lowerText.includes("visiting") ||
    lowerText.includes("travel to");
    
  const hasMultiplePlaces = places.length >= 3;
  
  const shouldCreateTrip = hasCreatedLanguage || (hasTripLanguage && hasMultiplePlaces);
  
  // Extract destination
  const destination = extractDestination(text);
  
  // Extract dates
  const { startDate, endDate } = extractDates(text);
  
  // Extract title
  const title = extractTitle(text, destination);
  
  // Categorize places by type
  const hotels = places
    .filter(p => p.category === "Stay")
    .map(p => p.placeName);
    
  const restaurants = places
    .filter(p => p.category === "Dining")
    .map(p => p.placeName);
    
  const activities = places
    .filter(p => p.category === "Activity")
    .map(p => p.placeName);
  
  return {
    shouldCreateTrip,
    destination,
    startDate,
    endDate,
    title,
    description: undefined, // Will be auto-generated from destination
    hotels,
    restaurants,
    activities,
  };
}

/**
 * Extract destination from text
 */
function extractDestination(text: string): string | undefined {
  // Look for patterns like "trip to [destination]" or "visiting [destination]"
  const patterns = [
    /trip to ([A-Z][a-zA-Z\s,]+?)(?:\.|,|!|\?|$)/,
    /visiting ([A-Z][a-zA-Z\s,]+?)(?:\.|,|!|\?|$)/,
    /travel to ([A-Z][a-zA-Z\s,]+?)(?:\.|,|!|\?|$)/,
    /in ([A-Z][a-zA-Z\s,]+?)(?:\.|,|!|\?|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the destination
      const dest = match[1].trim();
      // Remove common trailing words
      return dest
        .replace(/\s+(from|during|with|for|on)\s*$/, "")
        .replace(/\s+$/, "")
        .trim();
    }
  }
  
  return undefined;
}

/**
 * Extract dates from text
 */
function extractDates(text: string): { startDate?: Date; endDate?: Date } {
  const today = new Date();
  
  // Look for explicit date patterns
  const datePatterns = [
    // ISO format: 2024-03-15
    /(\d{4}-\d{2}-\d{2})/g,
    // US format: March 15, 2024
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
  ];
  
  const foundDates: Date[] = [];
  
  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateStr = match[0];
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        foundDates.push(parsed);
      }
    }
  }
  
  // If we found dates, use them
  if (foundDates.length >= 2) {
    foundDates.sort((a, b) => a.getTime() - b.getTime());
    return {
      startDate: foundDates[0],
      endDate: foundDates[1],
    };
  } else if (foundDates.length === 1) {
    // If only one date, assume it's the start date and add 7 days
    return {
      startDate: foundDates[0],
      endDate: new Date(foundDates[0].getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }
  
  // Look for relative date patterns
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("next week")) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    return { startDate, endDate };
  }
  
  if (lowerText.includes("next month")) {
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    return { startDate, endDate };
  }
  
  if (lowerText.includes("this weekend")) {
    const startDate = new Date(today);
    const daysUntilSaturday = (6 - startDate.getDay() + 7) % 7;
    startDate.setDate(startDate.getDate() + daysUntilSaturday);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);
    return { startDate, endDate };
  }
  
  // Default: start in 7 days, end in 14 days
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() + 7);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultEnd.getDate() + 7);
  
  return {
    startDate: defaultStart,
    endDate: defaultEnd,
  };
}

/**
 * Extract trip title from text
 */
function extractTitle(text: string, destination?: string): string | undefined {
  // Look for quoted titles
  const quotedMatch = text.match(/"([^"]+)"/);
  if (quotedMatch) {
    return quotedMatch[1];
  }
  
  // Use destination if available
  if (destination) {
    return `Trip to ${destination}`;
  }
  
  return undefined;
}
