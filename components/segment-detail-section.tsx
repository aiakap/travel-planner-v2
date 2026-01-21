"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Plane } from "lucide-react";
import type { GlobeSegment } from "@/lib/globe-types";
import SegmentReservationMap from "./segment-reservation-map";
import { Badge } from "@/components/ui/badge";

interface SegmentDetailSectionProps {
  segments: GlobeSegment[];
}

export function SegmentDetailSection({ segments }: SegmentDetailSectionProps) {
  if (segments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No segments found for this trip
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {segments.map((segment) => (
        <Card key={segment.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  {segment.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {segment.startTitle} → {segment.endTitle}
                  </span>
                </div>
              </div>
              <Badge variant="outline">{segment.segmentType.name}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Segment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {segment.startTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">
                    {new Date(segment.startTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {segment.endTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-medium">
                    {new Date(segment.endTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {segment.notes && (
              <div className="text-sm bg-secondary/50 p-3 rounded-md">
                <span className="font-medium">Notes:</span> {segment.notes}
              </div>
            )}

            {/* Reservations */}
            {segment.reservations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Reservations ({segment.reservations.length})
                </div>
                <div className="space-y-2">
                  {segment.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-start gap-3 p-3 bg-secondary/30 rounded-md text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{reservation.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {reservation.reservationType.category.name} -{" "}
                          {reservation.reservationType.name}
                        </div>
                        {reservation.location && (
                          <div className="text-xs mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {reservation.location}
                          </div>
                        )}
                        {reservation.departureLocation &&
                          reservation.arrivalLocation && (
                            <div className="text-xs mt-1">
                              <Plane className="h-3 w-3 inline mr-1" />
                              {reservation.departureLocation} →{" "}
                              {reservation.arrivalLocation}
                            </div>
                          )}
                        {reservation.confirmationNumber && (
                          <div className="text-xs mt-1 text-muted-foreground">
                            Confirmation: {reservation.confirmationNumber}
                          </div>
                        )}
                      </div>
                      {reservation.cost && (
                        <div className="text-sm font-medium whitespace-nowrap">
                          {reservation.currency || "$"}
                          {reservation.cost.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="pt-2">
              <div className="text-sm font-medium mb-2">Location Map</div>
              <SegmentReservationMap
                reservations={segment.reservations}
                segmentStartLat={segment.startLat}
                segmentStartLng={segment.startLng}
                segmentEndLat={segment.endLat}
                segmentEndLng={segment.endLng}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
