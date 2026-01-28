"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar } from "lucide-react"
import { TripCalendar } from "./trip-calendar"
import { SectionHeading } from "./section-heading"

interface ItinerarySectionProps {
  itinerary: ViewItinerary
}

export function ItinerarySection({ itinerary }: ItinerarySectionProps) {
  return (
    <section id="itinerary" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12">
      <SectionHeading 
        icon={Calendar} 
        title="Your Journey" 
        subtitle="Chapters & Moments"
      />
      
      {/* New calendar-based itinerary view */}
      <TripCalendar itinerary={itinerary} />
    </section>
  )
}
