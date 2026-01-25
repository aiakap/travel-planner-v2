"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Star,
  Loader2,
  Plus,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PlaceSuggestion, GooglePlaceData } from "@/lib/types/place-suggestion";
import { suggestScheduling, getTripDays, getSegmentDuration } from "@/lib/smart-scheduling";
import { getDefaultTimeForType } from "@/lib/scheduling-utils";
import { checkTimeConflict, getAlternativeTimeSlots } from "@/lib/actions/check-conflicts";
import { ConflictIndicator } from "@/components/conflict-indicator";
import { AlternativeTimeSlots } from "@/components/alternative-time-slots";
import { StatusIconIndicator } from "@/components/status-icon-indicator";

interface SuggestionDetailModalProps {
  suggestion: PlaceSuggestion;
  tripId: string;
  onClose: () => void;
  onAddToItinerary: (data: {
    placeName: string;
    placeData: GooglePlaceData | null;
    day: number;
    startTime: string;
    endTime: string;
    cost: number;
    category: string;
    type: string;
    status?: "suggested" | "planned" | "confirmed";
  }) => Promise<void>;
}

export function SuggestionDetailModal({
  suggestion,
  tripId,
  onClose,
  onAddToItinerary,
}: SuggestionDetailModalProps) {
  const [placeData, setPlaceData] = useState<GooglePlaceData | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Scheduling state
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("12:00");
  const [cost, setCost] = useState<number>(0);
  const [schedulingReason, setSchedulingReason] = useState<string>("");
  const [status, setStatus] = useState<"suggested" | "planned" | "confirmed">("suggested");
  
  // Auto-expand end time for hotels (Stay category) and Travel
  const shouldShowEndTimeByDefault = suggestion.category === "Stay" || suggestion.category === "Travel";
  const [showEndTime, setShowEndTime] = useState<boolean>(shouldShowEndTimeByDefault);
  
  const [segmentInfo, setSegmentInfo] = useState<{
    startDate: string;
    endDate: string;
    segmentTitle: string;
  } | null>(null);

  // Trip days for selection
  const [tripDays, setTripDays] = useState<
    Array<{ day: number; date: string; dayOfWeek: string }>
  >([]);

  // Conflict detection state
  const [hasConflict, setHasConflict] = useState<boolean>(false);
  const [conflictingReservations, setConflictingReservations] = useState<Array<{
    id: string;
    name: string;
    startTime: Date;
    endTime: Date | null;
    category: string;
  }>>([]);
  const [travelTimeIssues, setTravelTimeIssues] = useState<Array<{
    from: string;
    to: string;
    requiredTime: number;
    availableTime: number;
    shortfall: number;
    travelTimeText: string;
  }>>([]);
  const [alternativeSlots, setAlternativeSlots] = useState<Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>>([]);

  // Fetch place data from Google Places API
  useEffect(() => {
    async function fetchPlaceData() {
      console.log("🌍 [SuggestionDetailModal] Starting Google Places fetch:", {
        placeName: suggestion.placeName,
        tripId,
      });
      
      setIsLoadingPlace(true);
      try {
        const response = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placeName: suggestion.placeName,
            tripId,
          }),
        });

        console.log("🌍 [SuggestionDetailModal] Google Places API response:", {
          status: response.status,
          ok: response.ok,
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ [SuggestionDetailModal] Google Places data received:", {
            hasData: !!data.placeData,
            placeId: data.placeData?.placeId,
            name: data.placeData?.name,
            rating: data.placeData?.rating,
            photosCount: data.placeData?.photos?.length || 0,
          });
          
          setPlaceData(data.placeData);

          // Estimate cost based on price level
          if (data.placeData.priceLevel) {
            const estimatedCosts = [0, 15, 35, 75, 150];
            setCost(estimatedCosts[data.placeData.priceLevel] || 0);
          }
        } else {
          const errorData = await response.json();
          console.error("❌ [SuggestionDetailModal] Failed to fetch place data:", errorData);
        }
      } catch (error) {
        console.error("❌ [SuggestionDetailModal] Error fetching place data:", error);
      } finally {
        setIsLoadingPlace(false);
        console.log("🌍 [SuggestionDetailModal] Fetch complete");
      }
    }

    fetchPlaceData();
  }, [suggestion.placeName, tripId]);

  // Get smart scheduling suggestion
  useEffect(() => {
    async function getScheduling() {
      try {
        const scheduling = await suggestScheduling(suggestion, tripId);
        setSelectedDay(scheduling.day);
        setStartTime(scheduling.startTime);
        setEndTime(scheduling.endTime);
        setSchedulingReason(scheduling.reason);

        const days = await getTripDays(tripId);
        setTripDays(days);

        // For hotels (Stay category), get segment duration
        if (suggestion.category === "Stay" && suggestion.segmentId) {
          const segInfo = await getSegmentDuration(tripId, suggestion.segmentId);
          if (segInfo) {
            setSegmentInfo(segInfo);
            // Set dates to span the entire segment
            setStartTime("15:00"); // Standard check-in time
            setEndTime("11:00"); // Standard check-out time
            setSchedulingReason(
              `Hotel stay for entire ${segInfo.segmentTitle} segment (${segInfo.startDate} to ${segInfo.endDate})`
            );
          }
        }
      } catch (error) {
        console.error("Error getting scheduling:", error);
      }
    }

    getScheduling();
  }, [suggestion, tripId]);

  // Check for conflicts whenever time changes
  useEffect(() => {
    async function checkConflicts() {
      if (!selectedDay || !startTime || !endTime) return;

      try {
        // Pass location data if available for travel time checking
        const conflict = await checkTimeConflict(
          tripId, 
          selectedDay, 
          startTime, 
          endTime,
          placeData?.geometry?.location.lat,
          placeData?.geometry?.location.lng,
          "WALK" // Default to walking for activity-to-activity travel
        );
        setHasConflict(conflict.hasConflict);
        setConflictingReservations(conflict.conflictingReservations);
        setTravelTimeIssues(conflict.travelTimeIssues || []);

        // If there's a conflict, get alternative time slots
        if (conflict.hasConflict) {
          const duration = calculateDuration(startTime, endTime);
          const alternatives = await getAlternativeTimeSlots(
            tripId,
            selectedDay,
            duration,
            startTime
          );
          setAlternativeSlots(alternatives);
        } else {
          setAlternativeSlots([]);
        }
      } catch (error) {
        console.error("Error checking conflicts:", error);
      }
    }

    checkConflicts();
  }, [selectedDay, startTime, endTime, tripId, placeData]);

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

  // Handle selecting an alternative time slot
  const handleSelectAlternative = (newStartTime: string, newEndTime: string) => {
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  };

  const handleAddToItinerary = async () => {
    setIsAdding(true);
    try {
      await onAddToItinerary({
        placeName: suggestion.placeName,
        placeData,
        day: selectedDay,
        startTime,
        endTime,
        cost,
        category: suggestion.category,
        type: suggestion.type,
        status, // Include status in the data sent
      });
      onClose();
    } catch (error) {
      console.error("Error adding to itinerary:", error);
      alert(`Failed to add to itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const getCategoryBadge = () => {
    const colors = {
      Travel: "bg-blue-100 text-blue-700",
      Stay: "bg-purple-100 text-purple-700",
      Activity: "bg-green-100 text-green-700",
      Dining: "bg-orange-100 text-orange-700",
    };

    return (
      <Badge className={`${colors[suggestion.category]} text-xs px-2 py-0.5`}>
        {suggestion.category}
      </Badge>
    );
  };

  const renderRating = () => {
    if (!placeData?.rating) return null;

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{placeData.rating.toFixed(1)}</span>
        {placeData.userRatingsTotal && (
          <span className="text-xs text-muted-foreground">
            ({placeData.userRatingsTotal})
          </span>
        )}
      </div>
    );
  };

  const getImageUrl = () => {
    if (placeData?.photos && placeData.photos.length > 0) {
      return placeData.photos[0].url;
    }
    return "/placeholder.svg";
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Image */}
        <div className="relative shrink-0">
          {isLoadingPlace ? (
            <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <img
              src={getImageUrl()}
              alt={suggestion.placeName}
              className="w-full h-40 object-cover rounded-t-lg"
            />
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
          <div className="absolute top-2 left-2">
            {getCategoryBadge()}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Header Info */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{suggestion.placeName}</h2>
                  <StatusIconIndicator
                    status={status}
                    onStatusChange={setStatus}
                    size="sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{suggestion.type}</p>
              </div>
              {renderRating()}
            </div>
          </div>

          {/* Address */}
          {placeData?.formattedAddress && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{placeData.formattedAddress}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    placeData.formattedAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  Open in Maps <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {placeData?.openingHours?.weekdayText && (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Hours
              </h3>
              <div className="text-sm space-y-0.5">
                {placeData.openingHours.weekdayText.slice(0, 3).map((day, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    {day}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Contact Options */}
          {(placeData?.phoneNumber || placeData?.website) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Contact
              </h3>
              <div className="flex flex-wrap gap-2">
                {placeData.phoneNumber && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => window.open(`tel:${placeData.phoneNumber}`)}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                )}
                {placeData.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => window.open(placeData.website, "_blank")}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Website
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* AI Notes */}
          {suggestion.context?.notes && (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Recommendation
              </h3>
              <p className="text-sm bg-muted p-2 rounded">
                {suggestion.context.notes}
              </p>
            </div>
          )}

          {/* Scheduling Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold">Add to Itinerary</h3>
            </div>

            {/* Scheduling Reason - Prominent */}
            {schedulingReason && (
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-blue-900">Smart Scheduling</div>
                  <div className="text-xs text-blue-700">{schedulingReason}</div>
                </div>
              </div>
            )}

            {/* Day Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {tripDays.map((day) => (
                  <option key={day.day} value={day.day}>
                    Day {day.day} - {day.dayOfWeek}, {day.date}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <label className="text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      End Time
                    </label>
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
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            {/* Cost */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                <DollarSign className="h-3 w-3 inline mr-1" />
                Estimated Cost
              </label>
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>

            {/* Conflict Detection */}
            <ConflictIndicator
              hasConflict={hasConflict}
              conflictingReservations={conflictingReservations}
              travelTimeIssues={travelTimeIssues}
            />

            {/* Alternative Time Slots */}
            {hasConflict && alternativeSlots.length > 0 && (
              <AlternativeTimeSlots
                alternatives={alternativeSlots}
                onSelect={handleSelectAlternative}
                selectedStartTime={startTime}
              />
            )}
          </div>
        </div>

        {/* Fixed Footer Actions */}
        <div className="border-t bg-background p-4 flex justify-between items-center shrink-0 rounded-b-lg">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToItinerary}
            disabled={isAdding}
            className="bg-primary hover:bg-primary/90 min-w-[160px]"
            size="default"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Itinerary
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
