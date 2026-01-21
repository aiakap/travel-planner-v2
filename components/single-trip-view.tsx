"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripInfoBar } from "@/components/trip-info-bar";
import { TripReservationsMap } from "@/components/trip-reservations-map";
import { TripSegmentsDetail } from "@/components/trip-segments-detail";
import type { GlobeTripData } from "@/lib/globe-types";

interface SingleTripViewProps {
  trip: GlobeTripData;
  onBack: () => void;
}

export function SingleTripView({ trip, onBack }: SingleTripViewProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  // Find selected segment and reservation for breadcrumb
  const selectedSegment = selectedSegmentId
    ? trip.segments?.find((s) => s.id === selectedSegmentId)
    : null;
  const selectedReservation = selectedSegment && selectedReservationId
    ? selectedSegment.reservations?.find((r) => r.id === selectedReservationId)
    : null;

  const handleSegmentClick = (segmentId: string) => {
    if (selectedSegmentId === segmentId && !selectedReservationId) {
      // Clicking the same segment again - deselect
      setSelectedSegmentId(null);
    } else {
      // Select the segment and clear reservation
      setSelectedSegmentId(segmentId);
      setSelectedReservationId(null);
    }
  };

  const handleReservationClick = (segmentId: string, reservationId: string) => {
    // Select both segment and reservation
    setSelectedSegmentId(segmentId);
    setSelectedReservationId(reservationId);
  };

  const handleClearFilter = () => {
    setSelectedSegmentId(null);
    setSelectedReservationId(null);
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with back button and breadcrumb */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <button
                  onClick={onBack}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Trips
                </button>
                <ChevronRight className="h-4 w-4" />
                <button
                  onClick={handleClearFilter}
                  className={`hover:text-foreground transition-colors ${
                    !selectedSegmentId ? "font-medium" : ""
                  }`}
                >
                  {trip.title}
                </button>
                {selectedSegment && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <button
                      onClick={() => {
                        setSelectedSegmentId(selectedSegment.id);
                        setSelectedReservationId(null);
                      }}
                      className={`hover:text-foreground transition-colors truncate ${
                        selectedSegmentId && !selectedReservationId ? "font-medium" : ""
                      }`}
                    >
                      {selectedSegment.name}
                    </button>
                  </>
                )}
                {selectedReservation && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium truncate">
                      {selectedReservation.name}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl font-bold truncate">{trip.title}</h1>
            </div>
            <Button onClick={onBack} variant="outline" className="ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Globe
            </Button>
          </div>

          {/* Trip Info Bar */}
          <TripInfoBar trip={trip} />

          {/* Main Content: Map and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Trip Map</h2>
                  <p className="text-sm text-muted-foreground">
                    All reservations and segments visualized
                  </p>
                </div>
                <div className="p-0">
                  <TripReservationsMap 
                    trip={trip} 
                    height="600px"
                    selectedSegmentId={selectedSegmentId}
                    selectedReservationId={selectedReservationId}
                  />
                </div>
              </div>
            </div>

            {/* Segments Detail - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-lg overflow-hidden border p-6 max-h-[700px] overflow-y-auto">
                <TripSegmentsDetail 
                  trip={trip}
                  selectedSegmentId={selectedSegmentId}
                  selectedReservationId={selectedReservationId}
                  onSegmentClick={handleSegmentClick}
                  onReservationClick={handleReservationClick}
                />
              </div>
            </div>
          </div>

          {/* Alternative Layout: Map Above, Details Below (for mobile/preference) */}
          {/* Uncomment this section and remove the above grid if preferred */}
          {/*
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Trip Map</h2>
                <p className="text-sm text-muted-foreground">
                  All reservations and segments visualized
                </p>
              </div>
              <div className="p-0">
                <TripReservationsMap trip={trip} height="600px" />
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg overflow-hidden border p-6">
              <TripSegmentsDetail trip={trip} />
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
