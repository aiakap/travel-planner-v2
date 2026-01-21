import { Plane, Hotel, Utensils, Train, Camera } from "lucide-react"
import type { V0Itinerary, V0Segment, V0Day, V0Item, V0Reservation } from "./v0-types"

// Database types (simplified for this transformation)
type DBTrip = {
  id: string
  title: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
  segments: DBSegment[]
}

type DBSegment = {
  id: string
  name: string
  imageUrl: string | null
  startTime: Date | null
  endTime: Date | null
  segmentType: { name: string }
  reservations: DBReservation[]
  order: number
}

type DBReservation = {
  id: string
  name: string
  confirmationNumber: string | null
  notes: string | null
  startTime: Date | null
  endTime: Date | null
  cost: number | null
  currency: string | null
  location: string | null
  url: string | null
  imageUrl: string | null
  departureLocation: string | null
  departureTimezone: string | null
  arrivalLocation: string | null
  arrivalTimezone: string | null
  contactPhone: string | null
  contactEmail: string | null
  cancellationPolicy: string | null
  reservationType: { 
    name: string
    category: { name: string }
  }
  reservationStatus: { name: string }
}

/**
 * Transform a database Trip with relations to V0 itinerary format
 */
export function transformTripToV0Format(trip: DBTrip): V0Itinerary {
  const sortedSegments = [...trip.segments].sort((a, b) => a.order - b.order)
  
  return {
    title: trip.title,
    dates: formatTripDates(trip.startDate, trip.endDate),
    heroImage: trip.imageUrl || undefined,
    segments: sortedSegments.map((segment, index) => transformSegment(segment, index, trip.startDate))
  }
}

/**
 * Format trip dates for display
 */
function formatTripDates(startDate: Date, endDate: Date): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  const monthName = start.toLocaleDateString('en-US', { month: 'long' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = start.getFullYear()
  
  return `${monthName} ${startDay}-${endDay}, ${year} (${days} Days)`
}

/**
 * Transform a segment to V0 format
 */
function transformSegment(segment: DBSegment, segmentIndex: number, tripStartDate: Date): V0Segment {
  const segmentType = segment.segmentType?.name?.toLowerCase() === "travel" ? "travel" : "destination"
  
  const days = calculateSegmentDays(segment, tripStartDate)
  
  return {
    id: segmentIndex + 1,
    name: segment.name,
    type: segmentType,
    startDate: formatShortDate(segment.startTime || tripStartDate),
    endDate: formatShortDate(segment.endTime || tripStartDate),
    image: segment.imageUrl || undefined,
    days
  }
}

/**
 * Calculate days structure for a segment with grouped reservations
 */
function calculateSegmentDays(segment: DBSegment, tripStartDate: Date): V0Day[] {
  const startTime = segment.startTime || tripStartDate
  const endTime = segment.endTime || tripStartDate
  
  const dayCount = Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  const days: V0Day[] = []
  const tripStart = new Date(tripStartDate)
  const segmentStart = new Date(startTime)
  
  // Calculate which day of the trip this segment starts on
  const dayOffset = Math.floor((segmentStart.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(segmentStart)
    currentDate.setDate(currentDate.getDate() + i)
    
    const dayNumber = dayOffset + i + 1
    
    // Get reservations for this day
    const dayReservations = segment.reservations.filter(res => {
      if (!res.startTime) return i === 0 // If no time, put on first day
      
      const resDate = new Date(res.startTime)
      const resDay = resDate.toDateString()
      const currentDay = currentDate.toDateString()
      
      return resDay === currentDay
    })
    
    const items = dayReservations.map((res, idx) => transformReservationToItem(res, idx))
    
    days.push({
      day: dayNumber,
      date: formatLongDate(currentDate),
      dayOfWeek: formatDayOfWeek(currentDate),
      items
    })
  }
  
  return days
}

/**
 * Transform a reservation to a V0 item
 */
function transformReservationToItem(reservation: DBReservation, index: number): V0Item {
  const categoryName = reservation.reservationType?.category?.name?.toLowerCase() || "other"
  const typeName = reservation.reservationType?.name?.toLowerCase() || "other"
  
  return {
    id: index + 1,
    type: categoryName,
    title: deriveItemTitle(reservation, categoryName),
    time: formatTimeDisplay(reservation),
    icon: getReservationIcon(categoryName),
    reservations: [transformReservation(reservation)]
  }
}

/**
 * Transform a database reservation to V0 format
 */
function transformReservation(res: DBReservation): V0Reservation {
  const categoryName = res.reservationType.category.name.toLowerCase()
  const isHotel = categoryName === "hotel" || categoryName === "lodging"
  
  // Calculate nights for hotel stays
  const nights = isHotel && res.startTime && res.endTime 
    ? calculateNights(res.startTime, res.endTime, res.departureTimezone || "UTC")
    : undefined
  
  return {
    id: Math.floor(Math.random() * 100000), // Convert string ID to number for V0
    vendor: res.name,
    text: res.notes || deriveReservationText(res),
    status: mapReservationStatus(res.reservationStatus?.name || "Confirmed"),
    confirmationNumber: res.confirmationNumber || undefined,
    contactPhone: res.contactPhone || undefined,
    contactEmail: res.contactEmail || undefined,
    website: res.url || undefined,
    address: res.location || undefined,
    cost: res.cost || 0,
    image: res.imageUrl || undefined,
    notes: res.notes || undefined,
    cancellationPolicy: res.cancellationPolicy || undefined,
    startTime: res.startTime ? formatTime(res.startTime, res.departureTimezone || "UTC") : undefined,
    endTime: res.endTime ? formatTime(res.endTime, res.arrivalTimezone || res.departureTimezone || "UTC") : undefined,
    startTimezone: res.departureTimezone ? getTimezoneAbbreviation(res.departureTimezone) : undefined,
    endTimezone: res.arrivalTimezone ? getTimezoneAbbreviation(res.arrivalTimezone) : undefined,
    checkInDate: isHotel && res.startTime ? formatShortDate(res.startTime) : undefined,
    checkOutDate: isHotel && res.endTime ? formatShortDate(res.endTime) : undefined,
    checkInTime: isHotel && res.startTime ? formatTime(res.startTime, res.departureTimezone || "UTC") : undefined,
    checkOutTime: isHotel && res.endTime ? formatTime(res.endTime, res.arrivalTimezone || res.departureTimezone || "UTC") : undefined,
    nights,
    type: categoryName
  }
}

/**
 * Derive item title from reservation data
 */
function deriveItemTitle(reservation: DBReservation, category: string): string {
  if (category === "flight") {
    if (reservation.departureLocation && reservation.arrivalLocation) {
      return `${reservation.departureLocation} → ${reservation.arrivalLocation}`
    }
    return "Flight"
  }
  
  if (category === "hotel" || category === "lodging") {
    return "Hotel Check-in"
  }
  
  if (category === "dining" || category === "restaurant") {
    return "Dinner Reservation"
  }
  
  if (category === "train" || category === "rail") {
    return "Train Journey"
  }
  
  return reservation.name
}

/**
 * Derive reservation text from data
 */
function deriveReservationText(res: DBReservation): string {
  const parts: string[] = []
  
  if (res.departureLocation && res.arrivalLocation) {
    parts.push(`${res.departureLocation} → ${res.arrivalLocation}`)
  }
  
  if (res.reservationType?.name) {
    parts.push(res.reservationType.name)
  }
  
  return parts.length > 0 ? parts.join(" • ") : res.name
}

/**
 * Map database status to V0 status
 */
function mapReservationStatus(status: string): "suggested" | "planned" | "confirmed" {
  const normalized = status.toLowerCase()
  
  if (normalized.includes("confirm")) return "confirmed"
  if (normalized.includes("plan")) return "planned"
  return "suggested"
}

/**
 * Get icon for reservation category
 */
function getReservationIcon(category: string) {
  const lowerCategory = category.toLowerCase()
  
  if (lowerCategory === "flight") return Plane
  if (lowerCategory === "hotel" || lowerCategory === "lodging") return Hotel
  if (lowerCategory === "dining" || lowerCategory === "restaurant") return Utensils
  if (lowerCategory === "train" || lowerCategory === "rail") return Train
  
  return Camera // Default for activities, etc.
}

/**
 * Calculate number of nights between check-in and check-out
 */
function calculateNights(startTime: Date, endTime: Date, timezone: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, nights)
}

/**
 * Format time for display with timezone awareness
 */
function formatTime(date: Date, timezone: string): string {
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      hour12: true
    })
  } catch {
    // Fallback if timezone is invalid
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

/**
 * Get timezone abbreviation (e.g., PST, JST)
 */
function getTimezoneAbbreviation(timezone: string): string {
  // Map of common timezone IDs to abbreviations
  const timezoneMap: Record<string, string> = {
    'America/Los_Angeles': 'PST',
    'America/New_York': 'EST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Shanghai': 'CST',
    'Asia/Dubai': 'GST',
    'Australia/Sydney': 'AEDT'
  }
  
  return timezoneMap[timezone] || timezone
}

/**
 * Format time display handling different timezones
 */
function formatTimeDisplay(reservation: DBReservation): string {
  if (!reservation.startTime) return "TBD"
  
  const startTz = reservation.departureTimezone || "UTC"
  const endTz = reservation.arrivalTimezone || startTz
  const startTime = formatTime(reservation.startTime, startTz)
  
  if (reservation.endTime && startTz !== endTz) {
    const endTime = formatTime(reservation.endTime, endTz)
    const startTzAbbr = getTimezoneAbbreviation(startTz)
    const endTzAbbr = getTimezoneAbbreviation(endTz)
    return `${startTime} ${startTzAbbr} - ${endTime} ${endTzAbbr}`
  }
  
  if (reservation.endTime) {
    const endTime = formatTime(reservation.endTime, endTz)
    return `${startTime} - ${endTime}`
  }
  
  return startTime
}

/**
 * Format date in short format (e.g., "Mar 15")
 */
function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date in long format (e.g., "March 15, 2025")
 */
function formatLongDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format day of week (e.g., "Mon", "Tue")
 */
function formatDayOfWeek(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short'
  })
}
