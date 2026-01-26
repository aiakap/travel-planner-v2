/**
 * Format utilities for displaying API data in a user-friendly way
 */

/**
 * Format a date string to readable format
 * @param dateString - ISO date string or YYYY-MM-DD
 * @returns Formatted date like "July 15, 2026"
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a time string to readable 12-hour format
 * @param timeString - ISO 8601 datetime or time string
 * @returns Formatted time like "10:30 AM"
 */
export function formatTime(timeString: string): string {
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeString;
  }
}

/**
 * Format ISO 8601 duration to human readable format
 * @param duration - ISO 8601 duration like "PT8H30M"
 * @returns Formatted duration like "8h 30m"
 */
export function formatDuration(duration: string): string {
  if (!duration) return "N/A";
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

  return parts.length > 0 ? parts.join(" ") : "0m";
}

/**
 * Format a price with currency symbol and commas
 * @param amount - Price amount as string or number
 * @param currency - Currency code like "USD"
 * @returns Formatted price like "$1,234.56"
 */
export function formatPrice(amount: string | number, currency?: string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return amount.toString();

  const formatted = numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency) {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${formatted}`;
  }

  return formatted;
}

/**
 * Format phone number with spaces for readability
 * @param phoneNumber - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
}

/**
 * Format coordinates to fixed decimal places
 * @param lat - Latitude
 * @param lng - Longitude
 * @param decimals - Number of decimal places (default 6)
 * @returns Formatted coordinates like "40.712776, -74.005974"
 */
export function formatCoordinates(lat: number, lng: number, decimals: number = 6): string {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

/**
 * Format file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted size like "1.23 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format a number with commas
 * @param num - Number to format
 * @returns Formatted number like "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Estimate cost for OpenAI API usage
 * @param tokens - Number of tokens
 * @param model - Model name
 * @param type - "input" or "output"
 * @returns Estimated cost in dollars
 */
export function estimateOpenAICost(
  tokens: number,
  model: string,
  type: "input" | "output"
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.0025, output: 0.01 }, // per 1K tokens
    "gpt-4o-2024-11-20": { input: 0.0025, output: 0.01 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  };

  const modelPricing = pricing[model] || pricing["gpt-4o"];
  const rate = type === "input" ? modelPricing.input : modelPricing.output;
  
  return (tokens / 1000) * rate;
}

/**
 * Format tokens per second rate
 * @param tokens - Number of tokens
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted rate like "45.2 tokens/sec"
 */
export function formatTokensPerSecond(tokens: number, milliseconds: number): string {
  const seconds = milliseconds / 1000;
  const rate = tokens / seconds;
  return `${rate.toFixed(1)} tokens/sec`;
}

/**
 * Get airline name from carrier code
 * @param code - IATA airline code
 * @returns Airline name
 */
export function getAirlineName(code: string): string {
  const airlines: Record<string, string> = {
    AA: "American Airlines",
    UA: "United Airlines",
    DL: "Delta Air Lines",
    WN: "Southwest Airlines",
    B6: "JetBlue Airways",
    AS: "Alaska Airlines",
    NK: "Spirit Airlines",
    F9: "Frontier Airlines",
    G4: "Allegiant Air",
    BA: "British Airways",
    AF: "Air France",
    LH: "Lufthansa",
    KL: "KLM",
    IB: "Iberia",
    AZ: "ITA Airways",
    LX: "Swiss International Air Lines",
    OS: "Austrian Airlines",
    SN: "Brussels Airlines",
    TP: "TAP Air Portugal",
    EI: "Aer Lingus",
    SK: "SAS Scandinavian Airlines",
    AY: "Finnair",
    LO: "LOT Polish Airlines",
    OK: "Czech Airlines",
    RO: "Tarom",
  };
  
  return airlines[code] || code;
}

/**
 * Format cabin class to display name
 * @param cabin - Cabin code like "ECONOMY" or "BUSINESS"
 * @returns Display name like "Economy Class"
 */
export function formatCabinClass(cabin: string): string {
  const classes: Record<string, string> = {
    ECONOMY: "Economy Class",
    PREMIUM_ECONOMY: "Premium Economy",
    BUSINESS: "Business Class",
    FIRST: "First Class",
  };
  
  return classes[cabin] || cabin;
}
