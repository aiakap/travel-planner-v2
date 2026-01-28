"use client";

import { useState, useEffect } from "react";
import { X, Home, Plane, Map, Palmtree, Car, MapPin, Trash2, AlertCircle } from "lucide-react";
import { ClickToEditField } from "./ui/click-to-edit-field";
import { SaveIndicator } from "./ui/save-indicator";
import { LocationAutocompleteInput } from "./ui/location-autocomplete-input";
import { DatePopover } from "./ui/date-popover";
import { format, differenceInDays, parseISO } from "date-fns";
import { PlaceAutocompleteResult } from "@/lib/types/place-suggestion";
import { getTimeZoneForLocation } from "@/lib/actions/timezone";
import { useAutoSaveCallback } from "@/hooks/use-auto-save";
import { updatePersistedSegment } from "@/lib/actions/update-persisted-segment";
import { deleteSegment } from "@/lib/actions/delete-segment";
import { SegmentTimelineSummary } from "./segment-timeline-summary";
import Image from "next/image";

interface Segment {
  id: string;
  name: string;
  startTitle: string;
  startLat: number;
  startLng: number;
  endTitle: string;
  endLat: number;
  endLng: number;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  imageUrl: string | null;
  startTimeZoneId: string | null;
  startTimeZoneName: string | null;
  endTimeZoneId: string | null;
  endTimeZoneName: string | null;
  segmentType: {
    id: string;
    name: string;
  };
  reservations?: Array<{
    id: string;
    name: string;
    startTime: string | null;
    reservationType: {
      name: string;
      category: {
        name: string;
      };
    };
  }>;
}

interface Trip {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  segments: Array<{
    id: string;
    name: string;
    startTime: Date | null;
    endTime: Date | null;
    segmentType: { name: string };
  }>;
}

interface EditSegmentModalProps {
  segment: Segment;
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: () => void;
}

const segmentTypeIcons: Record<string, any> = {
  Travel: Plane,
  Stay: Home,
  Tour: Map,
  Retreat: Palmtree,
  "Road Trip": Car,
};

const segmentTypeLabels: Record<string, string> = {
  Travel: "Travel",
  Stay: "Stay",
  Tour: "Tour",
  Retreat: "Retreat",
  "Road Trip": "Road Trip",
};

const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end) return 1;
  const days = differenceInDays(end, start);
  return Math.max(1, days);
};

const formatDateRange = (start: Date | null, end: Date | null): string => {
  if (!start || !end) return "";
  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
};

export function EditSegmentModal({
  segment,
  trip,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: EditSegmentModalProps) {
  const [editName, setEditName] = useState(segment.name);
  const [editStartLocation, setEditStartLocation] = useState(segment.startTitle);
  const [editEndLocation, setEditEndLocation] = useState(segment.endTitle);
  const [editNotes, setEditNotes] = useState(segment.notes || "");
  const [editStartDate, setEditStartDate] = useState(
    segment.startTime ? segment.startTime.toISOString() : ""
  );
  const [editEndDate, setEditEndDate] = useState(
    segment.endTime ? segment.endTime.toISOString() : ""
  );
  const [editSegmentType, setEditSegmentType] = useState(segment.segmentType.name);
  const [useDifferentEndLocation, setUseDifferentEndLocation] = useState(
    segment.startTitle !== segment.endTitle
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Editing states for click-to-edit fields
  const [editingType, setEditingType] = useState(false);
  const [editingDates, setEditingDates] = useState(false);

  // Auto-save hook with debouncing
  const { save, saveState } = useAutoSaveCallback(
    async (updates: any) => {
      try {
        await updatePersistedSegment(segment.id, updates);
        onUpdate();
      } catch (error) {
        console.error("Failed to save segment:", error);
      }
    },
    { delay: 500 }
  );

  const days = calculateDays(
    editStartDate ? new Date(editStartDate) : null,
    editEndDate ? new Date(editEndDate) : null
  );

  // Track unsaved changes
  useEffect(() => {
    if (saveState === "saved") {
      setHasUnsavedChanges(false);
    }
  }, [saveState]);

  // Freeze page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    setEditName(segment.name);
    setEditStartLocation(segment.startTitle);
    setEditEndLocation(segment.endTitle);
    setEditNotes(segment.notes || "");
    setEditStartDate(segment.startTime ? segment.startTime.toISOString() : "");
    setEditEndDate(segment.endTime ? segment.endTime.toISOString() : "");
    setEditSegmentType(segment.segmentType.name);
    setUseDifferentEndLocation(segment.startTitle !== segment.endTitle);
    setHasUnsavedChanges(false);
  }, [segment]);

  if (!isOpen) return null;

  const handleNameChange = (newName: string) => {
    setEditName(newName);
    setHasUnsavedChanges(true);
    save({ name: newName });
  };

  const handleNotesChange = (newNotes: string) => {
    setEditNotes(newNotes);
    setHasUnsavedChanges(true);
    save({ notes: newNotes });
  };

  const handleTypeChange = (newType: string) => {
    setEditSegmentType(newType);
    setHasUnsavedChanges(true);
    save({ segmentType: newType });
    setEditingType(false);
  };

  const handleStartLocationChange = async (
    location: string,
    details?: PlaceAutocompleteResult
  ) => {
    setEditStartLocation(location);
    setHasUnsavedChanges(true);

    const updates: any = { startTitle: location };

    if (details?.location) {
      updates.startLat = details.location.lat;
      updates.startLng = details.location.lng;

      try {
        const timezone = await getTimeZoneForLocation(
          details.location.lat,
          details.location.lng
        );
        if (timezone) {
          updates.startTimeZoneId = timezone.timeZoneId;
          updates.startTimeZoneName = timezone.timeZoneName;
        }
      } catch (error) {
        console.error("Error fetching timezone:", error);
      }
    }

    if (!useDifferentEndLocation) {
      updates.endTitle = location;
      if (details?.location) {
        updates.endLat = details.location.lat;
        updates.endLng = details.location.lng;
        updates.endTimeZoneId = updates.startTimeZoneId;
        updates.endTimeZoneName = updates.startTimeZoneName;
      }
      setEditEndLocation(location);
    }

    // Save immediately without debounce for location changes
    try {
      await updatePersistedSegment(segment.id, updates);
      onUpdate();
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  };

  const handleEndLocationChange = async (
    location: string,
    details?: PlaceAutocompleteResult
  ) => {
    setEditEndLocation(location);
    setHasUnsavedChanges(true);

    const updates: any = { endTitle: location };

    if (details?.location) {
      updates.endLat = details.location.lat;
      updates.endLng = details.location.lng;

      try {
        const timezone = await getTimeZoneForLocation(
          details.location.lat,
          details.location.lng
        );
        if (timezone) {
          updates.endTimeZoneId = timezone.timeZoneId;
          updates.endTimeZoneName = timezone.timeZoneName;
        }
      } catch (error) {
        console.error("Error fetching timezone:", error);
      }
    }

    // Save immediately without debounce for location changes
    try {
      await updatePersistedSegment(segment.id, updates);
      onUpdate();
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  };

  const handleStartDateChange = (date: string) => {
    setEditStartDate(date);
    setHasUnsavedChanges(true);
    save({ startTime: date });
  };

  const handleEndDateChange = (date: string) => {
    setEditEndDate(date);
    setHasUnsavedChanges(true);
    save({ endTime: date });
  };

  const handleToggleDifferentEndLocation = (checked: boolean) => {
    setUseDifferentEndLocation(checked);
    setHasUnsavedChanges(true);

    if (!checked) {
      setEditEndLocation(editStartLocation);
      save({
        endTitle: editStartLocation,
        endLat: segment.startLat,
        endLng: segment.startLng,
        endTimeZoneId: segment.startTimeZoneId,
        endTimeZoneName: segment.startTimeZoneName,
      });
    }
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete "${segment.name}"? This will also delete all reservations in this segment.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteSegment(segment.id);
      onDelete();
      onClose();
    } catch (error) {
      console.error("Failed to delete segment:", error);
      alert("Failed to delete segment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const showTimezones =
    segment.startTimeZoneId &&
    segment.endTimeZoneId &&
    segment.startTimeZoneId !== segment.endTimeZoneId;

  const TypeIcon = segmentTypeIcons[editSegmentType] || Home;

  // Get segment index in trip
  const segmentIndex = trip.segments.findIndex((s) => s.id === segment.id);

  return (
    <>
      {/* Backdrop - No click to close */}
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] transition-opacity" />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full pointer-events-auto max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero Image Header - Compact */}
          <div className="relative h-32 flex-shrink-0 rounded-t-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
            {segment.imageUrl ? (
              <Image
                src={segment.imageUrl}
                alt={segment.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <TypeIcon className="h-16 w-16 text-white/30" />
              </div>
            )}
            
            {/* Gradient overlay - View1 style */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            
            {/* Title overlay - Compact */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-xl font-bold text-white mb-0.5">{segment.name}</h2>
              <div className="flex items-center gap-1.5 text-white/90 text-xs">
                <MapPin className="h-3 w-3" />
                <span>
                  {segment.startTitle === segment.endTitle
                    ? segment.startTitle
                    : `${segment.startTitle} → ${segment.endTitle}`}
                </span>
              </div>
            </div>

            {/* Close button - View1 style */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white/90"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Timeline Summary - Compact */}
          <div className="flex-shrink-0 border-b border-slate-200">
            <SegmentTimelineSummary
              trip={trip}
              currentSegmentId={segment.id}
              currentSegmentIndex={segmentIndex}
            />
          </div>

          {/* Content - Compact spacing */}
          <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
            {/* Name - Click to Edit */}
            <div className="px-2.5 py-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Name
              </label>
              <div
                onClick={() => {}}
                className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors group"
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none"
                  placeholder="Add a name..."
                />
              </div>
            </div>

            {/* Type - Click to Edit */}
            {editingType ? (
              <div className="px-2.5 py-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Type
                </label>
                <select
                  value={editSegmentType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  onBlur={() => setEditingType(false)}
                  className="w-full border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent text-sm"
                  autoFocus
                >
                  <option value="Travel">✈️ Travel</option>
                  <option value="Stay">🏠 Stay</option>
                  <option value="Tour">🗺️ Tour</option>
                  <option value="Retreat">🌴 Retreat</option>
                  <option value="Road Trip">🚗 Road Trip</option>
                </select>
              </div>
            ) : (
              <div
                onClick={() => setEditingType(true)}
                className="cursor-pointer hover:bg-blue-50 rounded px-2.5 py-1.5 transition-colors group"
              >
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Type
                </label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-sm text-slate-900">
                      {segmentTypeLabels[editSegmentType] || editSegmentType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    click to edit
                  </span>
                </div>
              </div>
            )}

            {/* Location(s) - Compact */}
            <div className="px-2.5 py-1.5 space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Location
              </label>
              
              <LocationAutocompleteInput
                label={`${useDifferentEndLocation ? "Start" : ""}${
                  showTimezones && segment.startTimeZoneName
                    ? ` (${segment.startTimeZoneName})`
                    : ""
                }`}
                value={editStartLocation}
                onChange={handleStartLocationChange}
                placeholder={
                  useDifferentEndLocation
                    ? "Where does this part start?"
                    : "Where is this part?"
                }
              />

              {useDifferentEndLocation && (
                <LocationAutocompleteInput
                  label={`End${
                    showTimezones && segment.endTimeZoneName
                      ? ` (${segment.endTimeZoneName})`
                      : ""
                  }`}
                  value={editEndLocation}
                  onChange={handleEndLocationChange}
                  placeholder="Where does this part end?"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDifferentEndLocation}
                  onChange={(e) =>
                    handleToggleDifferentEndLocation(e.target.checked)
                  }
                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600">
                  Different end location
                </span>
              </label>
            </div>

            {/* Dates - Compact */}
            {editingDates ? (
              <div className="px-2.5 py-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Dates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">
                      Start Date
                    </label>
                    <DatePopover
                      value={editStartDate}
                      onChange={handleStartDateChange}
                      label="Select start date"
                      className="w-full justify-start text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">
                      End Date
                    </label>
                    <DatePopover
                      value={editEndDate}
                      onChange={handleEndDateChange}
                      label="Select end date"
                      minDate={
                        editStartDate ? new Date(editStartDate) : undefined
                      }
                      className="w-full justify-start text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setEditingDates(false)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <div
                onClick={() => setEditingDates(true)}
                className="cursor-pointer hover:bg-blue-50 rounded px-2.5 py-1.5 transition-colors group"
              >
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Dates
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-900">
                    {editStartDate && editEndDate ? (
                      <>
                        {formatDateRange(
                          new Date(editStartDate),
                          new Date(editEndDate)
                        )}{" "}
                        ({days} day{days !== 1 ? "s" : ""})
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Add dates...</span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    click to edit
                  </span>
                </div>
              </div>
            )}

            {/* Notes - Compact */}
            <div className="px-2.5 py-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full text-sm text-slate-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 min-h-[60px] resize-none"
                placeholder="Add notes..."
              />
            </div>

            {/* Reservations - Compact cards */}
            {segment.reservations && segment.reservations.length > 0 && (
              <div className="px-2.5 py-1.5 mt-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Reservations ({segment.reservations.length})
                </label>
                <div className="space-y-1.5">
                  {segment.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 shadow-sm bg-white"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">
                          {reservation.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {reservation.reservationType.category.name}
                          {reservation.startTime &&
                            ` • ${format(
                              parseISO(reservation.startTime),
                              "h:mm a"
                            )}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer - View1 style buttons */}
          <div className="flex justify-between gap-2 p-3 border-t border-slate-200 flex-shrink-0">
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleCloseAttempt}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 z-[110]" />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Unsaved Changes
                  </h3>
                  <p className="text-xs text-slate-600">
                    You have unsaved changes. Are you sure you want to close?
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Save Indicator - View1 style */}
      <SaveIndicator state={saveState} position="floating-bottom" />
    </>
  );
}
