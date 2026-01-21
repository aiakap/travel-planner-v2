"use client"

import { useState } from "react"
import { ItineraryHeader } from "@/components/itinerary-view/itinerary-header"
import { ItineraryStats } from "@/components/itinerary-view/itinerary-stats"
import { SegmentSection } from "@/components/itinerary-view/segment-section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { MapPin, Plane } from "lucide-react"
import Link from "next/link"

interface ItineraryViewClientProps {
  itineraries: ViewItinerary[]
}

export function ItineraryViewClient({ itineraries }: ItineraryViewClientProps) {
  const [selectedTripId, setSelectedTripId] = useState<string>(itineraries[0]?.id || "")
  
  const selectedItinerary = itineraries.find(i => i.id === selectedTripId)

  if (itineraries.length === 0) {
    return (
      <main className="min-h-screen pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
          <div className="text-center py-16 bg-card rounded-xl border border-dashed">
            <Plane className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Trips Yet</h2>
            <p className="text-muted-foreground mb-6">Create your first trip to see it in this beautiful view</p>
            <Link 
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Create Your First Trip
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-8">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 space-y-6">
        {/* Trip Selector */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Plane className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Trip View</h1>
          </div>
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a trip" />
            </SelectTrigger>
            <SelectContent>
              {itineraries.map((itinerary) => (
                <SelectItem key={itinerary.id} value={itinerary.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{itinerary.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedItinerary && (
          <>
            <ItineraryHeader itinerary={selectedItinerary} />
            <ItineraryStats itinerary={selectedItinerary} />

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Trip Segments</h2>

              {selectedItinerary.segments.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                  <p className="text-muted-foreground">No segments yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Add segments to your trip to see them here</p>
                  <Link
                    href={`/trips/${selectedItinerary.id}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    Go to trip details →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedItinerary.segments.map((segment) => (
                    <SegmentSection key={segment.id} segment={segment} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}


