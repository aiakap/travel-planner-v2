"use client";

/**
 * Trip Builder View Wrapper
 * Wraps the existing TripBuilderClient to work within the object system
 */

import { TripBuilderClient } from "@/app/trip/new/components/trip-builder-client";
import { initializeSegmentTypes } from "@/app/trip/new/lib/segment-types";

export function TripBuilderView({ 
  data, 
  onDelete 
}: { 
  data: any;
  onDelete?: () => void;
}) {
  if (!data?.trip) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100%",
        color: "#6b7280",
        flexDirection: "column",
        gap: "12px"
      }}>
        <p>Start chatting to build your journey!</p>
        <p style={{ fontSize: "14px", opacity: 0.7 }}>
          Tell me where you want to go and when.
        </p>
      </div>
    );
  }

  const segmentTypes = data.segmentTypes || [];
  const segmentTypeMap = initializeSegmentTypes(segmentTypes);

  return (
    <TripBuilderClient 
      segmentTypeMap={segmentTypeMap}
      initialTrip={data.trip}
      initialSegments={data.segments}
      onUpdate={onDelete} // Reuse onDelete callback for updates
    />
  );
}
