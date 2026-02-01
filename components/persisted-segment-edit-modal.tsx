"use client";

import { useState, useEffect } from "react";
import { X, Home, Plane, Map, Palmtree, Car } from "lucide-react";
import { ClickToEditField } from "./ui/click-to-edit-field";
import { SaveIndicator } from "./ui/save-indicator";
import { LocationAutocompleteInput } from "./ui/location-autocomplete-input";
import { DatePopover } from "./ui/date-popover";
import { format, differenceInDays } from "date-fns";
import { PlaceAutocompleteResult } from "@/lib/types/place-suggestion";
import { getTimeZoneForLocation } from "@/lib/actions/timezone";
import { useAutoSaveCallback } from "@/hooks/use-auto-save";
import { Segment, SegmentType } from "@/app/generated/prisma";
import { updatePersistedSegment } from "@/lib/actions/update-persisted-segment";

interface PersistedSegmentEditModalProps {
  segment: Segment & { segmentType: SegmentType };
  segmentNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
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

export function PersistedSegmentEditModal({
  segment,
  segmentNumber,
  isOpen,
  onClose,
  onUpdate,
}: PersistedSegmentEditModalProps) {
  const [editName, setEditName] = useState(segment.name);
  const [editStartLocation, setEditStartLocation] = useState(segment.startTitle);
  const [editEndLocation, setEditEndLocation] = useState(segment.endTitle);
  const [editNotes, setEditNotes] = useState(segment.notes || "");
  const [editStartDate, setEditStartDate] = useState(segment.startTime ? segment.startTime.toISOString() : "");
  const [editEndDate, setEditEndDate] = useState(segment.endTime ? segment.endTime.toISOString() : "");
  const [editSegmentType, setEditSegmentType] = useState(segment.segmentType.name);
  const [useDifferentEndLocation, setUseDifferentEndLocation] = useState(
    segment.startTitle !== segment.endTitle
  );
  
  // Editing states for click-to-edit fields
  const [editingType, setEditingType] = useState(false);
  const [editingDates, setEditingDates] = useState(false);

  // Auto-save hook with debouncing
  const { save, saveState } = useAutoSaveCallback(async (updates: any) => {
    try {
      await updatePersistedSegment(segment.id, updates);
      onUpdate();
    } catch (error) {
      console.error("Failed to save segment:", error);
    }
  }, { delay: 500 });

  const days = calculateDays(
    editStartDate ? new Date(editStartDate) : null,
    editEndDate ? new Date(editEndDate) : null
  );

  useEffect(() => {
    setEditName(segment.name);
    setEditStartLocation(segment.startTitle);
    setEditEndLocation(segment.endTitle);
    setEditNotes(segment.notes || "");
    setEditStartDate(segment.startTime ? segment.startTime.toISOString() : "");
    setEditEndDate(segment.endTime ? segment.endTime.toISOString() : "");
    setEditSegmentType(segment.segmentType.name);
    setUseDifferentEndLocation(segment.startTitle !== segment.endTitle);
  }, [segment]);

  if (!isOpen) return null;

  const handleNameChange = (newName: string) => {
    setEditName(newName);
    save({ name: newName });
  };

  const handleNotesChange = (newNotes: string) => {
    setEditNotes(newNotes);
    save({ notes: newNotes });
  };

  const handleTypeChange = (newType: string) => {
    setEditSegmentType(newType);
    save({ segmentType: newType });
    setEditingType(false);
  };

  const handleStartLocationChange = async (location: string, details?: PlaceAutocompleteResult) => {
    setEditStartLocation(location);
    
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

  const handleEndLocationChange = async (location: string, details?: PlaceAutocompleteResult) => {
    setEditEndLocation(location);
    
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
    save({ startTime: date });
  };

  const handleEndDateChange = (date: string) => {
    setEditEndDate(date);
    save({ endTime: date });
  };

  const handleToggleDifferentEndLocation = (checked: boolean) => {
    setUseDifferentEndLocation(checked);
    
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

  const showTimezones = segment.startTimeZoneId && segment.endTimeZoneId && 
    segment.startTimeZoneId !== segment.endTimeZoneId;

  const TypeIcon = segmentTypeIcons[editSegmentType] || Home;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Edit Part {segmentNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Name - Click to Edit */}
            <ClickToEditField
              label="Name"
              value={editName}
              onChange={handleNameChange}
              placeholder="Add a name..."
            />

            {/* Type - Click to Edit */}
            {editingType ? (
              <div className="px-3 py-2">
                <span className="text-sm text-slate-500 block mb-1">Type</span>
                <select
                  value={editSegmentType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  onBlur={() => setEditingType(false)}
                  className="w-full border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent text-base"
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
                className="cursor-pointer hover:bg-slate-50 rounded px-3 py-2 transition-colors group"
              >
                <span className="text-sm text-slate-500 block mb-1">Type</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-base text-slate-900">
                      {segmentTypeLabels[editSegmentType] || editSegmentType}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    click to edit
                  </span>
                </div>
              </div>
            )}

            {/* Location(s) - Always Visible */}
            <div className="px-3 py-2 space-y-3">
              <span className="text-sm text-slate-500 block mb-2">Location</span>
              
              <LocationAutocompleteInput
                label={`${useDifferentEndLocation ? 'Start' : ''}${showTimezones && segment.startTimeZoneName ? ` (${segment.startTimeZoneName})` : ''}`}
                value={editStartLocation}
                onChange={handleStartLocationChange}
                placeholder={useDifferentEndLocation ? "Where does this part start?" : "Where is this part?"}
              />
              
              {useDifferentEndLocation && (
                <LocationAutocompleteInput
                  label={`End${showTimezones && segment.endTimeZoneName ? ` (${segment.endTimeZoneName})` : ''}`}
                  value={editEndLocation}
                  onChange={handleEndLocationChange}
                  placeholder="Where does this part end?"
                />
              )}
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDifferentEndLocation}
                  onChange={(e) => handleToggleDifferentEndLocation(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Different end location</span>
              </label>
            </div>

            {/* Dates - Click to Edit */}
            {editingDates ? (
              <div className="px-3 py-2">
                <span className="text-sm text-slate-500 block mb-2">Dates</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Start Date</label>
                    <DatePopover
                      value={editStartDate}
                      onChange={handleStartDateChange}
                      label="Select start date"
                      className="w-full justify-start text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">End Date</label>
                    <DatePopover
                      value={editEndDate}
                      onChange={handleEndDateChange}
                      label="Select end date"
                      minDate={editStartDate || undefined}
                      className="w-full justify-start text-sm"
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
                className="cursor-pointer hover:bg-slate-50 rounded px-3 py-2 transition-colors group"
              >
                <span className="text-sm text-slate-500 block mb-1">Dates</span>
                <div className="flex items-center justify-between">
                  <span className="text-base text-slate-900">
                    {editStartDate && editEndDate ? (
                      <>
                        {formatDateRange(new Date(editStartDate), new Date(editEndDate))} ({days} day{days !== 1 ? 's' : ''})
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Add dates...</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    click to edit
                  </span>
                </div>
              </div>
            )}

            {/* Notes - Click to Edit */}
            <ClickToEditField
              label="Notes"
              value={editNotes}
              onChange={handleNotesChange}
              type="textarea"
              placeholder="Add notes..."
            />
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Floating Save Indicator - Bottom Right */}
      <SaveIndicator state={saveState} position="floating-bottom" />
    </>
  );
}
