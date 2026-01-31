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
import { utcToDate, formatTimeInTimezone } from "@/lib/utils/date-timezone"
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
  // Note: Trip dates don't have timezone, so we use the first segment's timezone if available
  const firstSegmentTz = trip.segments[0]?.startTimeZoneId || undefined
  const startDate = utcToDate(trip.startDate.toISOString(), firstSegmentTz)
  const endDate = utcToDate(trip.endDate.toISOString(), firstSegmentTz)
  
  const segments = trip.segments.map(segment => ({
    id: segment.id,
    title: segment.name,
    startDate: segment.startTime 
      ? utcToDate(segment.startTime.toISOString(), segment.startTimeZoneId || undefined)
      : startDate,
    endDate: segment.endTime 
      ? utcToDate(segment.endTime.toISOString(), segment.endTimeZoneId || segment.startTimeZoneId || undefined)
      : endDate,
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
      date: res.startTime 
        ? utcToDate(res.startTime.toISOString(), res.timeZoneId || segment.startTimeZoneId || undefined)
        : segment.startTime
          ? utcToDate(segment.startTime.toISOString(), segment.startTimeZoneId || undefined)
          : startDate,
      time: res.startTime 
        ? formatTimeInTimezone(res.startTime, res.timeZoneId || segment.startTimeZoneId || undefined)
        : "00:00",
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
