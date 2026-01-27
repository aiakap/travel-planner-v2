"use client"

import type React from "react"
import { Badge } from "@/app/exp/ui/badge"
import { Button } from "@/app/exp/ui/button"
import { Plane, Hotel, Utensils, Train, Camera, ChevronDown, ChevronRight, Moon, Clock, MessageCircle, Edit, Phone, Mail, Globe, ChevronDown as ChevronDownIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"

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
  contactPhone?: string
  contactEmail?: string
  website?: string
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
  onChatAboutItem?: (reservation: Reservation, itemTitle: string) => void
  onChatAboutSegment?: (segment: any) => void
  onEditItem?: (reservation: Reservation) => void
}

export function TimelineView({ segments, heroImage, onSelectReservation, onChatAboutItem, onChatAboutSegment, onEditItem }: TimelineViewProps) {
  const [collapsedSegments, setCollapsedSegments] = useState<Set<number>>(new Set())
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
    segment.days.forEach((day) => {
      day.items.forEach((item) => {
        item.reservations.forEach((res) => {
          total += res.cost
        })
      })
    })
    return { total }
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
                className="flex gap-3 p-3 rounded-xl backdrop-blur-md hover:bg-white/10 transition-colors relative group"
                style={{ backgroundColor: `${segmentColor}15`, border: `1px solid ${segmentColor}40` }}
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
                <div className="flex-1 flex flex-col justify-center min-w-0 cursor-pointer" onClick={() => toggleSegment(segment.id)}>
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
                
                {/* Chat icon */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatAboutSegment?.(segment);
                  }}
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                  title="Chat about this segment"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
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

                            const hasContactInfo = res.contactPhone || res.contactEmail || res.website
                            const isContactMenuOpen = openContactMenu === res.id

                            return (
                              <div
                                key={`${item.id}-${resIndex}`}
                                className={`flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm border hover:scale-[1.01] transition-all group ${
                                  isMultiDay
                                    ? "bg-gradient-to-r from-background/80 to-background/40 border-l-2"
                                    : "bg-background/60 border-border/50 hover:bg-background/80"
                                }`}
                                style={isMultiDay ? { borderLeftColor: segmentColor } : undefined}
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
