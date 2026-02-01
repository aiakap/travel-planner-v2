"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, AlertCircle, Trash2, Lightbulb, X } from "lucide-react"
import { format, differenceInDays, differenceInMinutes } from "date-fns"
import { LocationAutocompleteInput } from "@/components/ui/location-autocomplete-input"
import { DatePopover } from "@/components/ui/date-popover"
import { updateReservation } from "@/lib/actions/update-reservation"
import { deleteReservation } from "@/lib/actions/delete-reservation"
import { getTimeZoneForLocation } from "@/lib/actions/timezone"
import { checkTimeConflict, getAlternativeTimeSlots } from "@/lib/actions/check-conflicts"
import { PlaceAutocompleteResult } from "@/lib/types/place-suggestion"
import { getDefaultTimeForType } from "@/lib/scheduling-utils"
import TimezoneSelect from "@/components/timezone-select"
import FlightMap from "@/components/flight-map"
import type {
  Reservation,
  ReservationType,
  ReservationCategory,
  ReservationStatus,
  ReservationDisplayGroup,
  Segment,
  Trip
} from "@prisma/client"

type ReservationWithRelations = Reservation & {
  reservationType: ReservationType & {
    category: ReservationCategory
    displayGroup: ReservationDisplayGroup | null
  }
  reservationStatus: ReservationStatus
  segment: Segment & {
    trip: Trip & {
      segments: Array<Segment & {
        reservations: Array<Reservation & {
          reservationType: ReservationType & {
            category: ReservationCategory
          }
        }>
      }>
    }
  }
}

type CategoryWithTypes = ReservationCategory & {
  types: Array<ReservationType & {
    displayGroup: ReservationDisplayGroup | null
  }>
}

interface ReservationEditClientProps {
  reservation: ReservationWithRelations
  trip: Trip & {
    segments: Array<Segment & {
      reservations: Array<Reservation & {
        reservationType: ReservationType & {
          category: ReservationCategory
        }
      }>
    }>
  }
  segment: Segment
  categories: CategoryWithTypes[]
  statuses: ReservationStatus[]
  returnTo: string
  isFromNaturalLanguage?: boolean
  originalInput?: string | null
}

interface LocationCache {
  lat?: number
  lng?: number
  timeZoneId?: string
  timeZoneName?: string
}

interface TimeConflict {
  hasConflict: boolean
  conflictingReservations: Array<{
    id: string
    name: string
    startTime: Date
    endTime: Date | null
    category: string
  }>
  travelTimeIssues?: Array<{
    from: string
    to: string
    requiredTime: number
    availableTime: number
    shortfall: number
    travelTimeText: string
  }>
}

interface TimeSuggestion {
  startTime: string
  endTime: string
  reason: string
}

// Helper to format datetime-local input value
function formatForDateTimeLocal(date: Date | null): string {
  if (!date) return ""
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper to calculate which day of trip a date falls on
function calculateTripDay(tripStartDate: Date, targetDate: Date): number {
  const daysDiff = differenceInDays(targetDate, tripStartDate)
  return Math.max(1, daysDiff + 1)
}

export function ReservationEditClient({
  reservation,
  trip,
  segment,
  categories,
  statuses,
  returnTo,
  isFromNaturalLanguage = false,
  originalInput = null
}: ReservationEditClientProps) {
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState(reservation.name)
  const [categoryId, setCategoryId] = useState(reservation.reservationType.categoryId)
  const [typeId, setTypeId] = useState(reservation.reservationTypeId)
  const [statusId, setStatusId] = useState(reservation.reservationStatusId)
  const [startTime, setStartTime] = useState(
    formatForDateTimeLocal(reservation.startTime)
  )
  const [endTime, setEndTime] = useState(
    formatForDateTimeLocal(reservation.endTime)
  )
  const [location, setLocation] = useState(reservation.location || "")
  const [cost, setCost] = useState(reservation.cost?.toString() || "")
  const [currency, setCurrency] = useState(reservation.currency || "USD")
  const [confirmationNumber, setConfirmationNumber] = useState(reservation.confirmationNumber || "")
  const [notes, setNotes] = useState(reservation.notes || "")
  const [url, setUrl] = useState(reservation.url || "")
  const [contactPhone, setContactPhone] = useState(reservation.contactPhone || "")
  const [contactEmail, setContactEmail] = useState(reservation.contactEmail || "")
  const [cancellationPolicy, setCancellationPolicy] = useState(reservation.cancellationPolicy || "")
  const [vendor, setVendor] = useState(reservation.vendor || "")
  
  // Flight/transport-specific state
  const [departureLocation, setDepartureLocation] = useState(reservation.departureLocation || "")
  const [departureTimezone, setDepartureTimezone] = useState(reservation.departureTimezone || "")
  const [arrivalLocation, setArrivalLocation] = useState(reservation.arrivalLocation || "")
  const [arrivalTimezone, setArrivalTimezone] = useState(reservation.arrivalTimezone || "")
  
  // Location cache
  const [locationCache, setLocationCache] = useState<LocationCache>({
    lat: reservation.latitude || undefined,
    lng: reservation.longitude || undefined,
    timeZoneId: reservation.timeZoneId || undefined,
    timeZoneName: reservation.timeZoneName || undefined,
  })
  
  // Flight map coords
  const [departureCoords, setDepartureCoords] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [arrivalCoords, setArrivalCoords] = useState<{ name: string; lat: number; lng: number } | null>(null)
  
  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingTimezone, setIsLoadingTimezone] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [conflicts, setConflicts] = useState<TimeConflict | null>(null)
  const [suggestions, setSuggestions] = useState<TimeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)

  // Refs for debouncing
  const conflictCheckTimer = useRef<NodeJS.Timeout | null>(null)
  const locationDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Get current type and display group
  const availableTypes = categories.find(cat => cat.id === categoryId)?.types || []
  const currentType = availableTypes.find(t => t.id === typeId)
  const currentCategory = categories.find(c => c.id === categoryId)
  const displayGroup = currentType?.displayGroup?.name || "DEFAULT"

  // Display group checks
  const isPointToPoint = displayGroup === "POINT_TO_POINT_TRANSPORT"
  const isShortDistance = displayGroup === "SHORT_DISTANCE_TRANSPORT"
  const isRental = displayGroup === "RENTAL_SERVICE"
  const isMultiDayStay = displayGroup === "MULTI_DAY_STAY"
  const isTimedReservation = displayGroup === "TIMED_RESERVATION"
  const isFlexibleActivity = displayGroup === "FLEXIBLE_ACTIVITY"

  // Calculate duration/nights
  const duration = startTime && endTime
    ? differenceInMinutes(new Date(endTime), new Date(startTime)) / 60
    : 0
  
  const nights = isMultiDayStay && startTime && endTime
    ? Math.max(1, differenceInDays(new Date(endTime), new Date(startTime)))
    : 0

  // Auto-select first type when category changes
  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.find(t => t.id === typeId)) {
      setTypeId(availableTypes[0].id)
      setIsDirty(true)
    }
  }, [categoryId, availableTypes, typeId])

  // Apply default times when type changes
  useEffect(() => {
    if (currentCategory && currentType && !reservation.startTime) {
      const defaults = getDefaultTimeForType(currentCategory.name, currentType.name)
      // Only apply if no times set yet
      if (!startTime) {
        const now = new Date()
        const defaultStart = new Date(now)
        const [hours, minutes] = defaults.startTime.split(":")
        defaultStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        setStartTime(formatForDateTimeLocal(defaultStart))
        
        const defaultEnd = new Date(defaultStart)
        defaultEnd.setHours(defaultEnd.getHours() + defaults.duration)
        setEndTime(formatForDateTimeLocal(defaultEnd))
      }
    }
  }, [currentCategory, currentType, reservation.startTime, startTime])

  // Debounced conflict check
  useEffect(() => {
    if (conflictCheckTimer.current) {
      clearTimeout(conflictCheckTimer.current)
    }

    if (!startTime || !endTime) {
      setConflicts(null)
      return
    }

    conflictCheckTimer.current = setTimeout(async () => {
      setIsCheckingConflicts(true)
      try {
        const start = new Date(startTime)
        const tripDay = calculateTripDay(new Date(trip.startDate), start)
        const startTimeStr = `${start.getHours()}:${String(start.getMinutes()).padStart(2, "0")}`
        const end = new Date(endTime)
        const endTimeStr = `${end.getHours()}:${String(end.getMinutes()).padStart(2, "0")}`
        
        const result = await checkTimeConflict(
          trip.id,
          tripDay,
          startTimeStr,
          endTimeStr,
          locationCache.lat,
          locationCache.lng
        )
        
        // Filter out the current reservation from conflicts
        const filteredConflicts = {
          ...result,
          conflictingReservations: result.conflictingReservations.filter(
            r => r.id !== reservation.id
          )
        }
        
        setConflicts(filteredConflicts.conflictingReservations.length > 0 || (filteredConflicts.travelTimeIssues?.length || 0) > 0 ? filteredConflicts : null)
        
        // Get suggestions if there are conflicts
        if (filteredConflicts.hasConflict && currentCategory && currentType) {
          const defaults = getDefaultTimeForType(currentCategory.name, currentType.name)
          const alts = await getAlternativeTimeSlots(
            trip.id,
            tripDay,
            defaults.duration,
            startTimeStr
          )
          setSuggestions(alts)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error("Error checking conflicts:", error)
      } finally {
        setIsCheckingConflicts(false)
      }
    }, 800)

    return () => {
      if (conflictCheckTimer.current) {
        clearTimeout(conflictCheckTimer.current)
      }
    }
  }, [startTime, endTime, locationCache.lat, locationCache.lng, trip.id, trip.startDate, reservation.id, currentCategory, currentType])

  // Handle location change with timezone lookup
  const handleLocationChange = useCallback(async (
    value: string,
    details?: PlaceAutocompleteResult
  ) => {
    setLocation(value)
    setIsDirty(true)

    if (details?.location) {
      setIsLoadingTimezone(true)
      try {
        const timezone = await getTimeZoneForLocation(
          details.location.lat,
          details.location.lng
        )
        
        setLocationCache({
          lat: details.location.lat,
          lng: details.location.lng,
          timeZoneId: timezone?.timeZoneId,
          timeZoneName: timezone?.timeZoneName,
        })
      } catch (error) {
        console.error("Error fetching timezone:", error)
      } finally {
        setIsLoadingTimezone(false)
      }
    }
  }, [])

  // Handle departure location change (for flights/transport)
  const handleDepartureLocationChange = useCallback(async (
    value: string,
    details?: PlaceAutocompleteResult
  ) => {
    setDepartureLocation(value)
    setIsDirty(true)

    if (locationDebounceTimer.current) {
      clearTimeout(locationDebounceTimer.current)
    }

    if (details?.location) {
      locationDebounceTimer.current = setTimeout(async () => {
        setIsLoadingTimezone(true)
        try {
          const timezone = await getTimeZoneForLocation(
            details.location.lat,
            details.location.lng
          )
          
          setDepartureTimezone(timezone?.timeZoneId || "")
          setDepartureCoords({
            name: value,
            lat: details.location.lat,
            lng: details.location.lng,
          })
        } catch (error) {
          console.error("Error fetching timezone:", error)
        } finally {
          setIsLoadingTimezone(false)
        }
      }, 800)
    }
  }, [])

  // Handle arrival location change (for flights/transport)
  const handleArrivalLocationChange = useCallback(async (
    value: string,
    details?: PlaceAutocompleteResult
  ) => {
    setArrivalLocation(value)
    setIsDirty(true)

    if (locationDebounceTimer.current) {
      clearTimeout(locationDebounceTimer.current)
    }

    if (details?.location) {
      locationDebounceTimer.current = setTimeout(async () => {
        setIsLoadingTimezone(true)
        try {
          const timezone = await getTimeZoneForLocation(
            details.location.lat,
            details.location.lng
          )
          
          setArrivalTimezone(timezone?.timeZoneId || "")
          setArrivalCoords({
            name: value,
            lat: details.location.lat,
            lng: details.location.lng,
          })
        } catch (error) {
          console.error("Error fetching timezone:", error)
        } finally {
          setIsLoadingTimezone(false)
        }
      }, 800)
    }
  }, [])

  // Apply suggested time slot
  const applySuggestion = (suggestion: TimeSuggestion) => {
    const start = new Date(startTime)
    const [startHours, startMinutes] = suggestion.startTime.split(":")
    start.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
    setStartTime(formatForDateTimeLocal(start))
    
    const end = new Date(start)
    const [endHours, endMinutes] = suggestion.endTime.split(":")
    end.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)
    setEndTime(formatForDateTimeLocal(end))
    
    setIsDirty(true)
    setShowSuggestions(false)
  }

  // Handle save
  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Build the return URL with scroll-to parameter
      const scrollToUrl = `/view1/${trip.id}?tab=journey&scrollTo=reservation-${reservation.id}`
      
      const formData = new FormData()
      formData.set("reservationId", reservation.id)
      formData.set("name", name)
      formData.set("reservationTypeId", typeId)
      formData.set("reservationStatusId", statusId)
      formData.set("confirmationNumber", confirmationNumber)
      formData.set("notes", notes)
      formData.set("url", url)
      formData.set("contactPhone", contactPhone)
      formData.set("contactEmail", contactEmail)
      formData.set("cancellationPolicy", cancellationPolicy)
      formData.set("vendor", vendor)
      formData.set("returnTo", scrollToUrl)
      
      if (cost) formData.set("cost", cost)
      if (currency) formData.set("currency", currency)
      
      // Handle times based on display group
      if (isPointToPoint || isShortDistance) {
        formData.set("departureLocation", departureLocation)
        formData.set("departureTimezone", departureTimezone)
        formData.set("arrivalLocation", arrivalLocation)
        formData.set("arrivalTimezone", arrivalTimezone)
        if (startTime) formData.set("startTime", new Date(startTime).toISOString())
        if (endTime) formData.set("endTime", new Date(endTime).toISOString())
      } else {
        formData.set("location", location)
        if (startTime) formData.set("startTime", new Date(startTime).toISOString())
        if (endTime) formData.set("endTime", new Date(endTime).toISOString())
        if (locationCache.lat) formData.set("latitude", locationCache.lat.toString())
        if (locationCache.lng) formData.set("longitude", locationCache.lng.toString())
        if (locationCache.timeZoneId) formData.set("timeZoneId", locationCache.timeZoneId)
        if (locationCache.timeZoneName) formData.set("timeZoneName", locationCache.timeZoneName)
      }

      await updateReservation(formData)
      
      // The server action will redirect using the scrollToUrl we passed as returnTo
      // But if it doesn't for some reason, fallback to client-side navigation
      router.push(scrollToUrl)
      router.refresh()
    } catch (error) {
      console.error("Failed to save reservation:", error)
      alert("Failed to save changes. Please try again.")
      setIsSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      )
      if (!confirmed) return
    }
    router.push(returnTo)
  }

  // Handle delete
  const handleDelete = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete "${reservation.name}"?`
    )
    
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteReservation(reservation.id)
      router.push(returnTo)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete reservation:", error)
      alert("Failed to delete reservation. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700">
                  Unsaved
                </span>
              )}
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                {currentType?.displayGroup?.displayName || "Reservation"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Natural Language Banner */}
        {isFromNaturalLanguage && originalInput && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-indigo-900 mb-2">
                  Review your reservation details
                </h3>
                <p className="text-sm text-indigo-800 mb-3">
                  I've created this reservation based on your request: <span className="font-semibold">"{originalInput}"</span>
                </p>
                <div className="text-xs text-indigo-700">
                  <strong className="font-semibold">Next steps:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Review the details below and make any necessary adjustments</li>
                    <li>Fill in any missing information</li>
                    <li>Click "Create Reservation" to save, or "Cancel" to discard</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Hero Image */}
          {reservation.imageUrl && (
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
              <img
                src={reservation.imageUrl}
                alt={reservation.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
            </div>
          )}

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Reservation Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter reservation name..."
              />
            </div>

            {/* Category & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Type
                </label>
                <select
                  value={typeId}
                  onChange={(e) => {
                    setTypeId(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {availableTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Status
              </label>
              <select
                value={statusId}
                onChange={(e) => {
                  setStatusId(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            {/* POINT_TO_POINT_TRANSPORT: Flight Map + Departure/Arrival */}
            {isPointToPoint && (
              <>
                {/* Flight Map */}
                {departureCoords && arrivalCoords && (
                  <div className="h-64 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    <FlightMap
                      departureLocation={departureCoords}
                      arrivalLocation={arrivalCoords}
                    />
                  </div>
                )}

                {/* Departure Section */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <h3 className="font-semibold text-slate-900">Departure</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <LocationAutocompleteInput
                      label="Location"
                      value={departureLocation}
                      onChange={handleDepartureLocationChange}
                      placeholder="Start typing location..."
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">
                          Time
                        </label>
                        <input
                          type="datetime-local"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value)
                            setIsDirty(true)
                          }}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">
                          Timezone
                          {departureTimezone && !isLoadingTimezone && (
                            <span className="ml-2 text-xs text-green-600 font-normal">✓</span>
                          )}
                        </label>
                        <TimezoneSelect
                          value={departureTimezone}
                          onChange={(tz) => {
                            setDepartureTimezone(tz)
                            setIsDirty(true)
                          }}
                          placeholder="Select timezone..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration Indicator */}
                {duration > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="h-px w-8 bg-slate-300" />
                      <span className="font-medium">Duration: ~{Math.floor(duration)}h {Math.round((duration % 1) * 60)}m</span>
                      <div className="h-px w-8 bg-slate-300" />
                    </div>
                  </div>
                )}

                {/* Arrival Section */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <h3 className="font-semibold text-slate-900">Arrival</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <LocationAutocompleteInput
                      label="Location"
                      value={arrivalLocation}
                      onChange={handleArrivalLocationChange}
                      placeholder="Start typing location..."
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">
                          Time
                        </label>
                        <input
                          type="datetime-local"
                          value={endTime}
                          onChange={(e) => {
                            setEndTime(e.target.value)
                            setIsDirty(true)
                          }}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">
                          Timezone
                          {arrivalTimezone && !isLoadingTimezone && (
                            <span className="ml-2 text-xs text-green-600 font-normal">✓</span>
                          )}
                        </label>
                        <TimezoneSelect
                          value={arrivalTimezone}
                          onChange={(tz) => {
                            setArrivalTimezone(tz)
                            setIsDirty(true)
                          }}
                          placeholder="Select timezone..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SHORT_DISTANCE_TRANSPORT: Pickup + Dropoff */}
            {isShortDistance && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Pickup Location
                  </label>
                  <LocationAutocompleteInput
                    label=""
                    value={departureLocation}
                    onChange={handleDepartureLocationChange}
                    placeholder="Enter pickup address..."
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Dropoff Location
                  </label>
                  <LocationAutocompleteInput
                    label=""
                    value={arrivalLocation}
                    onChange={handleArrivalLocationChange}
                    placeholder="Enter dropoff address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Pickup Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Dropoff Time (Est.)
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Driver / Vehicle Info
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => {
                      setVendor(e.target.value)
                      setIsDirty(true)
                    }}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g., John D. - Toyota Camry (ABC 123)"
                  />
                </div>
              </>
            )}

            {/* RENTAL_SERVICE: Pickup + Return */}
            {isRental && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Pickup Location
                  </label>
                  <LocationAutocompleteInput
                    label=""
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="Enter pickup location..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Pickup Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Return Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {duration > 0 && (
                  <p className="text-xs text-slate-500">
                    Duration: {Math.floor(duration / 24)} days, {Math.floor(duration % 24)} hours
                  </p>
                )}
              </>
            )}

            {/* MULTI_DAY_STAY: Check-in + Check-out */}
            {isMultiDayStay && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Property Address
                  </label>
                  <LocationAutocompleteInput
                    label=""
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="Enter property address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Check-in
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Check-out
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {nights > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                      {nights} night{nights !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* TIMED_RESERVATION: Single date/time + location */}
            {isTimedReservation && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Location
                  </label>
                  <LocationAutocompleteInput
                    label=""
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="Enter location..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      End Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {duration > 0 && (
                  <p className="text-xs text-slate-500">
                    Duration: ~{Math.floor(duration)}h {Math.round((duration % 1) * 60)}m
                  </p>
                )}
              </>
            )}

            {/* FLEXIBLE_ACTIVITY: Date + optional time */}
            {isFlexibleActivity && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                    Location / Meeting Point
                  </label>
                  <LocationAutocompleteInput
                    label=""
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="Enter location..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Date (Time Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        setIsDirty(true)
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                      Est. Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={duration > 0 ? Math.round(duration) : ""}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0
                        if (startTime) {
                          const start = new Date(startTime)
                          const end = new Date(start)
                          end.setHours(end.getHours() + hours)
                          setEndTime(formatForDateTimeLocal(end))
                          setIsDirty(true)
                        }
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., 4"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Conflict Detection Panel */}
            {(conflicts || isCheckingConflicts) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-slide-down">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {isCheckingConflicts ? (
                      <p className="text-xs text-amber-700">Checking for conflicts...</p>
                    ) : conflicts ? (
                      <>
                        <p className="text-xs font-medium text-amber-900 mb-1">
                          Scheduling conflicts detected
                        </p>
                        {conflicts.conflictingReservations.length > 0 && (
                          <ul className="text-[10px] text-amber-700 space-y-0.5 mb-2">
                            {conflicts.conflictingReservations.map(conflict => (
                              <li key={conflict.id}>
                                • Overlaps with {conflict.name} ({conflict.category})
                              </li>
                            ))}
                          </ul>
                        )}
                        {conflicts.travelTimeIssues && conflicts.travelTimeIssues.length > 0 && (
                          <ul className="text-[10px] text-amber-700 space-y-0.5 mb-2">
                            {conflicts.travelTimeIssues.map((issue, i) => (
                              <li key={i}>
                                • Travel time issue: {issue.from} → {issue.to} needs {issue.travelTimeText}, only {Math.round(issue.availableTime)}min available
                              </li>
                            ))}
                          </ul>
                        )}
                        {suggestions.length > 0 && (
                          <button
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="text-xs text-amber-800 hover:text-amber-900 font-medium underline"
                          >
                            {showSuggestions ? "Hide" : "View"} alternative times
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Panel */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-slide-down">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-900">Suggested Alternative Times</h4>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full text-left p-3 rounded-lg bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {suggestion.startTime} - {suggestion.endTime}
                          </div>
                          <div className="text-xs text-slate-600">
                            {suggestion.reason}
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Apply</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Universal Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => {
                    setCost(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
            </div>

            <div suppressHydrationWarning>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Confirmation Number
              </label>
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => {
                  setConfirmationNumber(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., ABC123XYZ"
                data-lpignore="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div suppressHydrationWarning>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="+1 (555) 123-4567"
                  data-lpignore="true"
                />
              </div>
              <div suppressHydrationWarning>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="contact@example.com"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div suppressHydrationWarning>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Booking URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="https://..."
                data-lpignore="true"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[100px] resize-y"
                placeholder="Add notes..."
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Cancellation Policy
              </label>
              <textarea
                value={cancellationPolicy}
                onChange={(e) => {
                  setCancellationPolicy(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-y"
                placeholder="Free cancellation until..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-300 flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isFromNaturalLanguage ? "Create Reservation" : "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
