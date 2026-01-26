"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/exp/ui/button"
import { Input } from "@/app/exp/ui/input"
import { Badge } from "@/app/exp/ui/badge"
import { SaveIndicator } from "@/app/exp/ui/save-indicator"
import { useAutoSave } from "@/hooks/use-auto-save"
import { ClickToEditField } from "@/app/exp/ui/click-to-edit-field"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { getTimeZoneForLocation, formatDateInTimeZone } from "@/lib/actions/timezone"
import { DBReservation } from "@/app/exp/types/database-types"
import { smartResolveReservation, ResolvedData } from "@/lib/actions/smart-resolve"
import { needsResolution } from "@/lib/utils/resolution-utils"
import { ResolutionConfirmationDialog } from "./resolution-confirmation-dialog"
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  ExternalLink,
  CreditCard,
  CheckSquare,
  Edit,
  Trash2,
  Navigation,
  Save,
  Moon,
  Plane,
  Hotel,
  Utensils,
  Train,
  Camera,
  Loader2,
  Search,
} from "lucide-react"

type ReservationStatus = "suggested" | "planned" | "confirmed"

interface SelectedReservation {
  reservation: DBReservation
  itemTitle: string
  itemTime: string
  itemType: string
  dayDate: string
}

interface ReservationDetailModalProps {
  selectedReservation: SelectedReservation | null
  onClose: () => void
  onConfirm?: (reservationId: string) => void
  onDelete?: (reservationId: string) => void
  onSave?: (reservation: DBReservation) => void
}

export function ReservationDetailModal({
  selectedReservation,
  onClose,
  onConfirm,
  onDelete,
  onSave,
}: ReservationDetailModalProps) {
  const [isEditingReservation, setIsEditingReservation] = useState(false)
  const [editedReservation, setEditedReservation] = useState<DBReservation | null>(null)
  const [localTimezone, setLocalTimezone] = useState<any>(null)
  
  // Auto-resolution state
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedData, setResolvedData] = useState<ResolvedData | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [hasAttemptedResolution, setHasAttemptedResolution] = useState(false)

  // Load Google Maps
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Auto-save hook for edit mode
  const { save, saveState } = useAutoSave(async (updates: Partial<DBReservation>) => {
    if (editedReservation && onSave) {
      const updatedReservation = { ...editedReservation, ...updates };
      onSave(updatedReservation);
    }
  }, { delay: 500 });

  // State for formatted display time
  const [displayTime, setDisplayTime] = useState("")
  
  // Fetch timezone when coordinates are available
  useEffect(() => {
    if (selectedReservation?.reservation.latitude && selectedReservation?.reservation.longitude) {
      getTimeZoneForLocation(
        selectedReservation.reservation.latitude,
        selectedReservation.reservation.longitude
      ).then(tz => {
        if (tz) setLocalTimezone(tz)
      })
    }
  }, [selectedReservation?.reservation.latitude, selectedReservation?.reservation.longitude])
  
  // Format time display
  useEffect(() => {
    if (selectedReservation?.reservation) {
      formatTimeDisplay(selectedReservation.reservation).then(setDisplayTime)
    }
  }, [selectedReservation?.reservation.startTime, selectedReservation?.reservation.endTime, selectedReservation?.reservation.timeZoneId])

  // Auto-resolve on modal open
  useEffect(() => {
    if (selectedReservation && !hasAttemptedResolution) {
      attemptAutoResolve()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReservation?.reservation.id])

  // Helper function to merge resolved data with reservation
  const mergeResolvedData = (reservation: DBReservation, resolved: ResolvedData): DBReservation => {
    return {
      ...reservation,
      ...(resolved.name && { name: resolved.name }),
      ...(resolved.vendor && { vendor: resolved.vendor }),
      ...(resolved.location && { location: resolved.location }),
      ...(resolved.latitude && { latitude: resolved.latitude }),
      ...(resolved.longitude && { longitude: resolved.longitude }),
      ...(resolved.timeZoneId && { timeZoneId: resolved.timeZoneId }),
      ...(resolved.timeZoneName && { timeZoneName: resolved.timeZoneName }),
      ...(resolved.contactPhone && { contactPhone: resolved.contactPhone }),
      ...(resolved.website && { url: resolved.website }),
      ...(resolved.imageUrl && !reservation.imageIsCustom && { imageUrl: resolved.imageUrl }),
    }
  }

  const attemptAutoResolve = async () => {
    if (!selectedReservation) return
    
    // Check if resolution is needed
    if (!needsResolution(selectedReservation.reservation)) {
      setHasAttemptedResolution(true)
      return
    }

    setIsResolving(true)
    setHasAttemptedResolution(true)

    try {
      console.log('[Auto-Resolve] Attempting resolution for:', selectedReservation.reservation.name)
      const resolved = await smartResolveReservation({
        name: selectedReservation.reservation.name,
        vendor: selectedReservation.reservation.vendor,
        location: selectedReservation.reservation.location,
        latitude: selectedReservation.reservation.latitude,
        longitude: selectedReservation.reservation.longitude,
      })

      if (resolved.source !== 'none') {
        console.log('[Auto-Resolve] Resolution successful:', resolved)
        setResolvedData(resolved)
        
        // HIGH confidence: auto-save and skip confirmation
        if (resolved.confidence === 'high' && onSave) {
          console.log('[Auto-Resolve] High confidence - auto-saving')
          const updatedReservation = mergeResolvedData(selectedReservation.reservation, resolved)
          await onSave(updatedReservation)
          // Modal will refresh with saved data
        } else {
          // MEDIUM/LOW confidence: show confirmation
          console.log('[Auto-Resolve] Medium/Low confidence - showing confirmation')
          setShowConfirmation(true)
        }
      } else {
        console.log('[Auto-Resolve] No resolution found')
      }
    } catch (error) {
      console.error('[Auto-Resolve] Error during resolution:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const handleAcceptResolution = () => {
    if (!resolvedData || !selectedReservation) return

    // Merge resolved data and enter edit mode
    const updatedReservation = mergeResolvedData(selectedReservation.reservation, resolvedData)
    
    setEditedReservation(updatedReservation)
    setIsEditingReservation(true)
    setShowConfirmation(false)
    setResolvedData(null)
  }

  const handleKeepOriginalResolution = () => {
    setShowConfirmation(false)
    setResolvedData(null)
  }

  if (!selectedReservation) return null

  const handleStartEdit = () => {
    setEditedReservation({ ...selectedReservation.reservation })
    setIsEditingReservation(true)
  }

  const handleCancelEdit = () => {
    setIsEditingReservation(false)
    setEditedReservation(null)
  }

  const handleSaveEdit = () => {
    if (editedReservation && onSave) {
      onSave(editedReservation)
    }
    setIsEditingReservation(false)
    setEditedReservation(null)
    onClose()
  }

  // Helper to update field and trigger auto-save
  const updateField = (field: keyof DBReservation, value: any) => {
    if (!editedReservation) return;
    const updated = { ...editedReservation, [field]: value };
    setEditedReservation(updated);
    save({ [field]: value });
  }

  // Format date for input field
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return ""
    }
  }

  // Format time for input field
  const formatTimeForInput = (dateString?: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toTimeString().slice(0, 5)
    } catch {
      return ""
    }
  }

  // Combine date and time
  const combineDateAndTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`).toISOString()
  }

  const getStatusBadge = (statusName: string, confirmationNumber?: string | null) => {
    const status = statusName.toLowerCase()
    
    if (status.includes("confirm")) {
      return (
        <Badge className="bg-green-100 text-green-700 text-[8px] px-1 py-0 font-bold">
          {confirmationNumber || "Confirmed"}
        </Badge>
      )
    }
    if (status.includes("plan")) {
      return <Badge className="bg-blue-100 text-blue-700 text-[8px] px-1 py-0">Planned</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700 text-[8px] px-1 py-0">Suggestion</Badge>
  }

  const formatTimeDisplay = async (res: DBReservation) => {
    if (!res.startTime) return ""
    
    try {
      if (res.timeZoneId) {
        const startFormatted = await formatDateInTimeZone(
          new Date(res.startTime),
          res.timeZoneId,
          { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
        )
        
        if (res.endTime) {
          const endFormatted = await formatDateInTimeZone(
            new Date(res.endTime),
            res.timeZoneId,
            { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
          )
          return `${startFormatted} - ${endFormatted}`
        }
        
        return startFormatted
      }
      
      // Fallback to simple display
      const startTime = new Date(res.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      if (res.endTime) {
        const endTime = new Date(res.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        if (res.departureTimezone && res.arrivalTimezone && res.departureTimezone !== res.arrivalTimezone) {
          return `${startTime} ${res.departureTimezone} - ${endTime} ${res.arrivalTimezone}`
        }
        return `${startTime} - ${endTime}`
      }
      return startTime
    } catch (error) {
      console.error("Error formatting time:", error)
      return ""
    }
  }

  const formatHotelDates = (res: DBReservation) => {
    if (res.startTime && res.endTime) {
      const startDate = new Date(res.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const endDate = new Date(res.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `${startDate} - ${endDate}`
    }
    return null
  }

  const calculateNights = (startTime: Date | null, endTime: Date | null): number | null => {
    if (!startTime || !endTime) return null
    const start = new Date(startTime)
    const end = new Date(endTime)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, nights)
  }

  const renderNightsIndicator = (startTime: Date | null, endTime: Date | null) => {
    const nights = calculateNights(startTime, endTime)
    if (!nights) return null
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[8px] text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded"
        title={`${nights} night${nights > 1 ? "s" : ""}`}
      >
        <Moon className="h-2.5 w-2.5" />
        {nights}
      </span>
    )
  }

  const getTypeIcon = () => {
    switch (selectedReservation.itemType) {
      case "flight":
        return <Plane className="h-12 w-12 text-muted-foreground" />
      case "hotel":
        return <Hotel className="h-12 w-12 text-muted-foreground" />
      case "dining":
        return <Utensils className="h-12 w-12 text-muted-foreground" />
      case "train":
        return <Train className="h-12 w-12 text-muted-foreground" />
      case "activity":
        return <Camera className="h-12 w-12 text-muted-foreground" />
      default:
        return <Camera className="h-12 w-12 text-muted-foreground" />
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Image */}
        <div className="relative shrink-0">
          {(editedReservation?.imageUrl || selectedReservation.reservation.imageUrl) ? (
            <img
              src={editedReservation?.imageUrl || selectedReservation.reservation.imageUrl || "/placeholder.svg"}
              alt={editedReservation?.name || selectedReservation.reservation.name}
              className="w-full h-40 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
              {getTypeIcon()}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          {/* Save indicator moved to bottom-right */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isEditingReservation && editedReservation ? (
            // Edit Mode - Click to Edit
            <div className="space-y-1">
              {/* Status Badge in Edit Mode */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground">Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(
                    selectedReservation.reservation.reservationStatus.name,
                    editedReservation.confirmationNumber,
                  )}
                  {renderNightsIndicator(editedReservation.startTime, editedReservation.endTime)}
                </div>
              </div>
              
              {/* Vendor - simplified */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vendor / Name</label>
                <Input
                  value={editedReservation.vendor || editedReservation.name}
                  onChange={(e) => updateField('vendor', e.target.value)}
                  className="mt-1"
                  placeholder="Enter vendor or business name..."
                />
              </div>

              <ClickToEditField
                label="Description"
                value={editedReservation.notes || ""}
                onChange={(value) => updateField('notes', value)}
                placeholder="Add description..."
              />

              {/* Date and Time Pickers */}
              <div className="border-t pt-3 mt-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Date & Time</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                    <Input
                      type="date"
                      value={formatDateForInput(editedReservation.startTime)}
                      onChange={(e) => {
                        const time = formatTimeForInput(editedReservation.startTime) || "12:00"
                        updateField('startTime', combineDateAndTime(e.target.value, time))
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                    <Input
                      type="time"
                      value={formatTimeForInput(editedReservation.startTime)}
                      onChange={(e) => {
                        const date = formatDateForInput(editedReservation.startTime) || new Date().toISOString().split('T')[0]
                        updateField('startTime', combineDateAndTime(date, e.target.value))
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">End Date</label>
                    <Input
                      type="date"
                      value={formatDateForInput(editedReservation.endTime)}
                      onChange={(e) => {
                        const time = formatTimeForInput(editedReservation.endTime) || "12:00"
                        updateField('endTime', combineDateAndTime(e.target.value, time))
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">End Time</label>
                    <Input
                      type="time"
                      value={formatTimeForInput(editedReservation.endTime)}
                      onChange={(e) => {
                        const date = formatDateForInput(editedReservation.endTime) || new Date().toISOString().split('T')[0]
                        updateField('endTime', combineDateAndTime(date, e.target.value))
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
                {localTimezone && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {localTimezone.timeZoneName}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Cost ($)</label>
                <Input
                  type="number"
                  value={editedReservation.cost || ""}
                  onChange={(e) =>
                    updateField('cost', Number.parseFloat(e.target.value) || null)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <Input
                  value={editedReservation.location || ""}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Enter address..."
                  className="mt-1"
                />
                {editedReservation.latitude && editedReservation.longitude && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {editedReservation.latitude.toFixed(6)}, {editedReservation.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input
                    value={editedReservation.contactPhone || ""}
                    onChange={(e) => setEditedReservation({ ...editedReservation, contactPhone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    value={editedReservation.contactEmail || ""}
                    onChange={(e) => setEditedReservation({ ...editedReservation, contactEmail: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                <Input
                  value={editedReservation.website || ""}
                  onChange={(e) => setEditedReservation({ ...editedReservation, website: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Confirmation Number</label>
                <Input
                  value={editedReservation.confirmationNumber || ""}
                  onChange={(e) =>
                    setEditedReservation({ ...editedReservation, confirmationNumber: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <textarea
                  value={editedReservation.notes || ""}
                  onChange={(e) => setEditedReservation({ ...editedReservation, notes: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md text-sm min-h-[80px] bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Cancellation Policy</label>
                <textarea
                  value={editedReservation.cancellationPolicy || ""}
                  onChange={(e) =>
                    setEditedReservation({ ...editedReservation, cancellationPolicy: e.target.value })
                  }
                  className="mt-1 w-full p-2 border rounded-md text-sm min-h-[60px] bg-background"
                />
              </div>

              {/* Map at bottom of edit mode */}
              {editedReservation.latitude && 
               editedReservation.longitude && 
               isMapsLoaded && (
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">Location Map</h4>
                  <div className="h-[200px] w-full rounded-lg overflow-hidden border">
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={{ 
                        lat: editedReservation.latitude, 
                        lng: editedReservation.longitude 
                      }}
                      zoom={15}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      <Marker 
                        position={{ 
                          lat: editedReservation.latitude, 
                          lng: editedReservation.longitude 
                        }}
                        title={editedReservation.vendor || editedReservation.name}
                      />
                    </GoogleMap>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // View Mode
            <>
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedReservation.reservation.vendor || selectedReservation.reservation.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedReservation.reservation.notes || selectedReservation.itemTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(
                      selectedReservation.reservation.reservationStatus.name,
                      selectedReservation.reservation.confirmationNumber,
                    )}
                    {renderNightsIndicator(selectedReservation.reservation.startTime, selectedReservation.reservation.endTime)}
                  </div>
                </div>
              </div>

              {selectedReservation.reservation.cost && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    ${selectedReservation.reservation.cost}
                  </span>
                </div>
              )}

              {/* Date & Time */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedReservation.dayDate}</p>
                    {formatHotelDates(selectedReservation.reservation) && (
                      <p className="text-xs text-muted-foreground">
                        Stay: {formatHotelDates(selectedReservation.reservation)}
                      </p>
                    )}
                  </div>
                </div>
                {selectedReservation.reservation.startTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span>{displayTime}</span>
                      {localTimezone && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                          {localTimezone.timeZoneName}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Address */}
              {selectedReservation.reservation.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">{selectedReservation.reservation.location}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(selectedReservation.reservation.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Open in Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Embedded Map */}
              {selectedReservation.reservation.latitude && 
               selectedReservation.reservation.longitude && 
               isMapsLoaded && (
                <div className="h-[200px] w-full rounded-lg overflow-hidden border">
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={{ 
                      lat: selectedReservation.reservation.latitude, 
                      lng: selectedReservation.reservation.longitude 
                    }}
                    zoom={15}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    <Marker 
                      position={{ 
                        lat: selectedReservation.reservation.latitude, 
                        lng: selectedReservation.reservation.longitude 
                      }}
                      title={selectedReservation.reservation.vendor || selectedReservation.reservation.name}
                    />
                  </GoogleMap>
                </div>
              )}

              {/* Contact Options */}
              {(selectedReservation.reservation.contactPhone ||
                selectedReservation.reservation.contactEmail ||
                selectedReservation.reservation.website) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">Contact</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReservation.reservation.contactPhone && (
                      <>
                        <Button variant="outline" size="sm" className="text-xs bg-transparent" title="Call">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                          title="Send text message"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Text
                        </Button>
                      </>
                    )}
                    {selectedReservation.reservation.contactEmail && (
                      <Button variant="outline" size="sm" className="text-xs bg-transparent" title="Send email">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    )}
                    {selectedReservation.reservation.website && (
                      <Button variant="outline" size="sm" className="text-xs bg-transparent" title="Visit website">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedReservation.reservation.notes && (
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">Notes</h3>
                  <p className="text-sm bg-muted p-2 rounded">{selectedReservation.reservation.notes}</p>
                </div>
              )}

              {/* Cancellation Policy */}
              {selectedReservation.reservation.cancellationPolicy && (
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">Cancellation Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.reservation.cancellationPolicy}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Footer Actions */}
        <div className="border-t p-3 flex justify-between shrink-0">
          {isEditingReservation ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                {selectedReservation.reservation.status !== "confirmed" && onConfirm && (
                  <Button
                    variant="outline"
                    size="sm"
                    title="Confirm this reservation"
                    onClick={() => onConfirm(selectedReservation.reservation.id)}
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Confirm
                  </Button>
                )}
                {selectedReservation.reservation.location && (
                  <Button
                    variant="outline"
                    size="sm"
                    title="Get directions"
                    onClick={() => {
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(selectedReservation.reservation.location!)}`,
                        "_blank"
                      )
                    }}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" title="Edit reservation" onClick={handleStartEdit}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    title="Delete reservation"
                    onClick={() => onDelete(selectedReservation.reservation.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Save Indicator - Bottom Right (only in edit mode) */}
      {isEditingReservation && (
        <SaveIndicator state={saveState} position="floating-bottom" />
      )}

      {/* Loading Overlay */}
      {isResolving && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              Looking up details for {selectedReservation.reservation.vendor || selectedReservation.reservation.name}...
            </p>
          </div>
        </div>
      )}

      {/* Resolution Confirmation Dialog */}
      {resolvedData && (
        <ResolutionConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          currentReservation={selectedReservation.reservation}
          resolvedData={resolvedData}
          onAccept={handleAcceptResolution}
          onKeepOriginal={handleKeepOriginalResolution}
        />
      )}
    </div>
  )
}
