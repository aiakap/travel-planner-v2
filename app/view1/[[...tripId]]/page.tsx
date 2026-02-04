import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { View1Client } from "../client"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { mapCategoryToType, mapReservationStatus } from "@/lib/itinerary-view-types"
import { calculateDayCount, calculateSegmentColors } from "@/app/view/lib/view-utils"
import { getUserProfileValues } from "@/lib/actions/profile-relational-actions"
import { getProfileGraphItems } from "@/lib/actions/profile-graph-actions"
import { IntelligenceProvider } from "../contexts/intelligence-context"
import { NewJourneyExperience } from "../components/new-journey-experience"
import { getUserContext } from "@/lib/actions/user-context"
import { getUserHomeLocation } from "@/lib/actions/profile-actions"
import { pgDateToString, pgTimeToString } from "@/lib/utils/local-time"
import { batchFetchIntelligence } from "@/lib/actions/batch-intelligence-actions"
import { convertToUSD } from "@/lib/utils/currency-converter"

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

  // Fetch user profile, intelligence data, and profile graph items in parallel
  const [profileValues, intelligenceCache, profileItems] = await Promise.all([
    getUserProfileValues(session.user.id),
    batchFetchIntelligence(tripId),
    getProfileGraphItems().catch(err => {
      console.error('Error fetching profile graph items:', err)
      return []
    }),
  ])

  // Transform trip into the ViewItinerary format
  // Use wall_* fields directly (local time) - no timezone conversion needed
  // Fallback to trip dates if wall dates not available
  const tripStartDate = trip.startDate.toISOString().split('T')[0]
  const tripEndDate = trip.endDate.toISOString().split('T')[0]
  
  const segments = await Promise.all(trip.segments.map(async segment => {
    // Read directly from wall_* fields (local time)
    const segmentStartDate = segment.wall_start_date 
      ? pgDateToString(segment.wall_start_date)
      : tripStartDate
    const segmentEndDate = segment.wall_end_date 
      ? pgDateToString(segment.wall_end_date)
      : tripEndDate
    
    // Process reservations with async currency conversion
    const reservations = await Promise.all(segment.reservations.map(async res => {
      // Read directly from wall_* fields (local time)
      const resDate = res.wall_start_date 
        ? pgDateToString(res.wall_start_date)
        : segmentStartDate
      const resTime = res.wall_start_time 
        ? pgTimeToString(res.wall_start_time)
        : "00:00"
      
      // Format end time for display
      const endTimeFormatted = res.wall_end_time 
        ? pgTimeToString(res.wall_end_time)
        : undefined
      
      // Calculate date difference between start and end
      let endDateDiff: number | undefined
      if (res.wall_start_date && res.wall_end_date) {
        const startDateObj = new Date(res.wall_start_date)
        const endDateObj = new Date(res.wall_end_date)
        // Use UTC dates to avoid timezone issues
        const startDay = Date.UTC(startDateObj.getUTCFullYear(), startDateObj.getUTCMonth(), startDateObj.getUTCDate())
        const endDay = Date.UTC(endDateObj.getUTCFullYear(), endDateObj.getUTCMonth(), endDateObj.getUTCDate())
        endDateDiff = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24))
      }
      
      // Calculate multi-day fields
      // Pass both category and type name for more accurate mapping
      const resType = mapCategoryToType(res.reservationType.category.name, res.reservationType.name)
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
        
        // DEBUG: Log multi-day calculation
        if (resType === 'hotel' || resType === 'transport') {
          console.log('🏨 Multi-day check:', res.name, {
            categoryName: res.reservationType.category.name,
            resType,
            startDate: startDate?.toString(),
            endDate: endDate?.toString(),
            daysDiff,
            nights,
            durationDays,
            wall_start_date: res.wall_start_date?.toString(),
            wall_end_date: res.wall_end_date?.toString(),
            startTime: res.startTime?.toISOString(),
            endTime: res.endTime?.toISOString(),
          })
        }
      } else {
        // DEBUG: Log when dates are missing
        if (resType === 'hotel' || resType === 'transport') {
          console.log('🏨 Missing dates for:', res.name, {
            categoryName: res.reservationType.category.name,
            resType,
            hasStartDate: !!startDate,
            hasEndDate: !!endDate,
            wall_start_date: res.wall_start_date?.toString(),
            wall_end_date: res.wall_end_date?.toString(),
            startTime: res.startTime?.toISOString(),
            endTime: res.endTime?.toISOString(),
          })
        }
      }
      
      // Convert price to USD for rollup calculations
      const price = res.cost || 0
      const currency = res.currency || 'USD'
      const priceUSD = price > 0 ? await convertToUSD(price, currency) : 0
      
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
        price,
        currency,
        priceUSD,
        notes: res.notes || "",
        latitude: res.latitude || undefined,
        longitude: res.longitude || undefined,
        departureLocation: res.departureLocation || undefined,
        arrivalLocation: res.arrivalLocation || undefined,
        categoryName: res.reservationType.category.name,
        startTime: res.startTime?.toISOString(),
        endTime: res.endTime?.toISOString(),
        endTimeFormatted,
        endDateDiff,
        status: mapReservationStatus(res.reservationStatus.name),
        statusName: res.reservationStatus.name,
        reservationStatusId: res.reservationStatusId,
        // Multi-day fields
        nights,
        durationDays,
        checkInDate,
        checkOutDate,
      }
    }))
    
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
      reservations,
    }
  }))
  
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
        profileItems={profileItems}
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
