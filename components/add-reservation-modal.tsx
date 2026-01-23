"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSegment,
  GooglePlaceData,
  AmadeusTransportData,
  AmadeusHotelData,
} from "@/lib/types/amadeus-pipeline";
import { Loader2, AlertCircle, Plane, Hotel as HotelIcon, ChevronDown, ChevronUp } from "lucide-react";
import { StatusIconIndicator } from "@/components/status-icon-indicator";
import { getDefaultTimeForType } from "@/lib/scheduling-utils";

interface AddReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: MessageSegment;
  tripId?: string;
  onSuccess?: () => void;
}

/**
 * Unified modal for adding places, flights, and hotels to itinerary
 * Pre-populates costs and dates from Amadeus data when available
 */
export function AddReservationModal({
  isOpen,
  onClose,
  segment,
  tripId,
  onSuccess,
}: AddReservationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"suggested" | "planned" | "confirmed">("suggested");
  
  // Extract data from segment
  const { type, suggestion, placeData, transportData, hotelData } = segment;
  
  // Auto-expand end time for hotels and flights
  const [showEndTime, setShowEndTime] = useState(type === "hotel" || type === "transport");
  const displayName = segment.display || "Unknown";

  // Helper to get dates from context
  const getDefaultDates = () => {
    if (type === "transport" && 'departureDate' in (suggestion || {})) {
      const transport = suggestion as any;
      return {
        start: transport.departureDate || getTomorrowDate(),
        end: transport.returnDate || transport.departureDate || getTomorrowDate(),
      };
    }
    if (type === "hotel" && 'checkInDate' in (suggestion || {})) {
      const hotel = suggestion as any;
      return {
        start: hotel.checkInDate || getTomorrowDate(),
        end: hotel.checkOutDate || get3DaysLaterDate(),
      };
    }
    if (suggestion && 'context' in suggestion) {
      const ctx = (suggestion as any).context || {};
      return {
        start: ctx.departureDate || ctx.checkInDate || getTomorrowDate(),
        end: ctx.returnDate || ctx.checkOutDate || get3DaysLaterDate(),
      };
    }
    return {
      start: getTomorrowDate(),
      end: get3DaysLaterDate(),
    };
  };

  // Helper to get cost from Amadeus data
  const getDefaultCost = (): number => {
    if (transportData?.price?.total) {
      return parseFloat(transportData.price.total);
    }
    if (hotelData?.price?.total) {
      return parseFloat(hotelData.price.total);
    }
    return 0;
  };

  const defaultDates = getDefaultDates();

  // Form state - pre-populated from Amadeus data
  const [vendor, setVendor] = useState(
    placeData?.name || hotelData?.name || displayName
  );
  const [cost, setCost] = useState(getDefaultCost());
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState(
    type === "transport" ? "Transportation" : 
    type === "hotel" ? "Lodging" : 
    type === "place" && 'category' in (suggestion || {}) ? (suggestion as any).category : "Activity"
  );

  // Calculate duration in hours
  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return (endMinutes - startMinutes) / 60;
  };

  // Format duration for display
  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours === 1) {
      return "1 hour";
    } else if (hours % 1 === 0) {
      return `${hours} hours`;
    } else {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return `${wholeHours}h ${minutes}m`;
    }
  };

  const handleSubmit = async () => {
    if (!tripId) {
      setError("No trip selected. Please select a trip from the dropdown above.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create reservation via API
      const response = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          vendor,
          cost,
          startDate,
          endDate,
          startTime,
          endTime,
          notes,
          category,
          // Include Amadeus reference data
          amadeusReference: transportData || hotelData ? {
            type: type,
            id: transportData?.id || hotelData?.hotelId,
            priceReference: transportData?.price || hotelData?.price,
          } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create reservation");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to itinerary");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Add to Itinerary</DialogTitle>
            <StatusIconIndicator
              status={status}
              onStatusChange={setStatus}
              size="sm"
            />
          </div>
          {type === "transport" && (
            <DialogDescription className="flex items-start gap-2 text-blue-900 bg-blue-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">
                <strong>For planning only.</strong> You'll need to book this flight separately.
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Pre-populated flight/hotel details */}
          {type === "transport" && transportData && transportData.itineraries && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-indigo-900">
                <Plane className="h-4 w-4" />
                Flight Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-indigo-900">
                <div>
                  <div className="text-muted-foreground">Carrier</div>
                  <div className="font-medium">{transportData.validatingAirlineCodes?.[0] || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">{transportData.itineraries[0].duration}</div>
                </div>
              </div>
            </div>
          )}

          {/* Vendor/Name */}
          <div>
            <Label htmlFor="vendor">Name</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Vendor or place name"
            />
          </div>

          {/* Cost - Pre-populated from Amadeus */}
          <div>
            <Label htmlFor="cost">Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="pl-7"
                step="0.01"
              />
            </div>
            {(transportData?.price || hotelData?.price) && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Auto-filled from live {type === "transport" ? "flight" : "hotel"} pricing
              </p>
            )}
          </div>

          {/* Dates - Pre-populated */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Times */}
          <div className="space-y-2">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              {!showEndTime && (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Duration: {formatDuration(calculateDuration(startTime, endTime))}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEndTime(true)}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    Customize end time
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
            
            {showEndTime && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="endTime">End Time</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEndTime(false)}
                    className="h-auto py-0 px-1 text-xs"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lodging">Lodging</SelectItem>
                <SelectItem value="Dining">Dining</SelectItem>
                <SelectItem value="Activity">Activity</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add to Itinerary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function getTomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

function get3DaysLaterDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
}
