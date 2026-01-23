"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Hotel, Utensils, Train, Camera, Phone, Mail, Globe, Moon, MessageCircle, Edit, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

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
  onChatAboutItem?: (reservation: Reservation, itemTitle: string) => void
  onChatAboutSegment?: (segment: any) => void
  onEditItem?: (reservation: Reservation) => void
}

export function TableView({ segments, onSelectReservation, onChatAboutItem, onChatAboutSegment, onEditItem }: TableViewProps) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'table-view.tsx:54',message:'TableView rendering',data:{segmentsCount:segments?.length,hasSegments:!!segments,firstSegment:segments?.[0],firstSegmentDays:segments?.[0]?.days?.length,firstSegmentFirstDay:segments?.[0]?.days?.[0]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H5'})}).catch(()=>{});
  // #endregion
  const [openContactMenu, setOpenContactMenu] = useState<number | null>(null)
  const contactMenuRef = useRef<HTMLDivElement>(null)

  // Close contact menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactMenuRef.current && !contactMenuRef.current.contains(event.target as Node)) {
        setOpenContactMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    segment.days.forEach((day) => {
      day.items.forEach((item) => {
        item.reservations.forEach((res) => {
          total += res.cost
        })
      })
    })
    return { total }
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

  return (
    <div className="space-y-4">
      {segments.map((segment, segmentIndex) => {
        const segmentColor = getSegmentColor(segment, segmentIndex)
        const segmentCosts = getSegmentCosts(segment)

        return (
          <div key={segment.id} className="border rounded-lg overflow-hidden">
            {/* Segment Header */}
            <div
              className="p-2 flex items-center justify-between group/segment"
              style={{ backgroundColor: `${segmentColor}20`, borderLeft: `4px solid ${segmentColor}` }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{segment.name}</span>
                <span className="text-xs text-muted-foreground">
                  {segment.startDate} - {segment.endDate}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatAboutSegment?.(segment);
                  }}
                  className="h-6 w-6 p-0 hover:bg-slate-200/50 opacity-0 group-hover/segment:opacity-100 transition-opacity"
                  title="Chat about this segment"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium">
                  ${segmentCosts.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* List View */}
            <div className="p-2 space-y-1.5">
              {segment.days.map((day) =>
                day.items.map((item) =>
                  item.reservations.map((res, resIndex) => {
                    const Icon = getTypeIcon(item.type)
                    const isMultiDay = res.nights && res.nights > 1
                    const hasContactInfo = res.contactPhone || res.contactEmail || res.website
                    const isContactMenuOpen = openContactMenu === res.id

                    return (
                      <div
                        key={`${item.id}-${resIndex}`}
                        className="flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm border bg-background/60 border-border/50 hover:bg-background/80 hover:scale-[1.01] transition-all group"
                        onDoubleClick={() => onChatAboutItem?.(res, item.title)}
                      >
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
                          {res.text && (
                            <div className="text-[9px] text-muted-foreground truncate mt-0.5">{res.text}</div>
                          )}
                        </div>

                        {/* Cost */}
                        <div className="text-[10px] shrink-0 text-muted-foreground mr-2">
                          ${res.cost}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Contact Button with Dropdown */}
                          {hasContactInfo && (
                            <div className="relative" ref={isContactMenuOpen ? contactMenuRef : null}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenContactMenu(isContactMenuOpen ? null : res.id)
                                }}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              {isContactMenuOpen && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 py-1">
                                  {res.contactPhone && (
                                    <a
                                      href={`tel:${res.contactPhone}`}
                                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Phone className="h-3 w-3" />
                                      <span className="truncate">{res.contactPhone}</span>
                                    </a>
                                  )}
                                  {res.contactEmail && (
                                    <a
                                      href={`mailto:${res.contactEmail}`}
                                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{res.contactEmail}</span>
                                    </a>
                                  )}
                                  {res.website && (
                                    <a
                                      href={res.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Globe className="h-3 w-3" />
                                      <span className="truncate">Website</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditItem?.(res)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          {/* Chat Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onChatAboutItem?.(res, item.title)
                            }}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  }),
                ),
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
