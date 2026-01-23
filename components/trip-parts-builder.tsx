"use client";

import { Calendar, Edit2, Plus, ArrowRight, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { PartCard } from "./part-card";
import Link from "next/link";

interface Segment {
  id: string;
  name: string;
  startTitle: string;
  endTitle: string;
  segmentType: { name: string };
  startTime: Date | null;
  endTime: Date | null;
  order: number;
}

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  segments: Segment[];
}

interface TripPartsBuilderProps {
  trip: Trip;
  onEditTrip?: () => void;
  onEditPart?: (partId: string) => void;
  onDeletePart?: (partId: string) => void;
  onAddPart?: () => void;
}

export function TripPartsBuilder({
  trip,
  onEditTrip,
  onEditPart,
  onDeletePart,
  onAddPart,
}: TripPartsBuilderProps) {
  const formatDateRange = () => {
    const start = new Date(trip.startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const end = new Date(trip.endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  // Sort segments by order
  const sortedSegments = [...trip.segments].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-6 bg-slate-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-slate-600 flex-shrink-0" />
              <h1 className="text-2xl font-bold text-slate-900 truncate">{trip.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </div>
            {trip.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{trip.description}</p>
            )}
          </div>
          {onEditTrip && (
            <Button variant="outline" size="sm" onClick={onEditTrip}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Trip
            </Button>
          )}
        </div>
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Parts Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Trip Parts</h2>
              <p className="text-sm text-slate-600">
                {sortedSegments.length === 0
                  ? "No parts yet - add your first part to get started"
                  : `${sortedSegments.length} ${sortedSegments.length === 1 ? "part" : "parts"} in your trip`}
              </p>
            </div>
            {onAddPart && sortedSegments.length > 0 && (
              <Button variant="outline" size="sm" onClick={onAddPart}>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            )}
          </div>

          {/* Parts Grid */}
          {sortedSegments.length > 0 ? (
            <div className="grid gap-4">
              {sortedSegments.map((segment, index) => (
                <PartCard
                  key={segment.id}
                  part={segment}
                  partNumber={index + 1}
                  onEdit={onEditPart}
                  onDelete={onDeletePart}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-lg">
              <MapPin className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No parts yet</h3>
              <p className="text-sm text-slate-600 text-center mb-4 max-w-md">
                Use the chat or form to add parts to your trip. Each part represents a destination or travel segment.
              </p>
              {onAddPart && (
                <Button onClick={onAddPart} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Part
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      {sortedSegments.length > 0 && (
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="font-medium text-slate-900">Structure complete!</p>
                <p className="text-xs">
                  Ready to add hotels, restaurants, and activities? Click below to plan the details.
                </p>
              </div>
            </div>
            <Link href={`/test/experience-builder?tripId=${trip.id}`} className="block">
              <Button className="w-full bg-slate-900 hover:bg-slate-800" size="lg">
                Next: Plan Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
