"use server";

import { searchPlace, getPhotoUrl } from "@/lib/actions/google-places";

/**
 * Fetch a destination image from Google Places or Unsplash fallback
 * @param destination - The destination name
 * @param imageQuery - Optional specific search query (e.g., "Eiffel Tower Paris")
 * @param keywords - Optional keywords for Unsplash fallback
 * @returns Image URL
 */
export async function fetchDestinationImage(
  destination: string,
  imageQuery?: string,
  keywords?: string[]
): Promise<string> {
  try {
    // Try Google Places first with the more specific query
    const query = imageQuery || destination;
    const place = await searchPlace(query);
    
    if (place?.photos?.[0]?.reference) {
      const photoUrl = await getPhotoUrl(place.photos[0].reference, 800);
      console.log(`✓ Found Google Places image for: ${query}`);
      return photoUrl;
    }
  } catch (error) {
    console.error("Google Places image fetch failed:", error);
  }
  
  // Fallback to Unsplash
  const searchTerms = keywords?.length 
    ? keywords.join(',')
    : imageQuery || destination;
  
  const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerms)},travel`;
  console.log(`→ Using Unsplash fallback for: ${searchTerms}`);
  
  return unsplashUrl;
}
