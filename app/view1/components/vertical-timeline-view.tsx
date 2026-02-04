"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { ChevronDown, ChevronRight, MessageCircle, Calendar, MapPin, Plane, Hotel, Utensils, Compass, Car, Sparkles } from "lucide-react"
import { getTripDates, formatDateCompact, formatDateWithLongWeekday } from "../lib/view-utils"
import { chatAboutSegment, chatAboutReservation } from "../lib/chat-integration"
import { formatAsUSD } from "@/lib/utils/currency-converter"
import { 
  TripSuggestionBanner, 
  SegmentSuggestionReason,
  SuggestionIndicator,
} from "./suggestion-reason-display"

interface VerticalTimelineViewProps {
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

export function VerticalTimelineView({ itinerary }: VerticalTimelineViewProps) {
  const [collapsedSegments, setCollapsedSegments] = useState<Set<string>>(new Set())

  const toggleSegment = (segmentId: string) => {
    const newCollapsed = new Set(collapsedSegments)
    if (newCollapsed.has(segmentId)) {
      newCollapsed.delete(segmentId)
    } else {
      newCollapsed.add(segmentId)
    }
    setCollapsedSegments(newCollapsed)
  }

  // Group reservations by date for each segment
  // Always includes all reservations - those with dates outside segment range appear on first day
  const getSegmentDays = (segment: typeof itinerary.segments[0]) => {
    const dates = getTripDates(segment.startDate, segment.endDate)
    const firstDay = dates[0]
    
    const days = dates.map(date => ({
      date,
      reservations: segment.reservations.filter(r => {
        // If date matches, show on that day
        if (r.date === date) return true
        // If date is outside segment range and this is the first day, show here
        if (date === firstDay && !dates.includes(r.date)) return true
        return false
      }).map(r => ({
        ...r,
        // Mark if this reservation is displayed on a different day than its actual date
        displayedOnDifferentDay: r.date !== date && !dates.includes(r.date),
        actualDate: r.date
      }))
    }))
    
    return days.filter(day => day.reservations.length > 0)
  }

  return (
    <div className="space-y-4">
      {/* Trip-level suggestion banner for AI-generated trips */}
      {itinerary.isSample && itinerary.suggestionSummary && (
        <TripSuggestionBanner
          suggestionSummary={itinerary.suggestionSummary}
          suggestionParameters={itinerary.suggestionParameters}
          profileReferences={itinerary.profileReferences}
          className="mb-2"
        />
      )}

      {itinerary.segments.map((segment, segmentIndex) => {
        const isCollapsed = collapsedSegments.has(segment.id)
        const segmentColor = itinerary.segmentColors[segment.id]
        const days = getSegmentDays(segment)
        // Use priceUSD for accurate multi-currency totals
        const totalCostUSD = segment.reservations.reduce((sum, r) => sum + (r.priceUSD || 0), 0)

        return (
          <Card key={segment.id} className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
            {/* Segment Header */}
            <div
              className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              style={{ borderLeft: `4px solid ${segmentColor}` }}
              onClick={() => toggleSegment(segment.id)}
            >
              <div className="flex items-start gap-3">
                {/* Segment Image */}
                {segment.imageUrl && (
                  <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                    <img
                      src={segment.imageUrl}
                      alt={segment.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Segment Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    )}
                    <h3 className="font-semibold text-base truncate">{segment.title}</h3>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: segmentColor, color: segmentColor }}
                    >
                      {segment.segmentType}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateCompact(segment.startDate)} - {formatDateCompact(segment.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {segment.startTitle === segment.endTitle
                        ? segment.startTitle
                        : `${segment.startTitle} → ${segment.endTitle}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      {segment.reservations.length} reservation{segment.reservations.length !== 1 ? 's' : ''}
                    </span>
                    {totalCostUSD > 0 && (
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatAsUSD(totalCostUSD)}
                      </span>
                    )}
                  </div>

                  {/* Segment-level suggestion reason */}
                  {segment.suggestionReason && (
                    <SegmentSuggestionReason
                      suggestionReason={segment.suggestionReason}
                      profileReferences={segment.profileReferences}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Chat Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    chatAboutSegment(itinerary.id, segment, 'timeline')
                  }}
                  className="shrink-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Segment Timeline Content */}
            {!isCollapsed && days.length > 0 && (
              <div className="px-4 pb-4">
                <div className="ml-4 relative">
                  {/* Vertical timeline line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                    style={{ backgroundColor: `${segmentColor}40` }}
                  />

                  {/* Days */}
                  <div className="space-y-6">
                    {days.map((day, dayIndex) => (
                      <div key={day.date} className="relative pl-6">
                        {/* Day node */}
                        <div
                          className="absolute left-0 top-2 w-3 h-3 rounded-full border-2 -translate-x-[5px] bg-background"
                          style={{ borderColor: segmentColor }}
                        />

                        {/* Day header */}
                        <div className="mb-3">
                          <div className="text-sm font-semibold">
                            {formatDateWithLongWeekday(day.date)}
                          </div>
                        </div>

                        {/* Reservations */}
                        <div className="space-y-2">
                          {day.reservations.map((reservation) => {
                            const Icon = getReservationIcon(reservation.type)

                            return (
                              <div
                                key={reservation.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-card border hover:border-primary/50 transition-colors cursor-pointer group"
                                onClick={() => chatAboutReservation(itinerary.id, reservation, segment.id, 'timeline')}
                              >
                                {/* Icon */}
                                <div
                                  className="p-2 rounded-md shrink-0"
                                  style={{ backgroundColor: `${segmentColor}20` }}
                                >
                                  <Icon className="h-4 w-4" style={{ color: segmentColor }} />
                                </div>

                                {/* Reservation Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-sm">{reservation.title}</span>
                                    {reservation.isSample && reservation.suggestionReason && (
                                      <SuggestionIndicator
                                        suggestionReason={reservation.suggestionReason}
                                        profileReferences={reservation.profileReferences}
                                        compact
                                      />
                                    )}
                                    {reservation.confirmationNumber && (
                                      <Badge variant="secondary" className="text-xs">
                                        {reservation.confirmationNumber}
                                      </Badge>
                                    )}
                                    {reservation.displayedOnDifferentDay && (
                                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                        {reservation.type === 'hotel' ? 'Check-in' : 'Starts'}: {formatDateCompact(reservation.actualDate)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                    {reservation.time && (
                                      <div>Time: {reservation.time}</div>
                                    )}
                                    {reservation.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {reservation.location}
                                      </div>
                                    )}
                                    {reservation.description && (
                                      <div>{reservation.description}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Price and Chat */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  {reservation.price > 0 && (
                                    <span className="text-sm font-semibold">
                                      ${reservation.price.toLocaleString()}
                                    </span>
                                  )}
                                  <MessageCircle className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      {itinerary.segments.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No segments in this trip</p>
        </Card>
      )}
    </div>
  )
}
