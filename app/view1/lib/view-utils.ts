import type { ViewItinerary, ViewSegment, ViewReservation } from "@/lib/itinerary-view-types"
import { Plane, Hotel, Utensils, Car, MapPin, Home, Snowflake, Map as MapIcon } from "lucide-react"

// Icon mapping for reservation types
export function getIconForType(type: ViewReservation['type']) {
  const iconMap = {
    flight: Plane,
    hotel: Home,
    restaurant: Utensils,
    transport: Car,
    activity: MapPin
  }
  return iconMap[type] || MapPin
}

// Chapter color mapping based on segment type
export function getChapterColor(segmentType: string) {
  const type = segmentType.toLowerCase()
  if (type.includes('travel') || type.includes('flight')) {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (type.includes('stay') || type.includes('hotel')) {
    return 'bg-rose-100 text-rose-700 border-rose-200'
  }
  if (type.includes('activity') || type.includes('explore')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

// Generate months array from date range
export function generateMonths(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months: Array<{ name: string, days: number[] }> = []
  
  const current = new Date(start)
  while (current <= end) {
    const monthName = current.toLocaleDateString('en-US', { month: 'long' })
    const year = current.getFullYear()
    const month = current.getMonth()
    
    // Get days for this month that are in the trip range
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: number[] = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date >= start && date <= end) {
        days.push(day)
      }
    }
    
    if (days.length > 0) {
      months.push({ name: monthName, days })
    }
    
    // Move to next month
    current.setMonth(current.getMonth() + 1)
    current.setDate(1)
  }
  
  return months
}

// Generate date range array for a segment
export function generateDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dates: string[] = []
  
  const current = new Date(start)
  while (current <= end) {
    const month = current.toLocaleDateString('en-US', { month: 'short' })
    const day = current.getDate()
    dates.push(`${month}-${day}`)
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Map itinerary to calendar data structure
export function mapToCalendarData(itinerary: ViewItinerary) {
  return {
    months: generateMonths(itinerary.startDate, itinerary.endDate),
    chapters: itinerary.segments.map(seg => ({
      id: seg.id,
      title: seg.title,
      start: formatDate(seg.startDate),
      end: formatDate(seg.endDate),
      location: seg.startTitle === seg.endTitle 
        ? seg.endTitle 
        : `${seg.startTitle} ➝ ${seg.endTitle}`,
      timeZone: '', // TODO: Add timezone logic if available
      color: getChapterColor(seg.segmentType),
      type: seg.segmentType.toLowerCase().includes('travel') ? 'travel' : 'stay',
      dateRange: generateDateRange(seg.startDate, seg.endDate)
    })),
    moments: itinerary.segments.flatMap(seg => 
      seg.reservations.map(res => {
        const date = new Date(res.date)
        return {
          id: res.id,
          date: date.getDate().toString(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          time: res.time,
          title: res.title,
          icon: getIconForType(res.type),
          chapterId: seg.id
        }
      })
    )
  }
}

// Generate all days in trip for calendar grid
export function generateAllDays(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days: Array<{
    date: number
    month: string
    fullId: string
    idx: number
    dateObj: Date
  }> = []
  
  const current = new Date(start)
  let idx = 0
  
  while (current <= end) {
    const month = current.toLocaleDateString('en-US', { month: 'long' })
    const monthShort = current.toLocaleDateString('en-US', { month: 'short' })
    const date = current.getDate()
    
    days.push({
      date,
      month,
      fullId: `${monthShort}-${date}`,
      idx,
      dateObj: new Date(current)
    })
    
    current.setDate(current.getDate() + 1)
    idx++
  }
  
  return days
}

// Get day of week for index
export function getDayOfWeek(idx: number, startDate: string): string {
  const start = new Date(startDate)
  const date = new Date(start)
  date.setDate(date.getDate() + idx)
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
}

// Detect if trip is round-trip (returns to starting location)
export function detectRoundTrip(itinerary: ViewItinerary): { isRoundTrip: boolean, homeLocation: string } {
  if (itinerary.segments.length === 0) {
    return { isRoundTrip: false, homeLocation: '' }
  }
  
  const firstSegment = itinerary.segments[0]
  const lastSegment = itinerary.segments[itinerary.segments.length - 1]
  
  // Check if the last segment ends where the first segment started
  const isRoundTrip = firstSegment.startTitle === lastSegment.endTitle
  
  return {
    isRoundTrip,
    homeLocation: firstSegment.startTitle
  }
}

// Filter only travel segments (segments with "travel" in type)
export function getTravelSegments(itinerary: ViewItinerary) {
  return itinerary.segments.filter(seg => 
    seg.segmentType.toLowerCase().includes('travel') || 
    seg.segmentType.toLowerCase().includes('flight')
  )
}
