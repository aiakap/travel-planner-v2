"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { groupReservationsByDate, getTripDates, getMonthLong, getYear } from "../lib/view-utils"

// Month names array for consistent UTC-safe display
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface CalendarGridProps {
  itinerary: ViewItinerary
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

export function CalendarGrid({ itinerary, selectedDate, onDateSelect }: CalendarGridProps) {
  // Parse trip dates in UTC to avoid timezone issues
  const tripStart = new Date(itinerary.startDate)
  const tripEnd = new Date(itinerary.endDate)
  
  // Use UTC methods to get initial month/year to avoid timezone shifts
  const [currentMonth, setCurrentMonth] = useState(tripStart.getUTCMonth())
  const [currentYear, setCurrentYear] = useState(tripStart.getUTCFullYear())
  
  // Pre-compute trip date strings for efficient lookup
  const tripDateStrings = useMemo(
    () => new Set(getTripDates(itinerary.startDate, itinerary.endDate)),
    [itinerary.startDate, itinerary.endDate]
  )

  // Group reservations by date
  const reservationsByDate = useMemo(() => groupReservationsByDate(itinerary), [itinerary])

  // Get segment for each date (UTC-safe using getTripDates)
  const segmentsByDate = useMemo(() => {
    const map: Record<string, typeof itinerary.segments[0]> = {}
    itinerary.segments.forEach(segment => {
      const segmentDates = getTripDates(segment.startDate, segment.endDate)
      segmentDates.forEach(dateStr => {
        if (!map[dateStr]) {
          map[dateStr] = segment
        }
      })
    })
    return map
  }, [itinerary])

  // Helper to format date as YYYY-MM-DD using UTC
  const formatDateStr = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Generate calendar days for current month (UTC-safe)
  const calendarDays = useMemo(() => {
    // Use Date.UTC for consistent UTC handling
    const firstDayTimestamp = Date.UTC(currentYear, currentMonth, 1)
    const firstDay = new Date(firstDayTimestamp)
    const startingDayOfWeek = firstDay.getUTCDay()
    
    // Get number of days in current month
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate()
    
    const days: Array<{ dayNumber: number; isCurrentMonth: boolean; dateStr: string }> = []
    
    // Add previous month days
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const daysInPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonth + 1, 0)).getUTCDate()
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      const day = daysInPrevMonth - startingDayOfWeek + i + 1
      days.push({
        dayNumber: day,
        isCurrentMonth: false,
        dateStr: formatDateStr(prevMonthYear, prevMonth, day)
      })
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        dateStr: formatDateStr(currentYear, currentMonth, i)
      })
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateStr: formatDateStr(nextMonthYear, nextMonth, i)
      })
    }
    
    return days
  }, [currentMonth, currentYear])

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // UTC-safe month name display
  const monthName = `${MONTHS_LONG[currentMonth]} ${currentYear}`

  return (
    <Card className="p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map(({ dayNumber, isCurrentMonth, dateStr }, index) => {
          // Use string-based trip date checking (UTC-safe)
          const isInTrip = tripDateStrings.has(dateStr)
          const segment = segmentsByDate[dateStr]
          const reservations = reservationsByDate[dateStr] || []
          const isSelected = selectedDate === dateStr
          const segmentColor = segment ? itinerary.segmentColors[segment.id] : undefined

          return (
            <button
              key={index}
              onClick={() => isInTrip && onDateSelect(dateStr)}
              disabled={!isInTrip}
              className={`
                aspect-square p-1 rounded-lg border-2 transition-all
                ${isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                ${isInTrip ? 'cursor-pointer hover:border-primary' : 'cursor-not-allowed opacity-30'}
                ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                ${!isInTrip ? 'bg-muted/20' : ''}
              `}
              style={
                isInTrip && segmentColor
                  ? { backgroundColor: `${segmentColor}15` }
                  : undefined
              }
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className={`text-sm font-medium ${isInTrip ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {dayNumber}
                </span>
                {reservations.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1 py-0 h-4 mt-1"
                    style={
                      segmentColor
                        ? { backgroundColor: segmentColor, color: 'white' }
                        : undefined
                    }
                  >
                    {reservations.length}
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs font-medium text-muted-foreground mb-2">Segments</div>
        <div className="flex flex-wrap gap-2">
          {itinerary.segments.map(segment => {
            const segmentColor = itinerary.segmentColors[segment.id]
            return (
              <div key={segment.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: segmentColor }}
                />
                <span className="text-xs text-muted-foreground">{segment.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
