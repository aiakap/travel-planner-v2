import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ItineraryViewClient } from "./client"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { mapCategoryToType, mapReservationStatus } from "@/lib/itinerary-view-types"
import { calculateDayCount, calculateSegmentColors } from "./lib/view-utils"
import { getUserProfileValues } from "@/lib/actions/profile-relational-actions"

export default async function ViewPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/")
  }

  // Fetch all trips with their segments and reservations
  const trips = await prisma.trip.findMany({
    where: {
      userId: session.user.id,
      status: { not: 'DRAFT' },
    },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          segmentType: true,
          reservations: {
            include: {
              reservationType: {
                include: {
                  category: true
                }
              },
              reservationStatus: true
            },
            orderBy: { startTime: "asc" }
          }
        }
      }
    },
    orderBy: { startDate: "desc" }
  })

  // Fetch user profile for packing suggestions
  const profileValues = await getUserProfileValues(session.user.id)

  // Transform trips into the ViewItinerary format
  const itineraries: ViewItinerary[] = trips.map(trip => {
    const startDate = trip.startDate.toISOString().split('T')[0]
    const endDate = trip.endDate.toISOString().split('T')[0]
    
    const segments = trip.segments.map(segment => ({
      id: segment.id,
      title: segment.name,
      startDate: segment.startTime?.toISOString().split('T')[0] || startDate,
      endDate: segment.endTime?.toISOString().split('T')[0] || endDate,
      destination: segment.endTitle || segment.startTitle,
      startLat: segment.startLat,
      startLng: segment.startLng,
      endLat: segment.endLat,
      endLng: segment.endLng,
      startTitle: segment.startTitle,
      endTitle: segment.endTitle,
      segmentType: segment.segmentType.name,
      imageUrl: segment.imageUrl || undefined,
      reservations: segment.reservations.map(res => ({
        id: res.id,
        type: mapCategoryToType(res.reservationType.category.name),
        title: res.name,
        description: res.reservationType.name,
        date: res.startTime?.toISOString().split('T')[0] || segment.startTime?.toISOString().split('T')[0] || startDate,
        time: res.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) || "00:00",
        location: res.location || segment.endTitle || "",
        confirmationNumber: res.confirmationNumber || "",
        image: res.imageUrl || getDefaultImage(mapCategoryToType(res.reservationType.category.name)),
        price: res.cost || 0,
        notes: res.notes || "",
        latitude: res.latitude || undefined,
        longitude: res.longitude || undefined,
        departureLocation: res.departureLocation || undefined,
        arrivalLocation: res.arrivalLocation || undefined,
        categoryName: res.reservationType.category.name,
        startTime: res.startTime?.toISOString(),
        endTime: res.endTime?.toISOString(),
        status: mapReservationStatus(res.reservationStatus.name),
        statusName: res.reservationStatus.name,
        reservationStatusId: res.reservationStatusId,
      }))
    }))
    
    // Calculate pending count
    const pendingCount = segments.reduce((count, seg) => 
      count + seg.reservations.filter(r => r.status === 'pending').length, 0
    )
    
    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      startDate,
      endDate,
      coverImage: trip.imageUrl || "/placeholder.svg",
      segments,
      dayCount: calculateDayCount(startDate, endDate),
      segmentColors: calculateSegmentColors(segments),
      pendingCount,
    }
  })

  return <ItineraryViewClient itineraries={itineraries} profileValues={profileValues} />
}

function getDefaultImage(type: string): string {
  const defaults: Record<string, string> = {
    flight: "/airplane-flight-travel.jpg",
    hotel: "/luxury-hotel-room.png",
    activity: "/travel-activity-adventure.jpg",
    transport: "/train-bus-transportation.jpg",
    restaurant: "/restaurant-dining-food.jpg",
  }
  return defaults[type] || "/placeholder.svg"
}


