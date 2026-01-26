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

export type MessageSegment = 
  | { type: "text"; content: string }
  | { 
      type: "place"; 
      suggestion: PlaceSuggestion; 
      placeData?: GooglePlaceData; 
      display?: string;
    }
  | {
      type: "trip_card";
      tripId: string;
      title: string;
      startDate: string;
      endDate: string;
      description?: string;
    }
  | {
      type: "segment_card";
      segmentId: string;
      name: string;
      segmentType: string;
      startLocation: string;
      endLocation: string;
      startTime?: string;
      endTime?: string;
    }
  | {
      type: "reservation_card";
      reservationId: string;
      name: string;
      category: string;
      type: string;
      status: string;
      cost?: number;
      currency?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      imageUrl?: string;
      vendor?: string;
    }
  | {
      type: "context_card";
      contextType: "trip" | "segment" | "reservation";
      data: any;
      actions: Array<{
        id: string;
        label: string;
        prompt: string;
      }>;
      onSaved?: () => void;
    }
  | {
      type: "hotel_reservation_card";
      reservationId?: string;
      hotelName: string;
      confirmationNumber?: string;
      checkInDate: string;
      checkInTime?: string;
      checkOutDate: string;
      checkOutTime?: string;
      nights?: number;
      guests?: number;
      rooms?: number;
      roomType?: string;
      address?: string;
      totalCost?: number;
      currency?: string;
      contactPhone?: string;
      contactEmail?: string;
      cancellationPolicy?: string;
      imageUrl?: string;
      url?: string;
    };

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
