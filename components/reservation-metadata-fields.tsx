/**
 * Metadata field components for different reservation types
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  FlightMetadata,
  HotelMetadata,
  CarRentalMetadata,
  TrainMetadata,
  RestaurantMetadata,
  TransportMetadata,
  ActivityMetadata,
  CruiseMetadata,
  BusMetadata,
  FerryMetadata,
  EventMetadata,
} from "@/lib/reservation-metadata-types"

interface MetadataFieldsProps<T> {
  value: T
  onChange: (value: T) => void
}

/**
 * Flight metadata fields
 */
export function FlightMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<FlightMetadata>) {
  const handleChange = (field: keyof FlightMetadata, newValue: string) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Flight Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="flightNumber">Flight Number</Label>
          <Input
            id="flightNumber"
            value={value.flightNumber || ''}
            onChange={(e) => handleChange('flightNumber', e.target.value)}
            placeholder="UA875"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="airlineCode">Airline Code</Label>
          <Input
            id="airlineCode"
            value={value.airlineCode || ''}
            onChange={(e) => handleChange('airlineCode', e.target.value)}
            placeholder="UA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seatNumber">Seat Number</Label>
          <Input
            id="seatNumber"
            value={value.seatNumber || ''}
            onChange={(e) => handleChange('seatNumber', e.target.value)}
            placeholder="12A"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cabin">Cabin Class</Label>
          <Input
            id="cabin"
            value={value.cabin || ''}
            onChange={(e) => handleChange('cabin', e.target.value)}
            placeholder="Business"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gate">Gate</Label>
          <Input
            id="gate"
            value={value.gate || ''}
            onChange={(e) => handleChange('gate', e.target.value)}
            placeholder="B23"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="departureTerminal">Departure Terminal</Label>
          <Input
            id="departureTerminal"
            value={value.departureTerminal || ''}
            onChange={(e) => handleChange('departureTerminal', e.target.value)}
            placeholder="Terminal 3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="arrivalTerminal">Arrival Terminal</Label>
          <Input
            id="arrivalTerminal"
            value={value.arrivalTerminal || ''}
            onChange={(e) => handleChange('arrivalTerminal', e.target.value)}
            placeholder="Terminal 1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aircraftType">Aircraft Type</Label>
          <Input
            id="aircraftType"
            value={value.aircraftType || ''}
            onChange={(e) => handleChange('aircraftType', e.target.value)}
            placeholder="Boeing 777"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operatedBy">Operated By</Label>
          <Input
            id="operatedBy"
            value={value.operatedBy || ''}
            onChange={(e) => handleChange('operatedBy', e.target.value)}
            placeholder="Partner Airline"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eTicketNumber">E-Ticket Number</Label>
          <Input
            id="eTicketNumber"
            value={value.eTicketNumber || ''}
            onChange={(e) => handleChange('eTicketNumber', e.target.value)}
            placeholder="0162363753568"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baggageAllowance">Baggage Allowance</Label>
          <Input
            id="baggageAllowance"
            value={value.baggageAllowance || ''}
            onChange={(e) => handleChange('baggageAllowance', e.target.value)}
            placeholder="2 checked bags"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequentFlyerNumber">Frequent Flyer #</Label>
          <Input
            id="frequentFlyerNumber"
            value={value.frequentFlyerNumber || ''}
            onChange={(e) => handleChange('frequentFlyerNumber', e.target.value)}
            placeholder="123456789"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Hotel metadata fields
 */
export function HotelMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<HotelMetadata>) {
  const handleChange = (field: keyof HotelMetadata, newValue: string | number) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Hotel Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomType">Room Type</Label>
          <Input
            id="roomType"
            value={value.roomType || ''}
            onChange={(e) => handleChange('roomType', e.target.value)}
            placeholder="Deluxe Suite"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input
            id="roomNumber"
            value={value.roomNumber || ''}
            onChange={(e) => handleChange('roomNumber', e.target.value)}
            placeholder="1205"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedType">Bed Type</Label>
          <Input
            id="bedType"
            value={value.bedType || ''}
            onChange={(e) => handleChange('bedType', e.target.value)}
            placeholder="King"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestCount">Guest Count</Label>
          <Input
            id="guestCount"
            type="number"
            value={value.guestCount || ''}
            onChange={(e) => handleChange('guestCount', parseInt(e.target.value) || 0)}
            placeholder="2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkInTime">Check-In Time</Label>
          <Input
            id="checkInTime"
            value={value.checkInTime || ''}
            onChange={(e) => handleChange('checkInTime', e.target.value)}
            placeholder="3:00 PM"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkOutTime">Check-Out Time</Label>
          <Input
            id="checkOutTime"
            value={value.checkOutTime || ''}
            onChange={(e) => handleChange('checkOutTime', e.target.value)}
            placeholder="11:00 AM"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loyaltyNumber">Loyalty Number</Label>
          <Input
            id="loyaltyNumber"
            value={value.loyaltyNumber || ''}
            onChange={(e) => handleChange('loyaltyNumber', e.target.value)}
            placeholder="123456789"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="floorPreference">Floor Preference</Label>
          <Input
            id="floorPreference"
            value={value.floorPreference || ''}
            onChange={(e) => handleChange('floorPreference', e.target.value)}
            placeholder="High floor"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="specialRequests">Special Requests</Label>
          <Textarea
            id="specialRequests"
            value={value.specialRequests || ''}
            onChange={(e) => handleChange('specialRequests', e.target.value)}
            placeholder="Early check-in, quiet room"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Car Rental metadata fields
 */
export function CarRentalMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<CarRentalMetadata>) {
  const handleChange = (field: keyof CarRentalMetadata, newValue: string) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Car Rental Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <Input
            id="vehicleType"
            value={value.vehicleType || ''}
            onChange={(e) => handleChange('vehicleType', e.target.value)}
            placeholder="SUV"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleModel">Vehicle Model</Label>
          <Input
            id="vehicleModel"
            value={value.vehicleModel || ''}
            onChange={(e) => handleChange('vehicleModel', e.target.value)}
            placeholder="Toyota RAV4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input
            id="licensePlate"
            value={value.licensePlate || ''}
            onChange={(e) => handleChange('licensePlate', e.target.value)}
            placeholder="ABC 123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insurance">Insurance</Label>
          <Input
            id="insurance"
            value={value.insurance || ''}
            onChange={(e) => handleChange('insurance', e.target.value)}
            placeholder="Full coverage"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelPolicy">Fuel Policy</Label>
          <Input
            id="fuelPolicy"
            value={value.fuelPolicy || ''}
            onChange={(e) => handleChange('fuelPolicy', e.target.value)}
            placeholder="Full to full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileageLimit">Mileage Limit</Label>
          <Input
            id="mileageLimit"
            value={value.mileageLimit || ''}
            onChange={(e) => handleChange('mileageLimit', e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
          <Textarea
            id="pickupInstructions"
            value={value.pickupInstructions || ''}
            onChange={(e) => handleChange('pickupInstructions', e.target.value)}
            placeholder="Go to counter B"
            rows={2}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="dropoffInstructions">Drop-off Instructions</Label>
          <Textarea
            id="dropoffInstructions"
            value={value.dropoffInstructions || ''}
            onChange={(e) => handleChange('dropoffInstructions', e.target.value)}
            placeholder="Return to parking lot A"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Train metadata fields
 */
export function TrainMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<TrainMetadata>) {
  const handleChange = (field: keyof TrainMetadata, newValue: string) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Train Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trainNumber">Train Number</Label>
          <Input
            id="trainNumber"
            value={value.trainNumber || ''}
            onChange={(e) => handleChange('trainNumber', e.target.value)}
            placeholder="THA 9342"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="carNumber">Car Number</Label>
          <Input
            id="carNumber"
            value={value.carNumber || ''}
            onChange={(e) => handleChange('carNumber', e.target.value)}
            placeholder="11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seatNumber">Seat Number</Label>
          <Input
            id="seatNumber"
            value={value.seatNumber || ''}
            onChange={(e) => handleChange('seatNumber', e.target.value)}
            placeholder="12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Input
            id="platform"
            value={value.platform || ''}
            onChange={(e) => handleChange('platform', e.target.value)}
            placeholder="3B"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Input
            id="class"
            value={value.class || ''}
            onChange={(e) => handleChange('class', e.target.value)}
            placeholder="First Class"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operatedBy">Operated By</Label>
          <Input
            id="operatedBy"
            value={value.operatedBy || ''}
            onChange={(e) => handleChange('operatedBy', e.target.value)}
            placeholder="Thalys"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Restaurant metadata fields
 */
export function RestaurantMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<RestaurantMetadata>) {
  const handleChange = (field: keyof RestaurantMetadata, newValue: string | number) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Restaurant Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partySize">Party Size</Label>
          <Input
            id="partySize"
            type="number"
            value={value.partySize || ''}
            onChange={(e) => handleChange('partySize', parseInt(e.target.value) || 0)}
            placeholder="2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tablePreference">Table Preference</Label>
          <Input
            id="tablePreference"
            value={value.tablePreference || ''}
            onChange={(e) => handleChange('tablePreference', e.target.value)}
            placeholder="Window seat"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mealType">Meal Type</Label>
          <Input
            id="mealType"
            value={value.mealType || ''}
            onChange={(e) => handleChange('mealType', e.target.value)}
            placeholder="Dinner"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dressCode">Dress Code</Label>
          <Input
            id="dressCode"
            value={value.dressCode || ''}
            onChange={(e) => handleChange('dressCode', e.target.value)}
            placeholder="Smart casual"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="specialRequests">Special Requests</Label>
          <Textarea
            id="specialRequests"
            value={value.specialRequests || ''}
            onChange={(e) => handleChange('specialRequests', e.target.value)}
            placeholder="Celebrating anniversary"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Transport metadata fields (taxi, rideshare, etc.)
 */
export function TransportMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<TransportMetadata>) {
  const handleChange = (field: keyof TransportMetadata, newValue: string) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Transport Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <Input
            id="vehicleType"
            value={value.vehicleType || ''}
            onChange={(e) => handleChange('vehicleType', e.target.value)}
            placeholder="Sedan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceLevel">Service Level</Label>
          <Input
            id="serviceLevel"
            value={value.serviceLevel || ''}
            onChange={(e) => handleChange('serviceLevel', e.target.value)}
            placeholder="UberX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="driverName">Driver Name</Label>
          <Input
            id="driverName"
            value={value.driverName || ''}
            onChange={(e) => handleChange('driverName', e.target.value)}
            placeholder="John D."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input
            id="licensePlate"
            value={value.licensePlate || ''}
            onChange={(e) => handleChange('licensePlate', e.target.value)}
            placeholder="ABC 123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Est. Duration</Label>
          <Input
            id="estimatedDuration"
            value={value.estimatedDuration || ''}
            onChange={(e) => handleChange('estimatedDuration', e.target.value)}
            placeholder="25 min"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDistance">Est. Distance</Label>
          <Input
            id="estimatedDistance"
            value={value.estimatedDistance || ''}
            onChange={(e) => handleChange('estimatedDistance', e.target.value)}
            placeholder="12 miles"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
          <Textarea
            id="pickupInstructions"
            value={value.pickupInstructions || ''}
            onChange={(e) => handleChange('pickupInstructions', e.target.value)}
            placeholder="Meet at main entrance"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Activity metadata fields
 */
export function ActivityMetadataFields({ 
  value, 
  onChange 
}: MetadataFieldsProps<ActivityMetadata>) {
  const handleChange = (field: keyof ActivityMetadata, newValue: string | number) => {
    onChange({ ...value, [field]: newValue || undefined })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Activity Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={value.duration || ''}
            onChange={(e) => handleChange('duration', e.target.value)}
            placeholder="3 hours"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Input
            id="difficulty"
            value={value.difficulty || ''}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            placeholder="Moderate"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="groupSize">Group Size</Label>
          <Input
            id="groupSize"
            type="number"
            value={value.groupSize || ''}
            onChange={(e) => handleChange('groupSize', parseInt(e.target.value) || 0)}
            placeholder="10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guideLanguage">Guide Language</Label>
          <Input
            id="guideLanguage"
            value={value.guideLanguage || ''}
            onChange={(e) => handleChange('guideLanguage', e.target.value)}
            placeholder="English"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="meetingPoint">Meeting Point</Label>
          <Input
            id="meetingPoint"
            value={value.meetingPoint || ''}
            onChange={(e) => handleChange('meetingPoint', e.target.value)}
            placeholder="Hotel lobby"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="physicalRequirements">Physical Requirements</Label>
          <Textarea
            id="physicalRequirements"
            value={value.physicalRequirements || ''}
            onChange={(e) => handleChange('physicalRequirements', e.target.value)}
            placeholder="Able to walk 2 miles"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}
