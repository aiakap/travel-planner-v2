"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, MapPin } from "lucide-react"

interface Trip {
  id: string
  title: string
  startDate: Date
  endDate: Date
}

interface TripSelectorProps {
  trips: Trip[]
  selectedTripId: string | null
  onTripSelect: (tripId: string | null) => void
}

export function TripSelector({ trips, selectedTripId, onTripSelect }: TripSelectorProps) {
  const formatTripDates = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const selectedTrip = trips.find((t) => t.id === selectedTripId)

  return (
    <div className="w-full">
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        Select Trip to Manage
      </label>
      <Select
        value={selectedTripId || "new"}
        onValueChange={(value) => {
          if (value === "new") {
            onTripSelect(null)
          } else {
            onTripSelect(value)
          }
        }}
      >
        <SelectTrigger className="w-full h-10 bg-background border-2 hover:border-primary/50 transition-colors">
          <SelectValue>
            {selectedTripId && selectedTrip ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-medium truncate">{selectedTrip.title}</span>
                  <span className="text-xs text-muted-foreground">{formatTripDates(selectedTrip.startDate, selectedTrip.endDate)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">New Chat</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-w-md">
          <SelectItem value="new" className="cursor-pointer">
            <div className="flex items-center gap-3 py-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium">New Chat</span>
                <span className="text-xs text-muted-foreground">Plan a new trip</span>
              </div>
            </div>
          </SelectItem>
          {trips.length > 0 && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="px-2 py-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Trips</span>
              </div>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id} className="cursor-pointer">
                  <div className="flex items-center gap-3 py-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{trip.title}</span>
                      <span className="text-xs text-muted-foreground">{formatTripDates(trip.startDate, trip.endDate)}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
