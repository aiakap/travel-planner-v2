/**
 * AI-Powered Place Consolidation
 * Uses OpenAI to intelligently merge and consolidate place data from multiple sources
 */

import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import type {
  ConsolidatedPlace,
  PlaceConcept,
  RawAPIResults,
  GooglePlaceSourceData,
  YelpBusinessSourceData,
  AmadeusSourceData,
  WeatherSourceData,
  PlaceCategory,
  DataQualityScore,
  PricingInfo,
} from "@/lib/types/consolidated-place";

import {
  calculateAggregatedRating,
  normalizePriceLevel,
  calculateDataQuality,
} from "@/lib/types/consolidated-place";

import {
  entityMatcher,
  type MatchGroup,
} from "@/lib/services/entity-matcher";

// ============================================================================
// Types
// ============================================================================

export interface ConsolidationOptions {
  useAI?: boolean; // Whether to use AI for smart consolidation
  includeDescriptions?: boolean;
  maxDescriptionLength?: number;
}

export interface ConsolidationResult {
  places: ConsolidatedPlace[];
  timing: number;
  aiUsed: boolean;
  matchGroups: number;
  deduplicationRate: number;
}

// ============================================================================
// Zod Schemas for AI Output
// ============================================================================

const ConsolidatedDescriptionSchema = z.object({
  canonicalName: z.string().describe("The best, most accurate name for this place"),
  description: z
    .string()
    .describe(
      "A concise, engaging description combining information from all sources (max 200 words)"
    ),
  highlights: z
    .array(z.string())
    .describe("Key highlights or features of this place (max 5)"),
  bestFor: z
    .array(z.string())
    .describe("What this place is best for (e.g., 'romantic dinner', 'family outing')"),
});

// ============================================================================
// Core Consolidation Functions
// ============================================================================

/**
 * Create a ConsolidatedPlace from matched API data
 */
function createConsolidatedPlace(
  matchGroup: MatchGroup,
  weather?: WeatherSourceData,
  suggestionContext?: PlaceConcept
): ConsolidatedPlace {
  const googleData = matchGroup.candidates.find((c) => c.source === "google")
    ?.data as GooglePlaceSourceData | undefined;
  const yelpData = matchGroup.candidates.find((c) => c.source === "yelp")
    ?.data as YelpBusinessSourceData | undefined;
  const amadeusData = matchGroup.candidates.find((c) => c.source === "amadeus")
    ?.data as AmadeusSourceData | undefined;

  // Determine category
  let category: PlaceCategory = suggestionContext?.category || "attraction";
  if (yelpData?.categories?.length) {
    const yelpCategory = yelpData.categories[0].alias;
    if (yelpCategory.includes("restaurant") || yelpCategory.includes("food")) {
      category = "restaurant";
    } else if (yelpCategory.includes("hotel")) {
      category = "hotel";
    } else if (yelpCategory.includes("bar")) {
      category = "bar";
    }
  }

  // Get coordinates
  const coordinates = matchGroup.bestCoordinates || {
    lat: 0,
    lng: 0,
  };

  // Aggregate ratings
  const googleRating = googleData?.rating
    ? { rating: googleData.rating, count: googleData.userRatingsTotal || 0 }
    : undefined;
  const yelpRating = yelpData
    ? { rating: yelpData.rating, count: yelpData.reviewCount }
    : undefined;

  const aggregatedRating = calculateAggregatedRating(googleRating, yelpRating);
  const totalReviewCount =
    (googleData?.userRatingsTotal || 0) + (yelpData?.reviewCount || 0);

  // Aggregate photos
  const photos: string[] = [];

  // Add Google photos
  if (googleData?.photos) {
    googleData.photos.forEach((photo) => {
      if (photo.url) photos.push(photo.url);
    });
  }

  // Add Yelp photos
  if (yelpData?.imageUrl) {
    photos.push(yelpData.imageUrl);
  }
  if (yelpData?.photos) {
    yelpData.photos.forEach((url) => photos.push(url));
  }

  // Add Amadeus photos
  if (amadeusData?.hotelPhotos) {
    amadeusData.hotelPhotos.forEach((url) => photos.push(url));
  }

  // Normalize pricing
  const priceLevel = normalizePriceLevel(
    googleData?.priceLevel,
    yelpData?.price
  );

  const pricing: PricingInfo | undefined = priceLevel
    ? {
        priceLevel,
        priceLevelDisplay: "$".repeat(priceLevel),
      }
    : amadeusData?.price
      ? {
          bookingPrice: {
            amount: parseFloat(amadeusData.price.amount),
            currency: amadeusData.price.currency,
            source: "amadeus",
          },
        }
      : undefined;

  // Build the consolidated place
  const place: ConsolidatedPlace = {
    id: uuidv4(),
    canonicalName: matchGroup.bestName,
    category,
    subcategory:
      yelpData?.categories?.[0]?.title ||
      googleData?.types?.[0]?.replace(/_/g, " "),
    coordinates,
    formattedAddress:
      googleData?.formattedAddress ||
      yelpData?.location?.displayAddress?.join(", ") ||
      amadeusData?.address ||
      "",
    city: yelpData?.location?.city,
    country: yelpData?.location?.country,
    aggregatedRating,
    totalReviewCount,
    ratingBreakdown: {
      google: googleRating,
      yelp: yelpRating,
    },
    description:
      googleData?.editorialSummary ||
      amadeusData?.activityDescription,
    photos,
    primaryPhoto: photos[0],
    website: googleData?.website || yelpData?.url,
    phone:
      googleData?.formattedPhoneNumber ||
      googleData?.internationalPhoneNumber ||
      yelpData?.displayPhone,
    sources: {
      google: googleData,
      yelp: yelpData,
      amadeus: amadeusData,
    },
    weather,
    pricing,
    availability: {
      isOpenNow: googleData?.openingHours?.openNow || yelpData?.hours?.[0]?.isOpenNow,
      canBook: !!amadeusData?.activityBookingUrl || !!yelpData?.transactions?.includes("restaurant_reservation"),
      bookingUrl: amadeusData?.activityBookingUrl || yelpData?.url,
      bookingSource: amadeusData?.activityBookingUrl ? "amadeus" : yelpData ? "yelp" : undefined,
    },
    confidence: matchGroup.matches.confidence,
    lastUpdated: new Date(),
    dataQuality: { overall: 0, freshness: 100, completeness: 0, sourceCount: 0 },
    suggestionContext: suggestionContext
      ? {
          originalName: suggestionContext.name,
          searchQuery: suggestionContext.searchHint || suggestionContext.name,
          dayNumber: suggestionContext.context?.dayNumber,
          timeOfDay: suggestionContext.context?.timeOfDay,
          notes: suggestionContext.context?.notes,
        }
      : undefined,
  };

  // Calculate data quality
  place.dataQuality = calculateDataQuality(place);

  return place;
}

/**
 * Use AI to enhance place descriptions
 */
async function enhanceWithAI(
  place: ConsolidatedPlace,
  options: ConsolidationOptions = {}
): Promise<ConsolidatedPlace> {
  const maxLength = options.maxDescriptionLength || 200;

  try {
    // Build context for AI
    const sourceInfo: string[] = [];

    if (place.sources.google) {
      sourceInfo.push(
        `Google Places: ${place.sources.google.name}, Rating: ${place.sources.google.rating}/5 (${place.sources.google.userRatingsTotal} reviews)`
      );
      if (place.sources.google.editorialSummary) {
        sourceInfo.push(`Description: ${place.sources.google.editorialSummary}`);
      }
    }

    if (place.sources.yelp) {
      sourceInfo.push(
        `Yelp: ${place.sources.yelp.name}, Rating: ${place.sources.yelp.rating}/5 (${place.sources.yelp.reviewCount} reviews), Price: ${place.sources.yelp.price || "N/A"}`
      );
      sourceInfo.push(
        `Categories: ${place.sources.yelp.categories.map((c) => c.title).join(", ")}`
      );
    }

    if (place.sources.amadeus) {
      if (place.sources.amadeus.activityDescription) {
        sourceInfo.push(
          `Amadeus Activity: ${place.sources.amadeus.activityName}`
        );
        sourceInfo.push(`Description: ${place.sources.amadeus.activityDescription}`);
      }
      if (place.sources.amadeus.hotelName) {
        sourceInfo.push(
          `Amadeus Hotel: ${place.sources.amadeus.hotelName}, Rating: ${place.sources.amadeus.hotelRating || "N/A"}`
        );
      }
    }

    if (sourceInfo.length === 0) {
      return place;
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ConsolidatedDescriptionSchema,
      prompt: `You are helping consolidate information about a place from multiple sources.

Source Data:
${sourceInfo.join("\n")}

Address: ${place.formattedAddress}
Category: ${place.category}

Please provide:
1. The best canonical name for this place (fix any spelling issues, use proper capitalization)
2. A concise, engaging description (max ${maxLength} words) that combines the best information from all sources
3. Key highlights (max 5)
4. What this place is best for (max 3 suggestions)

Be accurate and don't make up information that isn't in the source data.`,
    });

    // Update place with AI-enhanced content
    return {
      ...place,
      canonicalName: result.object.canonicalName || place.canonicalName,
      description: result.object.description || place.description,
    };
  } catch (error) {
    console.error("[ConsolidatePlaces] AI enhancement failed:", error);
    return place;
  }
}

// ============================================================================
// Main Consolidation Function
// ============================================================================

/**
 * Consolidate places from multiple API sources
 */
export async function consolidatePlaces(
  concepts: PlaceConcept[],
  rawResults: RawAPIResults,
  options: ConsolidationOptions = {}
): Promise<ConsolidationResult> {
  const startTime = Date.now();

  // Match entities across sources
  const matchGroups = entityMatcher.matchEntities(
    rawResults.google,
    rawResults.yelp,
    rawResults.amadeus
  );

  // Create concept lookup for context
  const conceptLookup = new Map<string, PlaceConcept>();
  concepts.forEach((c) => {
    conceptLookup.set(c.name.toLowerCase(), c);
  });

  // Create consolidated places from match groups
  let places: ConsolidatedPlace[] = matchGroups.map((group) => {
    // Find the matching concept
    let concept: PlaceConcept | undefined;
    for (const candidate of group.candidates) {
      const name = candidate.name.toLowerCase();
      if (conceptLookup.has(name)) {
        concept = conceptLookup.get(name);
        break;
      }
      // Try fuzzy match
      for (const [key, c] of conceptLookup) {
        if (entityMatcher.namesMatch(name, key, 0.8)) {
          concept = c;
          break;
        }
      }
      if (concept) break;
    }

    return createConsolidatedPlace(group, rawResults.weather, concept);
  });

  // Optionally enhance with AI
  if (options.useAI && places.length > 0) {
    const enhancedPlaces = await Promise.all(
      places.map((place) => enhanceWithAI(place, options))
    );
    places = enhancedPlaces;
  }

  // Calculate deduplication rate
  const totalSourceEntities =
    rawResults.google.size + rawResults.yelp.size + rawResults.amadeus.size;
  const deduplicationRate =
    totalSourceEntities > 0
      ? 1 - places.length / totalSourceEntities
      : 0;

  return {
    places,
    timing: Date.now() - startTime,
    aiUsed: options.useAI || false,
    matchGroups: matchGroups.length,
    deduplicationRate: Math.round(deduplicationRate * 100) / 100,
  };
}

/**
 * Consolidate a single place from API data
 */
export async function consolidateSinglePlace(
  concept: PlaceConcept,
  google?: GooglePlaceSourceData,
  yelp?: YelpBusinessSourceData,
  amadeus?: AmadeusSourceData,
  weather?: WeatherSourceData,
  options: ConsolidationOptions = {}
): Promise<ConsolidatedPlace> {
  // Create a match group manually
  const candidates: MatchGroup["candidates"] = [];

  if (google) {
    candidates.push({
      source: "google",
      id: google.placeId,
      name: google.name,
      coordinates: google.location,
      address: google.formattedAddress,
      phone: google.formattedPhoneNumber,
      data: google,
    });
  }

  if (yelp) {
    candidates.push({
      source: "yelp",
      id: yelp.businessId,
      name: yelp.name,
      coordinates: {
        lat: yelp.coordinates.latitude,
        lng: yelp.coordinates.longitude,
      },
      address: yelp.location.displayAddress.join(", "),
      phone: yelp.phone,
      data: yelp,
    });
  }

  if (amadeus) {
    candidates.push({
      source: "amadeus",
      id: amadeus.hotelId || amadeus.activityId || "",
      name: amadeus.hotelName || amadeus.activityName || "",
      coordinates: amadeus.location
        ? { lat: amadeus.location.latitude, lng: amadeus.location.longitude }
        : undefined,
      address: amadeus.address,
      data: amadeus,
    });
  }

  const matchGroup: MatchGroup = {
    matches: {
      googleId: google?.placeId,
      yelpId: yelp?.businessId,
      amadeusId: amadeus?.hotelId || amadeus?.activityId,
      confidence: candidates.length > 1 ? 0.9 : 1,
      matchedBy: ["name"],
    },
    candidates,
    bestName: google?.name || yelp?.name || amadeus?.hotelName || amadeus?.activityName || concept.name,
    bestCoordinates:
      google?.location ||
      (yelp
        ? { lat: yelp.coordinates.latitude, lng: yelp.coordinates.longitude }
        : amadeus?.location
          ? { lat: amadeus.location.latitude, lng: amadeus.location.longitude }
          : undefined),
  };

  let place = createConsolidatedPlace(matchGroup, weather, concept);

  if (options.useAI) {
    place = await enhanceWithAI(place, options);
  }

  return place;
}

// ============================================================================
// Exports
// ============================================================================

export const consolidationService = {
  consolidate: consolidatePlaces,
  consolidateSingle: consolidateSinglePlace,
};

export default consolidationService;
