/**
 * IATA Code Mappings for Major Airports
 * 
 * Used to map airport names from Google Places to their IATA codes
 * since Google Places API doesn't provide IATA codes directly.
 */

export const AIRPORT_NAME_TO_IATA: Record<string, string> = {
  // US - West Coast
  "San Francisco International Airport": "SFO",
  "Norman Y. Mineta San Jose International Airport": "SJC",
  "San Jose International Airport": "SJC",
  "San Jose Mineta International Airport": "SJC",
  "Mineta San Jose International Airport": "SJC",
  "Oakland International Airport": "OAK",
  "Los Angeles International Airport": "LAX",
  "San Diego International Airport": "SAN",
  "Seattle-Tacoma International Airport": "SEA",
  "Portland International Airport": "PDX",
  
  // US - East Coast
  "John F. Kennedy International Airport": "JFK",
  "LaGuardia Airport": "LGA",
  "Newark Liberty International Airport": "EWR",
  "Boston Logan International Airport": "BOS",
  "Washington Dulles International Airport": "IAD",
  "Ronald Reagan Washington National Airport": "DCA",
  "Baltimore/Washington International Airport": "BWI",
  "Philadelphia International Airport": "PHL",
  "Miami International Airport": "MIA",
  "Fort Lauderdale-Hollywood International Airport": "FLL",
  
  // US - Central
  "O'Hare International Airport": "ORD",
  "Chicago O'Hare International Airport": "ORD",
  "Midway International Airport": "MDW",
  "Chicago Midway International Airport": "MDW",
  "Dallas/Fort Worth International Airport": "DFW",
  "Dallas Fort Worth International Airport": "DFW",
  "George Bush Intercontinental Airport": "IAH",
  "Houston George Bush Intercontinental Airport": "IAH",
  "Phoenix Sky Harbor International Airport": "PHX",
  "Denver International Airport": "DEN",
  "Minneapolis-Saint Paul International Airport": "MSP",
  "Detroit Metropolitan Wayne County Airport": "DTW",
  "Hartsfield-Jackson Atlanta International Airport": "ATL",
  "Charlotte Douglas International Airport": "CLT",
  
  // US - South
  "Orlando International Airport": "MCO",
  "Tampa International Airport": "TPA",
  "Nashville International Airport": "BNA",
  "Austin-Bergstrom International Airport": "AUS",
  "San Antonio International Airport": "SAT",
  "New Orleans Louis Armstrong International Airport": "MSY",
  
  // International - Europe
  "Heathrow Airport": "LHR",
  "London Heathrow Airport": "LHR",
  "Gatwick Airport": "LGW",
  "London Gatwick Airport": "LGW",
  "Charles de Gaulle Airport": "CDG",
  "Paris Charles de Gaulle Airport": "CDG",
  "Amsterdam Airport Schiphol": "AMS",
  "Schiphol Airport": "AMS",
  "Frankfurt Airport": "FRA",
  "Munich Airport": "MUC",
  "Madrid-Barajas Adolfo Suárez Airport": "MAD",
  "Barcelona–El Prat Airport": "BCN",
  "Rome Fiumicino Airport": "FCO",
  "Leonardo da Vinci-Fiumicino Airport": "FCO",
  "Zurich Airport": "ZRH",
  "Vienna International Airport": "VIE",
  
  // International - Asia
  "Narita International Airport": "NRT",
  "Tokyo Narita International Airport": "NRT",
  "Haneda Airport": "HND",
  "Tokyo Haneda Airport": "HND",
  "Beijing Capital International Airport": "PEK",
  "Shanghai Pudong International Airport": "PVG",
  "Hong Kong International Airport": "HKG",
  "Singapore Changi Airport": "SIN",
  "Changi Airport": "SIN",
  "Incheon International Airport": "ICN",
  "Seoul Incheon International Airport": "ICN",
  "Dubai International Airport": "DXB",
  "Indira Gandhi International Airport": "DEL",
  "Delhi Indira Gandhi International Airport": "DEL",
  "Chhatrapati Shivaji International Airport": "BOM",
  "Mumbai Chhatrapati Shivaji International Airport": "BOM",
  
  // International - Oceania
  "Sydney Kingsford Smith Airport": "SYD",
  "Sydney Airport": "SYD",
  "Melbourne Airport": "MEL",
  "Auckland Airport": "AKL",
  
  // International - Middle East
  "Hamad International Airport": "DOH",
  "Doha Hamad International Airport": "DOH",
  "Abu Dhabi International Airport": "AUH",
  "Ben Gurion Airport": "TLV",
  "Tel Aviv Ben Gurion Airport": "TLV",
  
  // Canada
  "Toronto Pearson International Airport": "YYZ",
  "Vancouver International Airport": "YVR",
  "Montreal-Pierre Elliott Trudeau International Airport": "YUL",
  
  // Mexico & Latin America
  "Mexico City International Airport": "MEX",
  "Cancún International Airport": "CUN",
  "São Paulo-Guarulhos International Airport": "GRU",
  "Buenos Aires Ezeiza International Airport": "EZE",
};

/**
 * Extract IATA code from airport name
 * Looks for 3-letter codes in parentheses or common patterns
 */
export function extractIATAFromName(name: string): string | null {
  // Pattern 1: Code in parentheses - "San Francisco International Airport (SFO)"
  const parenMatch = name.match(/\(([A-Z]{3})\)/);
  if (parenMatch) {
    return parenMatch[1];
  }
  
  // Pattern 2: Code with dash - "San Francisco International Airport - SFO"
  const dashMatch = name.match(/\s-\s([A-Z]{3})$/);
  if (dashMatch) {
    return dashMatch[1];
  }
  
  // Pattern 3: Look up in mapping table
  const normalizedName = name.trim();
  if (AIRPORT_NAME_TO_IATA[normalizedName]) {
    return AIRPORT_NAME_TO_IATA[normalizedName];
  }
  
  // Pattern 4: Try without "Airport" suffix
  const withoutAirport = normalizedName.replace(/\s+Airport$/i, '').trim();
  if (AIRPORT_NAME_TO_IATA[withoutAirport + ' Airport']) {
    return AIRPORT_NAME_TO_IATA[withoutAirport + ' Airport'];
  }
  
  return null;
}

/**
 * Get IATA code from place name with fallback strategies
 */
export function getIATACode(placeName: string, placeTypes?: string[]): string {
  // First try to extract from name
  const extracted = extractIATAFromName(placeName);
  if (extracted) {
    return extracted;
  }
  
  // If no IATA code found, generate a placeholder based on first 3 letters
  // This helps with UI display but should be flagged as "unknown"
  const words = placeName.split(' ').filter(w => w.length > 2);
  if (words.length > 0) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  return 'UNK';
}
