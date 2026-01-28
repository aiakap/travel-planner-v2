"use server";

/**
 * Fetch location image from Google Places API
 * Returns the first photo URL for a given location
 */
export async function getLocationImage(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    // First, find nearby places using Nearby Search
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100&key=${apiKey}`;
    
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();

    if (nearbyData.status !== "OK" || !nearbyData.results || nearbyData.results.length === 0) {
      // Try a wider radius
      const widerUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&key=${apiKey}`;
      const widerResponse = await fetch(widerUrl);
      const widerData = await widerResponse.json();
      
      if (widerData.status !== "OK" || !widerData.results || widerData.results.length === 0) {
        return null;
      }
      
      // Find first place with photos
      const placeWithPhoto = widerData.results.find((place: any) => place.photos && place.photos.length > 0);
      if (!placeWithPhoto) return null;
      
      const photoReference = placeWithPhoto.photos[0].photo_reference;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
    }

    // Find first place with photos
    const placeWithPhoto = nearbyData.results.find((place: any) => place.photos && place.photos.length > 0);
    if (!placeWithPhoto) return null;

    const photoReference = placeWithPhoto.photos[0].photo_reference;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
  } catch (error) {
    console.error("Error fetching location image:", error);
    return null;
  }
}

/**
 * Fetch location image from a place ID
 */
export async function getLocationImageByPlaceId(
  placeId: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    // Get place details
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== "OK" || !data.result || !data.result.photos || data.result.photos.length === 0) {
      return null;
    }

    const photoReference = data.result.photos[0].photo_reference;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
  } catch (error) {
    console.error("Error fetching location image by place ID:", error);
    return null;
  }
}
