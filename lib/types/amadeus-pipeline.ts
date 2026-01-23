/**
 * Type definitions for the Amadeus-enhanced place suggestion pipeline
 * This is a copy of place-pipeline.ts with extensions for flight and hotel data
 * Used exclusively by /test/place-pipeline (NOT by /test/exp)
 */

// ============================================================================
// COPIED FROM place-pipeline.ts (Base Types)
// ============================================================================

export interface PlaceSuggestion {
  suggestedName: string; // Exact name as it appears in the text
  category: "Stay" | "Eat" | "Do" | "Transport";
  type: string; // e.g., "Hotel", "Restaurant", "Museum", "Flight"
  searchQuery: string; // Optimized query for Google Places API
  context?: {
    dayNumber?: number;
    timeOfDay?: string; // e.g., "morning", "afternoon", "evening"
    specificTime?: string; // e.g., "7:00 PM"
    notes?: string; // Additional context or recommendations
    // Flight-specific context
    origin?: string; // IATA code (e.g., "JFK")
    destination?: string; // IATA code (e.g., "LAX")
    departureDate?: string; // YYYY-MM-DD
    returnDate?: string; // YYYY-MM-DD (optional for one-way)
    adults?: number;
    travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    // Hotel-specific context
    location?: string; // City or location name
    checkInDate?: string; // YYYY-MM-DD
    checkOutDate?: string; // YYYY-MM-DD
    guests?: number;
    rooms?: number;
  };
}

// ============================================================================
// NEW: Separate Transport and Hotel Suggestion Types
// ============================================================================

export interface TransportSuggestion {
  suggestedName: string;
  type: "Flight" | "Transfer" | "Train" | "Bus";
  origin: string; // IATA code
  destination: string; // IATA code or address
  departureDate: string; // YYYY-MM-DD
  departureTime?: string; // HH:mm (24-hour)
  returnDate?: string; // For roundtrip
  adults: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  transferType?: "PRIVATE" | "SHARED" | "TAXI" | "AIRPORT_EXPRESS";
}

export interface HotelSuggestion {
  suggestedName: string;
  location: string; // City name or IATA code
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guests: number;
  rooms: number;
  searchQuery: string; // For Google Places fallback
}

export interface GooglePlaceData {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos?: Array<{
    reference: string;
    width: number;
    height: number;
  }>;
  formattedPhoneNumber?: string;
  internationalPhoneNumber?: string;
  website?: string;
  url?: string; // Google Maps link
  location?: {
    lat: number;
    lng: number;
  };
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  };
  notFound?: boolean; // True if resolution failed
}

export interface PlaceDataMap {
  [suggestedName: string]: GooglePlaceData;
}

// ============================================================================
// EXTENDED: MessageSegment with flight and hotel types
// ============================================================================

export interface MessageSegment {
  type: "text" | "place" | "flight" | "hotel" | "transport"; // EXTENDED: added flight/hotel/transport
  content?: string; // For text segments
  suggestion?: PlaceSuggestion | TransportSuggestion | HotelSuggestion; // For all segment types
  placeData?: GooglePlaceData; // For place segments (primary display)
  transportData?: AmadeusTransportData; // NEW: For transport segments (flights/transfers)
  hotelData?: AmadeusHotelData; // NEW: For hotel segments (can combine with placeData)
  // Legacy for backward compatibility
  flightData?: AmadeusFlightData;
  display?: string; // Display text for place/flight/hotel/transport segments
}

// ============================================================================
// NEW: Amadeus Flight Data Types
// ============================================================================

export interface AmadeusFlightData {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string; // ISO 8601 duration (e.g., "PT5H30M")
    segments: Array<{
      departure: {
        iataCode: string;
        at: string; // ISO 8601 datetime
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string; // Airline code (e.g., "AA")
      number: string; // Flight number
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  validatingAirlineCodes: string[];
  notFound?: boolean; // True if resolution failed
}

export interface FlightDataMap {
  [suggestedName: string]: AmadeusFlightData;
}

// ============================================================================
// NEW: Amadeus Hotel Data Types
// ============================================================================

export interface AmadeusHotelData {
  hotelId: string;
  name: string;
  price: {
    total: string;
    currency: string;
  };
  rating?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  amenities?: string[];
  photos?: string[];
  available: boolean;
  notFound?: boolean; // True if resolution failed
}

export interface HotelDataMap {
  [suggestedName: string]: AmadeusHotelData;
}

// ============================================================================
// NEW: Amadeus Transport/Transfer Data Types
// ============================================================================

export interface AmadeusTransportData {
  id: string;
  type: "flight" | "transfer";
  price: {
    total: string;
    currency: string;
  };
  // Flight-specific fields
  itineraries?: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  validatingAirlineCodes?: string[];
  // Transfer-specific fields
  transferType?: string;
  vehicle?: {
    code: string;
    category: string;
    description: string;
  };
  duration?: string;
  notFound?: boolean;
}

export interface TransportDataMap {
  [suggestedName: string]: AmadeusTransportData;
}

// ============================================================================
// NEW: Entity Types for XML Extraction (Stage 2)
// ============================================================================

export interface PlaceEntity {
  id: string; // Unique ID for matching in XML
  name: string; // Display name
  context: string; // Full location context: "Paris France 1st arrondissement"
  type: string; // "Restaurant", "Museum", etc.
  searchQuery: string; // Enhanced query with context
}

export interface TransportEntity {
  id: string;
  name: string;
  type: "Flight" | "Transfer" | "Train" | "Bus";
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: string;
}

export interface HotelEntity {
  id: string;
  name: string;
  context: string; // Location context
  location: string; // City for API
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms: number;
  searchQuery: string; // Enhanced with context
}

// ============================================================================
// Stage Outputs (Restructured for 4-Stage Pipeline)
// ============================================================================

// Stage 1: Content Generation - Plain text with intentions
export interface Stage1Output {
  text: string; // Full response including LOOKUP_REQUIREMENTS
  naturalLanguageSection: string; // Just the natural language part
  lookupRequirements: string; // Structured requirements section
  tripSuggestion?: any; // Optional trip metadata for trip suggestion mode
}

// Stage 2: XML Extraction - Marked text + entity lists
export interface Stage2Output {
  markedText: string; // XML-marked text with tags
  places: PlaceEntity[]; // For Google Places lookup
  transport: TransportEntity[]; // For Amadeus flights/transfers
  hotels: HotelEntity[]; // For Amadeus hotels
}

// Stage 3: API Lookups - Resolved data by ID
export interface Stage3Output {
  placeMap: { [id: string]: GooglePlaceData }; // Map by entity ID
  transportMap: { [id: string]: AmadeusTransportData }; // Map by entity ID
  hotelMap: { [id: string]: AmadeusHotelData }; // Map by entity ID
  errors?: Array<{
    id: string;
    error: string;
  }>;
  subStages?: {
    stage3A: { timing: number; count: number }; // Google Places
    stage3B: { timing: number; count: number }; // Transport
    stage3C: { timing: number; count: number }; // Hotels
  };
}

// Legacy Stage2Output for backward compatibility
export interface LegacyStage2Output {
  placeMap: PlaceDataMap;
  transportMap: TransportDataMap;
  hotelMap: HotelDataMap;
  flightMap?: FlightDataMap;
  errors?: Array<{
    suggestedName: string;
    error: string;
  }>;
  subStages?: {
    stage2A: { timing: number; count: number };
    stage2B: { timing: number; count: number };
    stage2C: { timing: number; count: number };
  };
}

// Stage 4: HTML Assembly - Rendered segments
export interface Stage4Output {
  segments: MessageSegment[]; // Structured message with place/flight/hotel links
}

// ============================================================================
// Pipeline Request/Response Types
// ============================================================================

export interface PipelineRequest {
  query: string;
  destination?: string; // For trip suggestion mode
  profileData?: any; // For personalization
  tripContext?: {
    tripId?: string;
    segmentId?: string;
  };
  stages?: ("stage1" | "stage2" | "stage3" | "stage4")[]; // For testing individual stages
}

export interface PipelineResponse {
  success: boolean;
  data?: {
    stage1?: Stage1Output & { timing: number };
    stage2?: Stage2Output & { timing: number };
    stage3?: Stage3Output & { timing: number };
    stage4?: Stage4Output & { timing: number };
  };
  error?: string;
}
