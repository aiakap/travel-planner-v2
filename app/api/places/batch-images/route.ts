import { NextRequest, NextResponse } from "next/server";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

// Simple in-memory cache for photo URLs (survives across requests in the same server instance)
const photoCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface ImageQuery {
  query: string;
  index: number;
  fallbackKeywords?: string[];
}

interface ImageResult {
  index: number;
  url: string;
  source: "google" | "unsplash" | "cache";
}

async function getPhotoForQuery(
  query: string,
  fallbackKeywords?: string[],
  apiKey?: string
): Promise<{ url: string; source: "google" | "unsplash" | "cache" }> {
  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { url: cached.url, source: "cache" };
  }

  if (!apiKey) {
    // Fallback to Unsplash
    const searchTerms = fallbackKeywords?.join(",") || query;
    return {
      url: `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerms)},travel`,
      source: "unsplash",
    };
  }

  try {
    // Text search to find the place
    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.append("query", query);
    searchUrl.searchParams.append("language", "en");
    searchUrl.searchParams.append("key", apiKey);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" || !searchData.results?.length) {
      throw new Error("No results");
    }

    const placeId = searchData.results[0].place_id;

    // Get place details with photos
    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.append("place_id", placeId);
    detailsUrl.searchParams.append("fields", "photos");
    detailsUrl.searchParams.append("key", apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (detailsData.status === "OK" && detailsData.result?.photos?.[0]) {
      const photoRef = detailsData.result.photos[0].photo_reference;
      const photoUrl = `${PLACES_API_BASE}/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;

      // Cache the result
      photoCache.set(cacheKey, { url: photoUrl, timestamp: Date.now() });

      return { url: photoUrl, source: "google" };
    }

    throw new Error("No photos");
  } catch {
    // Fallback to Unsplash
    const searchTerms = fallbackKeywords?.join(",") || query;
    const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerms)},travel`;
    return { url: unsplashUrl, source: "unsplash" };
  }
}

/**
 * Batch fetch images for multiple queries
 * POST /api/places/batch-images
 * Body: { queries: [{ query: string, index: number, fallbackKeywords?: string[] }] }
 */
export async function POST(req: NextRequest) {
  try {
    const { queries } = (await req.json()) as { queries: ImageQuery[] };

    if (!queries || !Array.isArray(queries)) {
      return NextResponse.json({ error: "Invalid queries" }, { status: 400 });
    }

    const apiKey = getApiKey();

    // Fetch all images in parallel
    const results = await Promise.all(
      queries.map(async ({ query, index, fallbackKeywords }): Promise<ImageResult> => {
        const { url, source } = await getPhotoForQuery(query, fallbackKeywords, apiKey);
        return { index, url, source };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in batch-images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
