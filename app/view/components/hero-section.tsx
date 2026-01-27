"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar, MapPin, Clock } from "lucide-react"
import { formatDateRange } from "../lib/view-utils"

interface HeroSectionProps {
  itinerary: ViewItinerary
}

export function HeroSection({ itinerary }: HeroSectionProps) {
  return (
    <section id="hero" className="relative h-[70vh] min-h-[500px] mb-12">
      {/* Cover Image */}
      <div className="absolute inset-0">
        <img
          src={itinerary.coverImage}
          alt={itinerary.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="space-y-4">
          {/* Trip Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
            {itinerary.title}
          </h1>
          
          {/* Dates & Stats */}
          <div className="flex flex-wrap gap-4 text-white/90 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{formatDateRange(itinerary.startDate, itinerary.endDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{itinerary.segments.length} destination{itinerary.segments.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{itinerary.dayCount} day{itinerary.dayCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {/* Description */}
          {itinerary.description && (
            <p className="text-white/80 text-lg max-w-2xl">
              {itinerary.description}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
