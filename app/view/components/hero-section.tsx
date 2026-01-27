"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import type { GlobeTripData } from "@/lib/globe-types"
import { Calendar, MapPin, Clock, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDateRange } from "../lib/view-utils"
import { buildChatUrl } from "../lib/chat-integration"
import { TripReservationsMap } from "@/components/trip-reservations-map"
import { useMemo } from "react"

interface HeroSectionProps {
  itinerary: ViewItinerary
}

export function HeroSection({ itinerary }: HeroSectionProps) {
  // Transform ViewItinerary to GlobeTripData for the map component
  const globeTripData: GlobeTripData = useMemo(() => ({
    id: itinerary.id,
    title: itinerary.title,
    description: itinerary.description,
    imageUrl: itinerary.coverImage,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    totalDistance: 0, // Not needed for this view
    countries: [], // Not needed for this view
    color: '#0EA5E9', // Default color
    segments: itinerary.segments.map(seg => ({
      id: seg.id,
      name: seg.title,
      startLat: seg.startLat,
      startLng: seg.startLng,
      endLat: seg.endLat,
      endLng: seg.endLng,
      startTitle: seg.startTitle,
      endTitle: seg.endTitle,
      startTime: seg.startDate,
      endTime: seg.endDate,
      notes: null,
      imageUrl: seg.imageUrl || null,
      segmentType: { name: seg.segmentType },
      reservations: seg.reservations.map(res => ({
        id: res.id,
        name: res.title,
        location: res.location,
        departureLocation: res.departureLocation || null,
        arrivalLocation: res.arrivalLocation || null,
        startTime: res.startTime || null,
        endTime: res.endTime || null,
        confirmationNumber: res.confirmationNumber || null,
        notes: res.notes || null,
        cost: res.price || null,
        currency: 'USD',
        imageUrl: res.image || null,
        reservationType: {
          name: res.description,
          category: { name: res.categoryName }
        }
      }))
    }))
  }), [itinerary]);

  return (
    <section id="hero" className="scroll-mt-32 mb-8">
      {/* Cover Image */}
      <div className="relative h-[50vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={itinerary.coverImage}
            alt={itinerary.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
        </div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-4 md:px-8 max-w-7xl mx-auto pt-20">
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
            
            {/* Chat Button */}
            <Button
              onClick={() => window.location.href = buildChatUrl({ tripId: itinerary.id, action: 'chat', source: 'overview' })}
              className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat About This Trip
            </Button>
          </div>
        </div>
      </div>

      {/* Trip Map */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="h-[250px] rounded-lg overflow-hidden border shadow-sm">
          <TripReservationsMap 
            trip={globeTripData} 
            height="250px"
            mapTypeId="satellite"
          />
        </div>
      </div>
    </section>
  )
}
