/**
 * Calendar Export API Route
 * 
 * Generates an .ics calendar file for a trip itinerary
 * Exports all reservations as individual calendar events with complete data preservation
 */

import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import ical, { ICalCalendar, ICalEventData } from 'ical-generator'
import type { ReservationMetadata } from "@/lib/reservation-metadata-types"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get trip ID from query params
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      )
    }

    // Fetch trip data with all related information
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id, // Ensure user owns the trip
      },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: {
                    category: true
                  }
                },
                reservationStatus: true
              },
              orderBy: { startTime: "asc" }
            }
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      )
    }

    // Create calendar
    const calendar: ICalCalendar = ical({
      name: trip.title,
      description: trip.description || undefined,
      timezone: 'UTC',
      prodId: {
        company: 'Travel Planner',
        product: 'Trip Calendar Export',
      },
    })

    // Process each segment and its reservations
    for (const segment of trip.segments) {
      for (const reservation of segment.reservations) {
        // Skip reservations without start time
        if (!reservation.startTime) {
          console.warn(`Skipping reservation ${reservation.id} - no start time`)
          continue
        }

        // Build event summary with confirmation number if available
        let summary = reservation.name
        if (reservation.confirmationNumber) {
          summary += ` - Confirmation: ${reservation.confirmationNumber}`
        }

        // Build comprehensive description
        const description = buildEventDescription(reservation, segment)

        // Determine location
        const location = determineLocation(reservation)

        // Create event data
        const eventData: ICalEventData = {
          uid: `reservation-${reservation.id}@travelplanner.app`,
          start: reservation.startTime,
          end: reservation.endTime || reservation.startTime,
          summary,
          description,
          location: location || undefined,
          url: reservation.url || undefined,
          categories: [
            {
              name: reservation.reservationType.category.name
            }
          ],
        }

        // Add timezone if available
        if (reservation.timeZoneId) {
          eventData.timezone = reservation.timeZoneId
        }

        // Add geo coordinates if available
        if (reservation.latitude && reservation.longitude) {
          eventData.geo = {
            lat: reservation.latitude,
            lon: reservation.longitude
          }
        }

        // Add organizer if vendor/contact info available
        if (reservation.vendor || reservation.contactEmail) {
          eventData.organizer = {
            name: reservation.vendor || 'Vendor',
            email: reservation.contactEmail || undefined,
          }
        }

        // Create the event
        calendar.createEvent(eventData)
      }
    }

    // Generate .ics file content
    const icsContent = calendar.toString()

    // Return as downloadable file
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="trip-${trip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics"`,
      }
    })

  } catch (error) {
    console.error('Calendar export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export calendar" },
      { status: 500 }
    )
  }
}

/**
 * Build comprehensive event description with ALL available data
 */
function buildEventDescription(reservation: any, segment: any): string {
  const lines: string[] = []

  // Header: Reservation Type and Status
  lines.push(`${reservation.reservationType.name} - ${reservation.reservationStatus.name}`)
  lines.push('')

  // CONFIRMATION NUMBER (Priority field)
  if (reservation.confirmationNumber) {
    lines.push(`✓ CONFIRMATION: ${reservation.confirmationNumber}`)
    lines.push('')
  }

  // BASIC INFO
  const basicInfo: string[] = []
  if (reservation.vendor) basicInfo.push(`Vendor: ${reservation.vendor}`)
  if (reservation.contactEmail) basicInfo.push(`Email: ${reservation.contactEmail}`)
  if (reservation.contactPhone) basicInfo.push(`Phone: ${reservation.contactPhone}`)
  if (reservation.cost && reservation.currency) {
    basicInfo.push(`Cost: ${reservation.currency} ${reservation.cost}`)
  } else if (reservation.cost) {
    basicInfo.push(`Cost: ${reservation.cost}`)
  }
  if (reservation.url) basicInfo.push(`URL: ${reservation.url}`)

  if (basicInfo.length > 0) {
    lines.push('BASIC INFO:')
    basicInfo.forEach(info => lines.push(`- ${info}`))
    lines.push('')
  }

  // LOCATION DETAILS
  const locationInfo: string[] = []
  if (reservation.location) locationInfo.push(`Location: ${reservation.location}`)
  if (reservation.latitude && reservation.longitude) {
    locationInfo.push(`Coordinates: ${reservation.latitude}, ${reservation.longitude}`)
  }
  if (reservation.departureLocation) {
    const depTz = reservation.departureTimezone ? ` (${reservation.departureTimezone})` : ''
    locationInfo.push(`Departure: ${reservation.departureLocation}${depTz}`)
  }
  if (reservation.arrivalLocation) {
    const arrTz = reservation.arrivalTimezone ? ` (${reservation.arrivalTimezone})` : ''
    locationInfo.push(`Arrival: ${reservation.arrivalLocation}${arrTz}`)
  }

  if (locationInfo.length > 0) {
    lines.push('LOCATION DETAILS:')
    locationInfo.forEach(info => lines.push(`- ${info}`))
    lines.push('')
  }

  // TYPE-SPECIFIC METADATA
  if (reservation.metadata) {
    const metadata = reservation.metadata as ReservationMetadata
    const metadataLines = buildMetadataDescription(metadata)
    if (metadataLines.length > 0) {
      lines.push('DETAILS:')
      metadataLines.forEach(line => lines.push(`- ${line}`))
      lines.push('')
    }
  }

  // SEGMENT INFO
  if (segment.name || segment.startTitle || segment.endTitle) {
    lines.push('TRIP SEGMENT:')
    if (segment.name) lines.push(`- Segment: ${segment.name}`)
    if (segment.startTitle) lines.push(`- From: ${segment.startTitle}`)
    if (segment.endTitle) lines.push(`- To: ${segment.endTitle}`)
    lines.push('')
  }

  // TIMING INFO
  const timingInfo: string[] = []
  if (reservation.timeZoneId) {
    const tzName = reservation.timeZoneName ? ` (${reservation.timeZoneName})` : ''
    timingInfo.push(`Timezone: ${reservation.timeZoneId}${tzName}`)
  }
  if (reservation.wallStartDate || reservation.wallStartTime) {
    const date = reservation.wallStartDate ? new Date(reservation.wallStartDate).toLocaleDateString() : ''
    const time = reservation.wallStartTime ? reservation.wallStartTime : ''
    if (date || time) timingInfo.push(`Local Start: ${date} ${time}`.trim())
  }
  if (reservation.wallEndDate || reservation.wallEndTime) {
    const date = reservation.wallEndDate ? new Date(reservation.wallEndDate).toLocaleDateString() : ''
    const time = reservation.wallEndTime ? reservation.wallEndTime : ''
    if (date || time) timingInfo.push(`Local End: ${date} ${time}`.trim())
  }

  if (timingInfo.length > 0) {
    lines.push('TIMING:')
    timingInfo.forEach(info => lines.push(`- ${info}`))
    lines.push('')
  }

  // POLICIES & NOTES
  if (reservation.cancellationPolicy) {
    lines.push('CANCELLATION POLICY:')
    lines.push(reservation.cancellationPolicy)
    lines.push('')
  }

  if (reservation.notes) {
    lines.push('NOTES:')
    lines.push(reservation.notes)
    lines.push('')
  }

  return lines.join('\n').trim()
}

/**
 * Build metadata description from typed metadata object
 */
function buildMetadataDescription(metadata: ReservationMetadata): string[] {
  const lines: string[] = []

  // Flight metadata
  if (metadata.flight) {
    const f = metadata.flight
    if (f.flightNumber) lines.push(`Flight Number: ${f.flightNumber}`)
    if (f.airlineCode) lines.push(`Airline: ${f.airlineCode}`)
    if (f.aircraftType) lines.push(`Aircraft: ${f.aircraftType}`)
    if (f.seatNumber) lines.push(`Seat: ${f.seatNumber}`)
    if (f.cabin) lines.push(`Cabin: ${f.cabin}`)
    if (f.gate) lines.push(`Gate: ${f.gate}`)
    if (f.departureTerminal) lines.push(`Departure Terminal: ${f.departureTerminal}`)
    if (f.arrivalTerminal) lines.push(`Arrival Terminal: ${f.arrivalTerminal}`)
    if (f.operatedBy) lines.push(`Operated By: ${f.operatedBy}`)
    if (f.eTicketNumber) lines.push(`E-Ticket: ${f.eTicketNumber}`)
    if (f.baggageAllowance) lines.push(`Baggage: ${f.baggageAllowance}`)
    if (f.frequentFlyerNumber) lines.push(`FF Number: ${f.frequentFlyerNumber}`)
  }

  // Hotel metadata
  if (metadata.hotel) {
    const h = metadata.hotel
    if (h.roomType) lines.push(`Room Type: ${h.roomType}`)
    if (h.roomNumber) lines.push(`Room Number: ${h.roomNumber}`)
    if (h.bedType) lines.push(`Bed Type: ${h.bedType}`)
    if (h.guestCount) lines.push(`Guests: ${h.guestCount}`)
    if (h.checkInTime) lines.push(`Check-in: ${h.checkInTime}`)
    if (h.checkOutTime) lines.push(`Check-out: ${h.checkOutTime}`)
    if (h.amenities && h.amenities.length > 0) lines.push(`Amenities: ${h.amenities.join(', ')}`)
    if (h.specialRequests) lines.push(`Special Requests: ${h.specialRequests}`)
    if (h.loyaltyNumber) lines.push(`Loyalty Number: ${h.loyaltyNumber}`)
    if (h.floorPreference) lines.push(`Floor: ${h.floorPreference}`)
  }

  // Car rental metadata
  if (metadata.carRental) {
    const c = metadata.carRental
    if (c.vehicleType) lines.push(`Vehicle Type: ${c.vehicleType}`)
    if (c.vehicleMake) lines.push(`Make: ${c.vehicleMake}`)
    if (c.vehicleModel) lines.push(`Model: ${c.vehicleModel}`)
    if (c.licensePlate) lines.push(`License Plate: ${c.licensePlate}`)
    if (c.insurance) lines.push(`Insurance: ${c.insurance}`)
    if (c.fuelPolicy) lines.push(`Fuel Policy: ${c.fuelPolicy}`)
    if (c.mileageLimit) lines.push(`Mileage Limit: ${c.mileageLimit}`)
    if (c.additionalDrivers && c.additionalDrivers.length > 0) {
      lines.push(`Additional Drivers: ${c.additionalDrivers.join(', ')}`)
    }
    if (c.pickupInstructions) lines.push(`Pickup: ${c.pickupInstructions}`)
    if (c.dropoffInstructions) lines.push(`Dropoff: ${c.dropoffInstructions}`)
  }

  // Train metadata
  if (metadata.train) {
    const t = metadata.train
    if (t.trainNumber) lines.push(`Train Number: ${t.trainNumber}`)
    if (t.carNumber) lines.push(`Car: ${t.carNumber}`)
    if (t.seatNumber) lines.push(`Seat: ${t.seatNumber}`)
    if (t.platform) lines.push(`Platform: ${t.platform}`)
    if (t.class) lines.push(`Class: ${t.class}`)
    if (t.operatedBy) lines.push(`Operated By: ${t.operatedBy}`)
    if (t.coachType) lines.push(`Coach Type: ${t.coachType}`)
  }

  // Restaurant metadata
  if (metadata.restaurant) {
    const r = metadata.restaurant
    if (r.partySize) lines.push(`Party Size: ${r.partySize}`)
    if (r.mealType) lines.push(`Meal Type: ${r.mealType}`)
    if (r.dietaryRestrictions && r.dietaryRestrictions.length > 0) {
      lines.push(`Dietary Restrictions: ${r.dietaryRestrictions.join(', ')}`)
    }
    if (r.tablePreference) lines.push(`Table Preference: ${r.tablePreference}`)
    if (r.specialRequests) lines.push(`Special Requests: ${r.specialRequests}`)
    if (r.dressCode) lines.push(`Dress Code: ${r.dressCode}`)
  }

  // Transport metadata
  if (metadata.transport) {
    const t = metadata.transport
    if (t.vehicleType) lines.push(`Vehicle Type: ${t.vehicleType}`)
    if (t.driverName) lines.push(`Driver: ${t.driverName}`)
    if (t.driverPhone) lines.push(`Driver Phone: ${t.driverPhone}`)
    if (t.licensePlate) lines.push(`License Plate: ${t.licensePlate}`)
    if (t.serviceLevel) lines.push(`Service Level: ${t.serviceLevel}`)
    if (t.estimatedDuration) lines.push(`Duration: ${t.estimatedDuration}`)
    if (t.estimatedDistance) lines.push(`Distance: ${t.estimatedDistance}`)
    if (t.pickupInstructions) lines.push(`Pickup: ${t.pickupInstructions}`)
    if (t.dropoffInstructions) lines.push(`Dropoff: ${t.dropoffInstructions}`)
  }

  // Activity metadata
  if (metadata.activity) {
    const a = metadata.activity
    if (a.duration) lines.push(`Duration: ${a.duration}`)
    if (a.difficulty) lines.push(`Difficulty: ${a.difficulty}`)
    if (a.groupSize) lines.push(`Group Size: ${a.groupSize}`)
    if (a.meetingPoint) lines.push(`Meeting Point: ${a.meetingPoint}`)
    if (a.guideLanguage) lines.push(`Language: ${a.guideLanguage}`)
    if (a.ageRestriction) lines.push(`Age Restriction: ${a.ageRestriction}`)
    if (a.physicalRequirements) lines.push(`Physical Requirements: ${a.physicalRequirements}`)
    if (a.equipmentProvided && a.equipmentProvided.length > 0) {
      lines.push(`Equipment Provided: ${a.equipmentProvided.join(', ')}`)
    }
    if (a.equipmentRequired && a.equipmentRequired.length > 0) {
      lines.push(`Equipment Required: ${a.equipmentRequired.join(', ')}`)
    }
  }

  // Cruise metadata
  if (metadata.cruise) {
    const c = metadata.cruise
    if (c.cruiseLine) lines.push(`Cruise Line: ${c.cruiseLine}`)
    if (c.shipName) lines.push(`Ship: ${c.shipName}`)
    if (c.cabinNumber) lines.push(`Cabin: ${c.cabinNumber}`)
    if (c.cabinType) lines.push(`Cabin Type: ${c.cabinType}`)
    if (c.deck) lines.push(`Deck: ${c.deck}`)
    if (c.diningTime) lines.push(`Dining Time: ${c.diningTime}`)
    if (c.tableNumber) lines.push(`Table: ${c.tableNumber}`)
    if (c.embarkationPort) lines.push(`Embarkation: ${c.embarkationPort}`)
    if (c.disembarkationPort) lines.push(`Disembarkation: ${c.disembarkationPort}`)
  }

  // Bus metadata
  if (metadata.bus) {
    const b = metadata.bus
    if (b.busNumber) lines.push(`Bus Number: ${b.busNumber}`)
    if (b.operator) lines.push(`Operator: ${b.operator}`)
    if (b.seatNumber) lines.push(`Seat: ${b.seatNumber}`)
    if (b.platform) lines.push(`Platform: ${b.platform}`)
    if (b.class) lines.push(`Class: ${b.class}`)
    if (b.amenities && b.amenities.length > 0) {
      lines.push(`Amenities: ${b.amenities.join(', ')}`)
    }
  }

  // Ferry metadata
  if (metadata.ferry) {
    const f = metadata.ferry
    if (f.ferryName) lines.push(`Ferry: ${f.ferryName}`)
    if (f.operator) lines.push(`Operator: ${f.operator}`)
    if (f.vehicleType) lines.push(`Vehicle Type: ${f.vehicleType}`)
    if (f.cabinNumber) lines.push(`Cabin: ${f.cabinNumber}`)
    if (f.deck) lines.push(`Deck: ${f.deck}`)
  }

  // Event metadata
  if (metadata.event) {
    const e = metadata.event
    if (e.eventName) lines.push(`Event: ${e.eventName}`)
    if (e.venue) lines.push(`Venue: ${e.venue}`)
    if (e.ticketType) lines.push(`Ticket Type: ${e.ticketType}`)
    if (e.seatSection) lines.push(`Section: ${e.seatSection}`)
    if (e.rowNumber) lines.push(`Row: ${e.rowNumber}`)
    if (e.seatNumber) lines.push(`Seat: ${e.seatNumber}`)
    if (e.accessCode) lines.push(`Access Code: ${e.accessCode}`)
    if (e.entryGate) lines.push(`Entry Gate: ${e.entryGate}`)
  }

  // Parking metadata
  if (metadata.parking) {
    const p = metadata.parking
    if (p.facilityName) lines.push(`Facility: ${p.facilityName}`)
    if (p.spaceNumber) lines.push(`Space: ${p.spaceNumber}`)
    if (p.level) lines.push(`Level: ${p.level}`)
    if (p.section) lines.push(`Section: ${p.section}`)
    if (p.accessCode) lines.push(`Access Code: ${p.accessCode}`)
    if (p.vehicleInfo) lines.push(`Vehicle: ${p.vehicleInfo}`)
  }

  // Equipment rental metadata
  if (metadata.equipmentRental) {
    const e = metadata.equipmentRental
    if (e.equipmentType) lines.push(`Equipment: ${e.equipmentType}`)
    if (e.size) lines.push(`Size: ${e.size}`)
    if (e.quantity) lines.push(`Quantity: ${e.quantity}`)
    if (e.accessories && e.accessories.length > 0) {
      lines.push(`Accessories: ${e.accessories.join(', ')}`)
    }
    if (e.insurance) lines.push(`Insurance: ${e.insurance}`)
    if (e.depositAmount) lines.push(`Deposit: ${e.depositAmount}`)
  }

  // Spa metadata
  if (metadata.spa) {
    const s = metadata.spa
    if (s.treatmentType) lines.push(`Treatment: ${s.treatmentType}`)
    if (s.therapistName) lines.push(`Therapist: ${s.therapistName}`)
    if (s.roomNumber) lines.push(`Room: ${s.roomNumber}`)
    if (s.specialRequests) lines.push(`Special Requests: ${s.specialRequests}`)
    if (s.packages && s.packages.length > 0) {
      lines.push(`Packages: ${s.packages.join(', ')}`)
    }
  }

  return lines
}

/**
 * Determine the best location string for the event
 */
function determineLocation(reservation: any): string | null {
  // For flights, use departure location
  if (reservation.departureLocation) {
    return reservation.departureLocation
  }

  // For other reservations, use the location field
  if (reservation.location) {
    return reservation.location
  }

  // For arrivals, use arrival location
  if (reservation.arrivalLocation) {
    return reservation.arrivalLocation
  }

  return null
}
