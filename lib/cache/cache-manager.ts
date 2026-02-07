/**
 * Multi-Level Cache Manager
 * Provides L1 (in-memory), L2 (Redis/Upstash), and L3 (Database) caching
 */

import type { ConsolidatedPlace } from "@/lib/types/consolidated-place";

// ============================================================================
// Types
// ============================================================================

export interface CacheConfig {
  l1TTL: number; // In-memory TTL in seconds (default: 300 = 5 min)
  l2TTL: number; // Redis TTL in seconds (default: 3600 = 1 hour)
  l3TTL: number; // Database TTL in seconds (default: 86400 = 24 hours)
  maxL1Size: number; // Max items in L1 cache (default: 1000)
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  source: "l1" | "l2" | "l3";
}

export interface CacheStats {
  l1Size: number;
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  l3Hits: number;
  l3Misses: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  l1TTL: 300, // 5 minutes
  l2TTL: 3600, // 1 hour
  l3TTL: 86400, // 24 hours
  maxL1Size: 1000,
};

// ============================================================================
// L1 Cache (In-Memory)
// ============================================================================

class L1Cache {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private maxSize: number;
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number, ttlSeconds: number) {
    this.maxSize = maxSize;
    this.ttl = ttlSeconds * 1000; // Convert to ms

    // Cleanup expired entries every minute
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

// ============================================================================
// L2 Cache (Redis/Upstash - Placeholder)
// ============================================================================

class L2Cache {
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;
  private enabled: boolean = false;

  constructor(ttlSeconds: number) {
    this.ttl = ttlSeconds;
    // Check if Redis is configured
    this.enabled = !!process.env.REDIS_URL;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // TODO: Implement Redis/Upstash integration
      // For now, this is a placeholder
      // const redis = getRedisClient();
      // const data = await redis.get(key);
      // if (data) {
      //   this.hits++;
      //   return JSON.parse(data) as T;
      // }
      this.misses++;
      return null;
    } catch (error) {
      console.error("[L2Cache] Error getting key:", key, error);
      this.misses++;
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // TODO: Implement Redis/Upstash integration
      // const redis = getRedisClient();
      // await redis.setex(key, this.ttl, JSON.stringify(data));
    } catch (error) {
      console.error("[L2Cache] Error setting key:", key, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // TODO: Implement Redis/Upstash integration
      // const redis = getRedisClient();
      // await redis.del(key);
    } catch (error) {
      console.error("[L2Cache] Error deleting key:", key, error);
    }
  }

  getStats(): { hits: number; misses: number } {
    return {
      hits: this.hits,
      misses: this.misses,
    };
  }
}

// ============================================================================
// L3 Cache (Database - Placeholder)
// ============================================================================

class L3Cache {
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(ttlSeconds: number) {
    this.ttl = ttlSeconds;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // TODO: Implement database caching
      // This would use Prisma to store cached data
      // const { prisma } = await import("@/lib/prisma");
      // const entry = await prisma.cacheEntry.findUnique({
      //   where: { key },
      // });
      // if (entry && new Date() < entry.expiresAt) {
      //   this.hits++;
      //   return JSON.parse(entry.data) as T;
      // }
      this.misses++;
      return null;
    } catch (error) {
      console.error("[L3Cache] Error getting key:", key, error);
      this.misses++;
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    try {
      // TODO: Implement database caching
      // const { prisma } = await import("@/lib/prisma");
      // await prisma.cacheEntry.upsert({
      //   where: { key },
      //   create: {
      //     key,
      //     data: JSON.stringify(data),
      //     expiresAt: new Date(Date.now() + this.ttl * 1000),
      //   },
      //   update: {
      //     data: JSON.stringify(data),
      //     expiresAt: new Date(Date.now() + this.ttl * 1000),
      //   },
      // });
    } catch (error) {
      console.error("[L3Cache] Error setting key:", key, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // TODO: Implement database caching
      // const { prisma } = await import("@/lib/prisma");
      // await prisma.cacheEntry.delete({ where: { key } });
    } catch (error) {
      console.error("[L3Cache] Error deleting key:", key, error);
    }
  }

  getStats(): { hits: number; misses: number } {
    return {
      hits: this.hits,
      misses: this.misses,
    };
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  private config: CacheConfig;
  private l1: L1Cache;
  private l2: L2Cache;
  private l3: L3Cache;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.l1 = new L1Cache(this.config.maxL1Size, this.config.l1TTL);
    this.l2 = new L2Cache(this.config.l2TTL);
    this.l3 = new L3Cache(this.config.l3TTL);
  }

  /**
   * Get a value from cache, checking L1 -> L2 -> L3
   */
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    // Try L1 first
    const l1Data = this.l1.get<T>(key);
    if (l1Data !== null) {
      return {
        data: l1Data,
        cachedAt: 0, // Not tracked in L1
        expiresAt: Date.now() + this.config.l1TTL * 1000,
        source: "l1",
      };
    }

    // Try L2
    const l2Data = await this.l2.get<T>(key);
    if (l2Data !== null) {
      // Promote to L1
      this.l1.set(key, l2Data);
      return {
        data: l2Data,
        cachedAt: 0,
        expiresAt: Date.now() + this.config.l2TTL * 1000,
        source: "l2",
      };
    }

    // Try L3
    const l3Data = await this.l3.get<T>(key);
    if (l3Data !== null) {
      // Promote to L1 and L2
      this.l1.set(key, l3Data);
      await this.l2.set(key, l3Data);
      return {
        data: l3Data,
        cachedAt: 0,
        expiresAt: Date.now() + this.config.l3TTL * 1000,
        source: "l3",
      };
    }

    return null;
  }

  /**
   * Set a value in all cache levels
   */
  async set<T>(key: string, data: T): Promise<void> {
    this.l1.set(key, data);
    await Promise.all([this.l2.set(key, data), this.l3.set(key, data)]);
  }

  /**
   * Delete a value from all cache levels
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    await Promise.all([this.l2.delete(key), this.l3.delete(key)]);
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.l1.clear();
    // L2 and L3 clear not implemented for safety
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const l1Stats = this.l1.getStats();
    const l2Stats = this.l2.getStats();
    const l3Stats = this.l3.getStats();

    return {
      l1Size: l1Stats.size,
      l1Hits: l1Stats.hits,
      l1Misses: l1Stats.misses,
      l2Hits: l2Stats.hits,
      l2Misses: l2Stats.misses,
      l3Hits: l3Stats.hits,
      l3Misses: l3Stats.misses,
    };
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached.data;
    }

    const data = await factory();
    await this.set(key, data);
    return data;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get a cached value
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  const entry = await getCacheManager().get<T>(key);
  return entry?.data || null;
}

/**
 * Set a cached value
 */
export async function setInCache<T>(key: string, data: T): Promise<void> {
  await getCacheManager().set(key, data);
}

/**
 * Delete a cached value
 */
export async function deleteFromCache(key: string): Promise<void> {
  await getCacheManager().delete(key);
}

/**
 * Get or set with factory
 */
export async function cacheOrFetch<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  return getCacheManager().getOrSet(key, factory);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return getCacheManager().getStats();
}

// ============================================================================
// Exports
// ============================================================================

export { CacheManager };
export default getCacheManager;
