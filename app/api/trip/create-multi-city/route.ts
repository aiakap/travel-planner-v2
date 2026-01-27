import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateTravelTime } from "@/lib/google-maps/calculate-travel-time"

export const maxDuration = 60

interface CityStop {
  city: string
  durationDays: number
}

interface CreateMultiCityRequest {
  title?: string
  startDate: string // ISO date string
  cities: CityStop[]
  conversationId?: string
}

// Helper to geocode a city
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body: CreateMultiCityRequest = await request.json()

    console.log(`[API] Multi-city trip request received`)
    console.log(`  Cities: ${body.cities.map(c => c.city).join(', ')}`)

    // Validate request
    if (!body.startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      )
    }

    if (!body.cities || body.cities.length === 0) {
      return NextResponse.json(
        { error: "At least one city is required" },
        { status: 400 }
      )
    }

    if (body.cities.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 cities allowed" },
        { status: 400 }
      )
    }

    // Validate each city
    for (let i = 0; i < body.cities.length; i++) {
      const city = body.cities[i]
      
      if (!city.city || !city.city.trim()) {
        return NextResponse.json(
          { error: `City ${i + 1} name is required` },
          { status: 400 }
        )
      }

      if (!city.durationDays || city.durationDays < 1) {
        return NextResponse.json(
          { error: `City ${i + 1} must have at least 1 day` },
          { status: 400 }
        )
      }

      if (city.durationDays > 90) {
        return NextResponse.json(
          { error: `City ${i + 1} duration cannot exceed 90 days` },
          { status: 400 }
        )
      }
    }

    // Generate trip title if not provided
    const cityNames = body.cities.map(c => c.city.split(',')[0].trim())
    const tripTitle = body.title || (
      cityNames.length === 1 
        ? `Trip to ${cityNames[0]}`
        : cityNames.length === 2
        ? `${cityNames[0]} & ${cityNames[1]}`
        : `${cityNames[0]}, ${cityNames[1]} & ${cityNames.length - 2} more`
    )

    // Calculate total duration
    const startDate = new Date(body.startDate)
    const totalDays = body.cities.reduce((sum, city) => sum + city.durationDays, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + totalDays)

    console.log(`[MultiCityTrip] Creating trip: ${tripTitle}`)

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
    if (body.conversationId) {
      try {
        await prisma.chatConversation.update({
          where: { id: body.conversationId },
          data: { tripId: trip.id },
        })
        console.log(`✓ Linked conversation ${body.conversationId} to trip ${trip.id}`)
      } catch (error) {
        console.error("❌ Failed to link conversation:", error)
      }
    }

    // Get segment types
    const [stayType, travelType] = await Promise.all([
      prisma.segmentType.findFirst({ where: { name: "Stay" } }),
      prisma.segmentType.findFirst({ where: { name: "Travel" } }),
    ])

    if (!stayType || !travelType) {
      throw new Error("Required segment types not found in database")
    }

    // Create segments
    const segments: any[] = []
    let currentDate = new Date(startDate)
    let segmentOrder = 0

    for (let i = 0; i < body.cities.length; i++) {
      const city = body.cities[i]
      const nextCity = body.cities[i + 1]

      // Geocode current city
      const cityGeo = await geocodeCity(city.city)

      // Calculate stay end date
      const stayEndDate = new Date(currentDate)
      stayEndDate.setDate(stayEndDate.getDate() + city.durationDays)

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

      console.log(`✓ Created stay segment: ${staySegment.name}`)

      // Check if we need a travel segment to next city
      if (nextCity) {
        const travelTime = await calculateTravelTime(city.city, nextCity.city)
        
        if (travelTime.durationHours > 5) {
          const nextCityGeo = await geocodeCity(nextCity.city)
          
          const travelStartDate = new Date(stayEndDate)
          const travelEndDate = new Date(stayEndDate)
          travelEndDate.setDate(travelEndDate.getDate() + 1)

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
              order: segmentOrder++,
              segmentTypeId: travelType.id,
              notes: `Estimated travel time: ${travelTime.durationHours.toFixed(1)} hours`,
            },
          })

          segments.push({
            id: travelSegment.id,
            name: travelSegment.name,
            type: "Travel",
            startDate: travelStartDate,
            endDate: travelEndDate,
            location: `${city.city} → ${nextCity.city}`,
          })

          console.log(`✓ Created travel segment: ${travelSegment.name}`)
          currentDate = new Date(travelEndDate)
        } else {
          console.log(`  No travel segment needed (${travelTime.durationHours.toFixed(1)}h < 5h)`)
          currentDate = new Date(stayEndDate)
        }
      }
    }

    console.log(`✅ Multi-city trip created: ${segments.length} segments`)

    return NextResponse.json({
      success: true,
      tripId: trip.id,
      segments: segments.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        location: s.location,
      })),
      totalDays,
      metadata: {
        cityCount: body.cities.length,
        segmentCount: segments.length,
      },
    })
  } catch (error: any) {
    console.error("[API] Multi-city trip creation error:", error)
    
    return NextResponse.json(
      {
        error: error.message || "Failed to create multi-city trip",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
