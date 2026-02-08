/**
 * Airport Code Extraction Utility
 * 
 * Extracts IATA airport codes from location strings and provides
 * fallback mappings for common cities.
 */

// Common city to airport code mappings
const CITY_AIRPORT_MAP: Record<string, string> = {
  // United States
  'new york': 'JFK',
  'nyc': 'JFK',
  'manhattan': 'JFK',
  'los angeles': 'LAX',
  'la': 'LAX',
  'san francisco': 'SFO',
  'sf': 'SFO',
  'chicago': 'ORD',
  'miami': 'MIA',
  'seattle': 'SEA',
  'boston': 'BOS',
  'denver': 'DEN',
  'las vegas': 'LAS',
  'dallas': 'DFW',
  'atlanta': 'ATL',
  'phoenix': 'PHX',
  'san diego': 'SAN',
  'portland': 'PDX',
  'austin': 'AUS',
  'honolulu': 'HNL',
  'washington': 'DCA',
  'dc': 'DCA',
  'washington dc': 'DCA',
  'philadelphia': 'PHL',
  'orlando': 'MCO',
  'minneapolis': 'MSP',
  'detroit': 'DTW',
  'houston': 'IAH',
  'newark': 'EWR',
  
  // Europe
  'london': 'LHR',
  'paris': 'CDG',
  'rome': 'FCO',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'munich': 'MUC',
  'milan': 'MXP',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'prague': 'PRG',
  'dublin': 'DUB',
  'lisbon': 'LIS',
  'brussels': 'BRU',
  'copenhagen': 'CPH',
  'stockholm': 'ARN',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'athens': 'ATH',
  'istanbul': 'IST',
  'berlin': 'BER',
  
  // Asia
  'tokyo': 'NRT',
  'osaka': 'KIX',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'hong kong': 'HKG',
  'singapore': 'SIN',
  'bangkok': 'BKK',
  'seoul': 'ICN',
  'taipei': 'TPE',
  'delhi': 'DEL',
  'mumbai': 'BOM',
  'dubai': 'DXB',
  'doha': 'DOH',
  'kuala lumpur': 'KUL',
  'bali': 'DPS',
  'denpasar': 'DPS',
  'manila': 'MNL',
  'ho chi minh': 'SGN',
  'saigon': 'SGN',
  'hanoi': 'HAN',
  
  // Oceania
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',
  'brisbane': 'BNE',
  'perth': 'PER',
  
  // Americas (non-US)
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  'mexico city': 'MEX',
  'cancun': 'CUN',
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG',
  'buenos aires': 'EZE',
  'lima': 'LIM',
  'bogota': 'BOG',
  'santiago': 'SCL',
  
  // Africa
  'cairo': 'CAI',
  'johannesburg': 'JNB',
  'cape town': 'CPT',
  'nairobi': 'NBO',
  'casablanca': 'CMN',
  'marrakech': 'RAK',
};

/**
 * Extract IATA airport code from a location string
 * 
 * Handles formats like:
 * - "San Francisco (SFO)"
 * - "SFO"
 * - "San Francisco, CA"
 * - "San Francisco"
 * 
 * @param location Location string to parse
 * @returns IATA code or null if not found
 */
export function extractAirportCode(location: string): string | null {
  if (!location) return null;
  
  // Pattern 1: Look for IATA code in parentheses (e.g., "San Francisco (SFO)")
  const parenMatch = location.match(/\(([A-Z]{3})\)/);
  if (parenMatch) {
    return parenMatch[1];
  }
  
  // Pattern 2: Check if the entire string is a 3-letter IATA code
  const trimmed = location.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Pattern 3: Look for standalone 3-letter code at end (e.g., "San Francisco SFO")
  const endMatch = location.match(/\s([A-Z]{3})$/);
  if (endMatch) {
    return endMatch[1];
  }
  
  // Pattern 4: Try to match city name to known airport code
  const cityCode = getAirportCodeForCity(location);
  if (cityCode) {
    return cityCode;
  }
  
  return null;
}

/**
 * Get airport code for a city name using the built-in mapping
 * 
 * @param city City name to look up
 * @returns IATA code or null if not found
 */
export function getAirportCodeForCity(city: string): string | null {
  if (!city) return null;
  
  // Normalize the city name
  const normalized = city
    .toLowerCase()
    .replace(/,.*$/, '') // Remove everything after comma
    .replace(/\s*(international|airport|intl|apt).*$/i, '') // Remove airport suffixes
    .trim();
  
  // Direct lookup
  if (CITY_AIRPORT_MAP[normalized]) {
    return CITY_AIRPORT_MAP[normalized];
  }
  
  // Try partial match (city name is contained in the key or vice versa)
  for (const [key, code] of Object.entries(CITY_AIRPORT_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }
  
  return null;
}

/**
 * Format date for Amadeus API (YYYY-MM-DD)
 * 
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatDateForFlightSearch(date: Date | string | null): string | null {
  if (!date) return null;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Extract flight search parameters from a segment
 * 
 * @param segment Segment object with location and date info
 * @returns Flight search parameters or null if not enough info
 */
export function extractFlightSearchParams(segment: {
  startTitle: string;
  endTitle: string;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
}): {
  origin: string;
  destination: string;
  departureDate: string;
} | null {
  const origin = extractAirportCode(segment.startTitle);
  const destination = extractAirportCode(segment.endTitle);
  const departureDate = formatDateForFlightSearch(segment.startTime);
  
  if (!origin || !destination || !departureDate) {
    console.warn('[extractFlightSearchParams] Missing required info:', {
      origin,
      destination,
      departureDate,
      startTitle: segment.startTitle,
      endTitle: segment.endTitle
    });
    return null;
  }
  
  return {
    origin,
    destination,
    departureDate
  };
}
