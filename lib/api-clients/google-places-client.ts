/**
 * Google Places API Client
 * Standardized wrapper for Google Places API calls
 */

import type { GooglePlaceSourceData } from "@/lib/types/consolidated-place";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const PLACES_API_NEW = "https://places.googleapis.com/v1";

// Get API key dynamically
function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

// ============================================================================
// Types
// ============================================================================

export interface GooglePlacesSearchOptions {
  query: string;
  locationContext?: string;
  coordinates?: { lat: number; lng: number };
  radius?: number; // meters
  types?: string[];
  maxResults?: number;
  includePhotos?: boolean;
}

export interface GooglePlacesSearchResult {
  places: GooglePlaceSourceData[];
  totalResults: number;
  timing: number;
  error?: string;
}

export interface GooglePlaceDetailsOptions {
  placeId: string;
  fields?: string[];
  includePhotos?: boolean;
}

// ============================================================================
// Internal Response Types
// ============================================================================

interface PlacesTextSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types?: string[];
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    business_status?: string;
  }>;
  status: string;
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
    opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
    };
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types?: string[];
    editorial_summary?: {
      overview: string;
    };
    utc_offset?: number;
    business_status?: string;
  };
  status: string;
  error_message?: string;
}

// ============================================================================
// Core Client Functions
// ============================================================================

/**
 * Search for places using Google Places Text Search API
 */
export async function searchPlaces(
  options: GooglePlacesSearchOptions
): Promise<GooglePlacesSearchResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      places: [],
      totalResults: 0,
      timing: Date.now() - startTime,
      error: "Google Places API key not configured",
    };
  }

  try {
    // Construct search query with location context if provided
    let query = options.query;
    if (options.locationContext) {
      query = `${options.query} in ${options.locationContext}`;
    }

    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.append("query", query);
    searchUrl.searchParams.append("language", "en");
    searchUrl.searchParams.append("key", apiKey);

    // Add location bias if coordinates provided
    if (options.coordinates) {
      searchUrl.searchParams.append(
        "location",
        `${options.coordinates.lat},${options.coordinates.lng}`
      );
      if (options.radius) {
        searchUrl.searchParams.append("radius", options.radius.toString());
      }
    }

    // Add type filter if specified
    if (options.types && options.types.length > 0) {
      searchUrl.searchParams.append("type", options.types[0]); // Only one type supported
    }

    const searchResponse = await fetch(searchUrl.toString());
    const searchData: PlacesTextSearchResponse = await searchResponse.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      return {
        places: [],
        totalResults: 0,
        timing: Date.now() - startTime,
        error: searchData.error_message || `Search failed: ${searchData.status}`,
      };
    }

    if (searchData.status === "ZERO_RESULTS" || !searchData.results.length) {
      return {
        places: [],
        totalResults: 0,
        timing: Date.now() - startTime,
      };
    }

    // Limit results
    const maxResults = options.maxResults || 10;
    const limitedResults = searchData.results.slice(0, maxResults);

    // Get detailed information for each place
    const detailedPlaces = await Promise.all(
      limitedResults.map((place) =>
        getPlaceDetails({
          placeId: place.place_id,
          includePhotos: options.includePhotos !== false,
        })
      )
    );

    const validPlaces = detailedPlaces.filter(
      (p): p is GooglePlaceSourceData => p !== null
    );

    return {
      places: validPlaces,
      totalResults: searchData.results.length,
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[GooglePlacesClient] Search error:", error);
    return {
      places: [],
      totalResults: 0,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get detailed place information by place_id
 */
export async function getPlaceDetails(
  options: GooglePlaceDetailsOptions
): Promise<GooglePlaceSourceData | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("[GooglePlacesClient] API key not configured");
    return null;
  }

  try {
    const defaultFields = [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "url",
      "rating",
      "user_ratings_total",
      "price_level",
      "photos",
      "opening_hours",
      "geometry",
      "types",
      "editorial_summary",
      "utc_offset",
      "business_status",
    ];

    const fields = options.fields || defaultFields;

    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.append("place_id", options.placeId);
    detailsUrl.searchParams.append("fields", fields.join(","));
    detailsUrl.searchParams.append("language", "en");
    detailsUrl.searchParams.append("key", apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData: PlaceDetailsResponse = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      console.error(
        "[GooglePlacesClient] Details fetch failed:",
        detailsData.status
      );
      return null;
    }

    const details = detailsData.result;

    // Format photos with URLs
    const photos =
      options.includePhotos !== false && details.photos
        ? details.photos.slice(0, 5).map((photo) => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            url: getPhotoUrl(photo.photo_reference, 800),
          }))
        : undefined;

    return {
      placeId: details.place_id,
      name: details.name,
      formattedAddress: details.formatted_address,
      rating: details.rating,
      userRatingsTotal: details.user_ratings_total,
      priceLevel: details.price_level,
      photos,
      formattedPhoneNumber: details.formatted_phone_number,
      internationalPhoneNumber: details.international_phone_number,
      website: details.website,
      url: details.url,
      location: details.geometry?.location
        ? {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
          }
        : undefined,
      openingHours: details.opening_hours
        ? {
            openNow: details.opening_hours.open_now,
            weekdayText: details.opening_hours.weekday_text,
            periods: details.opening_hours.periods,
          }
        : undefined,
      editorialSummary: details.editorial_summary?.overview,
      types: details.types,
      businessStatus: details.business_status,
      utcOffset: details.utc_offset,
    };
  } catch (error) {
    console.error("[GooglePlacesClient] Details error:", error);
    return null;
  }
}

/**
 * Search for places nearby a location
 */
export async function searchNearby(options: {
  coordinates: { lat: number; lng: number };
  radius?: number;
  types?: string[];
  keyword?: string;
  maxResults?: number;
}): Promise<GooglePlacesSearchResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      places: [],
      totalResults: 0,
      timing: Date.now() - startTime,
      error: "Google Places API key not configured",
    };
  }

  try {
    const nearbyUrl = new URL(`${PLACES_API_BASE}/nearbysearch/json`);
    nearbyUrl.searchParams.append(
      "location",
      `${options.coordinates.lat},${options.coordinates.lng}`
    );
    nearbyUrl.searchParams.append(
      "radius",
      (options.radius || 1000).toString()
    );
    nearbyUrl.searchParams.append("language", "en");
    nearbyUrl.searchParams.append("key", apiKey);

    if (options.types && options.types.length > 0) {
      nearbyUrl.searchParams.append("type", options.types[0]);
    }

    if (options.keyword) {
      nearbyUrl.searchParams.append("keyword", options.keyword);
    }

    const response = await fetch(nearbyUrl.toString());
    const data: PlacesTextSearchResponse = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return {
        places: [],
        totalResults: 0,
        timing: Date.now() - startTime,
        error: data.error_message || `Nearby search failed: ${data.status}`,
      };
    }

    const maxResults = options.maxResults || 10;
    const limitedResults = (data.results || []).slice(0, maxResults);

    const detailedPlaces = await Promise.all(
      limitedResults.map((place) =>
        getPlaceDetails({
          placeId: place.place_id,
          includePhotos: true,
        })
      )
    );

    const validPlaces = detailedPlaces.filter(
      (p): p is GooglePlaceSourceData => p !== null
    );

    return {
      places: validPlaces,
      totalResults: data.results?.length || 0,
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[GooglePlacesClient] Nearby search error:", error);
    return {
      places: [],
      totalResults: 0,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get photo URL from Google Places
 */
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "/placeholder.svg";
  }

  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

/**
 * Check if Google Places API is configured
 */
export function isConfigured(): boolean {
  return !!getApiKey();
}

// ============================================================================
// Exports
// ============================================================================

export const googlePlacesClient = {
  search: searchPlaces,
  getDetails: getPlaceDetails,
  searchNearby,
  getPhotoUrl,
  isConfigured,
};

export default googlePlacesClient;
