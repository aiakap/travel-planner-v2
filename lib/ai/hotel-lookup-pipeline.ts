/**
 * Hotel Lookup Pipeline
 * 
 * Enriches hotel suggestions with real-time pricing from Amadeus API.
 * Integrates with the existing place suggestion pipeline to add hotel pricing data.
 */

import { searchHotelByName } from '@/lib/amadeus/hotels';
import { 
  extractHotelContext, 
  extractBatchHotelContext,
  isValidHotelContext,
  calculateNightsFromContext,
  type TripContext,
  type HotelSearchContext 
} from '@/app/exp/lib/hotel-context-extractor';
import type { 
  PlaceSuggestion, 
  MessageSegment,
  AmadeusHotelData 
} from '@/lib/types/place-pipeline';

export interface HotelEnrichmentResult {
  suggestedName: string;
  hotelData: AmadeusHotelData | null;
  error?: string;
}

/**
 * Check if a suggestion is a hotel
 */
function isHotelSuggestion(suggestion: PlaceSuggestion): boolean {
  return suggestion.type?.toLowerCase() === 'hotel' || 
         suggestion.category === 'Stay';
}

/**
 * Enrich a single hotel suggestion with pricing data
 * 
 * @param suggestion - Hotel suggestion from AI
 * @param tripContext - Trip context for dates
 * @param profileData - User profile for guest count
 * @returns Hotel data with pricing or null if lookup fails
 */
export async function enrichHotelWithPricing(
  suggestion: PlaceSuggestion,
  tripContext?: TripContext,
  profileData?: any
): Promise<AmadeusHotelData | null> {
  try {
    // Extract search context
    const context = extractHotelContext(suggestion, tripContext, profileData);
    
    if (!isValidHotelContext(context)) {
      console.log(`⚠️  Invalid hotel context for "${suggestion.suggestedName}", skipping`);
      return null;
    }
    
    console.log(`🏨 Looking up pricing for: ${suggestion.suggestedName} in ${context.location}`);
    console.log(`   Dates: ${context.checkInDate} to ${context.checkOutDate}`);
    console.log(`   Guests: ${context.guests}, Rooms: ${context.rooms}`);
    
    // Search for hotel by name
    const hotelData = await searchHotelByName(
      suggestion.suggestedName,
      context.location,
      context.checkInDate,
      context.checkOutDate,
      context.guests,
      context.rooms
    );
    
    if (hotelData && !hotelData.notFound) {
      const nights = calculateNightsFromContext(context);
      console.log(`✅ Found pricing: ${hotelData.price.currency} ${hotelData.price.total} for ${nights} nights`);
    } else {
      console.log(`⚠️  No pricing found for "${suggestion.suggestedName}"`);
    }
    
    return hotelData;
  } catch (error) {
    console.error(`❌ Error enriching hotel "${suggestion.suggestedName}":`, error);
    return null;
  }
}

/**
 * Enrich multiple hotel suggestions with pricing data (parallel execution)
 * 
 * @param suggestions - Array of place suggestions (hotels will be filtered)
 * @param tripContext - Trip context for dates
 * @param profileData - User profile for guest count
 * @returns Map of suggestion name to hotel data
 */
export async function enrichHotelsWithPricing(
  suggestions: PlaceSuggestion[],
  tripContext?: TripContext,
  profileData?: any
): Promise<Map<string, AmadeusHotelData>> {
  const hotelMap = new Map<string, AmadeusHotelData>();
  
  // Filter only hotel suggestions
  const hotels = suggestions.filter(isHotelSuggestion);
  
  if (hotels.length === 0) {
    console.log('ℹ️  No hotel suggestions found');
    return hotelMap;
  }
  
  console.log(`🏨 Enriching ${hotels.length} hotel(s) with pricing...`);
  
  // Extract contexts for batch processing
  const contexts = extractBatchHotelContext(hotels, tripContext, profileData);
  
  if (contexts.length === 0) {
    console.log('⚠️  No valid hotel contexts found');
    return hotelMap;
  }
  
  // Process hotels in parallel (with timeout)
  const results = await Promise.allSettled(
    contexts.map(async ({ context, suggestion }) => {
      const hotelData = await Promise.race([
        searchHotelByName(
          suggestion.suggestedName,
          context.location,
          context.checkInDate,
          context.checkOutDate,
          context.guests,
          context.rooms
        ),
        // Timeout after 5 seconds
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      ]);
      
      return {
        name: suggestion.suggestedName,
        data: hotelData
      };
    })
  );
  
  // Process results
  let successCount = 0;
  let failureCount = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.data && !result.value.data.notFound) {
      hotelMap.set(result.value.name, result.value.data);
      successCount++;
    } else {
      failureCount++;
      if (result.status === 'rejected') {
        console.error(`❌ Hotel lookup rejected:`, result.reason);
      }
    }
  });
  
  console.log(`✅ Hotel enrichment complete: ${successCount} successful, ${failureCount} failed`);
  
  return hotelMap;
}

/**
 * Merge hotel data into message segments
 * 
 * @param segments - Message segments from pipeline
 * @param hotelDataMap - Map of hotel name to pricing data
 * @returns Updated segments with hotel data attached
 */
export function mergeHotelDataIntoSegments(
  segments: MessageSegment[],
  hotelDataMap: Map<string, AmadeusHotelData>
): MessageSegment[] {
  return segments.map(segment => {
    // Check if this segment has a hotel suggestion
    if (segment.type === 'place' && segment.suggestion) {
      const suggestion = segment.suggestion;
      
      if (isHotelSuggestion(suggestion)) {
        const hotelData = hotelDataMap.get(suggestion.suggestedName);
        
        if (hotelData) {
          // Attach hotel data to segment
          return {
            ...segment,
            hotelData
          };
        }
      }
    }
    
    return segment;
  });
}

/**
 * Extract hotel suggestions from message segments
 * Useful for identifying which segments need pricing
 * 
 * @param segments - Message segments
 * @returns Array of hotel suggestions
 */
export function extractHotelSuggestionsFromSegments(
  segments: MessageSegment[]
): PlaceSuggestion[] {
  const hotels: PlaceSuggestion[] = [];
  
  segments.forEach(segment => {
    if (segment.type === 'place' && segment.suggestion) {
      if (isHotelSuggestion(segment.suggestion)) {
        hotels.push(segment.suggestion);
      }
    }
  });
  
  return hotels;
}

/**
 * Check if any segments contain hotel suggestions
 */
export function hasHotelSuggestions(segments: MessageSegment[]): boolean {
  return segments.some(segment => 
    segment.type === 'place' && 
    segment.suggestion && 
    isHotelSuggestion(segment.suggestion)
  );
}

/**
 * Get summary statistics for hotel enrichment
 */
export interface HotelEnrichmentStats {
  totalHotels: number;
  enrichedHotels: number;
  failedLookups: number;
  averagePriceUSD: number | null;
}

export function getHotelEnrichmentStats(
  hotelDataMap: Map<string, AmadeusHotelData>
): HotelEnrichmentStats {
  const values = Array.from(hotelDataMap.values());
  
  const enrichedHotels = values.filter(h => !h.notFound).length;
  const failedLookups = values.filter(h => h.notFound).length;
  
  // Calculate average price (convert to USD if needed)
  const usdPrices = values
    .filter(h => !h.notFound && h.price.currency === 'USD')
    .map(h => parseFloat(h.price.total));
  
  const averagePriceUSD = usdPrices.length > 0
    ? usdPrices.reduce((sum, price) => sum + price, 0) / usdPrices.length
    : null;
  
  return {
    totalHotels: values.length,
    enrichedHotels,
    failedLookups,
    averagePriceUSD,
  };
}
