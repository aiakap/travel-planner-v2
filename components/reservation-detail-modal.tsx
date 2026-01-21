"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"

type ReservationStatus = "suggested" | "planned" | "confirmed"

interface Reservation {
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

interface SelectedReservation {
  reservation: Reservation
  itemTitle: string
  itemTime: string
  itemType: string
  dayDate: string
}

interface ReservationDetailModalProps {
  selectedReservation: SelectedReservation | null
  onClose: () => void
  onConfirm?: (reservationId: number) => void
  onDelete?: (reservationId: number) => void
  onSave?: (reservation: Reservation) => void
}

export function ReservationDetailModal({
  selectedReservation,
  onClose,
  onConfirm,
  onDelete,
  onSave,
}: ReservationDetailModalProps) {
  const [isEditingReservation, setIsEditingReservation] = useState(false)
  const [editedReservation, setEditedReservation] = useState<Reservation | null>(null)

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

  const getStatusBadge = (status: ReservationStatus, confirmationNumber?: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-700 text-[8px] px-1 py-0 font-bold">
            {confirmationNumber || "Confirmed"}
          </Badge>
        )
      case "planned":
        return <Badge className="bg-blue-100 text-blue-700 text-[8px] px-1 py-0">Planned</Badge>
      case "suggested":
        return <Badge className="bg-amber-100 text-amber-700 text-[8px] px-1 py-0">Suggestion</Badge>
    }
  }

  const formatTimeDisplay = (res: Reservation) => {
    if (res.startTime && res.endTime) {
      if (res.startTimezone && res.endTimezone && res.startTimezone !== res.endTimezone) {
        return `${res.startTime} ${res.startTimezone} - ${res.endTime} ${res.endTimezone}`
      }
      return `${res.startTime} - ${res.endTime}`
    }
    if (res.startTime && res.startTimezone && res.endTimezone && res.startTimezone !== res.endTimezone) {
      return `${res.startTime} ${res.startTimezone}`
    }
    return res.startTime || ""
  }

  const formatHotelDates = (res: Reservation) => {
    if (res.checkInDate && res.checkOutDate) {
      return `${res.checkInDate} - ${res.checkOutDate}`
    }
    return null
  }

  const renderNightsIndicator = (nights?: number) => {
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
          {selectedReservation.reservation.image ? (
            <img
              src={selectedReservation.reservation.image || "/placeholder.svg"}
              alt={selectedReservation.reservation.vendor}
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
          {isEditingReservation && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
              Editing
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isEditingReservation && editedReservation ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vendor Name</label>
                <Input
                  value={editedReservation.vendor}
                  onChange={(e) => setEditedReservation({ ...editedReservation, vendor: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input
                  value={editedReservation.text}
                  onChange={(e) => setEditedReservation({ ...editedReservation, text: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                  <Input
                    value={editedReservation.startTime || ""}
                    onChange={(e) => setEditedReservation({ ...editedReservation, startTime: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., 7:00 PM"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">End Time</label>
                  <Input
                    value={editedReservation.endTime || ""}
                    onChange={(e) => setEditedReservation({ ...editedReservation, endTime: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., 10:00 PM"
                  />
                </div>
              </div>

              {(editedReservation.type === "hotel" ||
                (editedReservation.nights !== undefined &&
                  editedReservation.nights !== null &&
                  editedReservation.nights > 0)) && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">Hotel Stay Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Check-in Date</label>
                        <Input
                          value={editedReservation.checkInDate || ""}
                          onChange={(e) =>
                            setEditedReservation({ ...editedReservation, checkInDate: e.target.value })
                          }
                          className="mt-1"
                          placeholder="e.g., Mar 16, 2025"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Check-in Time</label>
                        <Input
                          value={editedReservation.checkInTime || ""}
                          onChange={(e) =>
                            setEditedReservation({ ...editedReservation, checkInTime: e.target.value })
                          }
                          className="mt-1"
                          placeholder="e.g., 3:00 PM"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Check-out Date</label>
                        <Input
                          value={editedReservation.checkOutDate || ""}
                          onChange={(e) =>
                            setEditedReservation({ ...editedReservation, checkOutDate: e.target.value })
                          }
                          className="mt-1"
                          placeholder="e.g., Mar 21, 2025"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Check-out Time</label>
                        <Input
                          value={editedReservation.checkOutTime || ""}
                          onChange={(e) =>
                            setEditedReservation({ ...editedReservation, checkOutTime: e.target.value })
                          }
                          className="mt-1"
                          placeholder="e.g., 11:00 AM"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-muted-foreground">Number of Nights</label>
                      <Input
                        type="number"
                        value={
                          editedReservation.nights !== undefined && editedReservation.nights !== null
                            ? editedReservation.nights
                            : ""
                        }
                        onChange={(e) =>
                          setEditedReservation({
                            ...editedReservation,
                            nights: Number.parseInt(e.target.value) || undefined,
                          })
                        }
                        className="mt-1"
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Cost ($)</label>
                <Input
                  type="number"
                  value={editedReservation.cost}
                  onChange={(e) =>
                    setEditedReservation({ ...editedReservation, cost: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <Input
                  value={editedReservation.address || ""}
                  onChange={(e) => setEditedReservation({ ...editedReservation, address: e.target.value })}
                  className="mt-1"
                />
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
            </div>
          ) : (
            // View Mode
            <>
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedReservation.reservation.vendor}</h2>
                    <p className="text-sm text-muted-foreground">{selectedReservation.reservation.text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(
                      selectedReservation.reservation.status,
                      selectedReservation.reservation.confirmationNumber,
                    )}
                    {renderNightsIndicator(selectedReservation.reservation.nights)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`text-sm font-medium ${selectedReservation.reservation.status !== "confirmed" ? "text-amber-600" : ""}`}
                >
                  ${selectedReservation.reservation.cost}
                  {selectedReservation.reservation.status !== "confirmed" && " (estimated)"}
                </span>
              </div>

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
                    <span>{formatTimeDisplay(selectedReservation.reservation)}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              {selectedReservation.reservation.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">{selectedReservation.reservation.address}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(selectedReservation.reservation.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Open in Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
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
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="h-3 w-3 mr-1" />
                Save Changes
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
                {selectedReservation.reservation.address && (
                  <Button
                    variant="outline"
                    size="sm"
                    title="Get directions"
                    onClick={() => {
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(selectedReservation.reservation.address!)}`,
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
    </div>
  )
}
