"use client";

import { useState } from "react";
import { X, AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { adjustSegmentDates } from "@/lib/actions/adjust-segment-dates";

interface DateConflict {
  type: "overlap" | "trip-boundary" | "gap";
  message: string;
  affectedSegments: string[];
}

interface AdjacentSegment {
  id: string;
  name: string;
  startTime: Date | null;
  endTime: Date | null;
}

interface DateAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  segmentId: string;
  segmentName: string;
  newStartDate: Date;
  newEndDate: Date;
  conflicts: DateConflict[];
  tripBoundaries: {
    startDate: Date;
    endDate: Date;
  };
  adjacentSegments: {
    previous: AdjacentSegment | null;
    next: AdjacentSegment | null;
  };
}

export function DateAdjustmentModal({
  isOpen,
  onClose,
  onConfirm,
  segmentId,
  segmentName,
  newStartDate,
  newEndDate,
  conflicts,
  tripBoundaries,
  adjacentSegments,
}: DateAdjustmentModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<
    "extend-trip" | "adjust-segments" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const hasOverlap = conflicts.some((c) => c.type === "overlap");
  const hasTripBoundaryIssue = conflicts.some((c) => c.type === "trip-boundary");

  const handleConfirm = async () => {
    if (!selectedStrategy) return;

    setIsProcessing(true);
    try {
      await adjustSegmentDates(
        segmentId,
        newStartDate,
        newEndDate,
        selectedStrategy
      );
      onConfirm();
      onClose();
    } catch (error) {
      console.error("Error adjusting dates:", error);
      alert("Failed to adjust dates. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Date Conflict Detected
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Conflict Summary */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900 font-medium mb-2">
                The new dates for "{segmentName}" cause the following issues:
              </p>
              <ul className="space-y-1">
                {conflicts.map((conflict, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-amber-800 flex items-start gap-2"
                  >
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{conflict.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Date Change Preview */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-slate-500 text-xs mb-1">New Dates</div>
                  <div className="font-medium text-slate-900">
                    {format(newStartDate, "MMM d, yyyy")} -{" "}
                    {format(newEndDate, "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {differenceInDays(newEndDate, newStartDate)} days
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-slate-500 text-xs mb-1">
                    Trip Boundaries
                  </div>
                  <div className="font-medium text-slate-900">
                    {format(tripBoundaries.startDate, "MMM d, yyyy")} -{" "}
                    {format(tripBoundaries.endDate, "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                How would you like to resolve this?
              </p>

              {hasTripBoundaryIssue && (
                <button
                  onClick={() => setSelectedStrategy("extend-trip")}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedStrategy === "extend-trip"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={selectedStrategy === "extend-trip"}
                      onChange={() => setSelectedStrategy("extend-trip")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 text-sm">
                        Extend trip boundaries
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Automatically adjust the trip start/end dates to
                        accommodate this segment
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {hasOverlap && (
                <button
                  onClick={() => setSelectedStrategy("adjust-segments")}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedStrategy === "adjust-segments"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={selectedStrategy === "adjust-segments"}
                      onChange={() => setSelectedStrategy("adjust-segments")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 text-sm">
                        Adjust adjacent segments
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Manually adjust overlapping segments to prevent conflicts
                        (you'll need to edit them separately)
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> If you choose to adjust adjacent
                segments, you'll need to manually edit their dates to prevent
                overlaps.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedStrategy || isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Applying..." : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
