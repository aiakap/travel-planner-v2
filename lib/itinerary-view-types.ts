// Types for the itinerary view - adapted from the reference interface
// Maps to our existing Prisma models

export interface ViewReservation {
  id: string
  type: "flight" | "hotel" | "activity" | "transport" | "restaurant"
  title: string
  description: string
  date: string
  time: string
  location: string
  confirmationNumber: string
  image: string
  price: number
  notes: string
  // Enhanced fields for mapping and chat
  latitude?: number
  longitude?: number
  departureLocation?: string
  arrivalLocation?: string
  categoryName: string
  startTime?: string
  endTime?: string
  // Status fields for to-do list
  status: "pending" | "confirmed" | "cancelled" | "completed" | "waitlisted"
  statusName: string
  reservationStatusId: string
}

export interface ViewSegment {
  id: string
  title: string
  startDate: string
  endDate: string
  destination: string
  reservations: ViewReservation[]
  // Enhanced fields for mapping
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  startTitle: string
  endTitle: string
  segmentType: string
  color?: string
  imageUrl?: string
}

export interface ViewItinerary {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  coverImage: string
  segments: ViewSegment[]
  // Enhanced calculated fields
  dayCount: number
  segmentColors: Record<string, string>
  pendingCount: number
}

export const reservationTypeIcons: Record<ViewReservation["type"], string> = {
  flight: "✈️",
  hotel: "🏨",
  activity: "🎯",
  transport: "🚗",
  restaurant: "🍽️",
}

export const reservationTypeLabels: Record<ViewReservation["type"], string> = {
  flight: "Flight",
  hotel: "Hotel",
  activity: "Activity",
  transport: "Transport",
  restaurant: "Restaurant",
}

// Helper to map our Prisma category names to view types
export function mapCategoryToType(categoryName: string): ViewReservation["type"] {
  const mapping: Record<string, ViewReservation["type"]> = {
    "Flight": "flight",
    "Hotel": "hotel",
    "Accommodation": "hotel",
    "Activity": "activity",
    "Transportation": "transport",
    "Transport": "transport",
    "Restaurant": "restaurant",
    "Dining": "restaurant",
    "Food": "restaurant",
  }
  return mapping[categoryName] || "activity"
}

// Helper to map reservation status from DB to view type
export function mapReservationStatus(statusName: string): ViewReservation["status"] {
  const normalized = statusName.toLowerCase()
  if (normalized.includes("confirm")) return "confirmed"
  if (normalized.includes("cancel")) return "cancelled"
  if (normalized.includes("complete")) return "completed"
  if (normalized.includes("waitlist")) return "waitlisted"
  return "pending"
}

// Weather and packing types
export interface WeatherData {
  location: string
  country: string
  forecast: WeatherForecast[]
  segmentId?: string
  position?: 'departure' | 'arrival' | 'stay'
  isForecastForTripDates?: boolean
  forecastNote?: string
}

export interface WeatherForecast {
  date: string
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  humidity: number
  description: string
  icon: string
  wind_speed: number
  precipitation: number
}

export interface PackingList {
  clothing: PackingItem[]
  footwear: PackingItem[]
  gear: PackingItem[]
  toiletries: PackingItem[]
  documents: PackingItem[]
  clothingReasons?: string
  footwearReasons?: string
  gearReasons?: string
  toiletriesReasons?: string
  documentsReasons?: string
}

export interface PackingItem {
  name: string
  quantity?: string
  reason?: string
}

// Visa requirement types
export interface VisaRequirement {
  destination: string
  country: string
  visaRequired: boolean
  visaType?: string // e.g., "Electronic Travel Authorization (ETA)", "Visa on Arrival", "eVisa"
  duration?: string
  advanceRegistration?: string // Pre-arrival digital systems (Visit Japan Web, K-ETA, etc.)
  requirements: string[]
  processingTime?: string // How far in advance to apply
  cost?: string // Fees if any
  sources: VisaSource[]
  importantNotes?: string // Critical information travelers often miss
  lastChecked: Date
}

export interface VisaSource {
  title: string
  url: string
  domain: string
}


