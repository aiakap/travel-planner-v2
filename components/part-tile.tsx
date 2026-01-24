"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Check } from "lucide-react";
import { SegmentTypeSelect } from "./ui/segment-type-select";
import { DatePopover } from "./ui/date-popover";
import { addDays, startOfDay } from "date-fns";

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

interface PartTileProps {
  part: InMemorySegment;
  partNumber: number;
  onUpdate: (updates: Partial<InMemorySegment>) => void;
}

const segmentTypeColors: Record<string, { bgColor: string; borderColor: string }> = {
  Travel: { bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  Stay: { bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
  Tour: { bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  Retreat: { bgColor: "bg-teal-50", borderColor: "border-teal-200" },
  "Road Trip": { bgColor: "bg-orange-50", borderColor: "border-orange-200" },
};

const calculateDays = (start: string | null, end: string | null): number => {
  if (!start || !end) return 1;
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

const calculateEndDate = (start: string, days: number): string => {
  if (!start) return "";
  const startDt = new Date(start);
  const endDt = addDays(startDt, days);
  return endDt.toISOString().split("T")[0];
};

export function PartTile({ part, partNumber, onUpdate }: PartTileProps) {
  const [editingStartLocation, setEditingStartLocation] = useState(false);
  const [editingEndLocation, setEditingEndLocation] = useState(false);
  const [editStartLocation, setEditStartLocation] = useState(part.startLocation);
  const [editEndLocation, setEditEndLocation] = useState(part.endLocation);
  const [editStartTime, setEditStartTime] = useState(part.startTime || "");
  const [editEndTime, setEditEndTime] = useState(part.endTime || "");
  const [duration, setDuration] = useState(() => calculateDays(part.startTime, part.endTime));

  const colors = segmentTypeColors[part.segmentType] || segmentTypeColors.Other;

  // Sync props to local state
  useEffect(() => {
    setEditStartLocation(part.startLocation);
  }, [part.startLocation]);

  useEffect(() => {
    setEditEndLocation(part.endLocation);
  }, [part.endLocation]);

  useEffect(() => {
    if (part.startTime) setEditStartTime(part.startTime);
    if (part.endTime) setEditEndTime(part.endTime);
    if (part.startTime && part.endTime) {
      setDuration(calculateDays(part.startTime, part.endTime));
    }
  }, [part.startTime, part.endTime]);

  // Check completion
  const isComplete = !!(
    part.startLocation &&
    part.endLocation &&
    part.startTime &&
    part.endTime &&
    part.segmentType
  );

  // Handlers
  const handleStartLocationChange = (value: string) => {
    setEditStartLocation(value);
    onUpdate({ startLocation: value });
  };

  const handleEndLocationChange = (value: string) => {
    setEditEndLocation(value);
    onUpdate({ endLocation: value });
  };

  const handleSegmentTypeChange = (type: string) => {
    onUpdate({ segmentType: type });
  };

  const handleStartTimeChange = (newStart: string) => {
    setEditStartTime(newStart);
    const newEnd = calculateEndDate(newStart, duration);
    setEditEndTime(newEnd);
    onUpdate({ startTime: newStart, endTime: newEnd });
  };

  const handleDurationChange = (days: number) => {
    setDuration(days);
    const newEnd = calculateEndDate(editStartTime, days);
    setEditEndTime(newEnd);
    onUpdate({ startTime: editStartTime, endTime: newEnd });
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEditEndTime(newEnd);
    const days = calculateDays(editStartTime, newEnd);
    setDuration(days);
    onUpdate({ startTime: editStartTime, endTime: newEnd });
  };

  const formatDateRange = () => {
    if (!editStartTime || !editEndTime) return "Add dates...";
    const startDt = new Date(editStartTime);
    const endDt = new Date(editEndTime);
    const days = calculateDays(editStartTime, editEndTime);
    return `${startDt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endDt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} (${days} days)`;
  };

  return (
    <div
      className={`relative border-2 rounded-lg p-4 transition-all ${colors.bgColor} ${colors.borderColor} ${
        isComplete ? "shadow-sm" : "border-dashed"
      }`}
    >
      {/* Part Number Badge */}
      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
        {partNumber}
      </div>

      {/* Completion Badge */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="space-y-3">
        {/* Segment Type Selector */}
        <div className="flex items-center justify-between">
          <SegmentTypeSelect
            value={part.segmentType}
            onChange={handleSegmentTypeChange}
          />
        </div>

        {/* Locations */}
        <div className="space-y-2">
          {/* Start Location */}
          <div>
            {editingStartLocation ? (
              <input
                type="text"
                value={editStartLocation}
                onChange={(e) => handleStartLocationChange(e.target.value)}
                onBlur={() => setEditingStartLocation(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingStartLocation(false);
                  if (e.key === "Escape") {
                    setEditStartLocation(part.startLocation);
                    setEditingStartLocation(false);
                  }
                }}
                className="w-full text-sm font-medium border-b border-slate-400 focus:outline-none focus:border-slate-600 pb-1 bg-transparent"
                placeholder="Start location..."
                autoFocus
              />
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-white/50 rounded px-2 py-1 -mx-2 transition-colors group"
                onClick={() => setEditingStartLocation(true)}
              >
                <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-900 flex-1">
                  {part.startLocation || (
                    <span className="text-slate-400 italic">Start location...</span>
                  )}
                </span>
                <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  click
                </span>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>

          {/* End Location */}
          <div>
            {editingEndLocation ? (
              <input
                type="text"
                value={editEndLocation}
                onChange={(e) => handleEndLocationChange(e.target.value)}
                onBlur={() => setEditingEndLocation(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingEndLocation(false);
                  if (e.key === "Escape") {
                    setEditEndLocation(part.endLocation);
                    setEditingEndLocation(false);
                  }
                }}
                className="w-full text-sm font-medium border-b border-slate-400 focus:outline-none focus:border-slate-600 pb-1 bg-transparent"
                placeholder="End location..."
                autoFocus
              />
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-white/50 rounded px-2 py-1 -mx-2 transition-colors group"
                onClick={() => setEditingEndLocation(true)}
              >
                <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-900 flex-1">
                  {part.endLocation || (
                    <span className="text-slate-400 italic">End location...</span>
                  )}
                </span>
                <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  click
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Date Range with Inline Picker */}
        {editStartTime && editEndTime ? (
          <div className="bg-white/50 rounded-lg p-2 border border-slate-200">
            <div className="grid grid-cols-3 gap-2 items-center">
              {/* Start Date */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">Start</label>
                <DatePopover
                  value={editStartTime}
                  onChange={handleStartTimeChange}
                  label="Start date"
                  minDate={startOfDay(new Date())}
                  className="w-full text-xs"
                />
              </div>

              {/* Duration Slider */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-700 mb-1">
                  {duration}d
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">End</label>
                <DatePopover
                  value={editEndTime}
                  onChange={handleEndTimeChange}
                  label="End date"
                  minDate={new Date(editStartTime)}
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-2 border border-dashed border-slate-300 rounded">
            {formatDateRange()}
          </div>
        )}
      </div>
    </div>
  );
}
