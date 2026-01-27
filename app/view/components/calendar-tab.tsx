"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { CalendarGrid } from "./calendar-grid"
import { DayDetailsPanel } from "./day-details-panel"

interface CalendarTabProps {
  itinerary: ViewItinerary
}

export function CalendarTab({ itinerary }: CalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  return (
    <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
      {/* Calendar Grid */}
      <div>
        <CalendarGrid 
          itinerary={itinerary}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {/* Day Details Panel */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        {selectedDate ? (
          <DayDetailsPanel
            itinerary={itinerary}
            selectedDate={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Click a date to see details
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
