import type { ViewItinerary, ViewSegment, ViewReservation } from "@/lib/itinerary-view-types"
import { Plane, Hotel, Utensils, Car, MapPin, Home, Snowflake, Map as MapIcon } from "lucide-react"

// UTC-safe month/day names to avoid hydration mismatches
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

// Generate months array from date range (UTC-safe)
export function generateMonths(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months: Array<{ name: string, days: number[] }> = []
  
  const current = new Date(start)
  while (current <= end) {
    const monthName = MONTHS_LONG[current.getUTCMonth()]
    const year = current.getUTCFullYear()
    const month = current.getUTCMonth()
    
    // Get days for this month that are in the trip range
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const days: number[] = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month, day))
      if (date >= start && date <= end) {
        days.push(day)
      }
    }
    
    if (days.length > 0) {
      months.push({ name: monthName, days })
    }
    
    // Move to next month
    current.setUTCMonth(current.getUTCMonth() + 1)
    current.setUTCDate(1)
  }
  
  return months
}

// Generate date range array for a segment (UTC-safe)
export function generateDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dates: string[] = []
  
  const current = new Date(start)
  while (current <= end) {
    const month = MONTHS_SHORT[current.getUTCMonth()]
    const day = current.getUTCDate()
    dates.push(`${month}-${day}`)
    current.setUTCDate(current.getUTCDate() + 1)
  }
  
  return dates
}

// Format date for display (UTC-safe) - "Jan 29"
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`
}

// Alias for formatDate - "Jan 29"
export const formatDateCompact = formatDate

// Format date with full weekday, month, day, year (UTC-safe) - "Monday, January 29, 2026"
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString)
  const weekday = DAYS_LONG[date.getUTCDay()]
  const month = MONTHS_LONG[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  return `${weekday}, ${month} ${day}, ${year}`
}

// Format date with short weekday (UTC-safe) - "Mon, Jan 29"
export function formatDateWithWeekday(dateString: string): string {
  const date = new Date(dateString)
  const weekday = DAYS_SHORT[date.getUTCDay()]
  const month = MONTHS_SHORT[date.getUTCMonth()]
  const day = date.getUTCDate()
  return `${weekday}, ${month} ${day}`
}

// Format date with long weekday and full month (UTC-safe) - "Monday, January 29"
export function formatDateWithLongWeekday(dateString: string): string {
  const date = new Date(dateString)
  const weekday = DAYS_LONG[date.getUTCDay()]
  const month = MONTHS_LONG[date.getUTCMonth()]
  const day = date.getUTCDate()
  return `${weekday}, ${month} ${day}`
}

// Format date with full month, day, year but no weekday (UTC-safe) - "January 29, 2026"
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString)
  const month = MONTHS_LONG[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  return `${month} ${day}, ${year}`
}

// Get day number from date string (UTC-safe) - 29
export function getDateNumber(dateString: string): number {
  const date = new Date(dateString)
  return date.getUTCDate()
}

// Get short weekday from date string (UTC-safe) - "Mon"
export function getWeekdayShort(dateString: string): string {
  const date = new Date(dateString)
  return DAYS_SHORT[date.getUTCDay()]
}

// Get long weekday from date string (UTC-safe) - "Monday"
export function getWeekdayLong(dateString: string): string {
  const date = new Date(dateString)
  return DAYS_LONG[date.getUTCDay()]
}

// Get short month from date string (UTC-safe) - "Jan"
export function getMonthShort(dateString: string): string {
  const date = new Date(dateString)
  return MONTHS_SHORT[date.getUTCMonth()]
}

// Get long month from date string (UTC-safe) - "January"
export function getMonthLong(dateString: string): string {
  const date = new Date(dateString)
  return MONTHS_LONG[date.getUTCMonth()]
}

// Get year from date string (UTC-safe) - 2026
export function getYear(dateString: string): number {
  const date = new Date(dateString)
  return date.getUTCFullYear()
}

// Format date range (UTC-safe) - "Jan 29 - Feb 5" or "Jan 29 - 31" if same month
export function formatDateRangeUTC(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const startMonth = MONTHS_SHORT[start.getUTCMonth()]
  const endMonth = MONTHS_SHORT[end.getUTCMonth()]
  const startDay = start.getUTCDate()
  const endDay = end.getUTCDate()
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`
  }
  
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
}

// Get all trip dates as YYYY-MM-DD strings (UTC-safe)
export function getTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const current = new Date(start)
  while (current <= end) {
    // Format as YYYY-MM-DD using UTC methods
    const year = current.getUTCFullYear()
    const month = String(current.getUTCMonth() + 1).padStart(2, '0')
    const day = String(current.getUTCDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    current.setUTCDate(current.getUTCDate() + 1)
  }
  
  return dates
}

// Group reservations by date (uses reservation.date which is already YYYY-MM-DD)
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

// Calendar moment type with multi-day support
export interface CalendarMoment {
  id: string
  date: string
  month: string
  day: string
  time: string
  title: string
  icon: typeof Plane  // LucideIcon type
  chapterId: string
  // End time display support
  endTime?: string           // Formatted end time (HH:mm)
  endDateDiff?: number       // Days difference (0 = same day, 1 = next day, etc.)
  // Multi-day reservation support
  isMultiDay: boolean
  isContinuation: boolean
  nightNumber?: number      // e.g., 2 (for "Night 2 of 4")
  totalNights?: number      // e.g., 4
  dayNumber?: number        // e.g., 2 (for "Day 2 of 5" - car rentals)
  totalDays?: number        // e.g., 5
  parentReservationId?: string
  reservationType?: ViewReservation['type']
  // Out-of-range display support (when reservation date is outside segment dates)
  displayedOnDifferentDay?: boolean
  actualDateDisplay?: string  // e.g., "Jan 30" - the actual date
}

// Map itinerary to calendar data structure
export function mapToCalendarData(itinerary: ViewItinerary) {
  const moments: CalendarMoment[] = []
  
  // Build date-to-segment lookup for cross-segment continuations
  // This allows multi-day reservations to show continuations in subsequent segments
  const dateToSegmentId: Map<string, string> = new Map()
  itinerary.segments.forEach(seg => {
    const start = new Date(seg.startDate)
    const end = new Date(seg.endDate)
    const current = new Date(start)
    console.log('📅 Building segment date map:', seg.title, {
      startDate: seg.startDate,
      endDate: seg.endDate,
      parsedStart: start.toISOString(),
      parsedEnd: end.toISOString(),
    })
    while (current <= end) {
      const key = `${MONTHS_SHORT[current.getUTCMonth()]}-${current.getUTCDate()}`
      dateToSegmentId.set(key, seg.id)
      current.setUTCDate(current.getUTCDate() + 1)
    }
  })
  console.log('📅 Date-to-segment map entries:', Array.from(dateToSegmentId.entries()))
  
  // Helper to find segment ID for a date
  const getSegmentIdForDate = (date: Date): string | undefined => {
    const key = `${MONTHS_SHORT[date.getUTCMonth()]}-${date.getUTCDate()}`
    const result = dateToSegmentId.get(key)
    console.log('📅 Looking up segment for date:', date.toISOString(), 'key:', key, 'result:', result)
    return result
  }
  
  // Generate moments including continuations for multi-day reservations
  itinerary.segments.forEach(seg => {
    // Get segment date range to check if reservation is displayed out-of-range
    const segStart = new Date(seg.startDate)
    const segEnd = new Date(seg.endDate)
    
    seg.reservations.forEach(res => {
      const date = new Date(res.date)
      const isMultiDayHotel = res.type === 'hotel' && res.nights && res.nights > 1
      const isMultiDayTransport = res.type === 'transport' && res.durationDays && res.durationDays > 1
      const isMultiDay = isMultiDayHotel || isMultiDayTransport
      
      // Determine where the full reservation card will actually be displayed
      // If reservation date is outside segment range, it shows on the segment's first day
      const resDateKey = `${MONTHS_SHORT[date.getUTCMonth()]}-${date.getUTCDate()}`
      const segStartKey = `${MONTHS_SHORT[segStart.getUTCMonth()]}-${segStart.getUTCDate()}`
      
      // Check if reservation date is within segment range
      const isDateInSegmentRange = date >= segStart && date <= segEnd
      // The display date is either the reservation date (if in range) or segment start (if out of range)
      const displayDateKey = isDateInSegmentRange ? resDateKey : segStartKey
      
      // Add the primary moment (day 1) - shows full reservation card, no "Night 1 of X"
      moments.push({
        id: res.id,
        date: date.getUTCDate().toString(),
        month: MONTHS_SHORT[date.getUTCMonth()],
        day: DAYS_SHORT[date.getUTCDay()],
        time: res.time,
        title: res.title,
        icon: getIconForType(res.type),
        chapterId: seg.id,
        endTime: res.endTimeFormatted,
        endDateDiff: res.endDateDiff,
        isMultiDay,
        isContinuation: false,
        totalNights: res.nights,
        totalDays: res.durationDays,
        reservationType: res.type
      })
      
      // Generate continuation moments for multi-day hotel reservations
      if (isMultiDayHotel && res.nights) {
        // Check if the actual check-in date is in a different segment
        // If so, we need to show "Night 1 of X" in that segment
        const checkInSegmentId = getSegmentIdForDate(date)
        const isCheckInInDifferentSegment = checkInSegmentId && checkInSegmentId !== seg.id
        
        if (isCheckInInDifferentSegment) {
          // Add Night 1 continuation to the check-in segment
          moments.push({
            id: `${res.id}-night-1`,
            date: date.getUTCDate().toString(),
            month: MONTHS_SHORT[date.getUTCMonth()],
            day: DAYS_SHORT[date.getUTCDay()],
            time: '',
            title: res.title,
            icon: getIconForType(res.type),
            chapterId: checkInSegmentId,
            isMultiDay: true,
            isContinuation: true,
            nightNumber: 1,
            totalNights: res.nights,
            parentReservationId: res.id,
            reservationType: res.type
          })
        }
        
        // Generate continuations for nights 2+
        for (let night = 2; night <= res.nights; night++) {
          const contDate = new Date(date)
          contDate.setUTCDate(contDate.getUTCDate() + night - 1)
          const contDateKey = `${MONTHS_SHORT[contDate.getUTCMonth()]}-${contDate.getUTCDate()}`
          
          // Skip this continuation if it falls on the same day as the full card display
          if (contDateKey === displayDateKey) {
            continue
          }
          
          // Find which segment this continuation date belongs to
          const contSegmentId = getSegmentIdForDate(contDate) || seg.id
          
          moments.push({
            id: `${res.id}-night-${night}`,
            date: contDate.getUTCDate().toString(),
            month: MONTHS_SHORT[contDate.getUTCMonth()],
            day: DAYS_SHORT[contDate.getUTCDay()],
            time: '',
            title: res.title,
            icon: getIconForType(res.type),
            chapterId: contSegmentId,
            isMultiDay: true,
            isContinuation: true,
            nightNumber: night,
            totalNights: res.nights,
            parentReservationId: res.id,
            reservationType: res.type
          })
        }
      }
      
      // Generate continuation moments for multi-day transport (car rentals)
      if (isMultiDayTransport && res.durationDays) {
        // Check if the pickup date is in a different segment
        const pickupSegmentId = getSegmentIdForDate(date)
        const isPickupInDifferentSegment = pickupSegmentId && pickupSegmentId !== seg.id
        
        if (isPickupInDifferentSegment) {
          // Add Day 1 continuation to the pickup segment
          moments.push({
            id: `${res.id}-day-1`,
            date: date.getUTCDate().toString(),
            month: MONTHS_SHORT[date.getUTCMonth()],
            day: DAYS_SHORT[date.getUTCDay()],
            time: '',
            title: res.title,
            icon: getIconForType(res.type),
            chapterId: pickupSegmentId,
            isMultiDay: true,
            isContinuation: true,
            dayNumber: 1,
            totalDays: res.durationDays,
            parentReservationId: res.id,
            reservationType: res.type
          })
        }
        
        // Generate continuations for days 2+
        for (let day = 2; day <= res.durationDays; day++) {
          const contDate = new Date(date)
          contDate.setUTCDate(contDate.getUTCDate() + day - 1)
          const contDateKey = `${MONTHS_SHORT[contDate.getUTCMonth()]}-${contDate.getUTCDate()}`
          
          // Skip this continuation if it falls on the same day as the full card display
          if (contDateKey === displayDateKey) {
            continue
          }
          
          // Find which segment this continuation date belongs to
          const contSegmentId = getSegmentIdForDate(contDate) || seg.id
          
          moments.push({
            id: `${res.id}-day-${day}`,
            date: contDate.getUTCDate().toString(),
            month: MONTHS_SHORT[contDate.getUTCMonth()],
            day: DAYS_SHORT[contDate.getUTCDay()],
            time: '',
            title: res.title,
            icon: getIconForType(res.type),
            chapterId: contSegmentId,
            isMultiDay: true,
            isContinuation: true,
            dayNumber: day,
            totalDays: res.durationDays,
            parentReservationId: res.id,
            reservationType: res.type
          })
        }
      }
    })
  })
  
  // Sort moments by date (month-day order)
  moments.sort((a, b) => {
    const monthOrder = MONTHS_SHORT.indexOf(a.month) - MONTHS_SHORT.indexOf(b.month)
    if (monthOrder !== 0) return monthOrder
    return parseInt(a.date) - parseInt(b.date)
  })
  
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
    moments
  }
}

// Generate all days in trip for calendar grid (UTC-safe)
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
    const month = MONTHS_LONG[current.getUTCMonth()]
    const monthShort = MONTHS_SHORT[current.getUTCMonth()]
    const date = current.getUTCDate()
    
    days.push({
      date,
      month,
      fullId: `${monthShort}-${date}`,
      idx,
      dateObj: new Date(current)
    })
    
    current.setUTCDate(current.getUTCDate() + 1)
    idx++
  }
  
  return days
}

// Get day of week for index (UTC-safe)
export function getDayOfWeek(idx: number, startDate: string): string {
  const start = new Date(startDate)
  const date = new Date(start)
  date.setUTCDate(date.getUTCDate() + idx)
  return DAYS_SHORT[date.getUTCDay()].slice(0, 2)
}

// Segment day with grouped moments
export interface SegmentDay {
  date: number
  month: string
  monthShort: string
  fullId: string
  dateObj: Date
  weekday: string
  moments: CalendarMoment[]
}

// Generate all days in a segment with their moments grouped (UTC-safe)
// Includes out-of-range moments on the first day to ensure all reservations are visible
export function getSegmentDaysWithMoments(
  segmentStartDate: string,
  segmentEndDate: string,
  moments: CalendarMoment[]
): SegmentDay[] {
  const start = new Date(segmentStartDate)
  const end = new Date(segmentEndDate)
  const days: SegmentDay[] = []
  
  // Collect all valid dates in segment range for later check
  const validDates: Set<string> = new Set()
  const tempCurrent = new Date(start)
  while (tempCurrent <= end) {
    const monthShort = MONTHS_SHORT[tempCurrent.getUTCMonth()]
    const date = tempCurrent.getUTCDate()
    validDates.add(`${monthShort}-${date}`)
    tempCurrent.setUTCDate(tempCurrent.getUTCDate() + 1)
  }
  
  // Find moments outside segment date range (to place on first day)
  const outOfRangeMoments = moments.filter(m => {
    const momentKey = `${m.month}-${m.date}`
    return !validDates.has(momentKey)
  })
  
  const current = new Date(start)
  let isFirstDay = true
  
  while (current <= end) {
    const monthShort = MONTHS_SHORT[current.getUTCMonth()]
    const month = MONTHS_LONG[current.getUTCMonth()]
    const date = current.getUTCDate()
    const fullId = `${monthShort}-${date}`
    const weekday = DAYS_SHORT[current.getUTCDay()]
    
    // Filter moments that belong to this day
    let dayMoments = moments.filter(m => 
      m.month === monthShort && m.date === date.toString()
    )
    
    // On the first day, also include out-of-range moments
    if (isFirstDay && outOfRangeMoments.length > 0) {
      // Add metadata to indicate these are displayed on a different day
      const outOfRangeWithMeta = outOfRangeMoments.map(m => ({
        ...m,
        displayedOnDifferentDay: true,
        actualDateDisplay: `${m.month} ${m.date}`
      }))
      dayMoments = [...outOfRangeWithMeta, ...dayMoments]
    }
    
    days.push({
      date,
      month,
      monthShort,
      fullId,
      dateObj: new Date(current),
      weekday,
      moments: dayMoments
    })
    
    isFirstDay = false
    current.setUTCDate(current.getUTCDate() + 1)
  }
  
  return days
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
