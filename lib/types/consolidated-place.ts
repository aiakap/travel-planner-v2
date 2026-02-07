/**
 * Unified type definitions for consolidated place suggestions
 * This module provides a canonical data structure that can hold data from
 * Google Places, Yelp, Amadeus, and OpenWeather APIs
 */

// ============================================================================
// Place Categories - Unified across all APIs
// ============================================================================

export type PlaceCategory =
  | "restaurant"
  | "hotel"
  | "attraction"
  | "activity"
  | "transport"
  | "shopping"
  | "nightlife"
  | "cafe"
  | "bar";

// Category mapping from different sources
export const CATEGORY_MAPPINGS = {
  // From existing pipeline categories
  fromPipeline: {
    Stay: "hotel" as PlaceCategory,
    Eat: "restaurant" as PlaceCategory,
    Do: "activity" as PlaceCategory,
    Transport: "transport" as PlaceCategory,
  },
  // From Yelp categories
  fromYelp: {
    restaurants: "restaurant" as PlaceCategory,
    bars: "bar" as PlaceCategory,
    nightlife: "nightlife" as PlaceCategory,
    hotels: "hotel" as PlaceCategory,
    tours: "activity" as PlaceCategory,
    shopping: "shopping" as PlaceCategory,
    cafes: "cafe" as PlaceCategory,
    arts: "attraction" as PlaceCategory,
    landmarks: "attraction" as PlaceCategory,
  },
  // From Google Places types
  fromGoogle: {
    restaurant: "restaurant" as PlaceCategory,
    lodging: "hotel" as PlaceCategory,
    tourist_attraction: "attraction" as PlaceCategory,
    museum: "attraction" as PlaceCategory,
    bar: "bar" as PlaceCategory,
    night_club: "nightlife" as PlaceCategory,
    cafe: "cafe" as PlaceCategory,
    shopping_mall: "shopping" as PlaceCategory,
    store: "shopping" as PlaceCategory,
  },
} as const;

// ============================================================================
// Source-Specific Data Interfaces
// ============================================================================

/**
 * Google Places API data
 */
export interface GooglePlaceSourceData {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number; // 0-4
  photos?: Array<{
    reference: string;
    width: number;
    height: number;
    url?: string;
  }>;
  formattedPhoneNumber?: string;
  internationalPhoneNumber?: string;
  website?: string;
  url?: string; // Google Maps link
  location?: {
    lat: number;
    lng: number;
  };
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  editorialSummary?: string;
  types?: string[];
  businessStatus?: string;
  utcOffset?: number;
}

/**
 * Yelp Fusion API data
 */
export interface YelpBusinessSourceData {
  businessId: string;
  alias: string;
  name: string;
  imageUrl?: string;
  isClosed: boolean;
  url: string; // Yelp business page
  reviewCount: number;
  rating: number; // 1-5
  categories: Array<{
    alias: string;
    title: string;
  }>;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  transactions: string[]; // "delivery", "pickup", etc.
  price?: string; // "$", "$$", "$$$", "$$$$"
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zipCode: string;
    country: string;
    state: string;
    displayAddress: string[];
  };
  phone?: string;
  displayPhone?: string;
  distance?: number; // meters
  photos?: string[];
  hours?: Array<{
    hoursType: string;
    isOpenNow: boolean;
    open: Array<{
      day: number;
      start: string;
      end: string;
      isOvernight: boolean;
    }>;
  }>;
}

/**
 * Amadeus API data - for hotels, flights, and activities
 */
export interface AmadeusSourceData {
  type: "hotel" | "flight" | "activity" | "transfer";
  // Hotel-specific
  hotelId?: string;
  hotelName?: string;
  hotelRating?: number;
  hotelAmenities?: string[];
  hotelPhotos?: string[];
  // Activity-specific (Tours & Activities)
  activityId?: string;
  activityName?: string;
  activityDescription?: string;
  activityDuration?: string;
  activityBookingUrl?: string;
  // Common pricing
  price?: {
    amount: string;
    currency: string;
  };
  // Location
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  // Availability
  available?: boolean;
  availabilityDetails?: {
    checkIn?: string;
    checkOut?: string;
    travelers?: number;
  };
  // Flight-specific
  flightOffers?: Array<{
    id: string;
    price: {
      total: string;
      currency: string;
    };
    itineraries: Array<{
      duration: string;
      segments: Array<{
        departure: { iataCode: string; at: string };
        arrival: { iataCode: string; at: string };
        carrierCode: string;
        number: string;
      }>;
    }>;
  }>;
}

/**
 * OpenWeather API data
 */
export interface WeatherSourceData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  precipitation?: number;
  forecast?: Array<{
    date: string;
    tempHigh: number;
    tempLow: number;
    description: string;
    icon: string;
  }>;
}

// ============================================================================
// Consolidated Place Interface - Main Data Structure
// ============================================================================

/**
 * Data quality score for transparency
 */
export interface DataQualityScore {
  overall: number; // 0-100
  freshness: number; // How recent is the data
  completeness: number; // How many fields are filled
  sourceCount: number; // Number of sources contributing
}

/**
 * Pricing information aggregated from sources
 */
export interface PricingInfo {
  priceLevel?: number; // 1-4 normalized
  priceLevelDisplay?: string; // "$", "$$", etc.
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  bookingPrice?: {
    amount: number;
    currency: string;
    source: "amadeus" | "google" | "yelp";
  };
}

/**
 * Availability information
 */
export interface AvailabilityInfo {
  isOpenNow?: boolean;
  nextOpenTime?: string;
  canBook?: boolean;
  bookingUrl?: string;
  bookingSource?: string;
}

/**
 * The main consolidated place interface
 * This is the canonical data structure for all place suggestions
 */
export interface ConsolidatedPlace {
  // Core identification
  id: string; // Generated UUID
  canonicalName: string; // Best name from all sources
  category: PlaceCategory;
  subcategory?: string; // More specific type (e.g., "Italian restaurant")

  // Location - required
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  city?: string;
  country?: string;
  timezone?: string;

  // Aggregated ratings
  aggregatedRating?: number; // Weighted average from all sources
  totalReviewCount?: number; // Sum from all sources
  ratingBreakdown?: {
    google?: { rating: number; count: number };
    yelp?: { rating: number; count: number };
  };

  // Best content from sources
  description?: string; // Best description found
  photos: string[]; // Aggregated and deduplicated photos
  primaryPhoto?: string; // Best photo for card display
  website?: string;
  phone?: string;

  // Source-specific data (preserved for detailed views)
  sources: {
    google?: GooglePlaceSourceData;
    yelp?: YelpBusinessSourceData;
    amadeus?: AmadeusSourceData;
  };

  // Enrichments
  weather?: WeatherSourceData;
  pricing?: PricingInfo;
  availability?: AvailabilityInfo;

  // Metadata
  confidence: number; // 0-1 match confidence score
  lastUpdated: Date;
  dataQuality: DataQualityScore;

  // Original suggestion context (if from AI)
  suggestionContext?: {
    originalName: string;
    searchQuery: string;
    dayNumber?: number;
    timeOfDay?: string;
    notes?: string;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Raw results from parallel API calls before consolidation
 */
export interface RawAPIResults {
  google: Map<string, GooglePlaceSourceData>;
  yelp: Map<string, YelpBusinessSourceData>;
  amadeus: Map<string, AmadeusSourceData>;
  weather?: WeatherSourceData;
  errors: Array<{
    source: "google" | "yelp" | "amadeus" | "weather";
    query: string;
    error: string;
  }>;
  timing: {
    google: number;
    yelp: number;
    amadeus: number;
    weather?: number;
  };
}

/**
 * Place concept from AI generation (Stage 1 output)
 */
export interface PlaceConcept {
  name: string;
  category: PlaceCategory;
  searchHint?: string; // Additional context for search
  location?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  context?: {
    dayNumber?: number;
    timeOfDay?: string;
    notes?: string;
  };
}

/**
 * Consolidated suggestions endpoint response
 */
export interface ConsolidatedSuggestionsResponse {
  success: boolean;
  suggestions: ConsolidatedPlace[];
  meta: {
    query: string;
    totalResults: number;
    sourcesQueried: string[];
    timing: {
      total: number;
      aiGeneration?: number;
      apiResolution?: number;
      consolidation?: number;
      enrichment?: number;
    };
    cacheHit: boolean;
  };
  errors?: Array<{
    source: string;
    message: string;
  }>;
}

/**
 * Request for consolidated suggestions
 */
export interface ConsolidatedSuggestionsRequest {
  query: string;
  location?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  categories?: PlaceCategory[];
  limit?: number;
  tripContext?: {
    tripId?: string;
    segmentId?: string;
    startDate?: string;
    endDate?: string;
  };
  options?: {
    includeWeather?: boolean;
    includePricing?: boolean;
    skipCache?: boolean;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Match result from entity matching
 */
export interface EntityMatch {
  googleId?: string;
  yelpId?: string;
  amadeusId?: string;
  confidence: number;
  matchedBy: ("name" | "coordinates" | "address" | "phone")[];
}

/**
 * Cache entry for consolidated places
 */
export interface ConsolidatedPlaceCacheEntry {
  place: ConsolidatedPlace;
  cachedAt: Date;
  expiresAt: Date;
  cacheKey: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a cache key for a consolidated place
 */
export function generatePlaceCacheKey(
  name: string,
  coordinates: { lat: number; lng: number }
): string {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const coordKey = `${coordinates.lat.toFixed(4)}_${coordinates.lng.toFixed(4)}`;
  return `place:consolidated:${normalizedName}:${coordKey}`;
}

/**
 * Calculate aggregated rating from multiple sources
 */
export function calculateAggregatedRating(
  google?: { rating: number; count: number },
  yelp?: { rating: number; count: number }
): number | undefined {
  const sources: Array<{ rating: number; weight: number }> = [];

  if (google && google.rating > 0) {
    // Google ratings are out of 5, weight by review count
    sources.push({
      rating: google.rating,
      weight: Math.min(google.count, 1000), // Cap weight at 1000
    });
  }

  if (yelp && yelp.rating > 0) {
    // Yelp ratings are out of 5, weight by review count
    sources.push({
      rating: yelp.rating,
      weight: Math.min(yelp.count, 1000),
    });
  }

  if (sources.length === 0) return undefined;

  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = sources.reduce((sum, s) => sum + s.rating * s.weight, 0);

  return Math.round((weightedSum / totalWeight) * 10) / 10; // Round to 1 decimal
}

/**
 * Normalize price level from different sources to 1-4 scale
 */
export function normalizePriceLevel(
  googlePrice?: number, // 0-4
  yelpPrice?: string // "$" to "$$$$"
): number | undefined {
  if (googlePrice !== undefined && googlePrice > 0) {
    return googlePrice;
  }

  if (yelpPrice) {
    return yelpPrice.length; // "$" = 1, "$$" = 2, etc.
  }

  return undefined;
}

/**
 * Calculate data quality score
 */
export function calculateDataQuality(place: Partial<ConsolidatedPlace>): DataQualityScore {
  let completeness = 0;
  const totalFields = 10;

  if (place.canonicalName) completeness++;
  if (place.coordinates) completeness++;
  if (place.formattedAddress) completeness++;
  if (place.aggregatedRating) completeness++;
  if (place.photos && place.photos.length > 0) completeness++;
  if (place.description) completeness++;
  if (place.website) completeness++;
  if (place.phone) completeness++;
  if (place.pricing) completeness++;
  if (place.availability) completeness++;

  const sourceCount = Object.values(place.sources || {}).filter(Boolean).length;

  return {
    overall: Math.round(((completeness / totalFields) * 70 + sourceCount * 10) * 10) / 10,
    freshness: 100, // Will be calculated based on lastUpdated
    completeness: Math.round((completeness / totalFields) * 100),
    sourceCount,
  };
}
