"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { ClickToEditField } from "@/app/exp/ui/click-to-edit-field";
import { SaveIndicator } from "@/app/exp/ui/save-indicator";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
  Hotel,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Users,
  BedDouble,
  Moon,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  createHotelReservation,
  updateHotelReservation,
  deleteHotelReservation,
} from "@/lib/actions/hotel-reservation-actions";

interface HotelReservationCardProps {
  reservationId?: string;
  hotelName: string;
  confirmationNumber?: string;
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  nights?: number;
  guests?: number;
  rooms?: number;
  roomType?: string;
  address?: string;
  totalCost?: number;
  currency?: string;
  contactPhone?: string;
  contactEmail?: string;
  cancellationPolicy?: string;
  imageUrl?: string;
  url?: string;
  tripId?: string;
  segmentId?: string;
  onDeleted?: () => void;
  onSaved?: () => void;
}

export function HotelReservationCard({
  reservationId: initialReservationId,
  hotelName: initialHotelName,
  confirmationNumber: initialConfirmationNumber,
  checkInDate: initialCheckInDate,
  checkInTime: initialCheckInTime,
  checkOutDate: initialCheckOutDate,
  checkOutTime: initialCheckOutTime,
  nights: initialNights,
  guests: initialGuests,
  rooms: initialRooms,
  roomType: initialRoomType,
  address: initialAddress,
  totalCost: initialTotalCost,
  currency: initialCurrency = "USD",
  contactPhone: initialContactPhone,
  contactEmail: initialContactEmail,
  cancellationPolicy: initialCancellationPolicy,
  imageUrl,
  url,
  tripId,
  segmentId,
  onDeleted,
  onSaved,
}: HotelReservationCardProps) {
  const [reservationId, setReservationId] = useState(initialReservationId);
  const [hotelName, setHotelName] = useState(initialHotelName);
  const [confirmationNumber, setConfirmationNumber] = useState(initialConfirmationNumber || "");
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkInTime, setCheckInTime] = useState(initialCheckInTime || "");
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [checkOutTime, setCheckOutTime] = useState(initialCheckOutTime || "");
  const [nights, setNights] = useState(initialNights);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);
  const [roomType, setRoomType] = useState(initialRoomType || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [totalCost, setTotalCost] = useState(initialTotalCost);
  const [currency, setCurrency] = useState(initialCurrency);
  const [contactPhone, setContactPhone] = useState(initialContactPhone || "");
  const [contactEmail, setContactEmail] = useState(initialContactEmail || "");
  const [cancellationPolicy, setCancellationPolicy] = useState(initialCancellationPolicy || "");
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save hook
  const { save, saveState } = useAutoSave(
    async (updates: any) => {
      if (reservationId) {
        // Update existing reservation
        await updateHotelReservation(reservationId, updates);
        onSaved?.();
      } else {
        // Create new reservation on first save
        setIsSaving(true);
        try {
          const result = await createHotelReservation(
            {
              hotelName,
              confirmationNumber: confirmationNumber || undefined,
              checkInDate,
              checkInTime: checkInTime || undefined,
              checkOutDate,
              checkOutTime: checkOutTime || undefined,
              nights,
              guests,
              rooms,
              roomType: roomType || undefined,
              address: address || undefined,
              totalCost,
              currency,
              contactPhone: contactPhone || undefined,
              contactEmail: contactEmail || undefined,
              cancellationPolicy: cancellationPolicy || undefined,
              imageUrl,
              url,
            },
            tripId,
            segmentId
          );
          setReservationId(result.reservationId);
          onSaved?.();
        } finally {
          setIsSaving(false);
        }
      }
    },
    { delay: 500 }
  );

  // Auto-save on mount if no reservationId (new card from AI)
  useEffect(() => {
    if (!reservationId && tripId && !isSaving) {
      console.log("🏨 [HotelReservationCard] Auto-saving new reservation on mount");
      setIsSaving(true);
      createHotelReservation(
        {
          hotelName,
          confirmationNumber: confirmationNumber || undefined,
          checkInDate,
          checkInTime: checkInTime || undefined,
          checkOutDate,
          checkOutTime: checkOutTime || undefined,
          nights,
          guests,
          rooms,
          roomType: roomType || undefined,
          address: address || undefined,
          totalCost,
          currency,
          contactPhone: contactPhone || undefined,
          contactEmail: contactEmail || undefined,
          cancellationPolicy: cancellationPolicy || undefined,
          imageUrl,
          url,
        },
        tripId,
        segmentId
      )
        .then((result) => {
          console.log("✅ [HotelReservationCard] Reservation created:", result.reservationId);
          setReservationId(result.reservationId);
          onSaved?.();
        })
        .catch((error) => {
          console.error("❌ [HotelReservationCard] Error creating reservation:", error);
          alert(`Failed to save hotel reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  }, []); // Empty deps - only run once on mount

  const handleDelete = async () => {
    if (!reservationId) {
      onDeleted?.();
      return;
    }

    if (!confirm("Are you sure you want to delete this hotel reservation?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHotelReservation(reservationId);
      onDeleted?.();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      alert("Failed to delete reservation");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFieldUpdate = (field: string, value: any) => {
    save({ [field]: value });
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header with image/icon */}
      <div className="relative h-32 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={hotelName} className="w-full h-full object-cover" />
        ) : (
          <Hotel className="h-16 w-16 text-purple-600" />
        )}
        {reservationId && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-100 text-green-700 text-xs">Saved</Badge>
          </div>
        )}
        {!reservationId && isSaving && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-100 text-blue-700 text-xs">Saving...</Badge>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="p-4 space-y-3">
        {/* Hotel name and confirmation */}
        <div>
          <ClickToEditField
            label="Hotel Name"
            value={hotelName}
            onChange={(value) => {
              setHotelName(value);
              handleFieldUpdate("hotelName", value);
            }}
            className="font-bold text-lg"
          />
          {confirmationNumber && (
            <ClickToEditField
              label="Confirmation Number"
              value={confirmationNumber}
              onChange={(value) => {
                setConfirmationNumber(value);
                handleFieldUpdate("confirmationNumber", value);
              }}
              className="text-sm text-slate-600"
            />
          )}
        </div>

        {/* Check-in / Check-out */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>Check-in</span>
            </div>
            <ClickToEditField
              label=""
              value={checkInDate}
              onChange={(value) => {
                setCheckInDate(value);
                handleFieldUpdate("checkInDate", value);
              }}
              className="text-sm font-medium"
            />
            {checkInTime && (
              <ClickToEditField
                label=""
                value={checkInTime}
                onChange={(value) => {
                  setCheckInTime(value);
                  handleFieldUpdate("checkInTime", value);
                }}
                className="text-xs text-slate-600"
              />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>Check-out</span>
            </div>
            <ClickToEditField
              label=""
              value={checkOutDate}
              onChange={(value) => {
                setCheckOutDate(value);
                handleFieldUpdate("checkOutDate", value);
              }}
              className="text-sm font-medium"
            />
            {checkOutTime && (
              <ClickToEditField
                label=""
                value={checkOutTime}
                onChange={(value) => {
                  setCheckOutTime(value);
                  handleFieldUpdate("checkOutTime", value);
                }}
                className="text-xs text-slate-600"
              />
            )}
          </div>
        </div>

        {/* Stay details */}
        <div className="flex items-center gap-3 text-sm text-slate-600">
          {nights && (
            <div className="flex items-center gap-1">
              <Moon className="h-3 w-3" />
              <span>{nights} night{nights > 1 ? 's' : ''}</span>
            </div>
          )}
          {guests && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{guests} guest{guests > 1 ? 's' : ''}</span>
            </div>
          )}
          {rooms && (
            <div className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              <span>{rooms} room{rooms > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Room type */}
        {roomType && (
          <ClickToEditField
            label="Room Type"
            value={roomType}
            onChange={(value) => {
              setRoomType(value);
              handleFieldUpdate("roomType", value);
            }}
            className="text-sm"
          />
        )}

        {/* Address */}
        {address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <ClickToEditField
              label=""
              value={address}
              onChange={(value) => {
                setAddress(value);
                handleFieldUpdate("address", value);
              }}
              type="textarea"
              className="text-sm text-slate-700 flex-1"
            />
          </div>
        )}

        {/* Total cost */}
        {totalCost !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Total:</span>
            <ClickToEditField
              label=""
              value={totalCost?.toString() || "0"}
              onChange={(value) => {
                const cost = parseFloat(value);
                setTotalCost(cost);
                handleFieldUpdate("totalCost", cost);
              }}
              className="font-bold"
            />
            <span className="text-sm text-slate-600">{currency}</span>
          </div>
        )}

        {/* Expandable section for contact & policies */}
        {(contactPhone || contactEmail || cancellationPolicy) && (
          <div className="border-t pt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-sm text-slate-600 hover:text-slate-900"
            >
              <span className="font-medium">Contact & Policies</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <ClickToEditField
                      label=""
                      value={contactPhone}
                      onChange={(value) => {
                        setContactPhone(value);
                        handleFieldUpdate("contactPhone", value);
                      }}
                      className="text-sm"
                    />
                  </div>
                )}
                {contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <ClickToEditField
                      label=""
                      value={contactEmail}
                      onChange={(value) => {
                        setContactEmail(value);
                        handleFieldUpdate("contactEmail", value);
                      }}
                      className="text-sm"
                    />
                  </div>
                )}
                {cancellationPolicy && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      Cancellation Policy
                    </div>
                    <ClickToEditField
                      label=""
                      value={cancellationPolicy}
                      onChange={(value) => {
                        setCancellationPolicy(value);
                        handleFieldUpdate("cancellationPolicy", value);
                      }}
                      type="textarea"
                      className="text-xs text-slate-600"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="border-t px-4 py-3 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url, "_blank")}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Booking
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SaveIndicator state={saveState} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Status message */}
      {!reservationId && !isSaving && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
          This reservation will be saved to your trip when you make any edits.
        </div>
      )}
    </div>
  );
}
