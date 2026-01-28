"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { MapPin, Plane, Hotel, Utensils, Compass, Car, X, Filter } from "lucide-react"
import { useState } from "react"

interface MapSidePanelProps {
  itinerary: ViewItinerary
  selectedSegmentId: string | null
  selectedReservationId: string | null
  filterByType: string[]
  onSegmentSelect: (id: string | null) => void
  onReservationSelect: (id: string | null) => void
  onFilterChange: (types: string[]) => void
}

const reservationTypes: Array<{ value: ViewReservation['type']; label: string; icon: any }> = [
  { value: 'flight', label: 'Flights', icon: Plane },
  { value: 'hotel', label: 'Hotels', icon: Hotel },
  { value: 'restaurant', label: 'Restaurants', icon: Utensils },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'activity', label: 'Activities', icon: Compass },
]

function getReservationIcon(type: ViewReservation['type']) {
  return reservationTypes.find(t => t.value === type)?.icon || Compass
}

export function MapSidePanel({
  itinerary,
  selectedSegmentId,
  selectedReservationId,
  filterByType,
  onSegmentSelect,
  onReservationSelect,
  onFilterChange,
}: MapSidePanelProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleTypeToggle = (type: string) => {
    if (filterByType.includes(type)) {
      onFilterChange(filterByType.filter(t => t !== type))
    } else {
      onFilterChange([...filterByType, type])
    }
  }

  const clearFilters = () => {
    onSegmentSelect(null)
    onReservationSelect(null)
    onFilterChange([])
  }

  const selectedSegment = selectedSegmentId
    ? itinerary.segments.find(s => s.id === selectedSegmentId)
    : null

  return (
    <Card className="p-4 max-h-[700px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Map Controls</h3>
        {(selectedSegmentId || selectedReservationId || filterByType.length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full mb-4 gap-2"
      >
        <Filter className="h-4 w-4" />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {/* Filters */}
      {showFilters && (
        <Card className="p-3 mb-4 bg-muted/50">
          <div className="text-sm font-medium mb-2">Filter by Type</div>
          <div className="space-y-2">
            {reservationTypes.map(type => {
              const Icon = type.icon
              return (
                <div key={type.value} className="flex items-center gap-2">
                  <Checkbox
                    id={type.value}
                    checked={filterByType.includes(type.value)}
                    onCheckedChange={() => handleTypeToggle(type.value)}
                  />
                  <label
                    htmlFor={type.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {type.label}
                  </label>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Segments List */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Segments</div>
        {itinerary.segments.map(segment => {
          const color = itinerary.segmentColors[segment.id]
          const isSelected = selectedSegmentId === segment.id
          const totalCost = segment.reservations.reduce((sum, r) => sum + r.price, 0)

          return (
            <button
              key={segment.id}
              onClick={() => onSegmentSelect(isSelected ? null : segment.id)}
              className={`
                w-full text-left p-3 rounded-lg border-2 transition-all
                ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'}
              `}
              style={{ borderLeftWidth: '4px', borderLeftColor: color }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{segment.title}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {segment.startTitle === segment.endTitle
                          ? segment.startTitle
                          : `${segment.startTitle} → ${segment.endTitle}`}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0"
                    style={{ borderColor: color, color }}
                  >
                    {segment.segmentType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {segment.reservations.length} items
                  </span>
                  {totalCost > 0 && (
                    <span className="font-semibold text-emerald-600">
                      ${totalCost.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Segment Reservations */}
      {selectedSegment && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Reservations in {selectedSegment.title}
          </div>
          {selectedSegment.reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reservations</p>
          ) : (
            <div className="space-y-2">
              {selectedSegment.reservations.map(reservation => {
                const Icon = getReservationIcon(reservation.type)
                const isSelected = selectedReservationId === reservation.id
                const color = itinerary.segmentColors[selectedSegment.id]

                return (
                  <button
                    key={reservation.id}
                    onClick={() => onReservationSelect(isSelected ? null : reservation.id)}
                    className={`
                      w-full text-left p-2 rounded-lg border transition-all
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {reservation.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.time}
                        </div>
                      </div>
                      {reservation.price > 0 && (
                        <span className="text-xs font-semibold shrink-0">
                          ${reservation.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs font-medium text-muted-foreground mb-2">Legend</div>
        <div className="space-y-1.5">
          {itinerary.segments.map(segment => {
            const color = itinerary.segmentColors[segment.id]
            return (
              <div key={segment.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs text-muted-foreground truncate">{segment.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
