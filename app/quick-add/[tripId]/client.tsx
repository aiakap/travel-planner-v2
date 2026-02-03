"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Trip } from "@prisma/client"

// Snarky loading messages for extraction
const EXTRACTION_MESSAGES = [
  "🔍 Squinting at your booking confirmation...",
  "✈️ Checking if the plane actually exists...",
  "🎫 Decoding airline hieroglyphics...",
  "💺 Making sure your seat number isn't 13F...",
  "🧳 Scanning for hidden baggage fees...",
  "📋 Reading the fine print you ignored...",
  "🛫 Confirming departure gate is in the same airport...",
  "⏰ Converting 'boarding at dawn' to actual time...",
  "🍿 Judging your snack choices...",
  "🎭 Pretending this is a first-class ticket...",
]

// Snarky loading messages for creation
const CREATION_MESSAGES = [
  "🛠️ Building your itinerary...",
  "💺 Checking if seats recline (spoiler: probably not)...",
  "🧹 Cleaning under the seats from last passenger...",
  "📦 Tetris-ing your oversized luggage...",
  "🎒 Calculating baggage overweight fees...",
  "🍝 Pre-ordering your sad airplane meal...",
  "🎧 Testing if the in-flight entertainment works (it doesn't)...",
  "❄️ Adjusting the broken air vent above your seat...",
  "📱 Reminding you to put your phone in airplane mode...",
  "🚪 Making sure the emergency exit isn't your seat...",
  "☕ Watering down the complimentary coffee...",
]

type ReservationType = "flight" | "hotel" | "car-rental" | "train" | "restaurant" | "event" | "cruise" | "private-driver" | "generic"

interface SegmentAssignmentInfo {
  action: 'create' | 'match'
  segmentName: string
  segmentId?: string
}

interface FlightPreview {
  flightNumber: string
  carrier: string
  route: string
  departureCity: string
  arrivalCity: string
  departureDateTime: string
  arrivalDateTime: string
  category: 'outbound' | 'in-trip' | 'return'
  segment: SegmentAssignmentInfo
  cabin?: string
  seatNumber?: string
}

interface HotelPreview {
  hotelName: string
  address: string
  checkInDate: string
  checkInTime: string
  checkOutDate: string
  checkOutTime: string
  roomType: string
  numberOfRooms: number
  numberOfGuests: number
  totalCost: number
  currency: string
  segment: SegmentAssignmentInfo
}

interface CarRentalPreview {
  company: string
  vehicleClass: string
  vehicleModel: string
  pickupLocation: string
  pickupAddress: string
  pickupDate: string
  pickupTime: string
  returnLocation: string
  returnAddress: string
  returnDate: string
  returnTime: string
  isOneWay: boolean
  options: string[]
  totalCost: number
  currency: string
  segment: SegmentAssignmentInfo
}

interface TrainPreview {
  trainNumber: string
  operator: string
  departureStation: string
  departureCity: string
  departureDate: string
  departureTime: string
  departurePlatform: string
  arrivalStation: string
  arrivalCity: string
  arrivalDate: string
  arrivalTime: string
  class: string
  coach: string
  seat: string
  segment: SegmentAssignmentInfo
}

interface RestaurantPreview {
  restaurantName: string
  address: string
  phone: string
  reservationDate: string
  reservationTime: string
  partySize: number
  specialRequests: string
  platform: string
  totalCost: number
  currency: string
  segment: SegmentAssignmentInfo
}

interface EventTicket {
  ticketType: string
  quantity: number
  price: number
  seatInfo: string
}

interface EventPreview {
  eventName: string
  venueName: string
  address: string
  eventDate: string
  eventTime: string
  doorsOpenTime: string
  eventType: string
  tickets: EventTicket[]
  totalCost: number
  currency: string
  platform: string
  specialInstructions: string
  segment: SegmentAssignmentInfo
}

interface GenericPreview {
  type: string
  data: any
  segment: SegmentAssignmentInfo
}

interface AvailableSegment {
  id: string
  name: string
  type: string
  startTime: Date
  endTime: Date
}

interface SegmentAssignment {
  action: 'create' | 'match'
  segmentId?: string
  segmentName: string
}

interface ExtractionResult {
  type: ReservationType
  data: any
  count?: number
  categoryCounts?: {
    outbound: number
    inTrip: number
    return: number
  }
  flights?: FlightPreview[]
  hotels?: HotelPreview[]
  carRentals?: CarRentalPreview[]
  trains?: TrainPreview[]
  restaurants?: RestaurantPreview[]
  events?: EventPreview[]
  generic?: GenericPreview[]
  tripExtension?: {
    originalStart: string
    originalEnd: string
    newStart: string
    newEnd: string
  }
  confirmationNumber?: string
  totalCost?: number
  currency?: string
  availableSegments?: AvailableSegment[]
}

interface SampleOption {
  id: string
  label: string
}

interface QuickAddClientProps {
  trip: Trip
}

export function QuickAddClient({ trip }: QuickAddClientProps) {
  const router = useRouter()
  const [reservationType, setReservationType] = useState<ReservationType>("flight")
  const [confirmationText, setConfirmationText] = useState("")
  const [selectedSampleId, setSelectedSampleId] = useState("")
  const [sampleOptions, setSampleOptions] = useState<SampleOption[]>([])
  const [isLoadingSamples, setIsLoadingSamples] = useState(false)
  const [sampleError, setSampleError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [segmentAssignments, setSegmentAssignments] = useState<Record<number, SegmentAssignment>>({})

  // Cycle through snarky loading messages
  useEffect(() => {
    if (!isExtracting && !isCreating) {
      setLoadingMessage("")
      return
    }

    const messages = isExtracting ? EXTRACTION_MESSAGES : CREATION_MESSAGES
    let index = 0
    setLoadingMessage(messages[0])

    const interval = setInterval(() => {
      index = (index + 1) % messages.length
      setLoadingMessage(messages[index])
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(interval)
  }, [isExtracting, isCreating])

  // Initialize segment assignments when extraction completes
  useEffect(() => {
    if (!extractionResult) return

    const initialAssignments: Record<number, SegmentAssignment> = {}

    // Handle flights
    if (extractionResult.flights) {
      extractionResult.flights.forEach((flight, index) => {
        initialAssignments[index] = {
          action: flight.segment.action,
          segmentId: flight.segment.segmentId,
          segmentName: flight.segment.segmentName,
        }
      })
    }

    // Handle hotels
    if (extractionResult.hotels) {
      extractionResult.hotels.forEach((hotel, index) => {
        initialAssignments[index] = {
          action: hotel.segment.action,
          segmentId: hotel.segment.segmentId,
          segmentName: hotel.segment.segmentName,
        }
      })
    }

    // Handle car rentals
    if (extractionResult.carRentals) {
      extractionResult.carRentals.forEach((rental, index) => {
        initialAssignments[index] = {
          action: rental.segment.action,
          segmentId: rental.segment.segmentId,
          segmentName: rental.segment.segmentName,
        }
      })
    }

    // Handle trains
    if (extractionResult.trains) {
      extractionResult.trains.forEach((train, index) => {
        initialAssignments[index] = {
          action: train.segment.action,
          segmentId: train.segment.segmentId,
          segmentName: train.segment.segmentName,
        }
      })
    }

    // Handle restaurants
    if (extractionResult.restaurants) {
      extractionResult.restaurants.forEach((restaurant, index) => {
        initialAssignments[index] = {
          action: restaurant.segment.action,
          segmentId: restaurant.segment.segmentId,
          segmentName: restaurant.segment.segmentName,
        }
      })
    }

    // Handle events
    if (extractionResult.events) {
      extractionResult.events.forEach((event, index) => {
        initialAssignments[index] = {
          action: event.segment.action,
          segmentId: event.segment.segmentId,
          segmentName: event.segment.segmentName,
        }
      })
    }

    // Handle generic (cruise, private-driver, generic)
    if (extractionResult.generic) {
      extractionResult.generic.forEach((item, index) => {
        initialAssignments[index] = {
          action: item.segment.action,
          segmentId: item.segment.segmentId,
          segmentName: item.segment.segmentName,
        }
      })
    }

    if (Object.keys(initialAssignments).length > 0) {
      setSegmentAssignments(initialAssignments)
    }
  }, [extractionResult])

  useEffect(() => {
    const fetchSamples = async () => {
      setIsLoadingSamples(true)
      setSampleError(null)
      try {
        const response = await fetch("/api/sample-emails")
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load sample emails")
        }
        setSampleOptions(data.samples || [])
      } catch (err) {
        setSampleOptions([])
        setSampleError(err instanceof Error ? err.message : "Failed to load sample emails")
      } finally {
        setIsLoadingSamples(false)
      }
    }

    fetchSamples()
  }, [])

  const handleSegmentChange = (
    flightIndex: number,
    value: string,
    flight: FlightPreview
  ) => {
    if (value === 'new') {
      // Generate smart default name based on flight category
      let defaultName: string
      if (flight.category === 'outbound') {
        defaultName = `Travel to ${flight.arrivalCity}`
      } else if (flight.category === 'return') {
        defaultName = `Return to ${flight.arrivalCity}`
      } else {
        defaultName = `Flight to ${flight.arrivalCity}`
      }
      
      setSegmentAssignments(prev => ({
        ...prev,
        [flightIndex]: {
          action: 'create',
          segmentName: defaultName,
        }
      }))
    } else {
      // Match existing segment
      const segment = extractionResult?.availableSegments?.find(s => s.id === value)
      setSegmentAssignments(prev => ({
        ...prev,
        [flightIndex]: {
          action: 'match',
          segmentId: value,
          segmentName: segment?.name || 'Unknown',
        }
      }))
    }
  }

  const handleSegmentNameChange = (flightIndex: number, newName: string) => {
    setSegmentAssignments(prev => ({
      ...prev,
      [flightIndex]: {
        ...prev[flightIndex],
        segmentName: newName,
      }
    }))
  }

  const handleGenericSegmentChange = (
    itemIndex: number,
    value: string,
    defaultName: string,
    typePrefix: string
  ) => {
    if (value === 'new') {
      setSegmentAssignments(prev => ({
        ...prev,
        [itemIndex]: {
          action: 'create',
          segmentName: `${typePrefix} - ${defaultName}`.substring(0, 50),
        }
      }))
    } else {
      const segment = extractionResult?.availableSegments?.find(s => s.id === value)
      setSegmentAssignments(prev => ({
        ...prev,
        [itemIndex]: {
          action: 'match',
          segmentId: value,
          segmentName: segment?.name || 'Unknown',
        }
      }))
    }
  }

  const handleSampleSelect = async (value: string) => {
    setSelectedSampleId(value)
    if (!value) return

    setSampleError(null)
    try {
      const response = await fetch(`/api/sample-emails?id=${encodeURIComponent(value)}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load sample email")
      }
      setConfirmationText(data.text || "")
      setError(null)
    } catch (err) {
      setSampleError(err instanceof Error ? err.message : "Failed to load sample email")
    }
  }

  const handleExtract = async () => {
    if (!confirmationText.trim()) {
      setError("Please paste your confirmation text")
      return
    }

    setIsExtracting(true)
    setError(null)
    setExtractionResult(null)

    try {
      // Step 1: Extract data
      const extractResponse = await fetch("/api/quick-add/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: confirmationText,
          type: reservationType,
        }),
      })

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json()
        throw new Error(errorData.error || "Failed to extract details")
      }

      const extractResult = await extractResponse.json()

      // Step 2: Get preview with detailed flight info
      const previewResponse = await fetch("/api/quick-add/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          type: reservationType,
          extractedData: extractResult.data,
        }),
      })

      if (!previewResponse.ok) {
        const errorData = await previewResponse.json()
        throw new Error(errorData.error || "Failed to generate preview")
      }

      const previewResult = await previewResponse.json()

      // Combine extraction and preview data
      setExtractionResult({
        ...extractResult,
        ...previewResult,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract details")
    } finally {
      setIsExtracting(false)
    }
  }

  const handleCreate = async () => {
    if (!extractionResult) return

    setIsCreating(true)
    setError(null)

    try {
      // Start background processing
      const response = await fetch("/api/quick-add/create-async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          type: reservationType,
          extractedData: extractionResult.data,
          segmentAssignments: segmentAssignments,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to start processing")
      }

      const { jobId, count } = await response.json()

      // Store job info in sessionStorage for View1 to pick up
      sessionStorage.setItem('quickAddJob', JSON.stringify({
        jobId,
        tripId: trip.id,
        count,
        type: reservationType,
        timestamp: Date.now()
      }))

      // Immediately navigate back to View1
      router.push(`/view1/${trip.id}?tab=journey&scrollTo=new`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start processing")
      setIsCreating(false)
    }
  }

  const handleReset = () => {
    setExtractionResult(null)
    setError(null)
    setConfirmationText("")
  }

  const getCountLabel = () => {
    if (!extractionResult) return ""
    
    const count = extractionResult.count || 1
    switch (reservationType) {
      case "flight":
        return `${count} flight${count > 1 ? 's' : ''}`
      case "hotel":
        return `${count} hotel reservation${count > 1 ? 's' : ''}`
      case "car-rental":
        return `${count} car rental${count > 1 ? 's' : ''}`
      default:
        return `${count} reservation${count > 1 ? 's' : ''}`
    }
  }

  const getFlightSummary = () => {
    if (reservationType !== "flight" || !extractionResult?.categoryCounts) return null
    
    const { outbound, inTrip, return: returnFlight } = extractionResult.categoryCounts

    return (
      <div className="text-sm text-slate-600 space-y-1 mt-2">
        {outbound > 0 && <div>Outbound: {outbound} flight{outbound > 1 ? 's' : ''}</div>}
        {inTrip > 0 && <div>In-Trip: {inTrip} flight{inTrip > 1 ? 's' : ''}</div>}
        {returnFlight > 0 && <div>Return: {returnFlight} flight{returnFlight > 1 ? 's' : ''}</div>}
      </div>
    )
  }

  const getFlightDetails = () => {
    if (reservationType !== "flight" || !extractionResult?.flights) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Flight Details</div>
        {extractionResult.flights.map((flight, index) => {
          const departureDate = new Date(flight.departureDateTime)
          const arrivalDate = new Date(flight.arrivalDateTime)
          
          const categoryColors = {
            'outbound': 'bg-blue-50 text-blue-800 border-blue-200',
            'in-trip': 'bg-purple-50 text-purple-800 border-purple-200',
            'return': 'bg-emerald-50 text-emerald-800 border-emerald-200',
          }

          return (
            <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {flight.carrier} {flight.flightNumber}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">{flight.route}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${categoryColors[flight.category]}`}>
                  {flight.category === 'in-trip' ? 'In-Trip' : flight.category.charAt(0).toUpperCase() + flight.category.slice(1)}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-medium">Depart:</span> {departureDate.toLocaleDateString()} at {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <span className="font-medium">Arrive:</span> {arrivalDate.toLocaleDateString()} at {arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {(flight.cabin || flight.seatNumber) && (
                  <div className="flex gap-4 pt-1">
                    {flight.cabin && <span><span className="font-medium">Cabin:</span> {flight.cabin}</span>}
                    {flight.seatNumber && <span><span className="font-medium">Seat:</span> {flight.seatNumber}</span>}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign to Chapter
                </label>
                
                <Select
                  value={segmentAssignments[index]?.action === 'create' 
                    ? 'new' 
                    : segmentAssignments[index]?.segmentId || ''}
                  onValueChange={(value) => handleSegmentChange(index, value, flight)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Existing segments */}
                    {extractionResult.availableSegments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.type})
                      </SelectItem>
                    ))}
                    
                    {/* New chapter option */}
                    <SelectItem value="new">
                      ➕ New Chapter
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Editable name for new chapters */}
                {segmentAssignments[index]?.action === 'create' && (
                  <input
                    type="text"
                    value={segmentAssignments[index]?.segmentName || ''}
                    onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                    placeholder="Chapter name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )
        })}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getHotelDetails = () => {
    if (reservationType !== "hotel" || !extractionResult?.hotels) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Hotel Details</div>
        {extractionResult.hotels.map((hotel, index) => {
          const checkInDate = new Date(hotel.checkInDate)
          const checkOutDate = new Date(hotel.checkOutDate)
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {hotel.hotelName}
                  </div>
                  {hotel.address && (
                    <div className="text-sm text-slate-600 mt-0.5">{hotel.address}</div>
                  )}
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                  {nights} night{nights !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-medium">Check-in:</span> {checkInDate.toLocaleDateString()} at {hotel.checkInTime}
                </div>
                <div>
                  <span className="font-medium">Check-out:</span> {checkOutDate.toLocaleDateString()} at {hotel.checkOutTime}
                </div>
                {hotel.roomType && (
                  <div>
                    <span className="font-medium">Room:</span> {hotel.roomType}
                    {hotel.numberOfRooms > 1 && ` (x${hotel.numberOfRooms})`}
                  </div>
                )}
                {hotel.totalCost > 0 && (
                  <div>
                    <span className="font-medium">Total:</span> {hotel.currency} {hotel.totalCost.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign to Chapter
                </label>
                
                <Select
                  value={segmentAssignments[index]?.action === 'create' 
                    ? 'new' 
                    : segmentAssignments[index]?.segmentId || ''}
                  onValueChange={(value) => handleGenericSegmentChange(index, value, hotel.hotelName, 'Stay')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extractionResult.availableSegments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.type})
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      ➕ New Chapter
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {segmentAssignments[index]?.action === 'create' && (
                  <input
                    type="text"
                    value={segmentAssignments[index]?.segmentName || ''}
                    onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                    placeholder="Chapter name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )
        })}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getCarRentalDetails = () => {
    if (reservationType !== "car-rental" || !extractionResult?.carRentals) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Car Rental Details</div>
        {extractionResult.carRentals.map((rental, index) => {
          const pickupDate = new Date(rental.pickupDate)
          const returnDate = new Date(rental.returnDate)
          const days = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {rental.company}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    {rental.vehicleClass}{rental.vehicleModel && ` - ${rental.vehicleModel}`}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                  rental.isOneWay 
                    ? 'bg-purple-50 text-purple-800 border-purple-200' 
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {rental.isOneWay ? 'One-way' : `${days} day${days !== 1 ? 's' : ''}`}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-medium">Pick-up:</span> {rental.pickupLocation}
                  <br />
                  <span className="text-slate-500">{pickupDate.toLocaleDateString()} at {rental.pickupTime}</span>
                </div>
                <div>
                  <span className="font-medium">Return:</span> {rental.returnLocation}
                  <br />
                  <span className="text-slate-500">{returnDate.toLocaleDateString()} at {rental.returnTime}</span>
                </div>
                {rental.options && rental.options.length > 0 && (
                  <div>
                    <span className="font-medium">Options:</span> {rental.options.join(', ')}
                  </div>
                )}
                {rental.totalCost > 0 && (
                  <div>
                    <span className="font-medium">Total:</span> {rental.currency} {rental.totalCost.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign to Chapter
                </label>
                
                <Select
                  value={segmentAssignments[index]?.action === 'create' 
                    ? 'new' 
                    : segmentAssignments[index]?.segmentId || ''}
                  onValueChange={(value) => handleGenericSegmentChange(index, value, rental.pickupLocation, 'Drive')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extractionResult.availableSegments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.type})
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      ➕ New Chapter
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {segmentAssignments[index]?.action === 'create' && (
                  <input
                    type="text"
                    value={segmentAssignments[index]?.segmentName || ''}
                    onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                    placeholder="Chapter name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )
        })}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getTrainDetails = () => {
    if (reservationType !== "train" || !extractionResult?.trains) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Train Details</div>
        {extractionResult.trains.map((train, index) => {
          const departureDate = new Date(`${train.departureDate}T12:00:00`)
          const arrivalDate = new Date(`${train.arrivalDate}T12:00:00`)

          return (
            <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {train.operator} {train.trainNumber}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    {train.departureStation} → {train.arrivalStation}
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-sky-50 text-sky-800 border-sky-200">
                  Train
                </span>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-medium">Depart:</span> {departureDate.toLocaleDateString()} at {train.departureTime}
                  {train.departurePlatform && ` (${train.departurePlatform})`}
                </div>
                <div>
                  <span className="font-medium">Arrive:</span> {arrivalDate.toLocaleDateString()} at {train.arrivalTime}
                </div>
                {(train.class || train.coach || train.seat) && (
                  <div className="flex gap-4 pt-1">
                    {train.class && <span><span className="font-medium">Class:</span> {train.class}</span>}
                    {train.coach && <span><span className="font-medium">Coach:</span> {train.coach}</span>}
                    {train.seat && <span><span className="font-medium">Seat:</span> {train.seat}</span>}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign to Chapter
                </label>
                
                <Select
                  value={segmentAssignments[index]?.action === 'create' 
                    ? 'new' 
                    : segmentAssignments[index]?.segmentId || ''}
                  onValueChange={(value) => handleGenericSegmentChange(index, value, train.arrivalCity.split(',')[0], 'Train')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extractionResult.availableSegments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.type})
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      ➕ New Chapter
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {segmentAssignments[index]?.action === 'create' && (
                  <input
                    type="text"
                    value={segmentAssignments[index]?.segmentName || ''}
                    onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                    placeholder="Chapter name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )
        })}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getRestaurantDetails = () => {
    if (reservationType !== "restaurant" || !extractionResult?.restaurants) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Restaurant Details</div>
        {extractionResult.restaurants.map((restaurant, index) => {
          const reservationDate = new Date(restaurant.reservationDate)

          return (
            <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {restaurant.restaurantName}
                  </div>
                  {restaurant.address && (
                    <div className="text-sm text-slate-600 mt-0.5">{restaurant.address}</div>
                  )}
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-rose-50 text-rose-800 border-rose-200">
                  {restaurant.partySize} guest{restaurant.partySize !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-medium">Date:</span> {reservationDate.toLocaleDateString()} at {restaurant.reservationTime}
                </div>
                {restaurant.platform && (
                  <div>
                    <span className="font-medium">Booked via:</span> {restaurant.platform}
                  </div>
                )}
                {restaurant.specialRequests && (
                  <div>
                    <span className="font-medium">Notes:</span> {restaurant.specialRequests}
                  </div>
                )}
                {restaurant.totalCost > 0 && (
                  <div>
                    <span className="font-medium">Deposit:</span> {restaurant.currency} {restaurant.totalCost.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign to Chapter
                </label>
                
                <Select
                  value={segmentAssignments[index]?.action === 'create' 
                    ? 'new' 
                    : segmentAssignments[index]?.segmentId || ''}
                  onValueChange={(value) => handleGenericSegmentChange(index, value, restaurant.restaurantName, 'Dining')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extractionResult.availableSegments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.type})
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      ➕ New Chapter
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {segmentAssignments[index]?.action === 'create' && (
                  <input
                    type="text"
                    value={segmentAssignments[index]?.segmentName || ''}
                    onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                    placeholder="Chapter name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )
        })}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getEventDetails = () => {
    if (reservationType !== "event" || !extractionResult?.events) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Event Details</div>
        {extractionResult.events.map((event, index) => {
          const eventDate = new Date(event.eventDate)
          const totalTickets = event.tickets.reduce((sum, t) => sum + t.quantity, 0)

          return (
            <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {event.eventName}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">{event.venueName}</div>
                  {event.address && (
                    <div className="text-xs text-slate-500">{event.address}</div>
                  )}
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-violet-50 text-violet-800 border-violet-200">
                  {event.eventType || 'Event'}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-medium">Date:</span> {eventDate.toLocaleDateString()}
                  {event.eventTime && ` at ${event.eventTime}`}
                </div>
                {event.doorsOpenTime && (
                  <div>
                    <span className="font-medium">Doors:</span> {event.doorsOpenTime}
                  </div>
                )}
                <div>
                  <span className="font-medium">Tickets:</span> {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                  {event.tickets.length > 0 && (
                    <span className="text-slate-500">
                      {' '}({event.tickets.map(t => `${t.quantity}x ${t.ticketType}`).join(', ')})
                    </span>
                  )}
                </div>
                {event.totalCost > 0 && (
                  <div>
                    <span className="font-medium">Total:</span> {event.currency} {event.totalCost.toLocaleString()}
                  </div>
                )}
                {event.specialInstructions && (
                  <div className="pt-1 text-slate-500 italic">
                    {event.specialInstructions}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign to Chapter
                </label>
                
                <Select
                  value={segmentAssignments[index]?.action === 'create' 
                    ? 'new' 
                    : segmentAssignments[index]?.segmentId || ''}
                  onValueChange={(value) => handleGenericSegmentChange(index, value, event.eventName, 'Activity')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extractionResult.availableSegments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.type})
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      ➕ New Chapter
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {segmentAssignments[index]?.action === 'create' && (
                  <input
                    type="text"
                    value={segmentAssignments[index]?.segmentName || ''}
                    onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                    placeholder="Chapter name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )
        })}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getGenericDetails = () => {
    if (!extractionResult?.generic) return null
    if (!['cruise', 'private-driver', 'generic'].includes(reservationType)) return null

    const typeLabels: Record<string, string> = {
      'cruise': 'Cruise',
      'private-driver': 'Private Driver',
      'generic': 'Reservation'
    }

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{typeLabels[reservationType] || 'Reservation'} Details</div>
        {extractionResult.generic.map((item, index) => (
          <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  {typeLabels[reservationType] || 'Reservation'}
                </div>
                {item.data?.confirmationNumber && (
                  <div className="text-sm text-slate-600 mt-0.5">
                    Confirmation: {item.data.confirmationNumber}
                  </div>
                )}
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-slate-50 text-slate-800 border-slate-200">
                {typeLabels[reservationType]}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Assign to Chapter
              </label>
              
              <Select
                value={segmentAssignments[index]?.action === 'create' 
                  ? 'new' 
                  : segmentAssignments[index]?.segmentId || ''}
                onValueChange={(value) => handleGenericSegmentChange(index, value, typeLabels[reservationType], reservationType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {extractionResult.availableSegments?.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name} ({segment.type})
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    ➕ New Chapter
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {segmentAssignments[index]?.action === 'create' && (
                <input
                  type="text"
                  value={segmentAssignments[index]?.segmentName || ''}
                  onChange={(e) => handleSegmentNameChange(index, e.target.value)}
                  placeholder="Chapter name"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              )}
            </div>
          </div>
        ))}
        
        <div className="text-xs text-slate-500 italic pt-1">
          💡 You can move reservations to different segments later from the trip view.
        </div>
      </div>
    )
  }

  const getTripExtensionMessage = () => {
    if (!extractionResult?.tripExtension) return null

    const { originalStart, originalEnd, newStart, newEnd } = extractionResult.tripExtension
    const startChanged = originalStart !== newStart
    const endChanged = originalEnd !== newEnd

    if (!startChanged && !endChanged) return null

    return (
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-blue-900">Trip dates will be extended</div>
            <div className="text-sm text-blue-800 mt-1">
              {new Date(newStart).toLocaleDateString()} - {new Date(newEnd).toLocaleDateString()}
              <span className="text-blue-600 ml-1">
                (was {new Date(originalStart).toLocaleDateString()} - {new Date(originalEnd).toLocaleDateString()})
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="sticky top-20 z-10 bg-white border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/view1/${trip.id}?tab=journey`)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Trip
            </button>
            <div className="h-4 w-px bg-slate-300" />
            <h1 className="text-lg font-semibold text-slate-900">Quick Add Reservation</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Instructions Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-600">
            Paste your confirmation email or booking details below. We'll extract the information and add it to your trip.
          </p>
        </div>

        {/* Type Selector Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Reservation Type
            </Label>
            <Select
              value={reservationType}
              onValueChange={(value) => {
                setReservationType(value as ReservationType)
                handleReset()
              }}
              disabled={isExtracting || isCreating || !!extractionResult}
            >
              <SelectTrigger id="type" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flight">Flight</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="car-rental">Car Rental</SelectItem>
                <SelectItem value="train">Train</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="event">Event/Tickets</SelectItem>
                <SelectItem value="cruise">Cruise</SelectItem>
                <SelectItem value="private-driver">Private Driver</SelectItem>
                <SelectItem value="generic">Other/Generic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display Card */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-900 mb-2">
                  Extraction Failed
                </h4>
                <p className="text-sm text-rose-800">{error}</p>
                <div className="mt-4 text-xs text-rose-700">
                  <strong className="font-semibold">Troubleshooting Tips:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Ensure all flight dates and times are clearly visible in the confirmation</li>
                    <li>Include the confirmation number if available</li>
                    <li>Paste the complete email content, not just a screenshot</li>
                    <li>Check that dates are in a standard format (e.g., "Jan 29, 2026" or "01/29/2026")</li>
                    <li>Make sure departure and arrival information is present for all flights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text Input or Loading State */}
        {!extractionResult && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sampleImport" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Import
              </Label>
              <Select
                value={selectedSampleId}
                onValueChange={handleSampleSelect}
                disabled={isLoadingSamples || isExtracting || isCreating || sampleOptions.length === 0}
              >
                <SelectTrigger id="sampleImport" className="w-full">
                  <SelectValue
                    placeholder={isLoadingSamples ? "Loading sample emails..." : "Choose a sample email"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sampleOptions.map((sample) => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sampleError && (
                <p className="text-xs text-rose-600">{sampleError}</p>
              )}
              {!isLoadingSamples && sampleOptions.length === 0 && !sampleError && (
                <p className="text-xs text-slate-500">No sample emails found.</p>
              )}
            </div>
            <Label htmlFor="confirmation" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmation Text
            </Label>
            {isExtracting ? (
              <div className="min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                <div className="text-center space-y-4 p-6">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
                  <p className="text-sm text-slate-700 font-medium animate-pulse">
                    {loadingMessage}
                  </p>
                </div>
              </div>
            ) : (
              <Textarea
                id="confirmation"
                placeholder="Paste your confirmation email or booking details here..."
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isExtracting || isCreating}
                rows={12}
                className="font-mono text-sm resize-none"
              />
            )}
          </div>
        )}

        {/* Extraction Result Preview or Creating State */}
        {extractionResult && (
          isCreating ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-blue-900 font-semibold animate-pulse">
                  {loadingMessage}
                </p>
                <p className="text-xs text-blue-700">
                  Hang tight, we're adding {extractionResult.count} {extractionResult.type === 'flight' ? 'flight' : 'reservation'}{extractionResult.count && extractionResult.count > 1 ? 's' : ''} to your trip...
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-base font-semibold text-emerald-900">
                    Found {getCountLabel()}
                  </div>
                  {extractionResult.confirmationNumber && (
                    <div className="text-sm text-slate-600 mt-1">
                      Confirmation: <span className="font-medium">{extractionResult.confirmationNumber}</span>
                    </div>
                  )}
                  {getFlightSummary()}
                  {getTripExtensionMessage()}
                  {getFlightDetails()}
                  {getHotelDetails()}
                  {getCarRentalDetails()}
                  {getTrainDetails()}
                  {getRestaurantDetails()}
                  {getEventDetails()}
                  {getGenericDetails()}
                </div>
              </div>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          {!extractionResult ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/view1/${trip.id}?tab=journey`)}
                disabled={isExtracting}
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtract}
                disabled={isExtracting || !confirmationText.trim()}
                size="lg"
              >
                {isExtracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExtracting ? "Extracting..." : "Extract Details"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isCreating}
                size="lg"
              >
                Try Again
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                size="lg"
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? "Creating..." : "Create Reservations"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
