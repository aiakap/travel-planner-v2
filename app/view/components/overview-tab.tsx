"use client"

import { ItineraryHeader } from "@/components/itinerary-view/itinerary-header"
import { ItineraryStats } from "@/components/itinerary-view/itinerary-stats"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { MapPin, Calendar, MessageCircle, ExternalLink } from "lucide-react"
import { formatDateRange } from "../lib/view-utils"
import { chatAboutSegment, viewTripInChat } from "../lib/chat-integration"

interface OverviewTabProps {
  itinerary: ViewItinerary
}

export function OverviewTab({ itinerary }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <ItineraryHeader itinerary={itinerary} />

      {/* Stats Cards */}
      <ItineraryStats itinerary={itinerary} />

      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewTripInChat(itinerary.id, 'overview')}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chat About This Trip
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a href={`/exp?tripId=${itinerary.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open in Experience Builder
            </a>
          </Button>
        </div>
      </Card>

      {/* Trip Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trip Segments</h2>
          <span className="text-sm text-muted-foreground">
            {itinerary.segments.length} segment{itinerary.segments.length !== 1 ? 's' : ''} • {itinerary.dayCount} day{itinerary.dayCount !== 1 ? 's' : ''}
          </span>
        </div>

        {itinerary.segments.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No segments yet</p>
            <p className="text-sm text-muted-foreground">Add segments to your trip to see them here</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {itinerary.segments.map((segment) => {
              const segmentColor = itinerary.segmentColors[segment.id]
              const reservationCount = segment.reservations.length
              const totalCost = segment.reservations.reduce((sum, r) => sum + r.price, 0)

              return (
                <Card
                  key={segment.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => chatAboutSegment(itinerary.id, segment, 'overview')}
                >
                  {/* Segment Image */}
                  {segment.imageUrl && (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={segment.imageUrl}
                        alt={segment.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ backgroundColor: segmentColor }}
                      />
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    {/* Segment Header */}
                    <div>
                      <h3 className="font-semibold text-base mb-1 line-clamp-1">
                        {segment.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">
                          {segment.startTitle === segment.endTitle
                            ? segment.startTitle
                            : `${segment.startTitle} → ${segment.endTitle}`}
                        </span>
                      </div>
                    </div>

                    {/* Segment Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateRange(segment.startDate, segment.endDate)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {reservationCount} reservation{reservationCount !== 1 ? 's' : ''}
                        </span>
                        {totalCost > 0 && (
                          <span className="font-semibold text-emerald-600">
                            ${totalCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Segment Type Badge */}
                    <div
                      className="inline-block px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${segmentColor}20`,
                        color: segmentColor,
                      }}
                    >
                      {segment.segmentType}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
