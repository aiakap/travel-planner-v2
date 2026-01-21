import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateDistance } from "@/lib/utils"
import type { GlobeTripData } from "@/lib/globe-types"

// Helper function to extract country from location string
function extractCountry(location: string | null | undefined): string | null {
  if (!location) return null
  const parts = location.split(",")
  const country = parts[parts.length - 1]?.trim()
  return country || null
}

// Helper function to generate a color for a trip
function generateTripColor(tripId: string): string {
  const colors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ]
  // Use a simple hash of the trip ID to pick a consistent color
  let hash = 0
  for (let i = 0; i < tripId.length; i++) {
    hash = tripId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const trips = await prisma.trip.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: {
                    category: true,
                  },
                },
                reservationStatus: true,
              },
            },
          },
        },
      },
    })

    // Transform trips to include calculated fields
    const transformedTrips: GlobeTripData[] = trips.map((trip) => {
      // Calculate countries from segments
      const countriesSet = new Set<string>()
      trip.segments.forEach((segment) => {
        const startCountry = extractCountry(segment.startTitle)
        const endCountry = extractCountry(segment.endTitle)
        if (startCountry) countriesSet.add(startCountry)
        if (endCountry) countriesSet.add(endCountry)
      })

      // Calculate total distance
      let totalDistance = 0
      trip.segments.forEach((segment) => {
        const distance = calculateDistance(
          segment.startLat,
          segment.startLng,
          segment.endLat,
          segment.endLng
        )
        totalDistance += distance
      })

      return {
        id: trip.id,
        title: trip.title,
        description: trip.description || "",
        imageUrl: trip.imageUrl,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        segments: trip.segments.map((segment) => ({
          id: segment.id,
          name: segment.name,
          startTitle: segment.startTitle,
          startLat: segment.startLat,
          startLng: segment.startLng,
          endTitle: segment.endTitle,
          endLat: segment.endLat,
          endLng: segment.endLng,
          startTime: segment.startTime?.toISOString() || null,
          endTime: segment.endTime?.toISOString() || null,
          notes: segment.notes,
          imageUrl: segment.imageUrl,
          segmentType: segment.segmentType,
          reservations: segment.reservations.map((res) => ({
            id: res.id,
            name: res.name,
            location: res.location,
            departureLocation: res.departureLocation,
            arrivalLocation: res.arrivalLocation,
            startTime: res.startTime?.toISOString() || null,
            endTime: res.endTime?.toISOString() || null,
            confirmationNumber: res.confirmationNumber,
            notes: res.notes,
            cost: res.cost,
            currency: res.currency,
            imageUrl: res.imageUrl,
            reservationType: res.reservationType,
          })),
        })),
        totalDistance,
        countries: Array.from(countriesSet),
        color: generateTripColor(trip.id),
      }
    })

    return NextResponse.json(transformedTrips)
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
