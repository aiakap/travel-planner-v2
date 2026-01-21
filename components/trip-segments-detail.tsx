import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Plane, DollarSign } from "lucide-react";
import type { GlobeTripData, GlobeSegment, GlobeReservation } from "@/lib/globe-types";

interface TripSegmentsDetailProps {
  trip: GlobeTripData;
  selectedSegmentId?: string | null;
  selectedReservationId?: string | null;
  onSegmentClick?: (segmentId: string) => void;
  onReservationClick?: (segmentId: string, reservationId: string) => void;
}

export function TripSegmentsDetail({ 
  trip, 
  selectedSegmentId,
  selectedReservationId,
  onSegmentClick,
  onReservationClick 
}: TripSegmentsDetailProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Segments & Reservations</h3>
      
      {trip.segments.map((segment, index) => (
        <div key={segment.id} className="space-y-1">
          {/* Segment Header - Compact */}
          <button
            onClick={() => onSegmentClick?.(segment.id)}
            className={`w-full text-left p-2 rounded-md border transition-all group hover:border-primary/50 hover:bg-secondary/30 ${
              selectedSegmentId === segment.id && !selectedReservationId
                ? "border-primary bg-secondary/50"
                : "border-border"
            }`}
            title={`${segment.startTitle} → ${segment.endTitle}\n${
              segment.startTime
                ? new Date(segment.startTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : ""
            } - ${
              segment.endTime
                ? new Date(segment.endTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : ""
            }\n${segment.notes || ""}`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getSegmentColor(index) }}
              />
              <Plane className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">{segment.name}</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {segment.segmentType.name}
              </Badge>
            </div>
          </button>

          {/* Reservations List - Compact */}
          {segment.reservations.length > 0 && (
            <div className="ml-4 space-y-1">
              {segment.reservations.map((reservation) => (
                <button
                  key={reservation.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReservationClick?.(segment.id, reservation.id);
                  }}
                  className={`w-full text-left p-2 rounded-md border transition-all hover:border-primary/50 hover:bg-secondary/20 ${
                    selectedReservationId === reservation.id
                      ? "border-primary bg-secondary/40"
                      : "border-transparent"
                  }`}
                  title={`${reservation.name}\n${reservation.reservationType.category.name} - ${reservation.reservationType.name}\n${
                    reservation.location || ""
                  }${
                    reservation.departureLocation && reservation.arrivalLocation
                      ? `${reservation.departureLocation} → ${reservation.arrivalLocation}`
                      : ""
                  }\n${
                    reservation.startTime
                      ? new Date(reservation.startTime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }\n${reservation.confirmationNumber ? `Conf: ${reservation.confirmationNumber}` : ""}\n${
                    reservation.notes || ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground truncate flex-1">
                      {reservation.name}
                    </div>
                    {reservation.cost && (
                      <div className="text-xs font-medium whitespace-nowrap flex items-center gap-0.5">
                        <DollarSign className="h-3 w-3" />
                        {reservation.cost.toFixed(0)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {trip.segments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No segments found for this trip
        </div>
      )}
    </div>
  );
}

function getSegmentColor(index: number): string {
  const colors = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];
  return colors[index % colors.length];
}
