"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import type { GlobeReservation } from "@/lib/globe-types";

interface SegmentReservationMapProps {
  reservations: GlobeReservation[];
  segmentStartLat: number;
  segmentStartLng: number;
  segmentEndLat: number;
  segmentEndLng: number;
}

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  reservation: GlobeReservation;
  isRoute: boolean;
  endLat?: number;
  endLng?: number;
}

const containerStyle = { width: "100%", height: "300px" };

export default function SegmentReservationMap({
  reservations,
  segmentStartLat,
  segmentStartLng,
  segmentEndLat,
  segmentEndLng,
}: SegmentReservationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // Process reservations into markers
  useEffect(() => {
    const processedMarkers: MarkerData[] = [];

    reservations.forEach((reservation) => {
      // Check if reservation has different start and end locations
      if (
        reservation.departureLocation &&
        reservation.arrivalLocation &&
        reservation.departureLocation !== reservation.arrivalLocation
      ) {
        // This is a route (e.g., flight) - we'll need to geocode or use segment coords
        // For now, use segment start/end as approximation
        processedMarkers.push({
          id: reservation.id,
          lat: segmentStartLat,
          lng: segmentStartLng,
          title: `${reservation.name} - ${reservation.departureLocation}`,
          reservation,
          isRoute: true,
          endLat: segmentEndLat,
          endLng: segmentEndLng,
        });
      } else if (reservation.location) {
        // Single location - use segment start as approximation
        // In a real app, you'd geocode the location string
        processedMarkers.push({
          id: reservation.id,
          lat: segmentStartLat,
          lng: segmentStartLng,
          title: `${reservation.name} - ${reservation.location}`,
          reservation,
          isRoute: false,
        });
      }
    });

    setMarkers(processedMarkers);
  }, [reservations, segmentStartLat, segmentStartLng, segmentEndLat, segmentEndLng]);

  // Fit map bounds to show all markers
  useEffect(() => {
    if (!mapInstance || markers.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    
    // Add segment bounds
    bounds.extend({ lat: segmentStartLat, lng: segmentStartLng });
    bounds.extend({ lat: segmentEndLat, lng: segmentEndLng });

    // Add marker bounds
    markers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
      if (marker.isRoute && marker.endLat && marker.endLng) {
        bounds.extend({ lat: marker.endLat, lng: marker.endLng });
      }
    });

    mapInstance.fitBounds(bounds);
  }, [mapInstance, markers, segmentStartLat, segmentStartLng, segmentEndLat, segmentEndLng]);

  if (!apiKey) return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  if (loadError) return <div className="text-sm text-destructive">Error loading maps.</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading map...</div>;

  const center = { lat: segmentStartLat, lng: segmentStartLng };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={8}
      center={center}
      onLoad={(map) => setMapInstance(map)}
      options={{
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      }}
    >
      {/* Segment boundary line */}
      <Polyline
        path={[
          { lat: segmentStartLat, lng: segmentStartLng },
          { lat: segmentEndLat, lng: segmentEndLng },
        ]}
        options={{
          strokeColor: "#94a3b8",
          strokeOpacity: 0.4,
          strokeWeight: 2,
          geodesic: true,
        }}
      />

      {/* Segment start marker */}
      <Marker
        position={{ lat: segmentStartLat, lng: segmentStartLng }}
        title="Segment Start"
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#3b82f6",
          fillOpacity: 0.6,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        }}
      />

      {/* Segment end marker */}
      <Marker
        position={{ lat: segmentEndLat, lng: segmentEndLng }}
        title="Segment End"
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#3b82f6",
          fillOpacity: 0.6,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        }}
      />

      {/* Reservation markers and routes */}
      {markers.map((marker) => (
        <div key={marker.id}>
          {marker.isRoute && marker.endLat && marker.endLng ? (
            <>
              {/* Route polyline */}
              <Polyline
                path={[
                  { lat: marker.lat, lng: marker.lng },
                  { lat: marker.endLat, lng: marker.endLng },
                ]}
                options={{
                  strokeColor: "#ef4444",
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
              {/* Start marker for route */}
              <Marker
                position={{ lat: marker.lat, lng: marker.lng }}
                title={marker.title}
                onClick={() => setActiveMarker(marker.id)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
              {/* End marker for route */}
              <Marker
                position={{ lat: marker.endLat, lng: marker.endLng }}
                title={`${marker.reservation.name} - ${marker.reservation.arrivalLocation}`}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
            </>
          ) : (
            /* Single location marker */
            <Marker
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.title}
              onClick={() => setActiveMarker(marker.id)}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
              }}
            />
          )}

          {/* Info window */}
          {activeMarker === marker.id && (
            <InfoWindow
              position={{ lat: marker.lat, lng: marker.lng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="text-sm max-w-xs">
                <div className="font-semibold">{marker.reservation.name}</div>
                <div className="text-xs text-gray-500 mb-1">
                  {marker.reservation.reservationType.category.name} -{" "}
                  {marker.reservation.reservationType.name}
                </div>
                {marker.reservation.location && (
                  <div className="text-xs">
                    <strong>Location:</strong> {marker.reservation.location}
                  </div>
                )}
                {marker.reservation.departureLocation &&
                  marker.reservation.arrivalLocation && (
                    <div className="text-xs">
                      <strong>Route:</strong> {marker.reservation.departureLocation}{" "}
                      → {marker.reservation.arrivalLocation}
                    </div>
                  )}
                {marker.reservation.startTime && (
                  <div className="text-xs">
                    <strong>Time:</strong>{" "}
                    {new Date(marker.reservation.startTime).toLocaleString()}
                  </div>
                )}
                {marker.reservation.confirmationNumber && (
                  <div className="text-xs">
                    <strong>Confirmation:</strong>{" "}
                    {marker.reservation.confirmationNumber}
                  </div>
                )}
                {marker.reservation.notes && (
                  <div className="text-xs mt-1 italic">
                    {marker.reservation.notes}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </div>
      ))}
    </GoogleMap>
  );
}
