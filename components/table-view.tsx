"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Plane, Hotel, Utensils, Train, Camera, Phone, Mail, Globe, Moon } from "lucide-react"

interface Reservation {
  id: number
  vendor: string
  text: string
  status: "suggested" | "planned" | "confirmed"
  confirmationNumber?: string
  cost: number
  contactPhone?: string
  contactEmail?: string
  website?: string
  nights?: number
  startTime?: string
  endTime?: string
  startTimezone?: string
  endTimezone?: string
}

interface TableViewProps {
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

export function TableView({ segments, onSelectReservation }: TableViewProps) {
  const getSegmentColor = (segment: { type: string }, index: number) => {
    if (segment.type === "travel") return "#94A3B8"
    const colors = ["#0EA5E9", "#F43F5E", "#10B981", "#A855F7", "#F97316"]
    return colors[index % colors.length]
  }

  const getStatusBadge = (status: string, confirmationNumber?: string) => {
    if (status === "confirmed") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 text-[8px] px-1 py-0 font-bold">
          {confirmationNumber || "Confirmed"}
        </Badge>
      )
    }
    if (status === "planned") {
      return <Badge className="bg-sky-100 text-sky-700 text-[8px] px-1 py-0">Planned</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700 text-[8px] px-1 py-0">Suggestion</Badge>
  }

  const formatTimeDisplay = (res: Reservation) => {
    if (res.startTime && res.endTime) {
      if (res.startTimezone && res.endTimezone && res.startTimezone !== res.endTimezone) {
        return `${res.startTime} ${res.startTimezone} - ${res.endTime} ${res.endTimezone}`
      }
      return `${res.startTime} - ${res.endTime}`
    }
    if (res.startTime && res.startTimezone && res.endTimezone && res.startTimezone !== res.endTimezone) {
      return `${res.startTime} ${res.startTimezone}`
    }
    return res.startTime || ""
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

        return (
          <div key={segment.id} className="border rounded-lg overflow-hidden">
            {/* Segment Header */}
            <div
              className="p-2 flex items-center justify-between"
              style={{ backgroundColor: `${segmentColor}20`, borderLeft: `4px solid ${segmentColor}` }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{segment.name}</span>
                <span className="text-xs text-muted-foreground">
                  {segment.startDate} - {segment.endDate}
                </span>
              </div>
              <span className="text-xs font-medium">
                ${segmentCosts.total.toLocaleString()}
                {segmentCosts.estimatedTotal > 0 && (
                  <span className="text-amber-600"> (~${segmentCosts.estimatedTotal.toLocaleString()})</span>
                )}
              </span>
            </div>

            {/* Table */}
            <table className="w-full text-[10px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-1.5 font-medium">Day</th>
                  <th className="text-left p-1.5 font-medium w-6"></th>
                  <th className="text-left p-1.5 font-medium">Vendor</th>
                  <th className="text-left p-1.5 font-medium">Time</th>
                  <th className="text-left p-1.5 font-medium">Status</th>
                  <th className="text-right p-1.5 font-medium">Cost</th>
                  <th className="text-center p-1.5 font-medium w-12">Contact</th>
                </tr>
              </thead>
              <tbody>
                {segment.days.map((day) =>
                  day.items.map((item) =>
                    item.reservations.map((res, resIndex) => (
                      <tr
                        key={`${item.id}-${resIndex}`}
                        className="border-t hover:bg-accent/30 cursor-pointer"
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
                        <td className="p-1.5">
                          <div className="font-medium">{day.dayOfWeek}</div>
                          <div className="text-muted-foreground text-[9px]">Day {day.day}</div>
                        </td>
                        <td className="p-1.5">
                          <item.icon className="h-3 w-3 text-muted-foreground" />
                        </td>
                        <td className="p-1.5">
                          <div className="font-medium">{res.vendor}</div>
                          <div className="text-muted-foreground truncate max-w-[150px]">{res.text}</div>
                        </td>
                        <td className="p-1.5 whitespace-nowrap">
                          <div>{formatTimeDisplay(res)}</div>
                          {res.nights && (
                            <div className="flex items-center gap-0.5 text-muted-foreground">
                              <Moon className="h-2.5 w-2.5" />
                              <span>{res.nights}n</span>
                            </div>
                          )}
                        </td>
                        <td className="p-1.5">{getStatusBadge(res.status, res.confirmationNumber)}</td>
                        <td className={`p-1.5 text-right ${res.status !== "confirmed" ? "text-amber-600" : ""}`}>
                          ${res.cost}
                          {res.status !== "confirmed" && "~"}
                        </td>
                        <td className="p-1.5">
                          <div className="flex justify-center gap-0.5">
                            {res.contactPhone && <Phone className="h-3 w-3 text-muted-foreground" />}
                            {res.contactEmail && <Mail className="h-3 w-3 text-muted-foreground" />}
                            {res.website && <Globe className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </td>
                      </tr>
                    )),
                  ),
                )}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
