"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { Calendar, MapPin, Plane, Hotel, Utensils, Compass, Car } from "lucide-react"
import { getTripDates } from "../lib/view-utils"
import { chatAboutSegment, chatAboutReservation } from "../lib/chat-integration"

interface GanttViewProps {
  itinerary: ViewItinerary
}

function getReservationIcon(type: ViewReservation['type']) {
  switch (type) {
    case 'flight': return Plane
    case 'hotel': return Hotel
    case 'restaurant': return Utensils
    case 'transport': return Car
    default: return Compass
  }
}

export function GanttView({ itinerary }: GanttViewProps) {
  const allDates = getTripDates(itinerary.startDate, itinerary.endDate)
  
  // Calculate position and width for each segment
  const getSegmentPosition = (segment: typeof itinerary.segments[0]) => {
    const startIndex = allDates.indexOf(segment.startDate)
    const endIndex = allDates.indexOf(segment.endDate)
    const startPercent = (startIndex / allDates.length) * 100
    const widthPercent = ((endIndex - startIndex + 1) / allDates.length) * 100
    return { left: `${startPercent}%`, width: `${widthPercent}%` }
  }

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          {/* Date grid */}
          <div className="relative h-8 bg-muted/30 rounded-md">
            <div className="absolute inset-0 flex">
              {allDates.map((date, index) => (
                <div
                  key={date}
                  className="flex-1 border-r border-border/30 last:border-r-0 flex items-center justify-center"
                  title={new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                >
                  {allDates.length <= 14 && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(date).getDate()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Segments */}
      <div className="space-y-3">
        {itinerary.segments.map((segment) => {
          const segmentColor = itinerary.segmentColors[segment.id]
          const position = getSegmentPosition(segment)
          const totalCost = segment.reservations.reduce((sum, r) => sum + r.price, 0)

          return (
            <Card key={segment.id} className="p-4 overflow-hidden">
              <div className="space-y-3">
                {/* Segment Info */}
                <div className="flex items-start gap-3">
                  {segment.imageUrl && (
                    <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden">
                      <img
                        src={segment.imageUrl}
                        alt={segment.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{segment.title}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: segmentColor, color: segmentColor }}
                      >
                        {segment.segmentType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {segment.startTitle === segment.endTitle
                          ? segment.startTitle
                          : `${segment.startTitle} → ${segment.endTitle}`}
                      </span>
                    </div>
                  </div>

                  {totalCost > 0 && (
                    <span className="text-sm font-semibold text-emerald-600 shrink-0">
                      ${totalCost.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Gantt Bar */}
                <div className="min-w-[600px] overflow-x-auto">
                  <div
                    className="relative h-12 rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => chatAboutSegment(itinerary.id, segment, 'timeline')}
                  >
                    {/* Background track */}
                    <div className="absolute inset-0 bg-muted/20 rounded" />
                    
                    {/* Segment bar */}
                    <div
                      className="absolute top-1 bottom-1 rounded-md flex items-center px-2 overflow-hidden"
                      style={{
                        ...position,
                        backgroundColor: segmentColor,
                        opacity: 0.8,
                      }}
                    >
                      <span className="text-xs font-medium text-white truncate">
                        {segment.reservations.length} items
                      </span>
                    </div>

                    {/* Reservation markers */}
                    {segment.reservations.map((reservation) => {
                      const resIndex = allDates.indexOf(reservation.date)
                      if (resIndex === -1) return null
                      
                      const resLeft = (resIndex / allDates.length) * 100
                      const Icon = getReservationIcon(reservation.type)

                      return (
                        <div
                          key={reservation.id}
                          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
                          style={{
                            left: `${resLeft}%`,
                            borderColor: segmentColor,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            chatAboutReservation(itinerary.id, reservation, segment.id, 'timeline')
                          }}
                          title={`${reservation.title} - ${reservation.time}`}
                        >
                          <Icon className="h-3 w-3" style={{ color: segmentColor }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {itinerary.segments.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No segments in this trip</p>
        </Card>
      )}
    </div>
  )
}
