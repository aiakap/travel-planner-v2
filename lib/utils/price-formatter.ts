/**
 * Price Formatting Utilities
 * 
 * Helper functions for formatting hotel prices, flight prices, and other costs
 * in a consistent and user-friendly way.
 */

/**
 * Format a number as currency with proper localization
 * 
 * @param amount - The numeric amount
 * @param currency - Currency code (e.g., "USD", "EUR", "GBP")
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currency} ${amount.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  }
}

/**
 * Format hotel price with per-night breakdown
 * 
 * @param total - Total price as string
 * @param currency - Currency code
 * @param nights - Number of nights
 * @returns Formatted price object
 */
export function formatHotelPrice(
  total: string,
  currency: string,
  nights: number
) {
  const totalNum = parseFloat(total);
  const perNight = totalNum / nights;
  
  return {
    total: formatCurrency(totalNum, currency),
    perNight: formatCurrency(perNight, currency),
    totalRaw: totalNum,
    perNightRaw: perNight,
    nights,
    currency,
  };
}

/**
 * Format a price range (e.g., "$100 - $200")
 * 
 * @param min - Minimum price
 * @param max - Maximum price
 * @param currency - Currency code
 * @returns Formatted price range string
 */
export function formatPriceRange(
  min: number,
  max: number,
  currency: string = 'USD'
): string {
  if (min === max) {
    return formatCurrency(min, currency);
  }
  
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
}

/**
 * Calculate savings percentage
 * 
 * @param originalPrice - Original price
 * @param salePrice - Sale price
 * @returns Savings percentage rounded to nearest whole number
 */
export function calculateSavings(originalPrice: number, salePrice: number): number {
  if (originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Format flight price
 * Similar to hotel price but without night breakdown
 * 
 * @param total - Total price as string
 * @param currency - Currency code
 * @param passengers - Number of passengers
 * @returns Formatted price object
 */
export function formatFlightPrice(
  total: string,
  currency: string,
  passengers: number = 1
) {
  const totalNum = parseFloat(total);
  const perPassenger = totalNum / passengers;
  
  return {
    total: formatCurrency(totalNum, currency),
    perPassenger: passengers > 1 ? formatCurrency(perPassenger, currency) : null,
    totalRaw: totalNum,
    perPassengerRaw: perPassenger,
    passengers,
    currency,
  };
}

/**
 * Convert price between currencies (simplified version)
 * For production, use a real exchange rate API
 * 
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount (using hardcoded rates for demo)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // Simplified exchange rates (USD as base)
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110,
    CAD: 1.25,
    AUD: 1.35,
  };
  
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / (rates[fromCurrency] || 1);
  return usdAmount * (rates[toCurrency] || 1);
}

/**
 * Get currency symbol from currency code
 * 
 * @param currency - Currency code (e.g., "USD")
 * @returns Currency symbol (e.g., "$")
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
  };
  
  return symbols[currency] || currency;
}
