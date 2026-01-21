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
}

export interface ViewSegment {
  id: string
  title: string
  startDate: string
  endDate: string
  destination: string
  reservations: ViewReservation[]
}

export interface ViewItinerary {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  coverImage: string
  segments: ViewSegment[]
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


