import { ElementType } from "react"

export type ReservationStatus = "suggested" | "planned" | "confirmed"

export interface V0Reservation {
  id: number
  vendor: string
  text: string
  status: ReservationStatus
  confirmationNumber?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
  address?: string
  cost: number
  image?: string
  notes?: string
  cancellationPolicy?: string
  startTime?: string
  endTime?: string
  startTimezone?: string
  endTimezone?: string
  checkInDate?: string
  checkOutDate?: string
  checkInTime?: string
  checkOutTime?: string
  nights?: number
  type?: string
}

export interface V0Item {
  id: number
  type: string
  title: string
  time: string
  icon: ElementType
  reservations: V0Reservation[]
}

export interface V0Day {
  day: number
  date: string
  dayOfWeek: string
  items: V0Item[]
}

export interface V0Segment {
  id: number
  name: string
  type: "travel" | "destination"
  startDate: string
  endDate: string
  image?: string
  days: V0Day[]
}

export interface V0Itinerary {
  title: string
  dates: string
  heroImage?: string
  segments: V0Segment[]
}
