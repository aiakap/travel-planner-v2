/**
 * Cache Module Index
 * Exports all cache-related utilities
 */

// Cache Manager
export {
  getCacheManager,
  CacheManager,
  getFromCache,
  setInCache,
  deleteFromCache,
  cacheOrFetch,
  getCacheStats,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
} from "./cache-manager";

// Cache Keys
export {
  cacheKeys,
  CACHE_PREFIXES,
  googlePlaceKey,
  googleSearchKey,
  yelpBusinessKey,
  yelpSearchKey,
  amadeusHotelKey,
  amadeusActivityKey,
  amadeusFlightSearchKey,
  amadeusHotelSearchKey,
  consolidatedPlaceKey,
  consolidatedSuggestionsKey,
  weatherKey,
  weatherForecastKey,
  apiResponseKey,
  parseCacheKey,
  matchesPattern,
} from "./cache-keys";

// Re-export job progress if needed
export * from "./job-progress";
