"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Plane, Hotel, Utensils, Train, Camera, ChevronDown, ChevronRight, Moon, Clock } from "lucide-react"
import { useState } from "react"

interface Reservation {
  id: number
  vendor: string
  text: string
  status: "suggested" | "planned" | "confirmed"
  confirmationNumber?: string
  cost: number
  image?: string
  startTime?: string
  endTime?: string
  nights?: number
  checkInDate?: string
  checkOutDate?: string
  checkInTime?: string
  checkOutTime?: string
}

interface TimelineViewProps {
  segments: Array<{
    id: number
    name: string
    type: string
    startDate: string
    endDate: string
    image?: string
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
  heroImage?: string
  onSelectReservation: (data: {
    reservation: Reservation
    itemTitle: string
    itemTime: string
    itemType: string
    dayDate: string
  }) => void
}

export function TimelineView({ segments, heroImage, onSelectReservation }: TimelineViewProps) {
  const [collapsedSegments, setCollapsedSegments] = useState<Set<number>>(new Set())

  const toggleSegment = (segmentId: number) => {
    const newCollapsed = new Set(collapsedSegments)
    if (newCollapsed.has(segmentId)) {
      newCollapsed.delete(segmentId)
    } else {
      newCollapsed.add(segmentId)
    }
    setCollapsedSegments(newCollapsed)
  }

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flight":
        return Plane
      case "hotel":
        return Hotel
      case "dining":
        return Utensils
      case "train":
        return Train
      default:
        return Camera
    }
  }

  // Calculate segment costs
  const getSegmentCosts = (segment: TimelineViewProps["segments"][0]) => {
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
    <div className="h-full overflow-hidden rounded-lg bg-muted/30">
      {/* Content */}
      <div className="h-full overflow-y-auto p-4">
        {segments.map((segment, segmentIndex) => {
          const isCollapsed = collapsedSegments.has(segment.id)
          const segmentColor = getSegmentColor(segment, segmentIndex)
          const segmentCosts = getSegmentCosts(segment)

          const shownMultiDayReservations = new Set<number>()

          return (
            <div key={segment.id} className="mb-6 last:mb-0">
              {/* Segment card with image */}
              <div
                className="flex gap-3 p-3 rounded-xl backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
                style={{ backgroundColor: `${segmentColor}15`, border: `1px solid ${segmentColor}40` }}
                onClick={() => toggleSegment(segment.id)}
              >
                {/* Segment image */}
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={segment.image || "/placeholder.svg?height=100&width=100&query=travel destination"}
                    alt={segment.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Segment info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: segmentColor }} />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0" style={{ color: segmentColor }} />
                    )}
                    <span className="font-bold text-sm truncate">{segment.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {segment.startDate}
                      {segment.startDate !== segment.endDate && ` — ${segment.endDate}`}
                    </span>
                    <span className="text-xs font-medium">
                      ${segmentCosts.total.toLocaleString()}
                      {segmentCosts.estimatedTotal > 0 && (
                        <span className="text-amber-500 ml-1">(~${segmentCosts.estimatedTotal})</span>
                      )}
                    </span>
                  </div>
                  {/* Day count indicator */}
                  <div className="flex gap-1 mt-2">
                    {segment.days.map((day, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full max-w-4"
                        style={{ backgroundColor: segmentColor, opacity: 0.6 + i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline content */}
              {!isCollapsed && (
                <div className="mt-3 ml-8 relative">
                  {/* Vertical timeline line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                    style={{ backgroundColor: `${segmentColor}50` }}
                  />

                  {/* Days */}
                  {segment.days.map((day, dayIndex) => (
                    <div key={day.day} className="relative pl-6 pb-4">
                      {/* Hash mark on timeline */}
                      <div
                        className="absolute left-0 top-2 w-2 h-0.5 rounded-full -translate-x-[3px]"
                        style={{ backgroundColor: segmentColor }}
                      />
                      {/* Day node */}
                      <div
                        className="absolute left-0 top-0 w-3 h-3 rounded-full border-2 -translate-x-[5px] bg-background"
                        style={{ borderColor: segmentColor }}
                      />

                      {/* Day header */}
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xs font-semibold">{day.dayOfWeek}</span>
                        <span className="text-[10px] text-muted-foreground">Day {day.day}</span>
                        <span className="text-[10px] text-muted-foreground">• {day.date}</span>
                      </div>

                      <div className="space-y-1.5">
                        {day.items.map((item) =>
                          item.reservations.map((res, resIndex) => {
                            const Icon = getTypeIcon(item.type)
                            const isMultiDay = res.nights && res.nights > 1

                            // Skip multi-day reservations we've already shown
                            if (isMultiDay && shownMultiDayReservations.has(res.id)) {
                              return null
                            }

                            // Mark this multi-day reservation as shown
                            if (isMultiDay) {
                              shownMultiDayReservations.add(res.id)
                            }

                            return (
                              <div
                                key={`${item.id}-${resIndex}`}
                                className={`flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm border cursor-pointer hover:scale-[1.01] transition-all group ${
                                  isMultiDay
                                    ? "bg-gradient-to-r from-background/80 to-background/40 border-l-2"
                                    : "bg-background/60 border-border/50 hover:bg-background/80"
                                }`}
                                style={isMultiDay ? { borderLeftColor: segmentColor } : undefined}
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
                                {/* Time column */}
                                <div className="w-14 shrink-0 text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{res.startTime?.replace(":00", "") || "TBD"}</span>
                                </div>

                                {/* Icon */}
                                <div
                                  className="p-1.5 rounded-md shrink-0"
                                  style={{ backgroundColor: `${segmentColor}20` }}
                                >
                                  <Icon className="h-3.5 w-3.5" style={{ color: segmentColor }} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-medium truncate">{res.vendor}</span>
                                    {getStatusBadge(res.status, res.confirmationNumber)}
                                    {isMultiDay && (
                                      <Badge
                                        className="text-[8px] px-1.5 py-0 h-3.5 gap-0.5"
                                        style={{
                                          backgroundColor: `${segmentColor}20`,
                                          color: segmentColor,
                                          border: `1px solid ${segmentColor}40`,
                                        }}
                                      >
                                        <Moon className="h-2.5 w-2.5" />
                                        {res.nights} nights
                                      </Badge>
                                    )}
                                  </div>
                                  {isMultiDay && res.checkInDate && res.checkOutDate ? (
                                    <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                                      <span>
                                        In: {res.checkInDate} {res.checkInTime && `@ ${res.checkInTime}`}
                                      </span>
                                      <span className="text-muted-foreground/50">→</span>
                                      <span>
                                        Out: {res.checkOutDate} {res.checkOutTime && `@ ${res.checkOutTime}`}
                                      </span>
                                    </div>
                                  ) : (
                                    res.text && (
                                      <div className="text-[9px] text-muted-foreground truncate mt-0.5">{res.text}</div>
                                    )
                                  )}
                                </div>

                                {/* Cost */}
                                <div
                                  className={`text-[10px] shrink-0 ${res.status !== "confirmed" ? "text-amber-600" : "text-muted-foreground"}`}
                                >
                                  ${res.cost}
                                  {res.status !== "confirmed" && "~"}
                                </div>
                              </div>
                            )
                          }),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
