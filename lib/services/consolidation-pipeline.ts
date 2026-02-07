/**
 * Consolidation Pipeline Integration
 * Integrates the unified API consolidation system with the existing 4-stage pipeline
 */

import type {
  PlaceConcept,
  PlaceCategory,
  ConsolidatedPlace,
  RawAPIResults,
  GooglePlaceSourceData,
  YelpBusinessSourceData,
  AmadeusSourceData,
} from "@/lib/types/consolidated-place";

import type {
  Stage3Output,
  Stage4Output,
  MessageSegment,
  PlaceEntity,
  HotelEntity,
  GooglePlaceData,
  AmadeusHotelData,
} from "@/lib/types/amadeus-pipeline";

import { apiResolutionService } from "./api-resolution-service";
import { entityMatcher } from "./entity-matcher";
import { consolidationService } from "@/lib/ai/consolidate-places";
import { getCacheManager, consolidatedPlaceKey } from "@/lib/cache";
import { getAPIStatus } from "@/lib/api-clients";

// ============================================================================
// Types
// ============================================================================

export interface ConsolidationPipelineOptions {
  enableYelp?: boolean;
  enableAmadeusActivities?: boolean;
  enableWeather?: boolean;
  useAIConsolidation?: boolean;
  cacheResults?: boolean;
  tripContext?: {
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
    coordinates?: { lat: number; lng: number };
  };
}

export interface ConsolidationPipelineResult {
  // Original Stage 3 format for backward compatibility
  stage3Output: Stage3Output;
  // Enhanced consolidated places
  consolidatedPlaces: ConsolidatedPlace[];
  // Timing information
  timing: {
    total: number;
    googlePlaces: number;
    yelp: number;
    amadeus: number;
    consolidation: number;
  };
  // Statistics
  stats: {
    totalEntities: number;
    googleResolved: number;
    yelpResolved: number;
    amadeusResolved: number;
    consolidatedCount: number;
    deduplicationRate: number;
  };
}

// ============================================================================
// Entity to Concept Conversion
// ============================================================================

/**
 * Convert pipeline PlaceEntity to PlaceConcept for consolidated resolution
 */
function placeEntityToConcept(entity: PlaceEntity): PlaceConcept {
  // Map pipeline types to consolidated categories
  const categoryMap: Record<string, PlaceCategory> = {
    Restaurant: "restaurant",
    Cafe: "cafe",
    Bar: "bar",
    Hotel: "hotel",
    Museum: "attraction",
    "Tourist Attraction": "attraction",
    Theater: "attraction",
    Park: "attraction",
    Church: "attraction",
    Gallery: "attraction",
    Tour: "activity",
    Activity: "activity",
    Shopping: "shopping",
    Store: "shopping",
    Mall: "shopping",
  };

  return {
    name: entity.name,
    category: categoryMap[entity.type] || "attraction",
    searchHint: entity.context,
    location: {
      city: extractCityFromContext(entity.context),
    },
  };
}

/**
 * Convert HotelEntity to PlaceConcept
 */
function hotelEntityToConcept(entity: HotelEntity): PlaceConcept {
  return {
    name: entity.name,
    category: "hotel",
    searchHint: entity.context,
    location: {
      city: entity.location,
    },
  };
}

/**
 * Extract city from context string
 */
function extractCityFromContext(context: string): string | undefined {
  // Simple extraction - context is usually "City Country Area"
  const parts = context.split(/[,\s]+/);
  return parts[0] || undefined;
}

// ============================================================================
// Result Conversion
// ============================================================================

/**
 * Convert consolidated Google data back to pipeline format
 */
function googleToPlaceMap(
  google: Map<string, GooglePlaceSourceData>,
  entities: PlaceEntity[]
): Record<string, GooglePlaceData> {
  const placeMap: Record<string, GooglePlaceData> = {};

  entities.forEach((entity) => {
    // Find matching consolidated data
    for (const [name, data] of google) {
      if (
        name.toLowerCase().includes(entity.name.toLowerCase()) ||
        entity.name.toLowerCase().includes(name.toLowerCase())
      ) {
        placeMap[entity.id] = {
          placeId: data.placeId,
          name: data.name,
          formattedAddress: data.formattedAddress,
          rating: data.rating,
          userRatingsTotal: data.userRatingsTotal,
          priceLevel: data.priceLevel,
          photos: data.photos,
          formattedPhoneNumber: data.formattedPhoneNumber,
          internationalPhoneNumber: data.internationalPhoneNumber,
          website: data.website,
          url: data.url,
          location: data.location,
          openingHours: data.openingHours,
        };
        break;
      }
    }
  });

  return placeMap;
}

/**
 * Convert consolidated Amadeus data back to pipeline format for hotels
 */
function amadeusToHotelMap(
  amadeus: Map<string, AmadeusSourceData>,
  entities: HotelEntity[]
): Record<string, AmadeusHotelData> {
  const hotelMap: Record<string, AmadeusHotelData> = {};

  entities.forEach((entity) => {
    // Find matching consolidated data
    for (const [name, data] of amadeus) {
      if (
        data.type === "hotel" &&
        (name.toLowerCase().includes(entity.name.toLowerCase()) ||
          entity.name.toLowerCase().includes(name.toLowerCase()))
      ) {
        hotelMap[entity.id] = {
          hotelId: data.hotelId || "",
          name: data.hotelName || name,
          price: data.price
            ? { total: data.price.amount, currency: data.price.currency }
            : { total: "0", currency: "USD" },
          rating: data.hotelRating,
          location: data.location
            ? {
                latitude: data.location.latitude,
                longitude: data.location.longitude,
              }
            : undefined,
          amenities: data.hotelAmenities,
          available: data.available !== false,
        };
        break;
      }
    }
  });

  return hotelMap;
}

// ============================================================================
// Main Pipeline Integration
// ============================================================================

/**
 * Enhance the existing pipeline Stage 3 with consolidated API resolution
 * This adds Yelp data and deduplication while maintaining backward compatibility
 */
export async function enhancePipelineWithConsolidation(
  placeEntities: PlaceEntity[],
  hotelEntities: HotelEntity[],
  options: ConsolidationPipelineOptions = {}
): Promise<ConsolidationPipelineResult> {
  const startTime = Date.now();
  const apiStatus = getAPIStatus();

  // Convert entities to concepts
  const placeConcepts = placeEntities.map(placeEntityToConcept);
  const hotelConcepts = hotelEntities.map(hotelEntityToConcept);
  const allConcepts = [...placeConcepts, ...hotelConcepts];

  // Resolve across all APIs
  const resolutionResult = await apiResolutionService.resolveAll(allConcepts, {
    includeGoogle: true,
    includeYelp: options.enableYelp !== false && apiStatus.yelp,
    includeAmadeus: true,
    includeWeather: options.enableWeather && !!options.tripContext?.coordinates,
    weatherCoordinates: options.tripContext?.coordinates,
    tripContext: options.tripContext,
  });

  // Consolidate results
  const consolidationStart = Date.now();
  const consolidationResult = await consolidationService.consolidate(
    allConcepts,
    resolutionResult.results,
    {
      useAI: options.useAIConsolidation || false,
    }
  );
  const consolidationTime = Date.now() - consolidationStart;

  // Convert back to Stage 3 format for backward compatibility
  const stage3Output: Stage3Output = {
    placeMap: googleToPlaceMap(resolutionResult.results.google, placeEntities),
    transportMap: {}, // Transport is handled separately
    hotelMap: amadeusToHotelMap(resolutionResult.results.amadeus, hotelEntities),
    subStages: {
      stage3A: {
        timing: resolutionResult.timing.google,
        count: resolutionResult.results.google.size,
      },
      stage3B: { timing: 0, count: 0 },
      stage3C: {
        timing: resolutionResult.timing.amadeus,
        count: resolutionResult.results.amadeus.size,
      },
    },
  };

  // Cache consolidated places if enabled
  if (options.cacheResults !== false) {
    const cacheManager = getCacheManager();
    for (const place of consolidationResult.places) {
      if (place.coordinates) {
        const key = consolidatedPlaceKey(place.canonicalName, place.coordinates);
        await cacheManager.set(key, place);
      }
    }
  }

  const totalTime = Date.now() - startTime;

  return {
    stage3Output,
    consolidatedPlaces: consolidationResult.places,
    timing: {
      total: totalTime,
      googlePlaces: resolutionResult.timing.google,
      yelp: resolutionResult.timing.yelp,
      amadeus: resolutionResult.timing.amadeus,
      consolidation: consolidationTime,
    },
    stats: {
      totalEntities: allConcepts.length,
      googleResolved: resolutionResult.results.google.size,
      yelpResolved: resolutionResult.results.yelp.size,
      amadeusResolved: resolutionResult.results.amadeus.size,
      consolidatedCount: consolidationResult.places.length,
      deduplicationRate: consolidationResult.deduplicationRate,
    },
  };
}

/**
 * Create enhanced message segments that include consolidated place data
 */
export function createEnhancedSegments(
  originalSegments: MessageSegment[],
  consolidatedPlaces: ConsolidatedPlace[]
): MessageSegment[] {
  // Create a lookup map for consolidated places
  const placeLookup = new Map<string, ConsolidatedPlace>();
  consolidatedPlaces.forEach((place) => {
    placeLookup.set(place.canonicalName.toLowerCase(), place);
    if (place.suggestionContext?.originalName) {
      placeLookup.set(place.suggestionContext.originalName.toLowerCase(), place);
    }
  });

  // Enhance segments with consolidated data
  return originalSegments.map((segment) => {
    if (segment.type === "place" && segment.placeData) {
      const consolidated = placeLookup.get(segment.placeData.name.toLowerCase());
      if (consolidated) {
        return {
          ...segment,
          consolidatedPlace: consolidated,
          hasYelpData: !!consolidated.sources.yelp,
          hasAmadeusData: !!consolidated.sources.amadeus,
          aggregatedRating: consolidated.aggregatedRating,
          totalReviewCount: consolidated.totalReviewCount,
        };
      }
    }
    if (segment.type === "hotel" && segment.hotelData) {
      const consolidated = placeLookup.get(segment.hotelData.name.toLowerCase());
      if (consolidated) {
        return {
          ...segment,
          consolidatedPlace: consolidated,
          hasYelpData: !!consolidated.sources.yelp,
          pricing: consolidated.pricing,
        };
      }
    }
    return segment;
  });
}

// ============================================================================
// Exports
// ============================================================================

export const consolidationPipeline = {
  enhance: enhancePipelineWithConsolidation,
  createEnhancedSegments,
};

export default consolidationPipeline;
