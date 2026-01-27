import { differenceInDays } from "date-fns"
import type { ViewItinerary, ViewSegment } from "@/lib/itinerary-view-types"

/**
 * Generate consistent segment colors based on segment type and index
 */
export function getSegmentColor(segmentType: string, index: number): string {
  // Travel segments get a neutral gray
  if (segmentType.toLowerCase().includes('travel')) {
    return "#94A3B8"
  }
  
  // Rotating color palette for stay/other segments
  const colors = [
    "#0EA5E9", // sky blue
    "#F43F5E", // rose red
    "#10B981", // emerald green
    "#A855F7", // violet purple
    "#F97316", // orange
  ]
  
  return colors[index % colors.length]
}

/**
 * Calculate segment colors for an entire itinerary
 */
export function calculateSegmentColors(segments: ViewSegment[]): Record<string, string> {
  const colors: Record<string, string> = {}
  
  segments.forEach((segment, index) => {
    colors[segment.id] = getSegmentColor(segment.segmentType, index)
  })
  
  return colors
}

/**
 * Calculate the number of days in a trip
 */
export function calculateDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return differenceInDays(end, start) + 1 // +1 to include both start and end days
}

/**
 * Determine the recommended view mode based on trip length
 */
export function getRecommendedViewMode(dayCount: number): 'vertical' | 'gantt' | 'compact' {
  if (dayCount <= 5) return 'vertical'
  if (dayCount <= 14) return 'gantt'
  return 'compact'
}

/**
 * Format a date range into a readable string
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const startMonth = start.toLocaleDateString("en-US", { month: "short" })
  const endMonth = end.toLocaleDateString("en-US", { month: "short" })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = end.getFullYear()
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`
  }
  
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}

/**
 * Group reservations by date for calendar view
 */
export function groupReservationsByDate(itinerary: ViewItinerary): Record<string, ViewSegment['reservations']> {
  const grouped: Record<string, ViewSegment['reservations']> = {}
  
  itinerary.segments.forEach(segment => {
    segment.reservations.forEach(reservation => {
      const date = reservation.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(reservation)
    })
  })
  
  return grouped
}

/**
 * Get all unique dates in a trip
 */
export function getTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  let current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * Calculate total cost of an itinerary
 */
export function calculateTotalCost(itinerary: ViewItinerary): number {
  return itinerary.segments.reduce((total, segment) => {
    return total + segment.reservations.reduce((segmentTotal, res) => {
      return segmentTotal + res.price
    }, 0)
  }, 0)
}

/**
 * Get statistics for each reservation type
 */
export function getReservationStats(itinerary: ViewItinerary) {
  const allReservations = itinerary.segments.flatMap(s => s.reservations)
  
  return {
    flights: allReservations.filter(r => r.type === "flight").length,
    hotels: allReservations.filter(r => r.type === "hotel").length,
    restaurants: allReservations.filter(r => r.type === "restaurant").length,
    activities: allReservations.filter(r => r.type === "activity" || r.type === "transport").length,
    totalCost: calculateTotalCost(itinerary),
  }
}
