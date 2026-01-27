"use server";

import { getTimeZoneForLocation } from '@/lib/actions/timezone';

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
}

interface PlaceDetailsResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlaceResult {
  name: string;
  image: string | null;
  placeId: string;
  lat: number;
  lng: number;
  timezone?: string;
  timezoneOffset?: number;
}

/**
 * Autocomplete search for geographic locations (cities, regions, countries)
 * Returns results with guaranteed images, coordinates, and timezone data
 */
export async function searchPlacesAutocomplete(
  query: string
): Promise<PlaceResult[]> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return [];
  }

  if (query.length < 2) {
    return [];
  }

  try {
    // Step 1: Use Autocomplete with type filtering for cities/regions
    const autocompleteUrl = new URL(`${PLACES_API_BASE}/autocomplete/json`);
    autocompleteUrl.searchParams.append("input", query);
    autocompleteUrl.searchParams.append("types", "(regions)"); // Filters to cities, regions, countries
    autocompleteUrl.searchParams.append("language", "en");
    autocompleteUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const autocompleteResponse = await fetch(autocompleteUrl.toString());
    const autocompleteData = await autocompleteResponse.json();

    if (autocompleteData.status !== "OK" || !autocompleteData.predictions) {
      return [];
    }

    // Take top 5 predictions
    const predictions: AutocompletePrediction[] = autocompleteData.predictions.slice(0, 5);

    // Step 2: Get Place Details for each to fetch photos and coordinates
    const detailsPromises = predictions.map(async (prediction) => {
      try {
        const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
        detailsUrl.searchParams.append("place_id", prediction.place_id);
        detailsUrl.searchParams.append("fields", "name,geometry,photos,formatted_address");
        detailsUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        if (detailsData.status !== "OK" || !detailsData.result) {
          return null;
        }

        const place: PlaceDetailsResult = detailsData.result;
        
        // Get image URL from place photo OR fallback to Unsplash
        let imageUrl: string;
        
        if (place.photos && place.photos.length > 0) {
          const photoRef = place.photos[0].photo_reference;
          imageUrl = `${PLACES_API_BASE}/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
        } else {
          // Fallback: Use Unsplash for guaranteed images
          const locationName = encodeURIComponent(place.name);
          imageUrl = `https://source.unsplash.com/800x600/?${locationName},travel,landmark`;
        }

        // Fetch timezone data for this location
        const timezoneData = await getTimeZoneForLocation(
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        // Use clean name instead of formatted_address
        return {
          name: place.name, // Clean name like "Paris", "Tokyo", "California"
          image: imageUrl,
          placeId: prediction.place_id,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          timezone: timezoneData?.timeZoneId,
          timezoneOffset: timezoneData ? (timezoneData.offset + timezoneData.dstOffset) / 3600 : undefined,
        };
      } catch (error) {
        console.error(`Error fetching details for place ${prediction.place_id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(detailsPromises);
    
    // Filter out nulls and return
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
    
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}
