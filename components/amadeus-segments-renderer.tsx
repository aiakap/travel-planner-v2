"use client";

import { useState } from "react";
import { MapPin, Plane, Hotel as HotelIcon } from "lucide-react";
import { MessageSegment, PlaceSuggestion, GooglePlaceData } from "@/lib/types/amadeus-pipeline";
import { PlaceHoverCard } from "@/components/place-hover-card";
import { FlightHoverCard } from "@/components/flight-hover-card";
import { HotelHoverCard } from "@/components/hotel-hover-card";
import { AddReservationModal } from "@/components/add-reservation-modal";

interface AmadeusSegmentsRendererProps {
  segments: MessageSegment[];
  onPlaceClick?: (suggestion: PlaceSuggestion, placeData: GooglePlaceData | undefined) => void;
  tripId?: string; // Optional trip ID for adding to itinerary
  onReservationAdded?: () => void; // Callback when reservation is successfully added
}

/**
 * Renders message segments with clickable links for places, flights, and hotels
 * This is an enhanced version of MessageSegmentsRenderer that supports Amadeus data
 * Used exclusively by /test/place-pipeline (NOT by /test/exp)
 * 
 * Now includes unified "Add to Itinerary" modal with pre-populated costs and dates
 */
export function AmadeusSegmentsRenderer({
  segments,
  onPlaceClick,
  tripId,
  onReservationAdded,
}: AmadeusSegmentsRendererProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<MessageSegment | null>(null);

  const handleAddClick = (segment: MessageSegment) => {
    setSelectedSegment(segment);
    setShowAddModal(true);
  };

  return (
    <>
      <div className="whitespace-pre-wrap leading-relaxed">
        {segments.map((segment, idx) => {
        // Text segment
        if (segment.type === "text") {
          return <span key={idx}>{segment.content}</span>;
        }
        
        // Place segment (Google Places)
        if (segment.type === "place") {
          const hasValidData = segment.placeData && !segment.placeData.notFound;
          
          return (
            <PlaceHoverCard
              key={idx}
              placeData={segment.placeData}
              placeName={segment.display || "Unknown Place"}
              tripId={tripId}
              suggestion={segment.suggestion && 'category' in segment.suggestion ? segment.suggestion : undefined}
              onReservationAdded={onReservationAdded}
            >
              <button
                onClick={() => {
                  if (onPlaceClick && segment.suggestion && hasValidData && segment.type === "place") {
                    onPlaceClick(segment.suggestion as PlaceSuggestion, segment.placeData);
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
        
        // Transport segment (Flights/Transfers)
        if (segment.type === "transport" || segment.type === "flight") {
          const hasValidData = segment.transportData && !segment.transportData.notFound;
          
          return (
            <FlightHoverCard
              key={idx}
              transportData={segment.transportData}
              flightData={segment.flightData}
              flightName={segment.display || "Unknown Flight"}
              onAddToItinerary={() => handleAddClick(segment)}
            >
              <button
                className={`inline-flex items-center gap-0.5 font-medium transition-colors ${
                  hasValidData
                    ? "text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-500 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={
                  hasValidData
                    ? "Hover for flight details • Click to add to itinerary"
                    : "No flight availability found"
                }
                disabled={!hasValidData}
              >
                {segment.display}
                <Plane className="h-3 w-3 inline" />
              </button>
            </FlightHoverCard>
          );
        }
        
        // Hotel segment (Google + Amadeus merged)
        if (segment.type === "hotel") {
          const hasGoogleData = segment.placeData && !segment.placeData.notFound;
          const hasAmadeusData = segment.hotelData && !segment.hotelData.notFound;
          const hasValidData = hasGoogleData || hasAmadeusData;
          
          return (
            <HotelHoverCard
              key={idx}
              placeData={segment.placeData}
              hotelData={segment.hotelData}
              hotelName={segment.display || "Unknown Hotel"}
              onAddToItinerary={() => handleAddClick(segment)}
            >
              <button
                className={`inline-flex items-center gap-0.5 font-medium transition-colors ${
                  hasValidData
                    ? "text-purple-600 hover:text-purple-800 underline decoration-purple-300 hover:decoration-purple-500 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={
                  hasValidData
                    ? "Hover for hotel details • Click to add to itinerary"
                    : "No hotel information found"
                }
                disabled={!hasValidData}
              >
                {segment.display}
                <HotelIcon className="h-3 w-3 inline" />
              </button>
            </HotelHoverCard>
          );
        }

        // Fallback for unknown types
        return <span key={idx}>{segment.display || ""}</span>;
        })}
      </div>

      {/* Unified Add to Itinerary Modal */}
      {showAddModal && selectedSegment && (
        <AddReservationModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSegment(null);
          }}
          segment={selectedSegment}
          tripId={tripId}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedSegment(null);
            onReservationAdded?.();
          }}
        />
      )}
    </>
  );
}
