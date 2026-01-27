"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { groupReservationsByDate } from "../lib/view-utils"

interface CalendarGridProps {
  itinerary: ViewItinerary
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

export function CalendarGrid({ itinerary, selectedDate, onDateSelect }: CalendarGridProps) {
  const tripStart = new Date(itinerary.startDate)
  const tripEnd = new Date(itinerary.endDate)
  
  const [currentMonth, setCurrentMonth] = useState(tripStart.getMonth())
  const [currentYear, setCurrentYear] = useState(tripStart.getFullYear())

  // Group reservations by date
  const reservationsByDate = useMemo(() => groupReservationsByDate(itinerary), [itinerary])

  // Get segment for each date
  const segmentsByDate = useMemo(() => {
    const map: Record<string, typeof itinerary.segments[0]> = {}
    itinerary.segments.forEach(segment => {
      const start = new Date(segment.startDate)
      const end = new Date(segment.endDate)
      let current = new Date(start)
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        if (!map[dateStr]) {
          map[dateStr] = segment
        }
        current.setDate(current.getDate() + 1)
      }
    })
    return map
  }, [itinerary])

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; dateStr: string }> = []
    
    // Add previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(firstDay)
      date.setDate(date.getDate() - (startingDayOfWeek - i))
      days.push({
        date,
        isCurrentMonth: false,
        dateStr: date.toISOString().split('T')[0]
      })
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentYear, currentMonth, i)
      days.push({
        date,
        isCurrentMonth: true,
        dateStr: date.toISOString().split('T')[0]
      })
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(lastDay)
      date.setDate(date.getDate() + i)
      days.push({
        date,
        isCurrentMonth: false,
        dateStr: date.toISOString().split('T')[0]
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

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

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
        {calendarDays.map(({ date, isCurrentMonth, dateStr }, index) => {
          const isInTrip = date >= tripStart && date <= tripEnd
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
                  {date.getDate()}
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
