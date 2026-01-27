"use server";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
}

export interface PlaceResult {
  description: string;
  placeId: string;
}

/**
 * Autocomplete search for geographic locations (cities, regions, countries)
 * Simplified version for multi-city modal - returns only description and placeId
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
    // Use Autocomplete with type filtering for cities/regions
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

    // Take top 5 predictions and return simplified results
    const predictions: AutocompletePrediction[] = autocompleteData.predictions.slice(0, 5);
    
    return predictions.map(prediction => ({
      description: prediction.description,
      placeId: prediction.place_id,
    }));
    
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}
