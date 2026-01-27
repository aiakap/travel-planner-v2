"use client";

import { MapPin } from "lucide-react";
import { MessageSegment, PlaceSuggestion, GooglePlaceData } from "@/lib/types/place-pipeline";
import { PlaceHoverCard } from "@/app/exp/components/place-hover-card";
import { TripCard } from "@/app/exp/components/trip-card";
import { SegmentCard } from "@/app/exp/components/segment-card";
import { ReservationCard } from "@/app/exp/components/reservation-card";
import { ContextCard } from "@/app/exp/components/context-card";
import { HotelReservationCard } from "@/app/exp/components/hotel-reservation-card";
import { ExtractionLoadingAnimation } from "@/app/exp/components/extraction-loading-animation";
import { DiningScheduleCard } from "@/app/exp/components/dining-schedule-card";
import { ActivityTableCard } from "@/app/exp/components/activity-table-card";
import { FlightComparisonCard } from "@/app/exp/components/flight-comparison-card";
import { BudgetBreakdownCard } from "@/app/exp/components/budget-breakdown-card";
import { DayPlanCard } from "@/app/exp/components/day-plan-card";
import { PlacesMapCard } from "@/app/exp/components/places-map-card";

interface MessageSegmentsRendererProps {
  segments: MessageSegment[];
  onPlaceClick?: (suggestion: PlaceSuggestion, placeData: GooglePlaceData | undefined) => void;
  tripId?: string; // Optional trip ID for adding to itinerary
  onReservationAdded?: () => void; // Callback when reservation is successfully added
  onActionClick?: (prompt: string) => void; // Callback when context card action is clicked
  onEditItem?: (reservation: any) => void; // Callback to edit a reservation (opens modal)
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
  onEditItem,
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
                endTime={segment.endTime}
                imageUrl={segment.imageUrl}
                vendor={segment.vendor}
                onEdit={onEditItem ? () => {
                  // Construct V0Reservation object from segment data
                  const v0Reservation = {
                    id: segment.reservationId,
                    vendor: segment.vendor || segment.name,
                    text: segment.type,
                    status: segment.status as any,
                    cost: segment.cost || 0,
                    address: segment.location,
                    image: segment.imageUrl,
                    startTime: segment.startTime,
                    endTime: segment.endTime,
                  };
                  onEditItem(v0Reservation);
                } : undefined}
                onSaved={onReservationAdded}
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
        } else if (segment.type === "hotel_reservation_card") {
          return (
            <div key={idx} className="my-3">
              <HotelReservationCard
                reservationId={segment.reservationId}
                hotelName={segment.hotelName}
                confirmationNumber={segment.confirmationNumber}
                checkInDate={segment.checkInDate}
                checkInTime={segment.checkInTime}
                checkOutDate={segment.checkOutDate}
                checkOutTime={segment.checkOutTime}
                nights={segment.nights}
                guests={segment.guests}
                rooms={segment.rooms}
                roomType={segment.roomType}
                address={segment.address}
                totalCost={segment.totalCost}
                currency={segment.currency}
                contactPhone={segment.contactPhone}
                contactEmail={segment.contactEmail}
                cancellationPolicy={segment.cancellationPolicy}
                imageUrl={segment.imageUrl}
                url={segment.url}
                tripId={tripId}
                onSaved={onReservationAdded}
                onDeleted={onReservationAdded}
              />
            </div>
          );
        } else if (segment.type === "extraction_progress") {
          return (
            <div key={idx}>
              <ExtractionLoadingAnimation
                step={segment.step}
                totalSteps={segment.totalSteps}
                message={segment.message}
              />
            </div>
          );
        } else if (segment.type === "dining_schedule_card") {
          return (
            <div key={idx} className="my-3">
              <DiningScheduleCard
                tripId={segment.tripId}
                segmentId={segment.segmentId}
              />
            </div>
          );
        } else if (segment.type === "activity_table_card") {
          return (
            <div key={idx} className="my-3">
              <ActivityTableCard
                location={segment.location}
                segmentId={segment.segmentId}
                categories={segment.categories}
              />
            </div>
          );
        } else if (segment.type === "flight_comparison_card") {
          return (
            <div key={idx} className="my-3">
              <FlightComparisonCard
                origin={segment.origin}
                destination={segment.destination}
                departDate={segment.departDate}
                returnDate={segment.returnDate}
                passengers={segment.passengers}
              />
            </div>
          );
        } else if (segment.type === "budget_breakdown_card") {
          return (
            <div key={idx} className="my-3">
              <BudgetBreakdownCard
                tripId={segment.tripId}
              />
            </div>
          );
        } else if (segment.type === "day_plan_card") {
          return (
            <div key={idx} className="my-3">
              <DayPlanCard
                tripId={segment.tripId}
                date={segment.date}
                segmentId={segment.segmentId}
              />
            </div>
          );
        } else if (segment.type === "places_map_card") {
          return (
            <div key={idx} className="my-3">
              <PlacesMapCard
                centerLat={segment.centerLat}
                centerLng={segment.centerLng}
                centerName={segment.centerName}
                placeType={segment.placeType}
                radius={segment.radius}
                tripId={tripId}
                segmentId={segmentId}
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
