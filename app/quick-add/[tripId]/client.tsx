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

interface FlightPreview {
  flightNumber: string
  carrier: string
  route: string
  departureCity: string
  arrivalCity: string
  departureDateTime: string
  arrivalDateTime: string
  category: 'outbound' | 'in-trip' | 'return'
  segment: {
    action: 'create' | 'match'
    segmentName: string
    segmentId?: string
  }
  cabin?: string
  seatNumber?: string
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

interface QuickAddClientProps {
  trip: Trip
}

export function QuickAddClient({ trip }: QuickAddClientProps) {
  const router = useRouter()
  const [reservationType, setReservationType] = useState<ReservationType>("flight")
  const [confirmationText, setConfirmationText] = useState("")
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
    if (extractionResult?.flights) {
      const initialAssignments: Record<number, SegmentAssignment> = {}
      extractionResult.flights.forEach((flight, index) => {
        initialAssignments[index] = {
          action: flight.segment.action,
          segmentId: flight.segment.segmentId,
          segmentName: flight.segment.segmentName,
        }
      })
      setSegmentAssignments(initialAssignments)
    }
  }, [extractionResult])

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
