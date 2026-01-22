/**
 * Type definitions for the 3-stage place suggestion pipeline
 */

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
  };
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

export interface MessageSegment {
  type: "text" | "place";
  content?: string; // For text segments
  suggestion?: PlaceSuggestion; // For place segments
  placeData?: GooglePlaceData; // For place segments
  display?: string; // Display text for place segments
}

// Stage outputs
export interface Stage1Output {
  text: string; // Full AI response text
  places: PlaceSuggestion[]; // Structured place suggestions
  tripSuggestion?: any; // Optional trip metadata for trip suggestion mode
}

export interface Stage2Output {
  placeMap: PlaceDataMap; // Map of suggestedName -> Google Places data
  errors?: Array<{
    suggestedName: string;
    error: string;
  }>;
}

export interface Stage3Output {
  segments: MessageSegment[]; // Structured message with place links
}

// Pipeline request/response types
export interface PipelineRequest {
  query: string;
  destination?: string; // For trip suggestion mode
  profileData?: any; // For personalization
  tripContext?: {
    tripId?: string;
    segmentId?: string;
  };
  stages?: ("stage1" | "stage2" | "stage3")[]; // For testing individual stages
}

export interface PipelineResponse {
  success: boolean;
  data?: {
    stage1?: Stage1Output & { timing: number };
    stage2?: Stage2Output & { timing: number };
    stage3?: Stage3Output & { timing: number };
  };
  error?: string;
}
