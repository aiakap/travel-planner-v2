"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { ChevronDown, ChevronRight, Calendar, MapPin, MessageCircle } from "lucide-react"
import { chatAboutSegment, chatAboutReservation } from "../lib/chat-integration"

interface CompactListViewProps {
  itinerary: ViewItinerary
}

export function CompactListView({ itinerary }: CompactListViewProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set())

  const toggleSegment = (segmentId: string) => {
    const newExpanded = new Set(expandedSegments)
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId)
    } else {
      newExpanded.add(segmentId)
    }
    setExpandedSegments(newExpanded)
  }

  return (
    <div className="space-y-2">
      {itinerary.segments.map((segment) => {
        const isExpanded = expandedSegments.has(segment.id)
        const segmentColor = itinerary.segmentColors[segment.id]
        const totalCost = segment.reservations.reduce((sum, r) => sum + r.price, 0)

        return (
          <Card key={segment.id} className="overflow-hidden">
            {/* Compact Segment Row */}
            <div
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              style={{ borderLeft: `3px solid ${segmentColor}` }}
              onClick={() => toggleSegment(segment.id)}
            >
              <div className="flex items-center gap-3">
                {/* Expand/Collapse Icon */}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}

                {/* Segment Image */}
                {segment.imageUrl && (
                  <div className="shrink-0 w-10 h-10 rounded overflow-hidden">
                    <img
                      src={segment.imageUrl}
                      alt={segment.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Segment Info */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{segment.title}</div>
                    <Badge
                      variant="outline"
                      className="text-xs mt-1"
                      style={{ borderColor: segmentColor, color: segmentColor }}
                    >
                      {segment.segmentType}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(segment.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(segment.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {segment.startTitle === segment.endTitle
                          ? segment.startTitle
                          : `${segment.startTitle} → ${segment.endTitle}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{segment.reservations.length} items</span>
                      {totalCost > 0 && (
                        <span className="ml-2 font-semibold text-emerald-600">
                          ${totalCost.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        chatAboutSegment(itinerary.id, segment, 'timeline')
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Reservations */}
            {isExpanded && segment.reservations.length > 0 && (
              <div className="px-3 pb-3 bg-muted/20">
                <div className="space-y-1 pt-2">
                  {segment.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-2 rounded bg-background hover:bg-accent/50 transition-colors cursor-pointer text-sm"
                      onClick={() => chatAboutReservation(itinerary.id, reservation, segment.id, 'timeline')}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{reservation.title}</span>
                          {reservation.confirmationNumber && (
                            <Badge variant="secondary" className="text-xs">
                              {reservation.confirmationNumber}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {reservation.date} • {reservation.time}
                          {reservation.location && ` • ${reservation.location}`}
                        </div>
                      </div>
                      {reservation.price > 0 && (
                        <span className="text-sm font-semibold shrink-0 ml-3">
                          ${reservation.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
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
