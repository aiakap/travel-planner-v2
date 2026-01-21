"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ViewReservation } from "@/lib/itinerary-view-types"
import { reservationTypeLabels } from "@/lib/itinerary-view-types"
import { Clock, MapPin, Hash, DollarSign } from "lucide-react"

interface ReservationCardProps {
  reservation: ViewReservation
}

const typeColors: Record<ViewReservation["type"], string> = {
  flight: "bg-blue-500 text-white",
  hotel: "bg-purple-500 text-white",
  activity: "bg-green-500 text-white",
  transport: "bg-amber-500 text-white",
  restaurant: "bg-orange-500 text-white",
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-32 md:h-auto md:w-36 shrink-0">
          <img
            src={reservation.image || "/placeholder.svg"}
            alt={reservation.title}
            className="h-full w-full object-cover"
          />
          <Badge className={`absolute top-2 left-2 ${typeColors[reservation.type]}`}>
            {reservationTypeLabels[reservation.type]}
          </Badge>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground leading-tight">{reservation.title}</h4>
              <p className="text-sm text-muted-foreground">{reservation.description}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {formatDate(reservation.date)} at {reservation.time}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">{reservation.location}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {reservation.confirmationNumber && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">{reservation.confirmationNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-emerald-500 font-semibold">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{reservation.price.toLocaleString()}</span>
            </div>
          </div>

          {reservation.notes && (
            <p className="mt-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{reservation.notes}</p>
          )}
        </div>
      </div>
    </Card>
  )
}


