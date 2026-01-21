"use client";

import { MapPin } from "lucide-react";
import { MessageSegment, PlaceSuggestion, GooglePlaceData } from "@/lib/types/place-pipeline";
import { PlaceHoverCard } from "@/components/place-hover-card";

interface MessageSegmentsRendererProps {
  segments: MessageSegment[];
  onPlaceClick?: (suggestion: PlaceSuggestion, placeData: GooglePlaceData | undefined) => void;
  tripId?: string; // Optional trip ID for adding to itinerary
  onReservationAdded?: () => void; // Callback when reservation is successfully added
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
}: MessageSegmentsRendererProps) {
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {segments.map((segment, idx) => {
        if (segment.type === "text") {
          return <span key={idx}>{segment.content}</span>;
        } else {
          // Place segment - render as clickable link with hover card
          const hasValidData = segment.placeData && !segment.placeData.notFound;
          
          return (
            <PlaceHoverCard
              key={idx}
              placeData={segment.placeData}
              placeName={segment.display || "Unknown Place"}
              tripId={tripId}
              suggestion={segment.suggestion}
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
