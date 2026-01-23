"use client";

import { useState, useEffect } from "react";
import { MapPin, Calendar, Check } from "lucide-react";

interface TripMetadataCardProps {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  onUpdate: (updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    imageUrl?: string | null;
  }) => void;
}

// Helper functions
const calculateDays = (start: string, end: string): number => {
  if (!start || !end) return 1;
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

const calculateEndDate = (start: string, days: number): string => {
  if (!start) return "";
  const startDt = new Date(start);
  startDt.setDate(startDt.getDate() + days);
  return startDt.toISOString().split('T')[0];
};

const formatCompactDateRange = (start: string, end: string): string => {
  if (!start || !end) return "Add dates...";
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = calculateDays(start, end);
  return `${startDt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${endDt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} (${days} days)`;
};

export function TripMetadataCard({
  title,
  description,
  startDate,
  endDate,
  imageUrl,
  onUpdate,
}: TripMetadataCardProps) {
  // Local editing state
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editStart, setEditStart] = useState(startDate);
  const [editEnd, setEditEnd] = useState(endDate);
  const [duration, setDuration] = useState(() => calculateDays(startDate, endDate));

  // Individual editing flags
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDates, setEditingDates] = useState(false);

  // Sync props to local state
  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  useEffect(() => {
    setEditDescription(description);
  }, [description]);

  useEffect(() => {
    setEditStart(startDate);
    setEditEnd(endDate);
    setDuration(calculateDays(startDate, endDate));
  }, [startDate, endDate]);

  // Auto-save handlers
  const handleTitleBlur = () => {
    if (editTitle !== title) {
      onUpdate({ title: editTitle });
    }
    setEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    if (editDescription !== description) {
      onUpdate({ description: editDescription });
    }
    setEditingDescription(false);
  };

  const handleStartDateChange = (newStart: string) => {
    setEditStart(newStart);
    // Maintain duration
    const newEnd = calculateEndDate(newStart, duration);
    setEditEnd(newEnd);
    // Immediately update parent to refresh right side
    onUpdate({ startDate: newStart, endDate: newEnd });
  };

  const handleDurationChange = (days: number) => {
    setDuration(days);
    // Recalculate end date
    const newEnd = calculateEndDate(editStart, days);
    setEditEnd(newEnd);
    // Immediately update parent to refresh right side
    onUpdate({ startDate: editStart, endDate: newEnd });
  };

  const handleEndDateChange = (newEnd: string) => {
    setEditEnd(newEnd);
    // Recalculate duration
    const days = calculateDays(editStart, newEnd);
    setDuration(days);
    // Immediately update parent to refresh right side
    onUpdate({ startDate: editStart, endDate: newEnd });
  };

  // Completion status
  const isEmpty = !title && !description && !startDate && !endDate;
  const isComplete = title && startDate && endDate;

  return (
    <div
      className={`relative rounded-lg p-4 shadow-sm border-2 transition-all ${
        isEmpty
          ? "bg-slate-50 border-slate-200"
          : isComplete
          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300"
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      {/* Completion Badge */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
          <Check className="h-4 w-4" />
        </div>
      )}

      <div className="space-y-2">
        {/* Title Field */}
        <div>
          {editingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleBlur();
                if (e.key === "Escape") {
                  setEditTitle(title);
                  setEditingTitle(false);
                }
              }}
              className="w-full text-lg font-semibold border-b border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent"
              placeholder="Trip title..."
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-white/50 rounded px-2 py-1 -mx-2 transition-colors group"
              onClick={() => setEditingTitle(true)}
            >
              <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-slate-900 flex-1">
                {title || <span className="text-slate-400 italic">Add a trip title...</span>}
              </h3>
              <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                click to edit
              </span>
            </div>
          )}
        </div>

        {/* Dates Field */}
        <div>
          {editingDates ? (
            <div className="space-y-2 bg-white/50 rounded p-3 border border-blue-200">
              {/* Start Date */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editStart}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Duration Slider */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Duration: <span className="text-blue-600">{duration} days</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${(duration / 90) * 100}%, rgb(226, 232, 240) ${(duration / 90) * 100}%, rgb(226, 232, 240) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1 day</span>
                  <span>90 days</span>
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={editEnd}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setEditingDates(false)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Done
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-white/50 rounded px-2 py-1 -mx-2 transition-colors group"
              onClick={() => setEditingDates(true)}
            >
              <Calendar className="h-4 w-4 text-slate-600 flex-shrink-0" />
              <span className="text-sm text-slate-700 flex-1">
                {formatCompactDateRange(startDate, endDate)}
              </span>
              <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                click to edit
              </span>
            </div>
          )}
        </div>

        {/* Description Field */}
        <div>
          {editingDescription ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditDescription(description);
                  setEditingDescription(false);
                }
              }}
              className="w-full text-sm border border-blue-400 focus:outline-none focus:border-blue-600 rounded p-2 bg-white min-h-[60px] focus:ring-1 focus:ring-blue-500"
              placeholder="Add a description..."
              autoFocus
            />
          ) : (
            <div
              className="cursor-pointer hover:bg-white/50 rounded px-2 py-1 -mx-2 transition-colors group"
              onClick={() => setEditingDescription(true)}
            >
              <p className="text-sm text-slate-600 line-clamp-2">
                {description || (
                  <span className="text-slate-400 italic">Add a description...</span>
                )}
              </p>
              <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">
                click to edit
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Helper Text */}
      <div className="mt-3 pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          {isEmpty
            ? "Click to edit or chat to build your trip"
            : !isComplete
            ? "Complete all fields to proceed"
            : "Ready to add parts!"}
        </p>
      </div>
    </div>
  );
}
