/**
 * Calculate travel time between two cities using Google Distance Matrix API
 * Used to determine if a travel segment (flight) should be created
 */

interface TravelTimeResult {
  durationHours: number
  distanceKm: number
  mode: "driving" | "flight"
  durationText?: string
  distanceText?: string
}

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      status: string
      duration?: {
        value: number // seconds
        text: string
      }
      distance?: {
        value: number // meters
        text: string
      }
    }>
  }>
  status: string
}

// In-memory cache for travel times (session-only)
const travelTimeCache = new Map<string, TravelTimeResult>()

/**
 * Calculate Haversine distance between two coordinates
 * Fallback when geocoding works but Distance Matrix fails
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Geocode a city name to get coordinates
 */
async function geocodeCity(city: string): Promise<{
  lat: number
  lng: number
  formatted: string
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn("Google Maps API key not configured")
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        city
      )}&key=${apiKey}`
    )
    const data = await response.json()

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0]
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address,
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error)
  }

  return null
}

/**
 * Calculate travel time between two cities
 * Returns duration in hours and determines if flight is needed (>5 hours)
 */
export async function calculateTravelTime(
  origin: string,
  destination: string
): Promise<TravelTimeResult> {
  // Check cache first
  const cacheKey = `${origin.toLowerCase()}|${destination.toLowerCase()}`
  const cached = travelTimeCache.get(cacheKey)
  if (cached) {
    console.log(`[TravelTime] Cache hit: ${origin} → ${destination}`)
    return cached
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  // Fallback if no API key
  if (!apiKey) {
    console.warn("Google Maps API key not configured, using heuristic fallback")
    return useFallbackHeuristic(origin, destination)
  }

  try {
    // Try Distance Matrix API with driving mode
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json")
    url.searchParams.append("origins", origin)
    url.searchParams.append("destinations", destination)
    url.searchParams.append("mode", "driving")
    url.searchParams.append("key", apiKey)

    const response = await fetch(url.toString())
    const data: DistanceMatrixResponse = await response.json()

    if (data.status === "OK" && data.rows[0]?.elements[0]) {
      const element = data.rows[0].elements[0]

      if (element.status === "OK" && element.duration && element.distance) {
        const durationHours = element.duration.value / 3600
        const distanceKm = element.distance.value / 1000

        // Determine if flight is needed
        // Use flight if driving > 8 hours OR distance > 800km
        const mode = durationHours > 8 || distanceKm > 800 ? "flight" : "driving"

        const result: TravelTimeResult = {
          durationHours,
          distanceKm,
          mode,
          durationText: element.duration.text,
          distanceText: element.distance.text,
        }

        // Cache result
        travelTimeCache.set(cacheKey, result)
        console.log(
          `[TravelTime] ${origin} → ${destination}: ${durationHours.toFixed(1)}h, ${distanceKm.toFixed(0)}km (${mode})`
        )

        return result
      }
    }

    // If Distance Matrix fails, try fallback with geocoding
    console.warn(
      `Distance Matrix API failed (${data.status}), trying geocoding fallback`
    )
    return await useFallbackHeuristic(origin, destination)
  } catch (error) {
    console.error("Error calculating travel time:", error)
    return await useFallbackHeuristic(origin, destination)
  }
}

/**
 * Fallback heuristic using geocoding and Haversine distance
 */
async function useFallbackHeuristic(
  origin: string,
  destination: string
): Promise<TravelTimeResult> {
  try {
    const [originGeo, destGeo] = await Promise.all([
      geocodeCity(origin),
      geocodeCity(destination),
    ])

    if (originGeo && destGeo) {
      const distanceKm = calculateHaversineDistance(
        originGeo.lat,
        originGeo.lng,
        destGeo.lat,
        destGeo.lng
      )

      // Estimate travel time: 80 km/h average for driving
      const estimatedDrivingHours = distanceKm / 80

      // Use flight if distance > 800km or estimated driving > 8 hours
      const mode = distanceKm > 800 || estimatedDrivingHours > 8 ? "flight" : "driving"

      const result: TravelTimeResult = {
        durationHours: mode === "flight" ? distanceKm / 800 : estimatedDrivingHours, // ~800 km/h for flight
        distanceKm,
        mode,
      }

      console.log(
        `[TravelTime] Fallback: ${origin} → ${destination}: ${result.durationHours.toFixed(1)}h, ${distanceKm.toFixed(0)}km (${mode})`
      )

      return result
    }
  } catch (error) {
    console.error("Fallback heuristic error:", error)
  }

  // Ultimate fallback: assume short distance
  console.warn(`Failed to calculate travel time for ${origin} → ${destination}, assuming short distance`)
  return {
    durationHours: 2,
    distanceKm: 100,
    mode: "driving",
  }
}

/**
 * Determine if a travel segment should be created based on travel time
 * Rule: Create flight segment if travel time > 5 hours
 */
export function shouldCreateTravelSegment(travelTimeHours: number): boolean {
  return travelTimeHours > 5
}

/**
 * Clear the travel time cache (useful for testing)
 */
export function clearTravelTimeCache(): void {
  travelTimeCache.clear()
  console.log("[TravelTime] Cache cleared")
}
