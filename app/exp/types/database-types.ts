/**
 * Database types for the exp interface
 * These match the Prisma schema and are used for CRUD operations
 */

export interface DBReservation {
  id: string  // cuid from database
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
  imageIsCustom: boolean
  latitude: number | null
  longitude: number | null
  timeZoneId: string | null
  timeZoneName: string | null
  vendor: string | null
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

export interface DBSegment {
  id: string
  name: string
  imageUrl: string | null
  startTime: Date | null
  endTime: Date | null
  startTitle: string
  endTitle: string
  order: number
  segmentType: { name: string }
  reservations: DBReservation[]
}

export interface DBTrip {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
  segments: DBSegment[]
}
