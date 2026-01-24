"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripMetadataCard } from "@/components/trip-metadata-card";

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
  onMetadataUpdate: (updates: Partial<InMemoryTrip>) => void;
  onSegmentsUpdate: (segments: InMemorySegment[]) => void;
}

export function TripStructurePreview({
  trip,
  isMetadataComplete,
  onCommit,
  isCommitting,
  onMetadataUpdate,
  onSegmentsUpdate,
}: TripStructurePreviewProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Consolidated Trip Panel */}
      <TripMetadataCard
        title={trip.title}
        description={trip.description}
        startDate={trip.startDate}
        endDate={trip.endDate}
        imageUrl={trip.imageUrl}
        segments={trip.segments}
        onUpdate={onMetadataUpdate}
        onSegmentsUpdate={onSegmentsUpdate}
      />

      {/* Action Button - Simple, No Message Box */}
      {isMetadataComplete && (
        <div className="border-t border-slate-200 pt-4 bg-white sticky bottom-0">
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
        <div className="border-t border-slate-200 pt-4 bg-white sticky bottom-0">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-700">
              <strong>Almost there!</strong> Complete the trip details above to proceed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
