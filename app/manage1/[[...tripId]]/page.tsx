import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Manage1Client } from "../client"
import type { TripSummary } from "../components/trip-list-row"
import type { RecommendationCardData } from "../components/recommendation-card"
import { sumCostsInUSD, formatAsUSD, extractCostItems } from "@/lib/utils/currency-converter"

interface PageProps {
  params: Promise<{ tripId?: string[] }>
}

export default async function ManagePage({ params }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/")
  }

  const paramsResolved = await params;

  // Fetch user's trips (including drafts for filtering)
  const trips = await prisma.trip.findMany({
    where: { 
      userId: session.user.id
    },
    include: {
      segments: {
        include: { 
          reservations: true 
        }
      }
    },
    orderBy: { startDate: "asc" }
  })

  // Transform to TripSummary format (async for currency conversion)
  const tripSummaries: TripSummary[] = await Promise.all(trips.map(async trip => {
    const totalReservations = trip.segments.reduce(
      (count, segment) => count + segment.reservations.length, 
      0
    )

    // Calculate unique destinations
    const destinations = new Set<string>()
    trip.segments.forEach(segment => {
      if (segment.endTitle) destinations.add(segment.endTitle)
    })
    const destinationsStr = destinations.size > 0 
      ? Array.from(destinations).slice(0, 2).join(", ") + (destinations.size > 2 ? "..." : "")
      : "Not set"

    // Calculate duration
    const daysDiff = Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const duration = `${daysDiff} Day${daysDiff !== 1 ? 's' : ''}`

    // Calculate total cost from reservations (converted to USD)
    const allReservations = trip.segments.flatMap(segment => segment.reservations)
    const costItems = extractCostItems(allReservations)
    const totalCostUSD = await sumCostsInUSD(costItems)
    const costStr = totalCostUSD > 0 ? formatAsUSD(totalCostUSD) : "TBD"

    // Determine status and color
    let status: "Planning" | "Upcoming" | "Draft" | "Archived" = "Planning"
    let statusColor: "info" | "success" | "default" | "warning" = "info"
    
    const now = new Date()
    
    // Check if trip is a draft first
    if (trip.status === 'DRAFT') {
      status = "Draft"
      statusColor = "warning"
    } else if (trip.startDate > now) {
      // Trip is in the future
      const daysUntil = Math.ceil((trip.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil <= 30) {
        status = "Upcoming"
        statusColor = "success"
      } else {
        status = "Planning"
        statusColor = "info"
      }
    } else if (trip.endDate < now) {
      // Trip is in the past
      status = "Archived"
      statusColor = "default"
    } else {
      // Trip is ongoing
      status = "Upcoming"
      statusColor = "success"
    }

    // Format dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
    const dates = `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`

    return {
      id: trip.id,
      title: trip.title,
      status,
      statusColor,
      dates,
      startDate: trip.startDate.toISOString(),
      destinations: destinationsStr,
      duration,
      cost: costStr,
      reservations: totalReservations,
      image: trip.imageUrl || "/placeholder.svg",
      dbStatus: trip.status // Original database status for filtering
    }
  }))

  // Mock recommendation data (stubbed for now)
  const recommendations: Record<string, RecommendationCardData[]> = {
    for_you: [
      { 
        id: 1, 
        title: "Kyoto Autumn Leaves", 
        location: "Kyoto, Japan", 
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop", 
        badge: "Match: 98%", 
        badgeColor: "bg-emerald-500", 
        reason: "Based on 'Cultural Experiences'", 
        author: "Ntourage AI", 
        authorImg: "https://api.dicebear.com/7.x/bottts/svg?seed=1" 
      },
      { 
        id: 2, 
        title: "Swiss Alps Skiing", 
        location: "Zermatt, Switzerland", 
        image: "https://images.unsplash.com/photo-1551524164-687a55dd1126?q=80&w=800&auto=format&fit=crop", 
        badge: "Trending", 
        badgeColor: "bg-blue-500", 
        reason: "Similar to your past trips", 
        author: "Ntourage AI", 
        authorImg: "https://api.dicebear.com/7.x/bottts/svg?seed=1" 
      },
      { 
        id: 3, 
        title: "Amalfi Coast Drive", 
        location: "Positano, Italy", 
        image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop", 
        badge: "Relaxing", 
        badgeColor: "bg-amber-500", 
        reason: "Recommended for Summer", 
        author: "Ntourage AI", 
        authorImg: "https://api.dicebear.com/7.x/bottts/svg?seed=1" 
      },
    ],
    friends: [
      { 
        id: 4, 
        title: "Bali Retreat", 
        location: "Ubud, Indonesia", 
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop", 
        badge: "Sarah's Trip", 
        badgeColor: "bg-purple-500", 
        reason: "Sarah just booked this", 
        author: "Sarah M.", 
        authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" 
      },
      { 
        id: 5, 
        title: "Iceland Roadtrip", 
        location: "Reykjavik, Iceland", 
        image: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800&auto=format&fit=crop", 
        badge: "Mike's Fav", 
        badgeColor: "bg-purple-500", 
        reason: "Mike recommends", 
        author: "Mike T.", 
        authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" 
      },
    ],
    interests: [],
    influencers: []
  }

  return <Manage1Client trips={tripSummaries} recommendations={recommendations} />
}
