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
import { formatLocalDate, formatLocalTime } from "@/lib/utils/local-time";
import { useRoadRoutes, isGroundTransportSegment } from "@/hooks/use-road-routes";

interface TripReservationsMapProps {
  trip: GlobeTripData;
  height?: string;
  selectedSegmentId?: string | null;
  selectedReservationId?: string | null;
  mapTypeId?: "roadmap" | "satellite" | "hybrid" | "terrain";
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

// Get timezone abbreviation from lat/lng
function getTimezoneAbbreviation(lat: number, lng: number, date?: Date): string {
  try {
    const targetDate = date || new Date()
    
    // Use Intl.DateTimeFormat to get timezone info
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeZoneName: 'short'
    })
    
    // This is a simplified approach - in production, you'd want to use a proper
    // timezone lookup library or API that maps lat/lng to timezone
    // For now, we'll return a generic label
    const parts = formatter.formatToParts(targetDate)
    const timeZonePart = parts.find(part => part.type === 'timeZoneName')
    
    return timeZonePart?.value || 'Local Time'
  } catch (error) {
    return 'Local Time'
  }
}

export function TripReservationsMap({ 
  trip, 
  height = "600px",
  selectedSegmentId,
  selectedReservationId,
  mapTypeId = "roadmap"
}: TripReservationsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // Road routes for ground transport
  const { routes: roadRoutes, fetchRoutes } = useRoadRoutes();

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

  // Fetch road routes for ground transport markers
  useEffect(() => {
    const groundMarkers = markers.filter(marker => {
      if (!marker.isRoute || !marker.endLat || !marker.endLng) return false;
      const category = marker.reservation.reservationType.category.name.toLowerCase();
      // Ground transport categories (not flights)
      return !category.includes('flight') && !category.includes('air') && (
        category.includes('transport') ||
        category.includes('car') ||
        category.includes('train') ||
        category.includes('bus') ||
        category.includes('ferry') ||
        category.includes('driver')
      );
    });

    if (groundMarkers.length > 0) {
      const requests = groundMarkers.map(marker => ({
        id: marker.id,
        originLat: marker.lat,
        originLng: marker.lng,
        destLat: marker.endLat!,
        destLng: marker.endLng!,
      }));
      fetchRoutes(requests);
    }
  }, [markers, fetchRoutes]);

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
          mapTypeId: mapTypeId,
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
          const category = marker.reservation.reservationType.category.name.toLowerCase();
          const isTransportation = 
            category.includes('transport') ||
            category.includes('flight') ||
            category.includes('train') ||
            category.includes('bus') ||
            category.includes('car');
          
          // Check if this is ground transport (not a flight)
          const isGroundTransport = isTransportation && 
            !category.includes('flight') && 
            !category.includes('air');
          
          // Use road route if available for ground transport, otherwise straight line as fallback
          const roadRoute = isGroundTransport ? roadRoutes.get(marker.id) : null;
          const routePath = roadRoute && roadRoute.path.length > 0
            ? roadRoute.path
            : marker.isRoute && marker.endLat && marker.endLng
              ? [
                  { lat: marker.lat, lng: marker.lng },
                  { lat: marker.endLat, lng: marker.endLng },
                ]
              : null;

          return (
            <div key={marker.id}>
              {marker.isRoute && marker.endLat && marker.endLng ? (
                <>
                  {/* Route polyline - road path for ground transport (or straight line while loading), geodesic for flights */}
                  {routePath && (
                    <Polyline
                      path={routePath}
                      options={{
                        strokeColor: marker.segmentColor,
                        strokeOpacity: isTransportation ? 0.8 : 0.6,
                        strokeWeight: isTransportation ? 2.5 : 2,
                        geodesic: !isGroundTransport, // Geodesic for flights, not for road routes
                        icons: isTransportation && !isGroundTransport
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
                  )}
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
                    {marker.reservation.wall_start_date && (
                      <div className="text-xs">
                        <span className="font-medium">Time:</span>{" "}
                        {formatLocalDate(marker.reservation.wall_start_date, 'short')}
                        {marker.reservation.wall_start_time && ` ${formatLocalTime(marker.reservation.wall_start_time, '12h')}`}
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
