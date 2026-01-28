"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { TripMapView } from "./trip-map-view"
import { MapSidePanel } from "./map-side-panel"

interface MapTabProps {
  itinerary: ViewItinerary
}

export function MapTab({ itinerary }: MapTabProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [filterByType, setFilterByType] = useState<string[]>([])

  return (
    <div className="grid lg:grid-cols-[1fr,400px] gap-6">
      {/* Map View */}
      <div className="h-[600px] lg:h-[700px]">
        <TripMapView
          itinerary={itinerary}
          selectedSegmentId={selectedSegmentId}
          selectedReservationId={selectedReservationId}
          filterByType={filterByType}
          onSegmentClick={setSelectedSegmentId}
          onReservationClick={setSelectedReservationId}
        />
      </div>

      {/* Side Panel */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <MapSidePanel
          itinerary={itinerary}
          selectedSegmentId={selectedSegmentId}
          selectedReservationId={selectedReservationId}
          filterByType={filterByType}
          onSegmentSelect={setSelectedSegmentId}
          onReservationSelect={setSelectedReservationId}
          onFilterChange={setFilterByType}
        />
      </div>
    </div>
  )
}
