"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateTravelTime, shouldCreateTravelSegment } from "@/lib/google-maps/calculate-travel-time"
import { linkConversationToTrip } from "./link-conversation-to-trip"
import { getSegmentTimeZones } from "./timezone"

interface CityStop {
  city: string
  durationDays: number
}

interface CreateMultiCityTripParams {
  title?: string
  startDate: Date
  cities: CityStop[]
  conversationId?: string
}

interface SegmentInfo {
  id: string
  name: string
  type: string
  startDate: Date
  endDate: Date
  location: string
}

export interface CreateMultiCityTripResult {
  tripId: string
  segments: SegmentInfo[]
  totalDays: number
}

/**
 * Geocode a city to get coordinates
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
 * Create a multi-city trip with automatic segment generation
 * Creates stay segments for each city and travel segments for journeys >5 hours
 */
export async function createMultiCityTrip({
  title,
  startDate,
  cities,
  conversationId,
}: CreateMultiCityTripParams): Promise<CreateMultiCityTripResult> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Validate input
  if (cities.length === 0) {
    throw new Error("At least one city is required")
  }

  for (const city of cities) {
    if (!city.city.trim()) {
      throw new Error("All cities must have a name")
    }
    if (city.durationDays < 1) {
      throw new Error("Duration must be at least 1 day")
    }
  }

  // Generate trip title if not provided
  const cityNames = cities.map(c => c.city.split(',')[0].trim())
  const tripTitle = title || (
    cityNames.length === 1 
      ? `Trip to ${cityNames[0]}`
      : cityNames.length === 2
      ? `${cityNames[0]} & ${cityNames[1]}`
      : `${cityNames[0]}, ${cityNames[1]} & ${cityNames.length - 2} more`
  )

  // Calculate total duration
  const totalDays = cities.reduce((sum, city) => sum + city.durationDays, 0)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + totalDays)

  console.log(`[MultiCityTrip] Creating trip: ${tripTitle}`)
  console.log(`[MultiCityTrip] Cities: ${cityNames.join(' → ')}`)
  console.log(`[MultiCityTrip] Duration: ${totalDays} days`)

  // Create trip
  const trip = await prisma.trip.create({
    data: {
      userId: session.user.id,
      title: tripTitle,
      description: `Multi-city trip: ${cityNames.join(', ')}`,
      startDate,
      endDate,
    },
  })

  console.log(`✓ Created trip: ${trip.id}`)

  // Link conversation if provided
  if (conversationId) {
    try {
      await linkConversationToTrip(conversationId, trip.id, tripTitle)
      console.log(`✓ Linked conversation ${conversationId} to trip ${trip.id}`)
    } catch (error) {
      console.error("❌ Failed to link conversation:", error)
      // Don't fail the whole operation
    }
  }

  // Get segment types from database
  const [stayType, flightType] = await Promise.all([
    prisma.segmentType.findFirst({ where: { name: "Other" } }),
    prisma.segmentType.findFirst({ where: { name: "Flight" } }),
  ])

  if (!stayType || !flightType) {
    throw new Error("Required segment types not found in database")
  }

  // Create segments
  const segments: SegmentInfo[] = []
  let currentDate = new Date(startDate)
  let segmentOrder = 0

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i]
    const nextCity = cities[i + 1]

    // Geocode current city
    const cityGeo = await geocodeCity(city.city)

    // Calculate stay end date
    const stayEndDate = new Date(currentDate)
    stayEndDate.setDate(stayEndDate.getDate() + city.durationDays)

    // Fetch timezone information for stay segment
    const stayTimezones = cityGeo ? await getSegmentTimeZones(
      cityGeo.lat,
      cityGeo.lng,
      cityGeo.lat,
      cityGeo.lng,
      currentDate,
      stayEndDate
    ) : { start: null, end: null, hasTimeZoneChange: false }

    // Create stay segment
    const staySegment = await prisma.segment.create({
      data: {
        tripId: trip.id,
        name: `Stay in ${city.city.split(',')[0].trim()}`,
        startTitle: city.city,
        startLat: cityGeo?.lat || 0,
        startLng: cityGeo?.lng || 0,
        endTitle: city.city,
        endLat: cityGeo?.lat || 0,
        endLng: cityGeo?.lng || 0,
        startTime: currentDate,
        endTime: stayEndDate,
        startTimeZoneId: stayTimezones.start?.timeZoneId ?? null,
        startTimeZoneName: stayTimezones.start?.timeZoneName ?? null,
        endTimeZoneId: stayTimezones.end?.timeZoneId ?? null,
        endTimeZoneName: stayTimezones.end?.timeZoneName ?? null,
        order: segmentOrder++,
        segmentTypeId: stayType.id,
      },
    })

    segments.push({
      id: staySegment.id,
      name: staySegment.name,
      type: "Stay",
      startDate: currentDate,
      endDate: stayEndDate,
      location: city.city,
    })

    console.log(`✓ Created stay segment: ${staySegment.name} (${city.durationDays} days)`)

    // Check if we need a travel segment to next city
    if (nextCity) {
      console.log(`[MultiCityTrip] Calculating travel time: ${city.city} → ${nextCity.city}`)
      
      const travelTime = await calculateTravelTime(city.city, nextCity.city)
      
      if (shouldCreateTravelSegment(travelTime.durationHours)) {
        // Create flight segment
        const nextCityGeo = await geocodeCity(nextCity.city)
        
        // Travel segment starts at end of stay, duration = 1 day
        const travelStartDate = new Date(stayEndDate)
        const travelEndDate = new Date(stayEndDate)
        travelEndDate.setDate(travelEndDate.getDate() + 1)

        // Fetch timezone information for travel segment
        const travelTimezones = (cityGeo && nextCityGeo) ? await getSegmentTimeZones(
          cityGeo.lat,
          cityGeo.lng,
          nextCityGeo.lat,
          nextCityGeo.lng,
          travelStartDate,
          travelEndDate
        ) : { start: null, end: null, hasTimeZoneChange: false }

        const travelSegment = await prisma.segment.create({
          data: {
            tripId: trip.id,
            name: `${city.city.split(',')[0].trim()} → ${nextCity.city.split(',')[0].trim()}`,
            startTitle: city.city,
            startLat: cityGeo?.lat || 0,
            startLng: cityGeo?.lng || 0,
            endTitle: nextCity.city,
            endLat: nextCityGeo?.lat || 0,
            endLng: nextCityGeo?.lng || 0,
            startTime: travelStartDate,
            endTime: travelEndDate,
            startTimeZoneId: travelTimezones.start?.timeZoneId ?? null,
            startTimeZoneName: travelTimezones.start?.timeZoneName ?? null,
            endTimeZoneId: travelTimezones.end?.timeZoneId ?? null,
            endTimeZoneName: travelTimezones.end?.timeZoneName ?? null,
            order: segmentOrder++,
            segmentTypeId: flightType.id,
            notes: `Estimated travel time: ${travelTime.durationHours.toFixed(1)} hours (${travelTime.distanceKm.toFixed(0)} km)`,
          },
        })

        segments.push({
          id: travelSegment.id,
          name: travelSegment.name,
          type: "Flight",
          startDate: travelStartDate,
          endDate: travelEndDate,
          location: `${city.city} → ${nextCity.city}`,
        })

        console.log(
          `✓ Created flight segment: ${travelSegment.name} (${travelTime.durationHours.toFixed(1)}h)`
        )

        // Update current date to end of travel
        currentDate = new Date(travelEndDate)
      } else {
        console.log(
          `  No travel segment needed (${travelTime.durationHours.toFixed(1)}h < 5h threshold)`
        )
        // Move to next city without travel segment
        currentDate = new Date(stayEndDate)
      }
    }
  }

  console.log(`✅ Multi-city trip created: ${segments.length} segments`)

  return {
    tripId: trip.id,
    segments,
    totalDays,
  }
}

/**
 * Calculate Haversine distance between two coordinates
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
 * Fallback function when API is not available
 */
async function useFallbackHeuristic(
  origin: string,
  destination: string
): Promise<{
  durationHours: number
  distanceKm: number
  mode: "driving" | "flight"
}> {
  // Try to geocode both cities
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

    const estimatedHours = distanceKm / 80 // 80 km/h average
    const mode = distanceKm > 800 || estimatedHours > 8 ? "flight" : "driving"

    return {
      durationHours: mode === "flight" ? distanceKm / 800 : estimatedHours,
      distanceKm,
      mode,
    }
  }

  // Ultimate fallback: assume nearby cities
  return {
    durationHours: 2,
    distanceKm: 100,
    mode: "driving",
  }
}
