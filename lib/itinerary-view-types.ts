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
  currency?: string            // Currency code (e.g., "USD", "EUR", "JPY")
  priceUSD?: number            // Price converted to USD (for rollup calculations)
  notes: string
  // Enhanced fields for mapping and chat
  latitude?: number
  longitude?: number
  departureLocation?: string
  arrivalLocation?: string
  categoryName: string
  startTime?: string
  endTime?: string
  // Formatted end time for display (HH:mm)
  endTimeFormatted?: string
  // Days difference between start and end (0 = same day, 1 = next day, etc.)
  endDateDiff?: number
  // Wall time fields for accurate local time display
  wallStartDate?: string       // YYYY-MM-DD format
  wallStartTime?: string       // HH:mm format
  wallEndDate?: string         // YYYY-MM-DD format
  wallEndTime?: string         // HH:mm format
  timeZoneId?: string          // IANA timezone identifier (e.g., "America/Los_Angeles")
  // Status fields for to-do list
  status: "pending" | "confirmed" | "cancelled" | "completed" | "waitlisted"
  statusName: string
  reservationStatusId: string
  // Multi-day reservation support
  nights?: number              // Number of nights (for hotels)
  durationDays?: number        // Total days spanning (for car rentals, etc.)
  checkInDate?: string         // Formatted check-in date
  checkOutDate?: string        // Formatted check-out date
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
  // Pre-formatted date range to avoid hydration mismatch
  formattedDateRange: string
  // Style information
  imagePromptStyleId?: string | null
  imagePromptStyleName?: string | null
  imagePromptStyleSlug?: string | null
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
// Can optionally pass the reservation type name for more specific mapping
export function mapCategoryToType(categoryName: string, typeName?: string): ViewReservation["type"] {
  // First, check if the type name gives us a more specific mapping
  if (typeName) {
    const typeMapping: Record<string, ViewReservation["type"]> = {
      // Flights
      "Flight": "flight",
      // Ground transport / rentals
      "Car Rental": "transport",
      "Private Driver": "transport",
      "Ride Share": "transport",
      "Taxi": "transport",
      "Bus": "transport",
      "Train": "transport",
      "Ferry": "transport",
      "Cruise": "transport",
      "Parking": "transport",
      // Hotels
      "Hotel": "hotel",
      "Airbnb": "hotel",
      "Hostel": "hotel",
      "Resort": "hotel",
      "Vacation Rental": "hotel",
      "Ski Resort": "hotel",
      // Restaurants
      "Restaurant": "restaurant",
      "Cafe": "restaurant",
      "Bar": "restaurant",
      "Food Tour": "restaurant",
    }
    if (typeMapping[typeName]) {
      return typeMapping[typeName]
    }
  }
  
  // Fall back to category-based mapping
  const categoryMapping: Record<string, ViewReservation["type"]> = {
    "Flight": "flight",
    "Hotel": "hotel",
    "Stay": "hotel",           // Database uses "Stay" as the category for hotels
    "Accommodation": "hotel",
    "Travel": "transport",     // Default for Travel category (includes car rentals, trains, etc.)
    "Activity": "activity",
    "Transportation": "transport",
    "Transport": "transport",
    "Restaurant": "restaurant",
    "Dining": "restaurant",
    "Food": "restaurant",
  }
  return categoryMapping[categoryName] || "activity"
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

export interface TimePeriodForecast {
  temp_min: number
  temp_max: number
  temp: number
  description: string
  icon: string
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
  morning?: TimePeriodForecast | null
  afternoon?: TimePeriodForecast | null
  evening?: TimePeriodForecast | null
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
  luggageStrategy?: LuggageStrategy
  specialNotes?: string[]
}

export interface PackingItem {
  name: string
  quantity?: string
  reason?: string
}

export interface LuggageStrategy {
  bags: LuggageBag[]
  organization: string
  tips: string[]
}

export interface LuggageBag {
  type: string
  reason: string
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


