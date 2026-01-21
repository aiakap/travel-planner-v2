"use client";

import { Segment, SegmentType } from "@/app/generated/prisma";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { formatDateTimeInTimeZone } from "@/lib/utils";

interface MapProps {
  segments: (Segment & { segmentType: SegmentType })[];
  segmentTimeZones: Record<
    string,
    {
      startTimeZoneId?: string;
      startTimeZoneName?: string;
      endTimeZoneId?: string;
      endTimeZoneName?: string;
    }
  >;
}

const containerStyle = { width: "100%", height: "100%" };

export default function Map({ segments, segmentTimeZones }: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script", // prevents duplicate script loads
    googleMapsApiKey: apiKey || "",
  });

  const center =
    segments.length > 0
      ? { lat: segments[0].startLat, lng: segments[0].startLng }
      : { lat: 0, lng: 0 };

  useEffect(() => {
    if (!mapInstance || segments.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    segments.forEach((segment) => {
      bounds.extend({ lat: segment.startLat, lng: segment.startLng });
      bounds.extend({ lat: segment.endLat, lng: segment.endLng });
    });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, segments]);

  if (!apiKey) return <div>Missing Google Maps API key.</div>;
  if (loadError) return <div>Error loading maps.</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={8}
      center={center}
      onLoad={(map) => setMapInstance(map)}
    >
      {segments.map((segment, key) => (
        <Polyline
          key={`line-${segment.id}-${key}`}
          path={[
            { lat: segment.startLat, lng: segment.startLng },
            { lat: segment.endLat, lng: segment.endLng },
          ]}
          options={{
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 3,
          }}
        />
      ))}
      {segments.flatMap((segment, key) => [
        <Marker
          key={`start-${segment.id}-${key}`}
          position={{ lat: segment.startLat, lng: segment.startLng }}
          title={`Start: ${segment.startTitle}`}
          label="S"
          onClick={() => setActiveMarker(`start-${segment.id}`)}
        />,
        <Marker
          key={`end-${segment.id}-${key}`}
          position={{ lat: segment.endLat, lng: segment.endLng }}
          title={`End: ${segment.endTitle}`}
          label="E"
          onClick={() => setActiveMarker(`end-${segment.id}`)}
        />,
        activeMarker === `start-${segment.id}` && (
          <InfoWindow
            key={`start-info-${segment.id}-${key}`}
            position={{ lat: segment.startLat, lng: segment.startLng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="text-sm">
              <div className="font-semibold">{segment.name}</div>
              <div className="text-xs text-gray-500">
                {segment.segmentType.name}
              </div>
              <div>Start: {segment.startTitle}</div>
              {segmentTimeZones[segment.id]?.startTimeZoneName && (
                <div className="text-xs text-gray-500">
                  {segmentTimeZones[segment.id]?.startTimeZoneName}
                </div>
              )}
              {segment.startTime && (
                <div>
                  {formatDateTimeInTimeZone(
                    new Date(segment.startTime),
                    segmentTimeZones[segment.id]?.startTimeZoneId
                  )}
                </div>
              )}
              {segment.notes && <div className="text-xs mt-1">{segment.notes}</div>}
            </div>
          </InfoWindow>
        ),
        activeMarker === `end-${segment.id}` && (
          <InfoWindow
            key={`end-info-${segment.id}-${key}`}
            position={{ lat: segment.endLat, lng: segment.endLng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="text-sm">
              <div className="font-semibold">{segment.name}</div>
              <div className="text-xs text-gray-500">
                {segment.segmentType.name}
              </div>
              <div>End: {segment.endTitle}</div>
              {segmentTimeZones[segment.id]?.endTimeZoneName && (
                <div className="text-xs text-gray-500">
                  {segmentTimeZones[segment.id]?.endTimeZoneName}
                </div>
              )}
              {segment.endTime && (
                <div>
                  {formatDateTimeInTimeZone(
                    new Date(segment.endTime),
                    segmentTimeZones[segment.id]?.endTimeZoneId
                  )}
                </div>
              )}
              {segment.notes && <div className="text-xs mt-1">{segment.notes}</div>}
            </div>
          </InfoWindow>
        ),
      ])}
    </GoogleMap>
  );
}
