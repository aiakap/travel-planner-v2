/**
 * Cache Key Generators
 * Standardized cache key patterns for different data types
 */

// ============================================================================
// Key Prefixes
// ============================================================================

export const CACHE_PREFIXES = {
  GOOGLE_PLACE: "place:google",
  YELP_BUSINESS: "place:yelp",
  AMADEUS_DATA: "place:amadeus",
  CONSOLIDATED: "place:consolidated",
  WEATHER: "weather",
  SUGGESTIONS: "suggestions",
  API_RESPONSE: "api",
} as const;

// ============================================================================
// Google Places Keys
// ============================================================================

/**
 * Generate cache key for a Google Place by place ID
 */
export function googlePlaceKey(placeId: string): string {
  return `${CACHE_PREFIXES.GOOGLE_PLACE}:${placeId}`;
}

/**
 * Generate cache key for a Google Places search
 */
export function googleSearchKey(query: string, location?: string): string {
  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const normalizedLocation = location
    ? `:${location.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
    : "";
  return `${CACHE_PREFIXES.GOOGLE_PLACE}:search:${normalizedQuery}${normalizedLocation}`;
}

// ============================================================================
// Yelp Keys
// ============================================================================

/**
 * Generate cache key for a Yelp business by ID
 */
export function yelpBusinessKey(businessId: string): string {
  return `${CACHE_PREFIXES.YELP_BUSINESS}:${businessId}`;
}

/**
 * Generate cache key for a Yelp search
 */
export function yelpSearchKey(
  term: string,
  location: string,
  category?: string
): string {
  const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const normalizedLocation = location.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const categoryPart = category
    ? `:${category.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
    : "";
  return `${CACHE_PREFIXES.YELP_BUSINESS}:search:${normalizedTerm}:${normalizedLocation}${categoryPart}`;
}

// ============================================================================
// Amadeus Keys
// ============================================================================

/**
 * Generate cache key for an Amadeus hotel offer
 */
export function amadeusHotelKey(hotelId: string): string {
  return `${CACHE_PREFIXES.AMADEUS_DATA}:hotel:${hotelId}`;
}

/**
 * Generate cache key for an Amadeus activity
 */
export function amadeusActivityKey(activityId: string): string {
  return `${CACHE_PREFIXES.AMADEUS_DATA}:activity:${activityId}`;
}

/**
 * Generate cache key for an Amadeus flight search
 */
export function amadeusFlightSearchKey(
  origin: string,
  destination: string,
  date: string
): string {
  return `${CACHE_PREFIXES.AMADEUS_DATA}:flight:${origin}:${destination}:${date}`;
}

/**
 * Generate cache key for Amadeus hotels by location
 */
export function amadeusHotelSearchKey(
  lat: number,
  lng: number,
  checkIn: string,
  checkOut: string
): string {
  const latKey = lat.toFixed(2);
  const lngKey = lng.toFixed(2);
  return `${CACHE_PREFIXES.AMADEUS_DATA}:hotels:${latKey}:${lngKey}:${checkIn}:${checkOut}`;
}

// ============================================================================
// Consolidated Place Keys
// ============================================================================

/**
 * Generate cache key for a consolidated place
 */
export function consolidatedPlaceKey(
  name: string,
  coordinates: { lat: number; lng: number }
): string {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const coordKey = `${coordinates.lat.toFixed(4)}_${coordinates.lng.toFixed(4)}`;
  return `${CACHE_PREFIXES.CONSOLIDATED}:${normalizedName}:${coordKey}`;
}

/**
 * Generate cache key for consolidated suggestions query
 */
export function consolidatedSuggestionsKey(
  query: string,
  location?: string
): string {
  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const locationPart = location
    ? `:${location.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
    : "";
  return `${CACHE_PREFIXES.SUGGESTIONS}:consolidated:${normalizedQuery}${locationPart}`;
}

// ============================================================================
// Weather Keys
// ============================================================================

/**
 * Generate cache key for weather data
 */
export function weatherKey(
  lat: number,
  lng: number,
  date?: string
): string {
  const latKey = lat.toFixed(2);
  const lngKey = lng.toFixed(2);
  const datePart = date ? `:${date}` : "";
  return `${CACHE_PREFIXES.WEATHER}:${latKey}:${lngKey}${datePart}`;
}

/**
 * Generate cache key for weather forecast
 */
export function weatherForecastKey(
  lat: number,
  lng: number
): string {
  const latKey = lat.toFixed(2);
  const lngKey = lng.toFixed(2);
  return `${CACHE_PREFIXES.WEATHER}:forecast:${latKey}:${lngKey}`;
}

// ============================================================================
// API Response Keys
// ============================================================================

/**
 * Generate cache key for a generic API response
 */
export function apiResponseKey(
  api: string,
  endpoint: string,
  params: Record<string, string | number | boolean>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const hash = simpleHash(sortedParams);
  return `${CACHE_PREFIXES.API_RESPONSE}:${api}:${endpoint}:${hash}`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parse a cache key to extract its components
 */
export function parseCacheKey(key: string): {
  prefix: string;
  type: string;
  id: string;
} {
  const parts = key.split(":");
  return {
    prefix: parts[0] || "",
    type: parts[1] || "",
    id: parts.slice(2).join(":") || "",
  };
}

/**
 * Check if a cache key matches a pattern
 */
export function matchesPattern(key: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${regexPattern}$`).test(key);
}

// ============================================================================
// Exports
// ============================================================================

export const cacheKeys = {
  google: {
    place: googlePlaceKey,
    search: googleSearchKey,
  },
  yelp: {
    business: yelpBusinessKey,
    search: yelpSearchKey,
  },
  amadeus: {
    hotel: amadeusHotelKey,
    activity: amadeusActivityKey,
    flightSearch: amadeusFlightSearchKey,
    hotelSearch: amadeusHotelSearchKey,
  },
  consolidated: {
    place: consolidatedPlaceKey,
    suggestions: consolidatedSuggestionsKey,
  },
  weather: {
    current: weatherKey,
    forecast: weatherForecastKey,
  },
  api: apiResponseKey,
  parse: parseCacheKey,
  matches: matchesPattern,
};

export default cacheKeys;
