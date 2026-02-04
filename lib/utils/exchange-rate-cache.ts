/**
 * Exchange Rate Cache
 * 
 * In-memory cache for exchange rates with 24-hour TTL.
 * Fetches rates from exchangerate-api.com when cache is stale.
 * Falls back to hardcoded rates if API fails and no cache exists.
 */

// Cache structure
interface RateCache {
  rates: Record<string, number>;  // Currency code -> rate (USD as base, so USD = 1)
  timestamp: number;              // Unix timestamp when fetched
}

// Module-level cache (persists across requests within same server instance)
let cache: RateCache | null = null;

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Fallback rates (USD as base) - used only if API fails and no cache exists
// These are initial seed values that get updated with live data after successful API calls
let fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.1,
  MXN: 17.1,
  SGD: 1.34,
  HKD: 7.82,
  NZD: 1.64,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.87,
  KRW: 1330,
  THB: 35.5,
  BRL: 4.97,
  ZAR: 18.5,
  AED: 3.67,
  ILS: 3.65,
  PLN: 4.0,
  CZK: 23.0,
  HUF: 355,
  TRY: 32.0,
  TWD: 31.5,
  PHP: 56.0,
  IDR: 15800,
  MYR: 4.7,
  VND: 24500,
};

/**
 * Get current exchange rates (USD as base currency)
 * 
 * - Returns cached rates if cache is less than 24 hours old
 * - Fetches fresh rates from API if cache is stale or doesn't exist
 * - Falls back to stale cache or hardcoded rates if API fails
 * 
 * @returns Promise<Record<string, number>> - Map of currency code to rate (USD = 1)
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // Return cached rates if valid (less than 24 hours old)
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.rates;
  }

  // Fetch fresh rates from API
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response structure');
    }

    // Update cache with fresh rates
    cache = {
      rates: data.rates,
      timestamp: Date.now(),
    };

    // Keep fallback rates current for future cold starts within this server instance
    fallbackRates = { ...data.rates };

    console.log('[ExchangeRateCache] Fetched fresh rates from API');
    return cache.rates;
  } catch (error) {
    console.warn('[ExchangeRateCache] Failed to fetch rates from API:', error);
    
    // Return stale cache if available (better than nothing)
    if (cache?.rates) {
      console.log('[ExchangeRateCache] Using stale cache');
      return cache.rates;
    }

    // Last resort: use fallback rates (may be updated from previous successful fetches)
    console.log('[ExchangeRateCache] Using fallback rates');
    return fallbackRates;
  }
}

/**
 * Get the exchange rate for a specific currency to USD
 * 
 * @param currencyCode - ISO 4217 currency code (e.g., "JPY", "EUR")
 * @returns Promise<number> - The exchange rate (how many units of currency = 1 USD)
 */
export async function getExchangeRate(currencyCode: string): Promise<number> {
  const rates = await getExchangeRates();
  const code = currencyCode.toUpperCase();
  
  // Return rate if found, default to 1 (treat as USD) if unknown
  return rates[code] ?? 1;
}

/**
 * Check if the cache is currently valid (for debugging/monitoring)
 */
export function isCacheValid(): boolean {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL_MS;
}

/**
 * Get cache status (for debugging/monitoring)
 */
export function getCacheStatus(): { 
  hasCache: boolean; 
  ageMs: number | null; 
  isValid: boolean;
  currencyCount: number;
} {
  if (!cache) {
    return { hasCache: false, ageMs: null, isValid: false, currencyCount: 0 };
  }
  
  const ageMs = Date.now() - cache.timestamp;
  return {
    hasCache: true,
    ageMs,
    isValid: ageMs < CACHE_TTL_MS,
    currencyCount: Object.keys(cache.rates).length,
  };
}

/**
 * Force refresh the cache (for testing or manual refresh)
 */
export async function refreshCache(): Promise<void> {
  cache = null; // Clear cache to force refresh
  await getExchangeRates();
}
