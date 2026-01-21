"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar, MapPin } from "lucide-react"

interface ItineraryHeaderProps {
  itinerary: ViewItinerary
}

export function ItineraryHeader({ itinerary }: ItineraryHeaderProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  return (
    <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
      <div className="absolute inset-0">
        <img
          src={itinerary.coverImage || "/placeholder.svg"}
          alt={itinerary.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
      </div>

      <div className="relative px-4 py-8 md:px-8 md:py-12">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-card md:text-4xl text-balance">{itinerary.title}</h1>
          </div>
          <p className="text-sm text-card/90 md:text-base max-w-2xl">{itinerary.description}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-card/90">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{formatDateRange(itinerary.startDate, itinerary.endDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-card/90">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">{itinerary.segments.length} destinations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


