"use client"

import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Calendar } from "lucide-react"
import { VerticalTimelineView } from "./vertical-timeline-view"

interface ItinerarySectionProps {
  itinerary: ViewItinerary
}

export function ItinerarySection({ itinerary }: ItinerarySectionProps) {
  return (
    <section id="itinerary" className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h2 className="text-3xl font-bold">Your Itinerary</h2>
      </div>
      
      {/* Reuse existing vertical timeline */}
      <VerticalTimelineView itinerary={itinerary} />
    </section>
  )
}
