"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import type { GlobeTripData, GlobeReservation } from "@/lib/globe-types";

interface TripReservationsMapProps {
  trip: GlobeTripData;
  height?: string;
  selectedSegmentId?: string | null;
  selectedReservationId?: string | null;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  reservation: GlobeReservation;
  segmentName: string;
  segmentColor: string;
  isRoute: boolean;
  endLat?: number;
  endLng?: number;
}

const containerStyle = { width: "100%", height: "100%" };

// Get marker icon URL based on reservation category
function getMarkerIcon(categoryName: string): string {
  const category = categoryName.toLowerCase();
  
  // Google Maps marker colors
  const markerColors: Record<string, string> = {
    flight: "red",
    hotel: "blue",
    lodging: "blue",
    accommodation: "blue",
    restaurant: "orange",
    dining: "orange",
    food: "orange",
    activity: "green",
    attraction: "green",
    entertainment: "green",
    transport: "purple",
    transportation: "purple",
    car: "purple",
    train: "purple",
    bus: "purple",
  };

  const color = markerColors[category] || "red";
  
  // Use Google Maps default colored markers
  return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
}

export function TripReservationsMap({ 
  trip, 
  height = "600px",
  selectedSegmentId,
  selectedReservationId 
}: TripReservationsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // Generate color for each segment
  const getSegmentColor = (segmentId: string, index: number) => {
    const colors = [
      "#ef4444", // red
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#14b8a6", // teal
      "#f97316", // orange
    ];
    return colors[index % colors.length];
  };

  // Process all reservations from all segments (with filtering)
  useEffect(() => {
    const processedMarkers: MapMarker[] = [];

    // Filter segments based on selection
    const segmentsToShow = selectedSegmentId
      ? trip.segments.filter((s) => s.id === selectedSegmentId)
      : trip.segments;

    segmentsToShow.forEach((segment, segmentIndex) => {
      const segmentColor = getSegmentColor(segment.id, segmentIndex);

      // Filter reservations based on selection
      const reservationsToShow = selectedReservationId
        ? segment.reservations.filter((r) => r.id === selectedReservationId)
        : segment.reservations;

      reservationsToShow.forEach((reservation) => {
        // Check if reservation has different start and end locations (e.g., flights)
        if (
          reservation.departureLocation &&
          reservation.arrivalLocation &&
          reservation.departureLocation !== reservation.arrivalLocation
        ) {
          // Route reservation - use segment coordinates as approximation
          processedMarkers.push({
            id: reservation.id,
            lat: segment.startLat,
            lng: segment.startLng,
            reservation,
            segmentName: segment.name,
            segmentColor,
            isRoute: true,
            endLat: segment.endLat,
            endLng: segment.endLng,
          });
        } else if (reservation.location) {
          // Single location - use segment start as approximation
          processedMarkers.push({
            id: reservation.id,
            lat: segment.startLat,
            lng: segment.startLng,
            reservation,
            segmentName: segment.name,
            segmentColor,
            isRoute: false,
          });
        }
      });
    });

    setMarkers(processedMarkers);
  }, [trip, selectedSegmentId, selectedReservationId]);

  // Fit map bounds to show all markers (respecting filters)
  useEffect(() => {
    if (!mapInstance || trip.segments.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    // Filter segments based on selection
    const segmentsToShow = selectedSegmentId
      ? trip.segments.filter((s) => s.id === selectedSegmentId)
      : trip.segments;

    // Add visible segment start/end points to bounds
    segmentsToShow.forEach((segment) => {
      bounds.extend({ lat: segment.startLat, lng: segment.startLng });
      bounds.extend({ lat: segment.endLat, lng: segment.endLng });
    });

    mapInstance.fitBounds(bounds);
  }, [mapInstance, trip.segments, selectedSegmentId, selectedReservationId]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Missing Google Maps API key
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Error loading maps
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const center =
    trip.segments.length > 0
      ? { lat: trip.segments[0].startLat, lng: trip.segments[0].startLng }
      : { lat: 0, lng: 0 };

  return (
    <div style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={4}
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
        {/* Flight segment path lines - dashed lines for flight segments */}
        {(selectedSegmentId
          ? trip.segments.filter((s) => s.id === selectedSegmentId)
          : trip.segments
        )
          .filter((segment) => 
            segment.segmentType.name.toLowerCase().includes('flight') ||
            segment.segmentType.name.toLowerCase().includes('air')
          )
          .map((segment, index) => (
            <Polyline
              key={`segment-${segment.id}`}
              path={[
                { lat: segment.startLat, lng: segment.startLng },
                { lat: segment.endLat, lng: segment.endLng },
              ]}
              options={{
                strokeColor: getSegmentColor(segment.id, index),
                strokeOpacity: 0.7,
                strokeWeight: 2,
                geodesic: true,
                icons: [
                  {
                    icon: {
                      path: "M 0,-1 0,1",
                      strokeOpacity: 1,
                      scale: 3,
                    },
                    offset: "0",
                    repeat: "20px",
                  },
                ],
              }}
            />
          ))}

        {/* Reservation markers */}
        {markers.map((marker) => {
          const isTransportation = 
            marker.reservation.reservationType.category.name.toLowerCase().includes('transport') ||
            marker.reservation.reservationType.category.name.toLowerCase().includes('flight') ||
            marker.reservation.reservationType.category.name.toLowerCase().includes('train') ||
            marker.reservation.reservationType.category.name.toLowerCase().includes('bus') ||
            marker.reservation.reservationType.category.name.toLowerCase().includes('car');

          return (
            <div key={marker.id}>
              {marker.isRoute && marker.endLat && marker.endLng ? (
                <>
                  {/* Dashed route polyline for transportation reservations */}
                  <Polyline
                    path={[
                      { lat: marker.lat, lng: marker.lng },
                      { lat: marker.endLat, lng: marker.endLng },
                    ]}
                    options={{
                      strokeColor: marker.segmentColor,
                      strokeOpacity: isTransportation ? 0.8 : 0.6,
                      strokeWeight: isTransportation ? 2.5 : 2,
                      geodesic: true,
                      icons: isTransportation
                        ? [
                            {
                              icon: {
                                path: "M 0,-1 0,1",
                                strokeOpacity: 1,
                                scale: 3,
                              },
                              offset: "0",
                              repeat: "20px",
                            },
                            {
                              icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              },
                              offset: "100%",
                            },
                          ]
                        : [
                            {
                              icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              },
                              offset: "100%",
                            },
                          ],
                    }}
                  />
                  {/* Start marker for route */}
                  <Marker
                    position={{ lat: marker.lat, lng: marker.lng }}
                    title={marker.reservation.name}
                    onClick={() => setActiveMarker(marker.id)}
                    icon={{
                      url: getMarkerIcon(marker.reservation.reservationType.category.name),
                      scaledSize: new google.maps.Size(32, 32),
                    }}
                  />
                  {/* End marker for route */}
                  <Marker
                    position={{ lat: marker.endLat, lng: marker.endLng }}
                    title={`${marker.reservation.name} - Arrival`}
                    icon={{
                      url: getMarkerIcon(marker.reservation.reservationType.category.name),
                      scaledSize: new google.maps.Size(32, 32),
                    }}
                  />
                </>
              ) : (
                /* Single location marker with icon */
                <Marker
                  position={{ lat: marker.lat, lng: marker.lng }}
                  title={marker.reservation.name}
                  onClick={() => setActiveMarker(marker.id)}
                  icon={{
                    url: getMarkerIcon(marker.reservation.reservationType.category.name),
                    scaledSize: new google.maps.Size(32, 32),
                  }}
                />
              )}

              {/* Info window */}
              {activeMarker === marker.id && (
              <InfoWindow
                position={{ lat: marker.lat, lng: marker.lng }}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="text-sm max-w-xs p-2">
                  <div className="font-semibold text-base mb-1">
                    {marker.reservation.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {marker.segmentName}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs">
                      <span className="font-medium">Type:</span>{" "}
                      {marker.reservation.reservationType.category.name}
                    </div>
                    {marker.reservation.location && (
                      <div className="text-xs">
                        <span className="font-medium">Location:</span>{" "}
                        {marker.reservation.location}
                      </div>
                    )}
                    {marker.reservation.departureLocation &&
                      marker.reservation.arrivalLocation && (
                        <div className="text-xs">
                          <span className="font-medium">Route:</span>{" "}
                          {marker.reservation.departureLocation} →{" "}
                          {marker.reservation.arrivalLocation}
                        </div>
                      )}
                    {marker.reservation.startTime && (
                      <div className="text-xs">
                        <span className="font-medium">Time:</span>{" "}
                        {new Date(marker.reservation.startTime).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    )}
                    {marker.reservation.confirmationNumber && (
                      <div className="text-xs">
                        <span className="font-medium">Confirmation:</span>{" "}
                        {marker.reservation.confirmationNumber}
                      </div>
                    )}
                  </div>
                </div>
              </InfoWindow>
              )}
            </div>
          );
        })}
      </GoogleMap>
    </div>
  );
}
