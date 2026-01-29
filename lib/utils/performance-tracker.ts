// Only import async_hooks on server-side
let AsyncLocalStorage: any;
if (typeof window === 'undefined') {
  AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;
}

// Lazy import prisma to avoid circular dependency
let prisma: any;

// Types for performance tracking
interface QueryMetric {
  model: string;
  action: string;
  duration: number;
  timestamp: number;
}

interface ExternalApiMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface PerformanceContext {
  pathname: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  startTime: number;
  queries: QueryMetric[];
  externalApis: ExternalApiMetric[];
}

// AsyncLocalStorage for tracking context across async operations
const performanceStorage = typeof window === 'undefined' && AsyncLocalStorage 
  ? new AsyncLocalStorage<PerformanceContext>() 
  : null;

// Configuration with runtime safety checks
const config = {
  enabled: typeof process !== 'undefined' && process.env.PERFORMANCE_TRACKING_ENABLED === 'true',
  sampleRate: typeof process !== 'undefined' ? parseFloat(process.env.PERFORMANCE_SAMPLE_RATE || '1.0') : 0,
  logQueries: typeof process !== 'undefined' && process.env.PERFORMANCE_LOG_QUERIES === 'true',
  canTrack: typeof window === 'undefined' && performanceStorage !== null,
};

/**
 * Check if we should track this request based on sample rate
 */
function shouldTrack(): boolean {
  if (!config.enabled || !config.canTrack) return false;
  if (config.sampleRate >= 1.0) return true;
  return Math.random() < config.sampleRate;
}

/**
 * Start tracking performance for a request
 */
export function startTracking(options: {
  pathname: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
}): void {
  if (!shouldTrack() || !performanceStorage) return;

  const context: PerformanceContext = {
    pathname: options.pathname,
    userId: options.userId,
    sessionId: options.sessionId,
    userAgent: options.userAgent,
    startTime: performance.now(),
    queries: [],
    externalApis: [],
  };

  performanceStorage.enterWith(context);
}

/**
 * Track a database query
 */
export function trackQuery(model: string, action: string, duration: number): void {
  if (!config.logQueries || !performanceStorage) return;
  
  const context = performanceStorage.getStore();
  if (!context) return;

  context.queries.push({
    model,
    action,
    duration,
    timestamp: performance.now(),
  });
}

/**
 * Track an external API call
 */
export function trackExternalApi(name: string, duration: number): void {
  if (!performanceStorage) return;
  const context = performanceStorage.getStore();
  if (!context) return;

  context.externalApis.push({
    name,
    duration,
    timestamp: performance.now(),
  });
}

/**
 * Wrap an external API call with tracking
 */
export async function trackApiCall<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    trackExternalApi(name, duration);
  }
}

/**
 * Get current tracking context (for debugging)
 */
export function getTrackingContext(): PerformanceContext | undefined {
  if (!performanceStorage) return undefined;
  return performanceStorage.getStore();
}

/**
 * End tracking and log metrics to database
 */
export async function endTracking(): Promise<void> {
  if (!performanceStorage) return;
  const context = performanceStorage.getStore();
  if (!context) return;

  try {
    // Lazy load prisma only when needed
    if (!prisma) {
      const { prisma: prismaInstance } = await import('@/lib/prisma');
      prisma = prismaInstance;
    }

    const endTime = performance.now();
    const totalLoadTime = Math.round(endTime - context.startTime);

    // Calculate aggregated metrics
    const databaseQueryTime = context.queries.reduce(
      (sum, q) => sum + q.duration,
      0
    );
    const externalApiTime = context.externalApis.reduce(
      (sum, api) => sum + api.duration,
      0
    );

    // Prepare query details for JSON storage
    const queryDetails = config.logQueries
      ? {
          queries: context.queries.map((q) => ({
            model: q.model,
            action: q.action,
            duration: Math.round(q.duration),
          })),
          externalApis: context.externalApis.map((api) => ({
            name: api.name,
            duration: Math.round(api.duration),
          })),
        }
      : null;

    // Log to database asynchronously (non-blocking)
    // Use setTimeout for broader compatibility (works in all environments)
    setTimeout(async () => {
      try {
        // Lazy load prisma to avoid circular dependencies
        if (!prisma) {
          prisma = (await import('@/lib/prisma')).prisma;
        }
        
        await prisma.performanceLog.create({
          data: {
            pathname: context.pathname,
            userId: context.userId,
            sessionId: context.sessionId,
            userAgent: context.userAgent,
            serverRenderTime: totalLoadTime,
            databaseQueryTime: Math.round(databaseQueryTime),
            externalApiTime: Math.round(externalApiTime),
            totalLoadTime,
            queryCount: context.queries.length,
            queryDetails,
          },
        });
      } catch (error) {
        // Silently fail - we don't want performance tracking to break the app
        console.error('[Performance Tracker] Failed to log metrics:', error);
      }
    }, 0);
  } catch (error) {
    // Silently fail
    console.error('[Performance Tracker] Error in endTracking:', error);
  }
}

/**
 * Run a function with performance tracking
 */
export async function withTracking<T>(
  options: {
    pathname: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
  },
  fn: () => Promise<T>
): Promise<T> {
  startTracking(options);
  try {
    return await fn();
  } finally {
    await endTracking();
  }
}

/**
 * Log client-side performance metrics (Web Vitals)
 */
export async function logClientMetrics(data: {
  pathname: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  inp?: number;
}): Promise<void> {
  if (!config.enabled) return;

  try {
    // Lazy load prisma only when needed
    if (!prisma) {
      const { prisma: prismaInstance } = await import('@/lib/prisma');
      prisma = prismaInstance;
    }

    await prisma.performanceLog.create({
      data: {
        pathname: data.pathname,
        userId: data.userId,
        sessionId: data.sessionId,
        userAgent: data.userAgent,
        ttfb: data.ttfb,
        fcp: data.fcp,
        lcp: data.lcp,
        cls: data.cls,
        fid: data.fid,
        inp: data.inp,
      },
    });
  } catch (error) {
    console.error('[Performance Tracker] Failed to log client metrics:', error);
  }
}

/**
 * Check if tracking is enabled
 */
export function isTrackingEnabled(): boolean {
  return config.enabled;
}
