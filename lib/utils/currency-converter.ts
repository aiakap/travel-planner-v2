/**
 * Currency Converter Utility
 * 
 * Functions for converting costs to USD and aggregating multi-currency totals.
 * Uses the exchange rate cache for up-to-date rates.
 */

import { getExchangeRates } from './exchange-rate-cache';

/**
 * Represents a cost item with amount and currency
 */
export interface CostItem {
  amount: number;
  currency: string;
}

/**
 * Convert an amount from a given currency to USD
 * 
 * @param amount - The amount in the source currency
 * @param fromCurrency - The source currency code (e.g., "JPY", "EUR")
 * @returns Promise<number> - The amount converted to USD
 * 
 * @example
 * const usdAmount = await convertToUSD(50000, 'JPY'); // ~$335
 */
export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (!amount || amount === 0) return 0;
  
  const currency = fromCurrency?.toUpperCase() || 'USD';
  
  // Already USD, no conversion needed
  if (currency === 'USD') {
    return amount;
  }

  const rates = await getExchangeRates();
  const rate = rates[currency];

  // If rate not found, assume 1:1 (treat as USD)
  if (!rate) {
    console.warn(`[CurrencyConverter] Unknown currency: ${currency}, treating as USD`);
    return amount;
  }

  // Convert: amount / rate = USD
  // e.g., 50000 JPY / 149.5 = $334.45 USD
  return amount / rate;
}

/**
 * Sum an array of cost items, converting all to USD
 * 
 * @param items - Array of cost items with amount and currency
 * @returns Promise<number> - Total sum in USD
 * 
 * @example
 * const total = await sumCostsInUSD([
 *   { amount: 500, currency: 'USD' },
 *   { amount: 50000, currency: 'JPY' },
 * ]); // ~$835
 */
export async function sumCostsInUSD(items: CostItem[]): Promise<number> {
  if (!items || items.length === 0) return 0;

  // Filter out zero/invalid amounts
  const validItems = items.filter(item => item.amount && item.amount > 0);
  if (validItems.length === 0) return 0;

  // Get rates once for all conversions (efficient)
  const rates = await getExchangeRates();

  let total = 0;
  for (const item of validItems) {
    const currency = item.currency?.toUpperCase() || 'USD';
    
    if (currency === 'USD') {
      total += item.amount;
    } else {
      const rate = rates[currency];
      if (rate) {
        total += item.amount / rate;
      } else {
        // Unknown currency, treat as USD
        console.warn(`[CurrencyConverter] Unknown currency: ${currency}, treating as USD`);
        total += item.amount;
      }
    }
  }

  return total;
}

/**
 * Format a number as USD currency string
 * 
 * @param amount - The amount in USD
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$1,234")
 * 
 * @example
 * formatAsUSD(1234.56) // "$1,235"
 * formatAsUSD(1234.56, { decimals: 2 }) // "$1,234.56"
 */
export function formatAsUSD(
  amount: number,
  options: { decimals?: number; locale?: string } = {}
): string {
  const { decimals = 0, locale = 'en-US' } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Convert and format in one step (convenience function)
 * 
 * @param amount - The amount in the source currency
 * @param fromCurrency - The source currency code
 * @returns Promise<string> - Formatted USD string
 */
export async function convertAndFormatAsUSD(
  amount: number,
  fromCurrency: string
): Promise<string> {
  const usdAmount = await convertToUSD(amount, fromCurrency);
  return formatAsUSD(usdAmount);
}

/**
 * Sum costs and format as USD in one step (convenience function)
 * 
 * @param items - Array of cost items
 * @returns Promise<string> - Formatted USD total string
 */
export async function sumAndFormatAsUSD(items: CostItem[]): Promise<string> {
  const total = await sumCostsInUSD(items);
  return formatAsUSD(total);
}

/**
 * Extract cost items from reservations (helper for common pattern)
 * 
 * @param reservations - Array of reservation objects with cost and currency fields
 * @returns CostItem[] - Array of cost items ready for conversion
 */
export function extractCostItems<T extends { cost?: number | null; currency?: string | null }>(
  reservations: T[]
): CostItem[] {
  return reservations
    .filter(r => r.cost && r.cost > 0)
    .map(r => ({
      amount: r.cost!,
      currency: r.currency || 'USD',
    }));
}

/**
 * Calculate total cost in USD from reservations (all-in-one helper)
 * 
 * @param reservations - Array of reservation objects with cost and currency fields
 * @returns Promise<number> - Total in USD
 */
export async function calculateTotalCostUSD<T extends { cost?: number | null; currency?: string | null }>(
  reservations: T[]
): Promise<number> {
  const costItems = extractCostItems(reservations);
  return sumCostsInUSD(costItems);
}
