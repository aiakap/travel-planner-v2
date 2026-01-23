"use client";

import { MapPin } from "lucide-react";
import { MessageSegment, PlaceSuggestion, GooglePlaceData } from "@/lib/types/place-pipeline";
import { PlaceHoverCard } from "@/components/place-hover-card";
import { TripCard } from "@/app/test/exp/components/trip-card";
import { SegmentCard } from "@/app/test/exp/components/segment-card";
import { ReservationCard } from "@/app/test/exp/components/reservation-card";
import { ContextCard } from "@/app/test/exp/components/context-card";

interface MessageSegmentsRendererProps {
  segments: MessageSegment[];
  onPlaceClick?: (suggestion: PlaceSuggestion, placeData: GooglePlaceData | undefined) => void;
  tripId?: string; // Optional trip ID for adding to itinerary
  onReservationAdded?: () => void; // Callback when reservation is successfully added
  onActionClick?: (prompt: string) => void; // Callback when context card action is clicked
}

/**
 * Renders message segments with clickable place links and hover cards
 * Used by chat interfaces to display AI responses with interactive place suggestions
 */
export function MessageSegmentsRenderer({
  segments,
  onPlaceClick,
  tripId,
  onReservationAdded,
  onActionClick,
}: MessageSegmentsRendererProps) {
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {segments.map((segment, idx) => {
        if (segment.type === "text") {
          return <span key={idx}>{segment.content}</span>;
        } else if (segment.type === "trip_card") {
          return (
            <div key={idx} className="my-3">
              <TripCard
                tripId={segment.tripId}
                title={segment.title}
                startDate={segment.startDate}
                endDate={segment.endDate}
                description={segment.description}
                onOpenModal={() => {
                  // Open edit trip modal
                }}
              />
            </div>
          );
        } else if (segment.type === "segment_card") {
          return (
            <div key={idx} className="my-3">
              <SegmentCard
                segmentId={segment.segmentId}
                name={segment.name}
                type={segment.segmentType}
                startLocation={segment.startLocation}
                endLocation={segment.endLocation}
                startTime={segment.startTime}
                endTime={segment.endTime}
                onOpenModal={() => {
                  // Open edit segment modal
                }}
              />
            </div>
          );
        } else if (segment.type === "reservation_card") {
          return (
            <div key={idx} className="my-3">
              <ReservationCard
                reservationId={segment.reservationId}
                name={segment.name}
                category={segment.category}
                type={segment.type}
                status={segment.status}
                cost={segment.cost}
                currency={segment.currency}
                location={segment.location}
                startTime={segment.startTime}
                onOpenModal={() => {
                  // Open reservation detail modal
                }}
              />
            </div>
          );
        } else if (segment.type === "context_card") {
          return (
            <div key={idx} className="my-3">
              <ContextCard
                type={segment.contextType}
                data={segment.data}
                actions={segment.actions}
                onActionClick={(prompt) => {
                  onActionClick?.(prompt);
                }}
                onSaved={segment.onSaved}
              />
            </div>
          );
        } else {
          // Place segment - render as clickable link with hover card
          const hasValidData = segment.placeData && !segment.placeData.notFound;
          
          return (
            <PlaceHoverCard
              key={idx}
              placeData={segment.placeData}
              placeName={segment.display || "Unknown Place"}
              tripId={tripId}
              suggestion={segment.suggestion!}
              onReservationAdded={onReservationAdded}
            >
              <button
                onClick={() => {
                  if (onPlaceClick && segment.suggestion && hasValidData) {
                    onPlaceClick(segment.suggestion, segment.placeData);
                  }
                }}
                className={`inline-flex items-center gap-0.5 font-medium transition-colors ${
                  hasValidData
                    ? "text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={
                  hasValidData
                    ? "Hover for details • Click to add to itinerary"
                    : "Place not found in Google Places"
                }
                disabled={!hasValidData || !onPlaceClick}
              >
                {segment.display}
                <MapPin className="h-3 w-3 inline" />
              </button>
            </PlaceHoverCard>
          );
        }
      })}
    </div>
  );
}
