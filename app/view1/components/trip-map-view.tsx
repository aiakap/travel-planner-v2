"use client"

import { useEffect, useState } from "react"
import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api"
import type { ViewItinerary, ViewReservation } from "@/lib/itinerary-view-types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, MapPin } from "lucide-react"
import { chatAboutSegment, chatAboutReservation } from "../lib/chat-integration"
import { useRoadRoutes, isGroundTransportSegment } from "@/hooks/use-road-routes"

interface TripMapViewProps {
  itinerary: ViewItinerary
  selectedSegmentId: string | null
  selectedReservationId: string | null
  filterByType: string[]
  onSegmentClick: (id: string | null) => void
  onReservationClick: (id: string | null) => void
}

const containerStyle = { width: "100%", height: "100%" }

// Get marker icon URL based on reservation type
function getMarkerIcon(type: ViewReservation['type']): string {
  const colors: Record<string, string> = {
    flight: "red",
    hotel: "blue",
    restaurant: "orange",
    activity: "green",
    transport: "purple",
  }
  const color = colors[type] || "red"
  return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
}

export function TripMapView({
  itinerary,
  selectedSegmentId,
  selectedReservationId,
  filterByType,
  onSegmentClick,
  onReservationClick,
}: TripMapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  })

  // Road routes for ground transport segments
  const { routes: roadRoutes, fetchRoutes, isLoading: isLoadingRoutes } = useRoadRoutes()

  // Filter segments and reservations
  const visibleSegments = selectedSegmentId
    ? itinerary.segments.filter(s => s.id === selectedSegmentId)
    : itinerary.segments

  const visibleReservations = visibleSegments.flatMap(segment =>
    segment.reservations
      .filter(r => filterByType.length === 0 || filterByType.includes(r.type))
      .filter(r => !selectedReservationId || r.id === selectedReservationId)
      .map(r => ({ ...r, segment, segmentColor: itinerary.segmentColors[segment.id] }))
  )

  // Fetch road routes for ground transport segments
  useEffect(() => {
    const groundSegments = visibleSegments.filter(
      segment => isGroundTransportSegment(segment.segmentType)
    )

    if (groundSegments.length > 0) {
      const requests = groundSegments.map(segment => ({
        id: segment.id,
        originLat: segment.startLat,
        originLng: segment.startLng,
        destLat: segment.endLat,
        destLng: segment.endLng,
      }))
      fetchRoutes(requests)
    }
  }, [visibleSegments, fetchRoutes])

  // Fit map bounds to show all visible segments (including road route paths)
  useEffect(() => {
    if (!mapInstance || visibleSegments.length === 0) {
      return
    }

    const bounds = new google.maps.LatLngBounds()
    visibleSegments.forEach(segment => {
      // If we have a road route for this segment, use its path for bounds
      const roadRoute = roadRoutes.get(segment.id)
      if (roadRoute && roadRoute.path.length > 0) {
        roadRoute.path.forEach(point => {
          bounds.extend({ lat: point.lat, lng: point.lng })
        })
      } else {
        bounds.extend({ lat: segment.startLat, lng: segment.startLng })
        bounds.extend({ lat: segment.endLat, lng: segment.endLng })
      }
    })
    mapInstance.fitBounds(bounds)
  }, [mapInstance, visibleSegments, selectedSegmentId, roadRoutes])

  if (!apiKey) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Missing Google Maps API key</p>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-destructive">Error loading maps</p>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </Card>
    )
  }

  const center =
    visibleSegments.length > 0
      ? { lat: visibleSegments[0].startLat, lng: visibleSegments[0].startLng }
      : { lat: 0, lng: 0 }

  return (
    <Card className="h-full overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={4}
        center={center}
        onLoad={map => setMapInstance(map)}
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
        {/* Segment Polylines */}
        {visibleSegments.map(segment => {
          const color = itinerary.segmentColors[segment.id]
          const isFlightSegment = segment.segmentType.toLowerCase().includes('flight') ||
                                  segment.segmentType.toLowerCase().includes('air')
          const isGroundSegment = isGroundTransportSegment(segment.segmentType)
          
          // Use road route path if available for ground transport, otherwise straight line as fallback
          const roadRoute = isGroundSegment ? roadRoutes.get(segment.id) : null
          const path = roadRoute && roadRoute.path.length > 0
            ? roadRoute.path
            : [
                { lat: segment.startLat, lng: segment.startLng },
                { lat: segment.endLat, lng: segment.endLng },
              ]

          return (
            <Polyline
              key={segment.id}
              path={path}
              options={{
                strokeColor: color,
                strokeOpacity: 0.7,
                strokeWeight: 3,
                geodesic: !isGroundSegment, // Geodesic for flights, not for road routes
                icons: isFlightSegment
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
                    ]
                  : undefined,
              }}
              onClick={() => onSegmentClick(segment.id)}
            />
          )
        })}

        {/* Start/End Markers for Segments */}
        {visibleSegments.map(segment => {
          const color = itinerary.segmentColors[segment.id]
          
          return (
            <div key={`segment-markers-${segment.id}`}>
              <Marker
                position={{ lat: segment.startLat, lng: segment.startLng }}
                title={segment.startTitle}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: color,
                  fillOpacity: 0.8,
                  strokeColor: "white",
                  strokeWeight: 2,
                  scale: 8,
                }}
                onClick={() => onSegmentClick(segment.id)}
              />
              <Marker
                position={{ lat: segment.endLat, lng: segment.endLng }}
                title={segment.endTitle}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: color,
                  fillOpacity: 0.8,
                  strokeColor: "white",
                  strokeWeight: 2,
                  scale: 8,
                }}
                onClick={() => onSegmentClick(segment.id)}
              />
            </div>
          )
        })}

        {/* Reservation Markers */}
        {visibleReservations.map(reservation => {
          // Use reservation coordinates if available, otherwise use segment start
          const lat = reservation.latitude || reservation.segment.startLat
          const lng = reservation.longitude || reservation.segment.startLng

          return (
            <Marker
              key={reservation.id}
              position={{ lat, lng }}
              title={reservation.title}
              onClick={() => {
                setActiveMarker(reservation.id)
                onReservationClick(reservation.id)
              }}
              icon={{
                url: getMarkerIcon(reservation.type),
                scaledSize: new google.maps.Size(32, 32),
              }}
            >
              {activeMarker === reservation.id && (
                <InfoWindow
                  position={{ lat, lng }}
                  onCloseClick={() => {
                    setActiveMarker(null)
                    onReservationClick(null)
                  }}
                >
                  <div className="text-sm max-w-xs p-2">
                    <div className="font-semibold text-base mb-1">
                      {reservation.title}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {reservation.segment.title}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">Type:</span> {reservation.description}
                      </div>
                      {reservation.location && (
                        <div className="text-xs">
                          <span className="font-medium">Location:</span> {reservation.location}
                        </div>
                      )}
                      {reservation.time && (
                        <div className="text-xs">
                          <span className="font-medium">Time:</span> {reservation.time}
                        </div>
                      )}
                      {reservation.price > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Cost:</span> ${reservation.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 gap-2"
                      onClick={() => chatAboutReservation(itinerary.id, reservation, reservation.segment.id, 'map')}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Chat About This
                    </Button>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )
        })}
      </GoogleMap>
    </Card>
  )
}
