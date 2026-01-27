/**
 * Hotel Context Extractor
 * 
 * Extracts hotel search parameters from trip context, segments, and user profile
 * to enable real-time hotel price lookups from Amadeus API.
 */

export interface HotelSearchContext {
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guests: number;
  rooms: number;
  location: string; // from hotel suggestion or segment
}

export interface TripContext {
  tripId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  segments?: Array<{
    id: string;
    startTime?: Date | string;
    endTime?: Date | string;
    startTitle?: string;
    endTitle?: string;
  }>;
}

export interface HotelSuggestion {
  suggestedName?: string;
  searchQuery?: string;
  context?: {
    location?: string;
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
    rooms?: number;
  };
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateToYYYYMMDD(date: Date | string): string {
  if (typeof date === 'string') {
    // Already a string, try to parse it
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }
    date = parsed;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extract location from hotel suggestion
 * 
 * Priority:
 * 1. context.location (explicit location)
 * 2. searchQuery (parse location from search query)
 * 3. suggestedName (use hotel name as fallback)
 */
function extractLocationFromSuggestion(suggestion: HotelSuggestion): string {
  // Try context.location first
  if (suggestion.context?.location) {
    return suggestion.context.location;
  }
  
  // Try to parse location from searchQuery
  if (suggestion.searchQuery) {
    // searchQuery format might be like "Hilton Hotel Paris" or "Hotel in Paris"
    // Extract the last word(s) as location
    const words = suggestion.searchQuery.split(' ');
    if (words.length >= 2) {
      // Take last 1-2 words as potential location
      const potentialLocation = words.slice(-2).join(' ');
      // Check if it looks like a location (capitalized, not "hotel", etc.)
      if (potentialLocation && !potentialLocation.toLowerCase().includes('hotel')) {
        return potentialLocation;
      }
    }
  }
  
  // Fallback to suggested name
  return suggestion.suggestedName || 'Unknown';
}

/**
 * Extract hotel search context from trip and suggestion data
 * 
 * @param suggestion - Hotel suggestion from AI
 * @param tripContext - Trip context with dates and segments
 * @param profileData - Optional user profile data for guest count
 * @returns Hotel search context ready for Amadeus API
 */
export function extractHotelContext(
  suggestion: HotelSuggestion,
  tripContext?: TripContext,
  profileData?: any
): HotelSearchContext | null {
  try {
    // Extract location
    const location = extractLocationFromSuggestion(suggestion);
    
    // Extract dates (priority: suggestion context > trip context)
    let checkInDate: string;
    let checkOutDate: string;
    
    if (suggestion.context?.checkInDate && suggestion.context?.checkOutDate) {
      // Use dates from suggestion if available
      checkInDate = suggestion.context.checkInDate;
      checkOutDate = suggestion.context.checkOutDate;
    } else if (tripContext) {
      // Use trip dates or segment dates
      if (tripContext.startDate && tripContext.endDate) {
        checkInDate = formatDateToYYYYMMDD(tripContext.startDate);
        checkOutDate = formatDateToYYYYMMDD(tripContext.endDate);
      } else if (tripContext.segments && tripContext.segments.length > 0) {
        // Use first segment dates as fallback
        const firstSegment = tripContext.segments[0];
        if (firstSegment.startTime && firstSegment.endTime) {
          checkInDate = formatDateToYYYYMMDD(firstSegment.startTime);
          checkOutDate = formatDateToYYYYMMDD(firstSegment.endTime);
        } else {
          console.warn('⚠️  No valid dates found in trip context');
          return null;
        }
      } else {
        console.warn('⚠️  No dates available for hotel search');
        return null;
      }
    } else {
      console.warn('⚠️  No trip context provided for hotel search');
      return null;
    }
    
    // Validate dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    
    if (checkIn < today) {
      console.warn(`⚠️  Check-in date ${checkInDate} is in the past, skipping hotel lookup`);
      return null;
    }
    
    // Extract guests and rooms (with sensible defaults)
    const guests = suggestion.context?.guests || 
                   profileData?.travelPreferences?.defaultGuests || 
                   2; // Default to 2 guests
    
    const rooms = suggestion.context?.rooms || 
                  Math.ceil(guests / 2) || // Estimate 2 guests per room
                  1; // Minimum 1 room
    
    return {
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      location,
    };
  } catch (error) {
    console.error('❌ Error extracting hotel context:', error);
    return null;
  }
}

/**
 * Extract hotel context for multiple hotels at once
 * Useful for batch processing
 * 
 * @param suggestions - Array of hotel suggestions
 * @param tripContext - Trip context
 * @param profileData - User profile data
 * @returns Array of hotel search contexts with suggestion index
 */
export function extractBatchHotelContext(
  suggestions: HotelSuggestion[],
  tripContext?: TripContext,
  profileData?: any
): Array<{ index: number; context: HotelSearchContext; suggestion: HotelSuggestion }> {
  const contexts: Array<{ index: number; context: HotelSearchContext; suggestion: HotelSuggestion }> = [];
  
  suggestions.forEach((suggestion, index) => {
    const context = extractHotelContext(suggestion, tripContext, profileData);
    if (context) {
      contexts.push({ index, context, suggestion });
    }
  });
  
  return contexts;
}

/**
 * Calculate number of nights from context
 */
export function calculateNightsFromContext(context: HotelSearchContext): number {
  const checkIn = new Date(context.checkInDate);
  const checkOut = new Date(context.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}

/**
 * Validate hotel search context is complete and valid
 */
export function isValidHotelContext(context: HotelSearchContext | null): context is HotelSearchContext {
  if (!context) return false;
  
  return Boolean(
    context.checkInDate &&
    context.checkOutDate &&
    context.guests > 0 &&
    context.rooms > 0 &&
    context.location &&
    context.location !== 'Unknown'
  );
}
