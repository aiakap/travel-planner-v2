"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Globe } from "lucide-react"

interface Reservation {
  id: number
  vendor: string
  text: string
  status: "suggested" | "planned" | "confirmed"
  confirmationNumber?: string
  cost: number
  image?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
}

interface PhotosViewProps {
  segments: Array<{
    id: number
    name: string
    type: string
    startDate: string
    endDate: string
    days: Array<{
      day: number
      date: string
      dayOfWeek: string
      items: Array<{
        id: number
        type: string
        title: string
        time: string
        icon: React.ElementType
        reservations: Reservation[]
      }>
    }>
  }>
  onSelectReservation: (data: {
    reservation: Reservation
    itemTitle: string
    itemTime: string
    itemType: string
    dayDate: string
  }) => void
}

export function PhotosView({ segments, onSelectReservation }: PhotosViewProps) {
  const getSegmentColor = (segment: { type: string }, index: number) => {
    if (segment.type === "travel") return "#94A3B8"
    const colors = ["#0EA5E9", "#F43F5E", "#10B981", "#A855F7", "#F97316"]
    return colors[index % colors.length]
  }

  const getStatusBadge = (status: string, confirmationNumber?: string) => {
    if (status === "confirmed") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 text-[8px] px-1 py-0 h-3.5 font-bold">
          {confirmationNumber || "Confirmed"}
        </Badge>
      )
    }
    if (status === "planned") {
      return <Badge className="bg-sky-100 text-sky-700 text-[8px] px-1 py-0 h-3.5">Planned</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700 text-[8px] px-1 py-0 h-3.5">Suggestion</Badge>
  }

  const getSegmentCosts = (segment: (typeof segments)[0]) => {
    let total = 0
    let estimatedTotal = 0
    segment.days.forEach((day) => {
      day.items.forEach((item) => {
        item.reservations.forEach((res) => {
          total += res.cost
          if (res.status !== "confirmed") {
            estimatedTotal += res.cost
          }
        })
      })
    })
    return { total, estimatedTotal }
  }

  return (
    <div className="space-y-4">
      {segments.map((segment, segmentIndex) => {
        const segmentColor = getSegmentColor(segment, segmentIndex)
        const segmentCosts = getSegmentCosts(segment)
        
        // Collect all reservations with context
        const allReservations: Array<{
          res: Reservation
          item: (typeof segment.days)[0]["items"][0]
          day: (typeof segment.days)[0]
        }> = []

        segment.days.forEach((day) => {
          day.items.forEach((item) => {
            item.reservations.forEach((res) => {
              allReservations.push({ res, item, day })
            })
          })
        })

        return (
          <div
            key={segment.id}
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: `${segmentColor}10` }}
          >
            {/* Segment header */}
            <div
              className="p-3 flex items-center justify-between"
              style={{ borderLeft: `4px solid ${segmentColor}` }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{segment.name}</span>
                <span className="text-xs text-muted-foreground">
                  {segment.startDate} - {segment.endDate}
                </span>
              </div>
              <span className="text-xs">
                ${segmentCosts.total.toLocaleString()}
                {segmentCosts.estimatedTotal > 0 && (
                  <span className="text-amber-600"> (~${segmentCosts.estimatedTotal.toLocaleString()})</span>
                )}
              </span>
            </div>

            {/* Photo grid */}
            <div className="p-2 grid grid-cols-3 gap-2">
              {allReservations.map(({ res, item, day }, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() =>
                    onSelectReservation({
                      reservation: res,
                      itemTitle: item.title,
                      itemTime: item.time,
                      itemType: item.type,
                      dayDate: day.date,
                    })
                  }
                >
                  <img
                    src={res.image || "/placeholder.svg?height=200&width=200&query=travel destination"}
                    alt={res.vendor}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div
                        className="p-1 rounded-full text-white"
                        style={{ backgroundColor: segmentColor }}
                      >
                        <item.icon className="h-3 w-3" />
                      </div>
                      <div className="flex gap-1">
                        {res.contactPhone && (
                          <div className="p-1 rounded-full bg-white/20 text-white">
                            <Phone className="h-3 w-3" />
                          </div>
                        )}
                        {res.contactEmail && (
                          <div className="p-1 rounded-full bg-white/20 text-white">
                            <Mail className="h-3 w-3" />
                          </div>
                        )}
                        {res.website && (
                          <div className="p-1 rounded-full bg-white/20 text-white">
                            <Globe className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-white text-[10px] font-medium truncate">{res.vendor}</div>
                      <div
                        className={`text-[8px] ${res.status !== "confirmed" ? "text-amber-300" : "text-white/70"}`}
                      >
                        ${res.cost}
                        {res.status !== "confirmed" && "~"}
                      </div>
                    </div>
                  </div>
                  {/* Status indicator */}
                  <div className="absolute top-1 left-1">
                    {getStatusBadge(res.status, res.confirmationNumber)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
