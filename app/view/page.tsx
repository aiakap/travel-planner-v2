import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ItineraryViewClient } from "./client"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { mapCategoryToType } from "@/lib/itinerary-view-types"

export default async function ViewPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/")
  }

  // Fetch all trips with their segments and reservations
  const trips = await prisma.trip.findMany({
    where: {
      userId: session.user.id
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

  // Transform trips into the ViewItinerary format
  const itineraries: ViewItinerary[] = trips.map(trip => ({
    id: trip.id,
    title: trip.title,
    description: trip.description,
    startDate: trip.startDate.toISOString().split('T')[0],
    endDate: trip.endDate.toISOString().split('T')[0],
    coverImage: trip.imageUrl || "/placeholder.svg",
    segments: trip.segments.map(segment => ({
      id: segment.id,
      title: segment.name,
      startDate: segment.startTime?.toISOString().split('T')[0] || trip.startDate.toISOString().split('T')[0],
      endDate: segment.endTime?.toISOString().split('T')[0] || trip.endDate.toISOString().split('T')[0],
      destination: segment.endTitle || segment.startTitle,
      reservations: segment.reservations.map(res => ({
        id: res.id,
        type: mapCategoryToType(res.reservationType.category.name),
        title: res.name,
        description: res.reservationType.name,
        date: res.startTime?.toISOString().split('T')[0] || segment.startTime?.toISOString().split('T')[0] || trip.startDate.toISOString().split('T')[0],
        time: res.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) || "00:00",
        location: res.location || segment.endTitle || "",
        confirmationNumber: res.confirmationNumber || "",
        image: res.imageUrl || getDefaultImage(mapCategoryToType(res.reservationType.category.name)),
        price: res.cost || 0,
        notes: res.notes || ""
      }))
    }))
  }))

  return <ItineraryViewClient itineraries={itineraries} />
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


