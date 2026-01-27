/**
 * Client-side API response caching for admin demos
 * Reduces redundant API calls during testing
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class APICache {
  private cache: Map<string, CacheEntry<any>>;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
  };

  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  /**
   * Generate cache key from API endpoint and parameters
   */
  private generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(endpoint: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`[API Cache] HIT: ${endpoint}`, params);
    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>,
    ttl: number = 300000 // Default 5 minutes
  ): void {
    const key = this.generateKey(endpoint, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.stats.sets++;
    console.log(`[API Cache] SET: ${endpoint}`, params, `TTL: ${ttl}ms`);
  }

  /**
   * Clear specific cache entry
   */
  clear(endpoint: string, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    this.cache.delete(key);
    console.log(`[API Cache] CLEAR: ${endpoint}`, params);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
    console.log('[API Cache] CLEAR ALL');
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    console.log(`[API Cache] CLEARED ${cleared} expired entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: hitRate.toFixed(1),
      cacheSize: this.cache.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size in bytes (approximate)
   */
  getSizeEstimate(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.data).length;
    }
    return size;
  }
}

// Singleton instance
const apiCache = new APICache();

// Export cache instance and utility functions
export default apiCache;

/**
 * Cached fetch wrapper
 */
export async function cachedFetch<T>(
  endpoint: string,
  options?: RequestInit,
  params?: Record<string, any>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = apiCache.get<T>(endpoint, params);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Store in cache
  apiCache.set(endpoint, data, params, ttl);

  return data as T;
}

/**
 * Preset TTL values for different API types
 */
export const CacheTTL = {
  WEATHER: 600000, // 10 minutes
  RESTAURANTS: 3600000, // 1 hour
  ACTIVITIES: 3600000, // 1 hour
  FLIGHTS: 300000, // 5 minutes
  HOTELS: 600000, // 10 minutes
  PLACES: 86400000, // 24 hours
  STATIC_DATA: 604800000, // 7 days
};

/**
 * Clear cache for specific API type
 */
export function clearCacheByType(type: 'weather' | 'restaurants' | 'activities' | 'flights' | 'hotels' | 'all'): void {
  if (type === 'all') {
    apiCache.clearAll();
    return;
  }

  const keys = apiCache.getKeys();
  const filtered = keys.filter(key => key.includes(type));
  filtered.forEach(key => {
    const [endpoint] = key.split(':');
    apiCache.clear(endpoint);
  });
}

/**
 * Get cache statistics for display
 */
export function getCacheStats() {
  return apiCache.getStats();
}

/**
 * Export cache instance for direct access
 */
export { apiCache };
