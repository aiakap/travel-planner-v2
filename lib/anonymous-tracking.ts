"use client";

/**
 * Anonymous tracking for logged-out users
 * Stores activity in localStorage for session persistence
 */

export interface AnonymousActivity {
  sessionId: string;
  location: {
    city?: string;
    region?: string;
    country?: string;
    timestamp?: number;
  };
  clickedPlaces: Array<{
    placeName: string;
    timestamp: number;
    category: string;
  }>;
  searchQueries: Array<{
    query: string;
    timestamp: number;
  }>;
  sessionStart: number;
  lastActive: number;
}

const STORAGE_KEY = "anonymous_activity";
const MAX_CLICKS = 20;
const MAX_SEARCHES = 10;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Get or initialize anonymous activity
 */
export function getAnonymousActivity(): AnonymousActivity {
  if (typeof window === "undefined") {
    // Server-side, return empty activity
    return {
      sessionId: "",
      location: {},
      clickedPlaces: [],
      searchQueries: [],
      sessionStart: Date.now(),
      lastActive: Date.now(),
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const activity: AnonymousActivity = JSON.parse(stored);
      // Update last active
      activity.lastActive = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
      return activity;
    }
  } catch (error) {
    console.error("Error reading anonymous activity:", error);
  }

  // Initialize new activity
  const newActivity: AnonymousActivity = {
    sessionId: generateSessionId(),
    location: {},
    clickedPlaces: [],
    searchQueries: [],
    sessionStart: Date.now(),
    lastActive: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newActivity));
  return newActivity;
}

/**
 * Track a place click
 */
export function trackPlaceClick(placeName: string, category: string): void {
  if (typeof window === "undefined") return;

  try {
    const activity = getAnonymousActivity();
    
    // Check if this place was already clicked recently (within 1 minute)
    const recentClick = activity.clickedPlaces.find(
      (p) => p.placeName === placeName && Date.now() - p.timestamp < 60000
    );
    
    if (!recentClick) {
      activity.clickedPlaces.unshift({
        placeName,
        timestamp: Date.now(),
        category,
      });

      // Keep only the most recent clicks
      activity.clickedPlaces = activity.clickedPlaces.slice(0, MAX_CLICKS);
      activity.lastActive = Date.now();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
    }
  } catch (error) {
    console.error("Error tracking place click:", error);
  }
}

/**
 * Track a search query
 */
export function trackSearch(query: string): void {
  if (typeof window === "undefined") return;
  if (!query.trim()) return;

  try {
    const activity = getAnonymousActivity();
    
    // Check if this exact query was already searched recently (within 5 minutes)
    const recentSearch = activity.searchQueries.find(
      (s) => s.query === query && Date.now() - s.timestamp < 300000
    );
    
    if (!recentSearch) {
      activity.searchQueries.unshift({
        query,
        timestamp: Date.now(),
      });

      // Keep only the most recent searches
      activity.searchQueries = activity.searchQueries.slice(0, MAX_SEARCHES);
      activity.lastActive = Date.now();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
    }
  } catch (error) {
    console.error("Error tracking search:", error);
  }
}

/**
 * Update location information
 */
export function updateLocation(location: {
  city?: string;
  region?: string;
  country?: string;
}): void {
  if (typeof window === "undefined") return;

  try {
    const activity = getAnonymousActivity();
    activity.location = {
      ...location,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
  } catch (error) {
    console.error("Error updating location:", error);
  }
}

/**
 * Detect location using browser geolocation API (requires user permission)
 */
export async function detectLocation(): Promise<void> {
  if (typeof window === "undefined" || !navigator.geolocation) return;

  try {
    // Try browser geolocation first
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      });
    });

    // Reverse geocode using a free API (nominatim)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
    );
    
    if (response.ok) {
      const data = await response.json();
      updateLocation({
        city: data.address?.city || data.address?.town || data.address?.village,
        region: data.address?.state,
        country: data.address?.country,
      });
      return;
    }
  } catch (error) {
    // Geolocation failed or denied, try IP-based location
    console.log("Browser geolocation unavailable, trying IP-based location");
  }

  // Fallback to IP-based location
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = await response.json();
      updateLocation({
        city: data.city,
        region: data.region,
        country: data.country_name,
      });
    }
  } catch (error) {
    console.error("Error detecting location:", error);
  }
}

/**
 * Clear all anonymous activity
 */
export function clearAnonymousActivity(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing anonymous activity:", error);
  }
}

/**
 * Get session duration in minutes
 */
export function getSessionDuration(): number {
  const activity = getAnonymousActivity();
  const durationMs = Date.now() - activity.sessionStart;
  return Math.floor(durationMs / 60000);
}
