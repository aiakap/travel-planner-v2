// Types for place suggestions and Google Places API integration

export interface PlaceSuggestion {
  placeName: string;
  category: "Travel" | "Stay" | "Activity" | "Dining";
  type: string;
  context?: {
    dayNumber?: number;
    timeOfDay?: "morning" | "afternoon" | "evening" | "night";
    specificTime?: string;
    notes?: string;
  };
  tripId?: string;
  segmentId?: string;
}

export interface GooglePlacePhoto {
  photoReference: string;
  width: number;
  height: number;
  url?: string;
}

export interface GooglePlaceData {
  placeId: string;
  name: string;
  formattedAddress: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos?: GooglePlacePhoto[];
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
}

export interface PlaceDetailModalData {
  suggestion: PlaceSuggestion;
  placeData?: GooglePlaceData;
  suggestedDay?: number;
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  estimatedCost?: number;
}

// Types for Google Places Autocomplete
export interface PlaceAutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceAutocompleteResult {
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  placeId: string;
}
