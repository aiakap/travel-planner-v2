/**
 * Type definitions for reservation metadata
 * 
 * Uses a union type structure where each reservation can contain metadata
 * for multiple types simultaneously. This preserves data when users switch
 * between reservation types.
 */

/**
 * Flight-specific metadata
 */
export interface FlightMetadata {
  flightNumber?: string
  airlineCode?: string
  aircraftType?: string
  seatNumber?: string
  cabin?: string
  gate?: string
  departureTerminal?: string
  arrivalTerminal?: string
  operatedBy?: string
  eTicketNumber?: string
  baggageAllowance?: string
  frequentFlyerNumber?: string
}

/**
 * Hotel/Accommodation metadata
 */
export interface HotelMetadata {
  roomType?: string
  roomNumber?: string
  bedType?: string
  guestCount?: number
  checkInTime?: string  // "3:00 PM"
  checkOutTime?: string // "11:00 AM"
  amenities?: string[]
  specialRequests?: string
  loyaltyNumber?: string
  floorPreference?: string
}

/**
 * Car rental metadata
 */
export interface CarRentalMetadata {
  vehicleType?: string
  vehicleModel?: string
  vehicleMake?: string
  licensePlate?: string
  insurance?: string
  fuelPolicy?: string
  mileageLimit?: string
  additionalDrivers?: string[]
  pickupInstructions?: string
  dropoffInstructions?: string
}

/**
 * Train metadata
 */
export interface TrainMetadata {
  trainNumber?: string
  carNumber?: string
  seatNumber?: string
  platform?: string
  class?: string
  operatedBy?: string
  coachType?: string
}

/**
 * Restaurant/Dining metadata
 */
export interface RestaurantMetadata {
  partySize?: number
  dietaryRestrictions?: string[]
  specialRequests?: string
  tablePreference?: string
  mealType?: string // "breakfast", "lunch", "dinner"
  dressCode?: string
}

/**
 * Transport metadata (taxi, rideshare, private driver)
 */
export interface TransportMetadata {
  vehicleType?: string
  driverName?: string
  driverPhone?: string
  licensePlate?: string
  pickupInstructions?: string
  dropoffInstructions?: string
  serviceLevel?: string // "UberX", "Comfort", "XL", etc.
  estimatedDuration?: string
  estimatedDistance?: string
  // Airport transfer specific fields
  flightNumber?: string
  flightArrivalTime?: string
  meetingInstructions?: string // "showing a name board", etc.
  passengerCount?: number
  luggageDetails?: string
}

/**
 * Activity metadata (tours, museums, events, etc.)
 */
export interface ActivityMetadata {
  duration?: string
  difficulty?: string
  groupSize?: number
  equipmentProvided?: string[]
  equipmentRequired?: string[]
  ageRestriction?: string
  physicalRequirements?: string
  meetingPoint?: string
  guideLanguage?: string
}

/**
 * Cruise metadata
 */
export interface CruiseMetadata {
  cruiseLine?: string
  shipName?: string
  cabinNumber?: string
  cabinType?: string
  deck?: string
  diningTime?: string
  tableNumber?: string
  embarkationPort?: string
  disembarkationPort?: string
}

/**
 * Bus metadata
 */
export interface BusMetadata {
  busNumber?: string
  operator?: string
  seatNumber?: string
  platform?: string
  class?: string
  amenities?: string[]
}

/**
 * Ferry metadata
 */
export interface FerryMetadata {
  ferryName?: string
  operator?: string
  vehicleType?: string // "passenger", "vehicle", etc.
  cabinNumber?: string
  deck?: string
}

/**
 * Event/Tickets metadata
 */
export interface EventMetadata {
  eventName?: string
  venue?: string
  seatSection?: string
  rowNumber?: string
  seatNumber?: string
  ticketType?: string
  accessCode?: string
  entryGate?: string
}

/**
 * Parking metadata
 */
export interface ParkingMetadata {
  facilityName?: string
  spaceNumber?: string
  level?: string
  section?: string
  accessCode?: string
  vehicleInfo?: string
}

/**
 * Equipment Rental metadata (bikes, skis, etc.)
 */
export interface EquipmentRentalMetadata {
  equipmentType?: string
  size?: string
  quantity?: number
  accessories?: string[]
  insurance?: string
  depositAmount?: number
}

/**
 * Spa/Wellness metadata
 */
export interface SpaMetadata {
  treatmentType?: string
  therapistName?: string
  roomNumber?: string
  specialRequests?: string
  packages?: string[]
}

/**
 * Union type containing all possible metadata
 * 
 * Each reservation can have metadata for multiple types,
 * but only the relevant type is displayed in the UI.
 */
export interface ReservationMetadata {
  flight?: FlightMetadata
  hotel?: HotelMetadata
  carRental?: CarRentalMetadata
  train?: TrainMetadata
  restaurant?: RestaurantMetadata
  transport?: TransportMetadata
  activity?: ActivityMetadata
  cruise?: CruiseMetadata
  bus?: BusMetadata
  ferry?: FerryMetadata
  event?: EventMetadata
  parking?: ParkingMetadata
  equipmentRental?: EquipmentRentalMetadata
  spa?: SpaMetadata
}

/**
 * Type guard to check if metadata exists for a specific type
 */
export function hasMetadataForType(
  metadata: ReservationMetadata | null | undefined,
  type: keyof ReservationMetadata
): boolean {
  if (!metadata) return false
  return metadata[type] !== undefined && metadata[type] !== null
}

/**
 * Get all metadata types that have data
 */
export function getMetadataTypes(
  metadata: ReservationMetadata | null | undefined
): Array<keyof ReservationMetadata> {
  if (!metadata) return []
  return Object.keys(metadata).filter(key => 
    metadata[key as keyof ReservationMetadata] !== undefined &&
    metadata[key as keyof ReservationMetadata] !== null
  ) as Array<keyof ReservationMetadata>
}
