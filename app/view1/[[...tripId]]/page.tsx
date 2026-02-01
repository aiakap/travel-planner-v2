import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { View1Client } from "../client"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { mapCategoryToType, mapReservationStatus } from "@/lib/itinerary-view-types"
import { calculateDayCount, calculateSegmentColors } from "@/app/view/lib/view-utils"
import { getUserProfileValues } from "@/lib/actions/profile-relational-actions"
import { IntelligenceProvider } from "../contexts/intelligence-context"
import { NewJourneyExperience } from "../components/new-journey-experience"
import { getUserContext } from "@/lib/actions/user-context"
import { getUserHomeLocation } from "@/lib/actions/profile-actions"
import { pgDateToString, pgTimeToString } from "@/lib/utils/local-time"
import { batchFetchIntelligence } from "@/lib/actions/batch-intelligence-actions"

interface PageProps {
  params: Promise<{ tripId?: string[] }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ViewPage({ params, searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/")
  }

  const paramsResolved = await params;
  const searchParamsResolved = await searchParams;

  // Extract trip ID from optional catch-all route
  const tripId = paramsResolved.tripId?.[0]

  // If no trip ID, show new journey experience
  if (!tripId) {
    try {
      const [userContext, homeLocation, profileValues] = await Promise.all([
        getUserContext(session.user.id).catch(err => {
          console.error('Error fetching user context:', err)
          return null
        }),
        getUserHomeLocation().catch(err => {
          console.error('Error fetching home location:', err)
          return null
        }),
        getUserProfileValues(session.user.id).catch(err => {
          console.error('Error fetching profile values:', err)
          return []
        }),
      ])

      // Fetch recent trips for suggestions
      const recentTrips = await prisma.trip.findMany({
        where: {
          userId: session.user.id,
          status: { not: 'DRAFT' },
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          imageUrl: true,
        },
        orderBy: { startDate: "desc" },
        take: 3,
      })

      return (
        <NewJourneyExperience
          userContext={userContext}
          homeLocation={homeLocation}
          profileValues={profileValues}
          recentTrips={recentTrips}
        />
      )
    } catch (error) {
      console.error('Error loading new journey experience:', error)
      // Fallback: redirect to home or show error
      redirect("/")
    }
  }

  // Fetch the specific trip with all its data
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
      status: { not: 'DRAFT' },
    },
    include: {
      ImagePromptStyle: true,
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
  })

  // If trip not found, redirect to new journey experience
  if (!trip) {
    redirect("/view1")
  }

  // Fetch user profile and intelligence data in parallel
  const [profileValues, intelligenceCache] = await Promise.all([
    getUserProfileValues(session.user.id),
    batchFetchIntelligence(tripId),
  ])

  // Transform trip into the ViewItinerary format
  // Use wall_* fields directly (local time) - no timezone conversion needed
  // Fallback to trip dates if wall dates not available
  const tripStartDate = trip.startDate.toISOString().split('T')[0]
  const tripEndDate = trip.endDate.toISOString().split('T')[0]
  
  const segments = trip.segments.map(segment => {
    // Read directly from wall_* fields (local time)
    const segmentStartDate = segment.wall_start_date 
      ? pgDateToString(segment.wall_start_date)
      : tripStartDate
    const segmentEndDate = segment.wall_end_date 
      ? pgDateToString(segment.wall_end_date)
      : tripEndDate
    
    return {
      id: segment.id,
      title: segment.name,
      startDate: segmentStartDate,
      endDate: segmentEndDate,
      destination: segment.endTitle || segment.startTitle,
      startLat: segment.startLat,
      startLng: segment.startLng,
      endLat: segment.endLat,
      endLng: segment.endLng,
      startTitle: segment.startTitle,
      endTitle: segment.endTitle,
      segmentType: segment.segmentType.name,
      imageUrl: segment.imageUrl || undefined,
      reservations: segment.reservations.map(res => {
        // Read directly from wall_* fields (local time)
        const resDate = res.wall_start_date 
          ? pgDateToString(res.wall_start_date)
          : segmentStartDate
        const resTime = res.wall_start_time 
          ? pgTimeToString(res.wall_start_time)
          : "00:00"
        
        // Calculate multi-day fields
        const resType = mapCategoryToType(res.reservationType.category.name)
        const startDate = res.wall_start_date || res.startTime
        const endDate = res.wall_end_date || res.endTime
        let nights: number | undefined
        let durationDays: number | undefined
        let checkInDate: string | undefined
        let checkOutDate: string | undefined
        
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          
          if (resType === 'hotel' && daysDiff > 0) {
            nights = daysDiff
            checkInDate = pgDateToString(res.wall_start_date) || res.startTime?.toISOString().split('T')[0]
            checkOutDate = pgDateToString(res.wall_end_date) || res.endTime?.toISOString().split('T')[0]
          } else if (resType === 'transport' && daysDiff > 0) {
            // Car rentals span multiple days
            durationDays = daysDiff + 1 // Include both start and end days
          }
        }
        
        return {
          id: res.id,
          type: resType,
          title: res.name,
          description: res.reservationType.name,
          date: resDate,
          time: resTime,
          location: res.location || segment.endTitle || "",
          confirmationNumber: res.confirmationNumber || "",
          image: res.imageUrl || getDefaultImage(resType),
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
          // Multi-day fields
          nights,
          durationDays,
          checkInDate,
          checkOutDate,
        }
      })
    }
  })
  
  // Calculate trip start/end from first/last segment
  const startDate = segments.length > 0 ? segments[0].startDate : tripStartDate
  const endDate = segments.length > 0 ? segments[segments.length - 1].endDate : tripEndDate
  
  // Calculate pending count
  const pendingCount = segments.reduce((count, seg) => 
    count + seg.reservations.filter(r => r.status === 'pending').length, 0
  )
  
  // Format date range on server to avoid hydration mismatch
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`
  }
  const formattedDateRange = `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`
  
  const itinerary: ViewItinerary = {
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
    formattedDateRange,
    imagePromptStyleId: trip.imagePromptStyleId,
    imagePromptStyleName: trip.ImagePromptStyle?.name || null,
    imagePromptStyleSlug: trip.ImagePromptStyle?.slug || null,
  }

  return (
    <IntelligenceProvider initialCache={intelligenceCache}>
      <View1Client 
        itinerary={itinerary} 
        profileValues={profileValues}
        currentStyleId={trip.ImagePromptStyle?.id || null}
        currentStyleName={trip.ImagePromptStyle?.name || null}
      />
    </IntelligenceProvider>
  )
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
