/**
 * Centralized Rate Limiter
 * Per-API rate limiting with queuing and configurable limits
 */

// ============================================================================
// Types
// ============================================================================

export interface RateLimiterConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
  queueEnabled?: boolean; // Whether to queue exceeded requests
  maxQueueSize?: number; // Max queue size before rejecting
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number; // Unix timestamp when window resets
  queuePosition?: number; // If queued, position in queue
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_CONFIGS: Record<string, RateLimiterConfig> = {
  google: {
    maxRequests: parseInt(process.env.API_RATE_LIMIT_GOOGLE || "100"),
    windowMs: 60 * 1000, // 1 minute
    queueEnabled: true,
    maxQueueSize: 50,
  },
  yelp: {
    maxRequests: parseInt(process.env.API_RATE_LIMIT_YELP || "50"),
    windowMs: 60 * 1000,
    queueEnabled: true,
    maxQueueSize: 30,
  },
  amadeus: {
    maxRequests: parseInt(process.env.API_RATE_LIMIT_AMADEUS || "60"),
    windowMs: 60 * 1000,
    queueEnabled: true,
    maxQueueSize: 40,
  },
  weather: {
    maxRequests: parseInt(process.env.API_RATE_LIMIT_WEATHER || "60"),
    windowMs: 60 * 1000,
    queueEnabled: true,
    maxQueueSize: 20,
  },
  openai: {
    maxRequests: parseInt(process.env.API_RATE_LIMIT_OPENAI || "20"),
    windowMs: 60 * 1000,
    queueEnabled: true,
    maxQueueSize: 100,
  },
};

// ============================================================================
// Rate Limiter Class
// ============================================================================

interface RequestRecord {
  timestamp: number;
}

interface QueuedRequest {
  id: string;
  resolve: (allowed: boolean) => void;
  addedAt: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private queues: Map<string, QueuedRequest[]> = new Map();
  private configs: Map<string, RateLimiterConfig> = new Map();
  private processingQueues: Set<string> = new Set();

  constructor() {
    // Initialize with default configs
    Object.entries(DEFAULT_CONFIGS).forEach(([api, config]) => {
      this.configs.set(api, config);
    });
  }

  /**
   * Set configuration for an API
   */
  setConfig(api: string, config: Partial<RateLimiterConfig>): void {
    const existing = this.configs.get(api) || DEFAULT_CONFIGS.google;
    this.configs.set(api, { ...existing, ...config });
  }

  /**
   * Get configuration for an API
   */
  getConfig(api: string): RateLimiterConfig {
    return this.configs.get(api) || DEFAULT_CONFIGS.google;
  }

  /**
   * Check if a request is allowed (non-blocking)
   */
  checkLimit(api: string): RateLimitResult {
    const config = this.getConfig(api);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this API
    const apiRequests = this.requests.get(api) || [];

    // Filter to only requests within the current window
    const validRequests = apiRequests.filter((r) => r.timestamp > windowStart);

    const allowed = validRequests.length < config.maxRequests;
    const resetTime = validRequests.length > 0
      ? validRequests[0].timestamp + config.windowMs
      : now + config.windowMs;

    return {
      allowed,
      remainingRequests: Math.max(0, config.maxRequests - validRequests.length),
      resetTime,
    };
  }

  /**
   * Record a request (call after making the API call)
   */
  recordRequest(api: string): void {
    const config = this.getConfig(api);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests and filter old ones
    const apiRequests = this.requests.get(api) || [];
    const validRequests = apiRequests.filter((r) => r.timestamp > windowStart);

    // Add new request
    validRequests.push({ timestamp: now });
    this.requests.set(api, validRequests);

    // Process queue if there are waiting requests
    this.processQueue(api);
  }

  /**
   * Acquire permission to make a request (with optional queuing)
   * Returns a promise that resolves when the request can be made
   */
  async acquire(api: string): Promise<boolean> {
    const config = this.getConfig(api);
    const check = this.checkLimit(api);

    if (check.allowed) {
      return true;
    }

    // If queuing is not enabled, reject immediately
    if (!config.queueEnabled) {
      return false;
    }

    // Check queue size
    const queue = this.queues.get(api) || [];
    if (config.maxQueueSize && queue.length >= config.maxQueueSize) {
      console.warn(
        `[RateLimiter] Queue full for ${api}, rejecting request`
      );
      return false;
    }

    // Add to queue
    return new Promise<boolean>((resolve) => {
      const queuedRequest: QueuedRequest = {
        id: `${api}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        resolve,
        addedAt: Date.now(),
      };

      const currentQueue = this.queues.get(api) || [];
      currentQueue.push(queuedRequest);
      this.queues.set(api, currentQueue);

      console.log(
        `[RateLimiter] Request queued for ${api}, position: ${currentQueue.length}`
      );

      // Start processing queue if not already processing
      this.processQueue(api);
    });
  }

  /**
   * Process queued requests for an API
   */
  private async processQueue(api: string): Promise<void> {
    // Prevent concurrent processing
    if (this.processingQueues.has(api)) {
      return;
    }

    const queue = this.queues.get(api);
    if (!queue || queue.length === 0) {
      return;
    }

    this.processingQueues.add(api);

    try {
      while (queue.length > 0) {
        const check = this.checkLimit(api);

        if (check.allowed) {
          // Allow the next request
          const request = queue.shift();
          if (request) {
            request.resolve(true);
          }
        } else {
          // Wait until the window resets
          const waitTime = check.resetTime - Date.now();
          if (waitTime > 0) {
            await new Promise((r) => setTimeout(r, Math.min(waitTime, 1000)));
          }
        }
      }
    } finally {
      this.processingQueues.delete(api);
    }
  }

  /**
   * Execute a function with rate limiting
   */
  async withRateLimit<T>(
    api: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const allowed = await this.acquire(api);

    if (!allowed) {
      throw new Error(`Rate limit exceeded for ${api}`);
    }

    try {
      const result = await fn();
      this.recordRequest(api);
      return result;
    } catch (error) {
      // Still record the request even if it failed
      this.recordRequest(api);
      throw error;
    }
  }

  /**
   * Get current rate limit status for all APIs
   */
  getStatus(): Record<string, RateLimitResult & { queueSize: number }> {
    const status: Record<string, RateLimitResult & { queueSize: number }> = {};

    this.configs.forEach((_, api) => {
      const check = this.checkLimit(api);
      const queue = this.queues.get(api) || [];
      status[api] = {
        ...check,
        queueSize: queue.length,
      };
    });

    return status;
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.requests.clear();
    this.queues.clear();
    this.processingQueues.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check if a request to an API is allowed
 */
export function checkRateLimit(api: string): RateLimitResult {
  return getRateLimiter().checkLimit(api);
}

/**
 * Record that a request was made to an API
 */
export function recordRequest(api: string): void {
  getRateLimiter().recordRequest(api);
}

/**
 * Acquire permission to make a request (with queuing)
 */
export async function acquireRateLimit(api: string): Promise<boolean> {
  return getRateLimiter().acquire(api);
}

/**
 * Execute a function with rate limiting
 */
export async function withRateLimit<T>(
  api: string,
  fn: () => Promise<T>
): Promise<T> {
  return getRateLimiter().withRateLimit(api, fn);
}

/**
 * Get rate limit status for all APIs
 */
export function getRateLimitStatus(): Record<
  string,
  RateLimitResult & { queueSize: number }
> {
  return getRateLimiter().getStatus();
}

/**
 * Set rate limit configuration for an API
 */
export function setRateLimitConfig(
  api: string,
  config: Partial<RateLimiterConfig>
): void {
  getRateLimiter().setConfig(api, config);
}

// ============================================================================
// Decorator-style helper for class methods
// ============================================================================

/**
 * Create a rate-limited version of an async function
 */
export function rateLimited<T extends (...args: any[]) => Promise<any>>(
  api: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    return withRateLimit(api, () => fn(...args));
  }) as T;
}

// ============================================================================
// Exports
// ============================================================================

export { RateLimiter };
export default getRateLimiter;
