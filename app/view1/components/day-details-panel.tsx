"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { X, MapPin, Calendar, Plane, Hotel, Utensils, Compass, Car, MessageCircle } from "lucide-react"
import { chatAboutReservation } from "../lib/chat-integration"
import { formatDateLong, getTripDates } from "../lib/view-utils"

interface DayDetailsPanelProps {
  itinerary: ViewItinerary
  selectedDate: string
  onClose: () => void
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

export function DayDetailsPanel({ itinerary, selectedDate, onClose }: DayDetailsPanelProps) {
  // Find segment for this date (UTC-safe using date string comparison)
  const segment = itinerary.segments.find(seg => {
    const segmentDates = getTripDates(seg.startDate, seg.endDate)
    return segmentDates.includes(selectedDate)
  })

  // Get reservations for this date
  const reservations = segment?.reservations.filter(r => r.date === selectedDate) || []

  // UTC-safe date formatting
  const formattedDate = formatDateLong(selectedDate)

  const segmentColor = segment ? itinerary.segmentColors[segment.id] : undefined

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-base">{formattedDate}</h3>
          </div>
          {segment && (
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                style={{ borderColor: segmentColor, color: segmentColor }}
                className="text-xs"
              >
                {segment.segmentType}
              </Badge>
              <span className="text-xs text-muted-foreground">{segment.title}</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Reservations */}
      {reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map(reservation => {
            const Icon = getReservationIcon(reservation.type)

            return (
              <div
                key={reservation.id}
                className="p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => segment && chatAboutReservation(itinerary.id, reservation, segment.id, 'calendar')}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="p-2 rounded-md shrink-0"
                    style={{ backgroundColor: `${segmentColor}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: segmentColor }} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{reservation.title}</span>
                      {reservation.confirmationNumber && (
                        <Badge variant="secondary" className="text-xs">
                          {reservation.confirmationNumber}
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
                      {reservation.notes && (
                        <div className="text-muted-foreground/80 italic mt-1">
                          {reservation.notes}
                        </div>
                      )}
                    </div>

                    {reservation.price > 0 && (
                      <div className="text-sm font-semibold text-emerald-600 mt-2">
                        ${reservation.price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Chat Icon */}
                  <MessageCircle className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No reservations on this day</p>
        </div>
      )}

      {/* Summary */}
      {reservations.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-emerald-600">
              ${reservations.reduce((sum, r) => sum + r.price, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
