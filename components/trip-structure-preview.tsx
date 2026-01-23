"use client";

import { MapPin, Calendar, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface InMemoryTrip {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  segments: InMemorySegment[];
}

interface TripStructurePreviewProps {
  trip: InMemoryTrip;
  isMetadataComplete: boolean;
  onCommit: () => void;
  isCommitting: boolean;
}

const segmentTypeConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  Flight: { color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", icon: "✈️" },
  Drive: { color: "text-green-600", bgColor: "bg-green-50 border-green-200", icon: "🚗" },
  Train: { color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", icon: "🚆" },
  Ferry: { color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200", icon: "⛴️" },
  Walk: { color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", icon: "🚶" },
  Other: { color: "text-slate-600", bgColor: "bg-slate-50 border-slate-200", icon: "📍" },
};

export function TripStructurePreview({
  trip,
  isMetadataComplete,
  onCommit,
  isCommitting,
}: TripStructurePreviewProps) {
  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return "No dates set";
    const startDt = new Date(start);
    const endDt = new Date(end);
    const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
    return `${startDt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endDt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} (${days} days)`;
  };

  const hasAnyContent = trip.title || trip.description || trip.startDate || trip.endDate || trip.segments.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Sparkles className="h-16 w-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Build Your Trip Structure</h3>
        <p className="text-slate-600 max-w-md mb-6">
          Use the form and chat on the left to define your trip. Add a title, dates, and break
          your journey into parts. You'll see everything build here in real-time.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-slate-700">
            💡 <strong>Tip:</strong> Start by telling me where you want to go and when, or fill in
            the trip card on the left.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Trip Overview Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                {trip.title || <span className="text-slate-400 italic">Untitled Trip</span>}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
            {trip.description && (
              <p className="text-sm text-slate-600 mt-2">{trip.description}</p>
            )}
          </div>
          {isMetadataComplete && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="h-5 w-5" />
              <span>Ready</span>
            </div>
          )}
        </div>

        {/* Completion Status */}
        {!isMetadataComplete && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Missing:</span>{" "}
              {[
                !trip.title && "title",
                !trip.startDate && "start date",
                !trip.endDate && "end date",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Trip Parts</h3>
          <span className="text-sm text-slate-500">
            {trip.segments.length} {trip.segments.length === 1 ? "part" : "parts"}
          </span>
        </div>

        {trip.segments.length > 0 ? (
          <div className="space-y-3">
            {trip.segments
              .sort((a, b) => a.order - b.order)
              .map((segment, index) => {
                const config = segmentTypeConfig[segment.segmentType] || segmentTypeConfig.Other;
                return (
                  <div
                    key={segment.tempId}
                    className={`relative border-2 rounded-lg p-4 ${config.bgColor} animate-in slide-in-from-left duration-300 hover:shadow-md transition-all`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                      {index + 1}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <h4 className="font-semibold text-slate-900">{segment.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <MapPin className="h-3 w-3" />
                        <span>{segment.startLocation}</span>
                        {segment.startLocation !== segment.endLocation && (
                          <>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span>{segment.endLocation}</span>
                          </>
                        )}
                      </div>
                      {segment.notes && (
                        <p className="text-xs text-slate-600 mt-1">{segment.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-white">
            <div className="text-slate-400 mb-2">
              <Sparkles className="h-10 w-10 mx-auto" />
            </div>
            <p className="text-sm text-slate-600">
              No parts yet. Chat with the assistant to add destinations and travel segments.
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {isMetadataComplete && (
        <div className="border-t border-slate-200 pt-6 bg-white sticky bottom-0">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900 text-sm mb-1">Ready to add details?</p>
                <p className="text-xs text-slate-600">
                  This will save your trip structure and take you to the Experience Builder where
                  you can add hotels, restaurants, and activities.
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={onCommit}
            disabled={isCommitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-base font-semibold shadow-lg"
            size="lg"
          >
            {isCommitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Creating Trip...
              </>
            ) : (
              <>
                Let's Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {!isMetadataComplete && (
        <div className="border-t border-slate-200 pt-6 bg-white sticky bottom-0">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-700">
              <strong>Almost there!</strong> Complete the trip details on the left to proceed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
