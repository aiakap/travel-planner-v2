"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ViewSegment } from "@/lib/itinerary-view-types"
import { ReservationCard } from "./reservation-card"
import { ChevronDown, ChevronRight, Calendar, MapPin } from "lucide-react"

interface SegmentSectionProps {
  segment: ViewSegment
}

export function SegmentSection({ segment }: SegmentSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }

  const totalCost = segment.reservations.reduce((sum, r) => sum + r.price, 0)

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="bg-secondary/50 px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{segment.title}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateRange(segment.startDate, segment.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {segment.destination}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{segment.reservations.length} reservations</p>
                <p className="font-semibold text-emerald-500">${totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex md:hidden justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">{segment.reservations.length} reservations</span>
              <span className="font-semibold text-emerald-500">${totalCost.toLocaleString()}</span>
            </div>

            {segment.reservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No reservations yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {segment.reservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}


