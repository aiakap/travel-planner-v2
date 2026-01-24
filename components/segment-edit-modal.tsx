"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { SegmentTypeSelect } from "./ui/segment-type-select";
import { LocationAutocompleteInput } from "./ui/location-autocomplete-input";
import { format } from "date-fns";
import { PlaceAutocompleteResult } from "@/lib/types/place-suggestion";

interface InMemorySegment {
  tempId: string;
  name: string;
  segmentType: string;
  startLocation: string;
  endLocation: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  order: number;
}

interface SegmentEditModalProps {
  segment: InMemorySegment;
  segmentNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<InMemorySegment>) => void;
}

const calculateDays = (start: string | null, end: string | null): number => {
  if (!start || !end) return 1;
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
};

export function SegmentEditModal({
  segment,
  segmentNumber,
  isOpen,
  onClose,
  onUpdate,
}: SegmentEditModalProps) {
  const [editName, setEditName] = useState(segment.name);
  const [editStartLocation, setEditStartLocation] = useState(segment.startLocation);
  const [editEndLocation, setEditEndLocation] = useState(segment.endLocation);
  const [editNotes, setEditNotes] = useState(segment.notes || "");

  const days = calculateDays(segment.startTime, segment.endTime);

  useEffect(() => {
    setEditName(segment.name);
    setEditStartLocation(segment.startLocation);
    setEditEndLocation(segment.endLocation);
    setEditNotes(segment.notes || "");
  }, [segment]);

  if (!isOpen) return null;

  const handleNameChange = (newName: string) => {
    setEditName(newName);
    onUpdate({ name: newName });
  };

  const handleStartLocationChange = (location: string, details?: PlaceAutocompleteResult) => {
    setEditStartLocation(location);
    onUpdate({ startLocation: location });
  };

  const handleEndLocationChange = (location: string, details?: PlaceAutocompleteResult) => {
    setEditEndLocation(location);
    onUpdate({ endLocation: location });
  };

  const handleNotesChange = (notes: string) => {
    setEditNotes(notes);
    onUpdate({ notes });
  };

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
          className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
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
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-slate-700 font-medium block mb-1">
                Name
              </label>
              <input
                value={editName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Part name"
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            {/* Type */}
            <div>
              <label className="text-sm text-slate-700 font-medium block mb-1">
                Type
              </label>
              <SegmentTypeSelect 
                value={segment.segmentType} 
                onChange={(type) => onUpdate({ segmentType: type })} 
              />
            </div>
            
            {/* Start Location */}
            <div>
              <LocationAutocompleteInput
                label="Start Location"
                value={editStartLocation}
                onChange={handleStartLocationChange}
                placeholder="Where does this part start?"
              />
            </div>
            
            {/* End Location */}
            <div>
              <LocationAutocompleteInput
                label="End Location"
                value={editEndLocation}
                onChange={handleEndLocationChange}
                placeholder="Where does this part end?"
              />
            </div>
            
            {/* Dates (read-only) */}
            <div>
              <label className="text-sm text-slate-700 font-medium block mb-1">
                Dates
              </label>
              <div className="text-sm text-slate-900 bg-slate-50 rounded px-3 py-2 border border-slate-200">
                {formatDateRange(segment.startTime, segment.endTime)} ({days} day{days !== 1 ? 's' : ''})
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Adjust dates by dragging the edges of the segment
              </p>
            </div>
            
            {/* Notes */}
            <div>
              <label className="text-sm text-slate-700 font-medium block mb-1">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes about this part of the trip..."
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
