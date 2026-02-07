/**
 * Yelp Fusion API Client
 * Standardized wrapper for Yelp API calls
 */

import type { YelpBusinessSourceData } from "@/lib/types/consolidated-place";

const YELP_API_BASE = "https://api.yelp.com/v3";

// Get API key dynamically
function getApiKey(): string | undefined {
  return process.env.YELP_API_KEY;
}

// ============================================================================
// Types
// ============================================================================

export interface YelpSearchOptions {
  location?: string;
  coordinates?: { lat: number; lng: number };
  term?: string;
  categories?: string; // Comma-separated category aliases
  price?: string; // "1", "2", "3", "4" or combination like "1,2"
  radius?: number; // Max 40000 meters
  limit?: number; // Max 50
  offset?: number;
  sortBy?: "best_match" | "rating" | "review_count" | "distance";
  openNow?: boolean;
}

export interface YelpSearchResult {
  businesses: YelpBusinessSourceData[];
  total: number;
  timing: number;
  error?: string;
  isMock?: boolean;
}

export interface YelpBusinessDetailsResult {
  business: YelpBusinessSourceData | null;
  timing: number;
  error?: string;
  isMock?: boolean;
}

// ============================================================================
// Internal Response Types
// ============================================================================

interface YelpBusinessSearchResponse {
  businesses: YelpAPIBusiness[];
  total: number;
  region?: {
    center: { latitude: number; longitude: number };
  };
}

interface YelpAPIBusiness {
  id: string;
  alias: string;
  name: string;
  image_url?: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: Array<{ alias: string; title: string }>;
  rating: number;
  coordinates: { latitude: number; longitude: number };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone?: string;
  display_phone?: string;
  distance?: number;
  photos?: string[];
  hours?: Array<{
    hours_type: string;
    is_open_now: boolean;
    open: Array<{
      day: number;
      start: string;
      end: string;
      is_overnight: boolean;
    }>;
  }>;
}

// ============================================================================
// Core Client Functions
// ============================================================================

/**
 * Search for businesses using Yelp Fusion API
 */
export async function searchBusinesses(
  options: YelpSearchOptions
): Promise<YelpSearchResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("[YelpClient] API key not configured, returning mock data");
    return {
      businesses: getMockBusinesses(options),
      total: 50,
      timing: Date.now() - startTime,
      isMock: true,
    };
  }

  if (!options.location && !options.coordinates) {
    return {
      businesses: [],
      total: 0,
      timing: Date.now() - startTime,
      error: "Location or coordinates required",
    };
  }

  try {
    const params = new URLSearchParams();

    if (options.location) {
      params.append("location", options.location);
    }
    if (options.coordinates) {
      params.append("latitude", options.coordinates.lat.toString());
      params.append("longitude", options.coordinates.lng.toString());
    }
    if (options.term) {
      params.append("term", options.term);
    }
    if (options.categories) {
      params.append("categories", options.categories);
    }
    if (options.price) {
      params.append("price", options.price);
    }
    if (options.radius) {
      params.append("radius", Math.min(options.radius, 40000).toString());
    }
    if (options.limit) {
      params.append("limit", Math.min(options.limit, 50).toString());
    }
    if (options.offset !== undefined) {
      params.append("offset", options.offset.toString());
    }
    if (options.sortBy) {
      params.append("sort_by", options.sortBy);
    }
    if (options.openNow !== undefined) {
      params.append("open_now", options.openNow.toString());
    }

    const url = `${YELP_API_BASE}/businesses/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        businesses: [],
        total: 0,
        timing: Date.now() - startTime,
        error: errorData.error?.description || `Yelp API error: ${response.status}`,
      };
    }

    const data: YelpBusinessSearchResponse = await response.json();

    const businesses = data.businesses.map(transformYelpBusiness);

    return {
      businesses,
      total: data.total,
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[YelpClient] Search error:", error);
    return {
      businesses: [],
      total: 0,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get business details by ID
 */
export async function getBusinessDetails(
  businessId: string
): Promise<YelpBusinessDetailsResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("[YelpClient] API key not configured, returning mock data");
    return {
      business: getMockBusinessDetails(businessId),
      timing: Date.now() - startTime,
      isMock: true,
    };
  }

  try {
    const url = `${YELP_API_BASE}/businesses/${businessId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        business: null,
        timing: Date.now() - startTime,
        error: errorData.error?.description || `Yelp API error: ${response.status}`,
      };
    }

    const data: YelpAPIBusiness = await response.json();

    return {
      business: transformYelpBusiness(data),
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[YelpClient] Details error:", error);
    return {
      business: null,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search for restaurants specifically
 */
export async function searchRestaurants(options: {
  location?: string;
  coordinates?: { lat: number; lng: number };
  cuisine?: string;
  price?: string;
  limit?: number;
  sortBy?: "best_match" | "rating" | "review_count" | "distance";
}): Promise<YelpSearchResult> {
  return searchBusinesses({
    ...options,
    categories: options.cuisine || "restaurants",
    term: options.cuisine ? `${options.cuisine} restaurant` : undefined,
  });
}

/**
 * Search for hotels specifically
 */
export async function searchHotels(options: {
  location?: string;
  coordinates?: { lat: number; lng: number };
  limit?: number;
}): Promise<YelpSearchResult> {
  return searchBusinesses({
    ...options,
    categories: "hotels",
  });
}

/**
 * Search for activities and tours
 */
export async function searchActivities(options: {
  location?: string;
  coordinates?: { lat: number; lng: number };
  term?: string;
  limit?: number;
}): Promise<YelpSearchResult> {
  return searchBusinesses({
    ...options,
    categories: "tours,landmarks,museums,arts",
    term: options.term,
  });
}

// ============================================================================
// Transform Functions
// ============================================================================

function transformYelpBusiness(business: YelpAPIBusiness): YelpBusinessSourceData {
  return {
    businessId: business.id,
    alias: business.alias,
    name: business.name,
    imageUrl: business.image_url,
    isClosed: business.is_closed,
    url: business.url,
    reviewCount: business.review_count,
    rating: business.rating,
    categories: business.categories,
    coordinates: {
      latitude: business.coordinates.latitude,
      longitude: business.coordinates.longitude,
    },
    transactions: business.transactions,
    price: business.price,
    location: {
      address1: business.location.address1,
      address2: business.location.address2,
      address3: business.location.address3,
      city: business.location.city,
      zipCode: business.location.zip_code,
      country: business.location.country,
      state: business.location.state,
      displayAddress: business.location.display_address,
    },
    phone: business.phone,
    displayPhone: business.display_phone,
    distance: business.distance,
    photos: business.photos,
    hours: business.hours?.map((h) => ({
      hoursType: h.hours_type,
      isOpenNow: h.is_open_now,
      open: h.open.map((o) => ({
        day: o.day,
        start: o.start,
        end: o.end,
        isOvernight: o.is_overnight,
      })),
    })),
  };
}

// ============================================================================
// Mock Data
// ============================================================================

function getMockBusinesses(options: YelpSearchOptions): YelpBusinessSourceData[] {
  const cuisines = [
    "Italian",
    "Japanese",
    "Mexican",
    "French",
    "American",
    "Chinese",
    "Thai",
    "Indian",
  ];
  const names = [
    "Bella Vista",
    "Sakura",
    "El Toro",
    "Le Petit",
    "The Grill",
    "Dragon Palace",
    "Spice Garden",
    "Curry House",
  ];

  const limit = Math.min(options.limit || 10, 10);
  const location = options.location || "Unknown Location";

  return Array.from({ length: limit }, (_, i) => ({
    businessId: `mock-business-${i}`,
    alias: `mock-${names[i % names.length].toLowerCase().replace(/\s/g, "-")}-${location.toLowerCase().replace(/\s/g, "-")}`,
    name: `${names[i % names.length]} ${location}`,
    imageUrl: "https://via.placeholder.com/300x200",
    isClosed: false,
    url: `https://www.yelp.com/biz/mock-${i}`,
    reviewCount: Math.floor(Math.random() * 500) + 50,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    categories: [
      {
        alias: cuisines[i % cuisines.length].toLowerCase(),
        title: cuisines[i % cuisines.length],
      },
    ],
    coordinates: {
      latitude: (options.coordinates?.lat || 40.7128) + (Math.random() - 0.5) * 0.1,
      longitude: (options.coordinates?.lng || -74.006) + (Math.random() - 0.5) * 0.1,
    },
    transactions: ["delivery", "pickup"],
    price: "$".repeat(Math.floor(Math.random() * 4) + 1),
    location: {
      address1: `${100 + i} Main Street`,
      city: location,
      zipCode: "10001",
      country: "US",
      state: "NY",
      displayAddress: [`${100 + i} Main Street`, `${location}, NY 10001`],
    },
    phone: "+12125551234",
    displayPhone: "(212) 555-1234",
    distance: Math.random() * 5000,
  }));
}

function getMockBusinessDetails(id: string): YelpBusinessSourceData {
  return {
    businessId: id,
    alias: "mock-restaurant",
    name: "Mock Restaurant",
    imageUrl: "https://via.placeholder.com/600x400",
    isClosed: false,
    url: "https://www.yelp.com/biz/mock",
    reviewCount: 250,
    rating: 4.5,
    categories: [
      { alias: "italian", title: "Italian" },
      { alias: "pizza", title: "Pizza" },
    ],
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    transactions: ["delivery", "pickup", "restaurant_reservation"],
    price: "$$",
    location: {
      address1: "123 Main Street",
      city: "New York",
      zipCode: "10001",
      country: "US",
      state: "NY",
      displayAddress: ["123 Main Street", "New York, NY 10001"],
    },
    phone: "+12125551234",
    displayPhone: "(212) 555-1234",
    photos: [
      "https://via.placeholder.com/600x400",
      "https://via.placeholder.com/600x400",
      "https://via.placeholder.com/600x400",
    ],
    hours: [
      {
        hoursType: "REGULAR",
        isOpenNow: true,
        open: [
          { day: 0, start: "1100", end: "2200", isOvernight: false },
          { day: 1, start: "1100", end: "2200", isOvernight: false },
          { day: 2, start: "1100", end: "2200", isOvernight: false },
          { day: 3, start: "1100", end: "2200", isOvernight: false },
          { day: 4, start: "1100", end: "2300", isOvernight: false },
          { day: 5, start: "1100", end: "2300", isOvernight: false },
          { day: 6, start: "1200", end: "2100", isOvernight: false },
        ],
      },
    ],
  };
}

/**
 * Check if Yelp API is configured
 */
export function isConfigured(): boolean {
  return !!getApiKey();
}

// ============================================================================
// Exports
// ============================================================================

export const yelpClient = {
  search: searchBusinesses,
  getDetails: getBusinessDetails,
  searchRestaurants,
  searchHotels,
  searchActivities,
  isConfigured,
};

export default yelpClient;
