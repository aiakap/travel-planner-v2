"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { LocationAutocompleteInput } from "@/components/ui/location-autocomplete-input"
import { DatePopover } from "@/components/ui/date-popover"
import { updatePersistedSegment } from "@/lib/actions/update-persisted-segment"
import { deleteSegment } from "@/lib/actions/delete-segment"
import { getTimeZoneForLocation } from "@/lib/actions/timezone"
import { updateTripDates } from "@/lib/actions/update-trip-dates"
import { PlaceAutocompleteResult } from "@/lib/types/place-suggestion"
import { dateToUTC, utcToDate } from "@/lib/utils/date-timezone"
import type { Segment, Trip, SegmentType, Reservation, ReservationType, ReservationCategory } from "@prisma/client"

interface SegmentEditClientProps {
  segment: Segment & {
    segmentType: SegmentType
    trip: Trip & {
      segments: Array<Segment & { segmentType: SegmentType }>
    }
    reservations: Array<Reservation & {
      reservationType: ReservationType & {
        category: ReservationCategory
      }
    }>
  }
  trip: Trip & {
    segments: Array<Segment & { segmentType: SegmentType }>
  }
  segmentTypes: SegmentType[]
  returnTo: string
}

export function SegmentEditClient({
  segment,
  trip,
  segmentTypes,
  returnTo
}: SegmentEditClientProps) {
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState(segment.name)
  const [segmentTypeId, setSegmentTypeId] = useState(segment.segmentTypeId)
  const [startLocation, setStartLocation] = useState(segment.startTitle)
  const [endLocation, setEndLocation] = useState(segment.endTitle)
  const [startDate, setStartDate] = useState(
    segment.startTime 
      ? utcToDate(segment.startTime.toISOString(), segment.startTimeZoneId || undefined)
      : ""
  )
  const [endDate, setEndDate] = useState(
    segment.endTime 
      ? utcToDate(segment.endTime.toISOString(), segment.endTimeZoneId || segment.startTimeZoneId || undefined)
      : ""
  )
  const [notes, setNotes] = useState(segment.notes || "")
  const [useDifferentEndLocation, setUseDifferentEndLocation] = useState(
    segment.startTitle !== segment.endTitle
  )
  
  // Location cache - initialize with segment's existing timezone data
  const [locationCache, setLocationCache] = useState<{
    startLat?: number
    startLng?: number
    startTimeZoneId?: string
    startTimeZoneName?: string
    endLat?: number
    endLng?: number
    endTimeZoneId?: string
    endTimeZoneName?: string
  }>({
    startLat: segment.startLat || undefined,
    startLng: segment.startLng || undefined,
    startTimeZoneId: segment.startTimeZoneId || undefined,
    startTimeZoneName: segment.startTimeZoneName || undefined,
    endLat: segment.endLat || undefined,
    endLng: segment.endLng || undefined,
    endTimeZoneId: segment.endTimeZoneId || undefined,
    endTimeZoneName: segment.endTimeZoneName || undefined,
  })
  
  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingTimezone, setIsLoadingTimezone] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Get current segment type
  const currentSegmentType = segmentTypes.find(st => st.id === segmentTypeId)
  const segmentTypeNeedsTwoLocations = currentSegmentType?.name === "Travel"

  // Calculate days
  const days = startDate && endDate 
    ? Math.max(1, differenceInDays(new Date(endDate), new Date(startDate)))
    : 1

  // Check for date conflicts
  const hasDateConflicts = () => {
    if (!startDate || !endDate) return false
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const segmentIndex = trip.segments.findIndex(s => s.id === segment.id)
    const prevSegment = trip.segments[segmentIndex - 1]
    const nextSegment = trip.segments[segmentIndex + 1]
    
    // Check overlaps with adjacent segments
    if (prevSegment?.endTime && start < new Date(prevSegment.endTime)) return true
    if (nextSegment?.startTime && end > new Date(nextSegment.startTime)) return true
    
    // Check trip boundaries
    if (start < trip.startDate || end > trip.endDate) return true
    
    return false
  }

  // Handle location changes
  const handleStartLocationChange = async (
    location: string,
    details?: PlaceAutocompleteResult
  ) => {
    setStartLocation(location)
    setIsDirty(true)

    if (details?.location) {
      setIsLoadingTimezone(true)
      try {
        const timezone = await getTimeZoneForLocation(
          details.location.lat,
          details.location.lng
        )
        
        const newData = {
          startLat: details.location.lat,
          startLng: details.location.lng,
          startTimeZoneId: timezone?.timeZoneId,
          startTimeZoneName: timezone?.timeZoneName,
        }
        
        setLocationCache(prev => ({ ...prev, ...newData }))
        
        if (!useDifferentEndLocation) {
          setEndLocation(location)
          setLocationCache(prev => ({
            ...prev,
            endLat: newData.startLat,
            endLng: newData.startLng,
            endTimeZoneId: newData.startTimeZoneId,
            endTimeZoneName: newData.startTimeZoneName,
          }))
        }
      } catch (error) {
        console.error("Error fetching timezone:", error)
      } finally {
        setIsLoadingTimezone(false)
      }
    }
  }

  const handleEndLocationChange = async (
    location: string,
    details?: PlaceAutocompleteResult
  ) => {
    setEndLocation(location)
    setIsDirty(true)

    if (details?.location) {
      setIsLoadingTimezone(true)
      try {
        const timezone = await getTimeZoneForLocation(
          details.location.lat,
          details.location.lng
        )
        
        const newData = {
          endLat: details.location.lat,
          endLng: details.location.lng,
          endTimeZoneId: timezone?.timeZoneId,
          endTimeZoneName: timezone?.timeZoneName,
        }
        
        setLocationCache(prev => ({ ...prev, ...newData }))
      } catch (error) {
        console.error("Error fetching timezone:", error)
      } finally {
        setIsLoadingTimezone(false)
      }
    }
  }

  // Handle save
  const handleSave = async () => {
    setIsSaving(true)

    try {
      const updates: any = {
        name,
        notes: notes || null,
        startTitle: startLocation,
        endTitle: endLocation,
        startTime: startDate 
          ? dateToUTC(startDate, locationCache.startTimeZoneId, false)
          : null,
        endTime: endDate 
          ? dateToUTC(endDate, useDifferentEndLocation ? locationCache.endTimeZoneId : locationCache.startTimeZoneId, true)
          : null,
        segmentTypeId,
        ...locationCache,
      }

      await updatePersistedSegment(segment.id, updates)
      
      // Navigate back with success
      router.push(returnTo)
      router.refresh()
    } catch (error) {
      console.error("Failed to save segment:", error)
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
      `Are you sure you want to delete "${segment.name}"? This will also delete all reservations in this segment.`
    )
    
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteSegment(segment.id)
      router.push(returnTo)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete segment:", error)
      alert("Failed to delete segment. Please try again.")
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
              Back to Trip
            </button>
            
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700">
                  Unsaved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Hero Image */}
          {segment.imageUrl && (
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
              <img
                src={segment.imageUrl}
                alt={segment.name}
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
                Segment Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter segment name..."
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Type
              </label>
              <select
                value={segmentTypeId}
                onChange={(e) => {
                  setSegmentTypeId(e.target.value)
                  setIsDirty(true)
                  
                  // Auto-enable different end location for Travel
                  const selectedType = segmentTypes.find(st => st.id === e.target.value)
                  if (selectedType?.name === "Travel" && !useDifferentEndLocation) {
                    setUseDifferentEndLocation(true)
                  }
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {segmentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Locations */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Location
              </label>
              
              <LocationAutocompleteInput
                label={`${useDifferentEndLocation ? "Start Location" : "Location"}${
                  locationCache.startTimeZoneName
                    ? ` (${locationCache.startTimeZoneName})`
                    : isLoadingTimezone
                    ? " - Loading timezone..."
                    : ""
                }`}
                value={startLocation}
                onChange={handleStartLocationChange}
                onFocus={() => {
                  setStartLocation("")
                  setIsDirty(true)
                }}
                placeholder="Start typing to search..."
              />

              {useDifferentEndLocation && (
                <LocationAutocompleteInput
                  label={`End Location${
                    locationCache.endTimeZoneName
                      ? ` (${locationCache.endTimeZoneName})`
                      : isLoadingTimezone
                      ? " - Loading timezone..."
                      : ""
                  }`}
                  value={endLocation}
                  onChange={handleEndLocationChange}
                  onFocus={() => {
                    setEndLocation("")
                    setIsDirty(true)
                  }}
                  placeholder="Start typing to search..."
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDifferentEndLocation}
                  onChange={(e) => {
                    setUseDifferentEndLocation(e.target.checked)
                    setIsDirty(true)
                    if (!e.target.checked) {
                      setEndLocation(startLocation)
                      setLocationCache(prev => ({
                        ...prev,
                        endLat: prev.startLat,
                        endLng: prev.startLng,
                        endTimeZoneId: prev.startTimeZoneId,
                        endTimeZoneName: prev.startTimeZoneName,
                      }))
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600">
                  Different end location
                  {segmentTypeNeedsTwoLocations && (
                    <span className="text-[10px] text-slate-400 ml-1">
                      (recommended for Travel)
                    </span>
                  )}
                </span>
              </label>
            </div>

            {/* Dates */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Dates
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">
                    Start Date
                    {locationCache.startTimeZoneName && (
                      <span className="ml-1.5 text-[9px] font-normal text-slate-400">
                        ({locationCache.startTimeZoneName.replace(/_/g, ' ')})
                      </span>
                    )}
                  </label>
                  <DatePopover
                    value={startDate}
                    onChange={(date) => {
                      setStartDate(date)
                      setIsDirty(true)
                    }}
                    label="Select start date"
                    className="w-full justify-start text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">
                    End Date
                    {(useDifferentEndLocation ? locationCache.endTimeZoneName : locationCache.startTimeZoneName) && (
                      <span className="ml-1.5 text-[9px] font-normal text-slate-400">
                        ({(useDifferentEndLocation ? locationCache.endTimeZoneName : locationCache.startTimeZoneName)?.replace(/_/g, ' ')})
                      </span>
                    )}
                  </label>
                  <DatePopover
                    value={endDate}
                    onChange={(date) => {
                      setEndDate(date)
                      setIsDirty(true)
                    }}
                    label="Select end date"
                    minDate={startDate ? new Date(startDate) : undefined}
                    className="w-full justify-start text-sm"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <p className="text-xs text-slate-500 mt-2">
                  {days} day{days !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Conflict Warning */}
            {hasDateConflicts() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-slide-down">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="text-xs text-amber-700 font-medium">
                      Date conflicts detected with other segments
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/journey/${trip.id}/edit?returnTo=${encodeURIComponent(returnTo)}`)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Open Journey Manager
                  </button>
                </div>
              </div>
            )}

            {/* Notes */}
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

            {/* Reservations */}
            {segment.reservations && segment.reservations.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Reservations ({segment.reservations.length})
                </label>
                <div className="space-y-2">
                  {segment.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 shadow-sm bg-white"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {reservation.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {reservation.reservationType.category.name}
                          {reservation.startTime &&
                            ` • ${format(new Date(reservation.startTime), "h:mm a")}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Segment"}
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
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
