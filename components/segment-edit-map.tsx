"use client"

import { useEffect, useState, useCallback } from "react"
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api"
import { useRouter } from "next/navigation"
import { formatLocalDate, formatLocalTime } from "@/lib/utils/local-time"
import { Plane, Hotel, Utensils, Train, Car, Ticket, MapPin, ExternalLink } from "lucide-react"
import type { Reservation, ReservationType, ReservationCategory } from "@prisma/client"

interface SegmentReservation {
  id: string
  name: string
  location: string | null
  latitude: number | null
  longitude: number | null
  departureLocation: string | null
  arrivalLocation: string | null
  wall_start_date: Date | null
  wall_start_time: Date | null
  reservationType: ReservationType & {
    category: ReservationCategory
  }
}

interface SegmentEditMapProps {
  reservations: SegmentReservation[]
  currentReservationId: string
  segmentName?: string
  height?: string
}

interface MapMarker {
  id: string
  lat: number
  lng: number
  name: string
  location: string
  categoryName: string
  isCurrent: boolean
  startDate?: Date | null
  startTime?: Date | null
}

const containerStyle = { width: "100%", height: "100%" }

// Get marker icon URL based on category
function getMarkerIcon(categoryName: string, isCurrent: boolean): string {
  const category = categoryName.toLowerCase()
  
  // Color mapping for categories
  const markerColors: Record<string, string> = {
    travel: "red",
    flight: "red",
    stay: "blue",
    hotel: "blue",
    lodging: "blue",
    dining: "orange",
    restaurant: "orange",
    food: "orange",
    activity: "green",
    attraction: "green",
  }

  const color = markerColors[category] || "purple"
  
  // Current reservation gets a larger, highlighted marker
  if (isCurrent) {
    return `http://maps.google.com/mapfiles/ms/icons/${color}.png`
  }
  
  return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
}

// Get category icon component
function getCategoryIcon(categoryName: string) {
  switch (categoryName.toLowerCase()) {
    case "travel":
    case "flight":
      return <Plane className="h-4 w-4" />
    case "stay":
    case "hotel":
    case "lodging":
      return <Hotel className="h-4 w-4" />
    case "dining":
    case "restaurant":
      return <Utensils className="h-4 w-4" />
    case "activity":
      return <Ticket className="h-4 w-4" />
    default:
      return <MapPin className="h-4 w-4" />
  }
}

export function SegmentEditMap({
  reservations,
  currentReservationId,
  segmentName,
  height = "300px",
}: SegmentEditMapProps) {
  const router = useRouter()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  })

  // Extract markers from reservations
  useEffect(() => {
    const newMarkers: MapMarker[] = []
    
    reservations.forEach((res) => {
      const isCurrent = res.id === currentReservationId
      
      // Check if reservation has coordinates
      if (res.latitude && res.longitude) {
        newMarkers.push({
          id: res.id,
          lat: res.latitude,
          lng: res.longitude,
          name: res.name,
          location: res.location || "",
          categoryName: res.reservationType.category.name,
          isCurrent,
          startDate: res.wall_start_date,
          startTime: res.wall_start_time,
        })
      }
    })
    
    setMarkers(newMarkers)
  }, [reservations, currentReservationId])

  // Fit bounds when markers change
  useEffect(() => {
    if (!mapInstance || markers.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    markers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng })
    })

    // Add some padding
    mapInstance.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 })
    
    // Don't zoom in too much for single marker
    const listener = google.maps.event.addListenerOnce(mapInstance, "idle", () => {
      const zoom = mapInstance.getZoom()
      if (zoom && zoom > 15) {
        mapInstance.setZoom(15)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [mapInstance, markers])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map)
  }, [])

  const handleMarkerClick = (markerId: string) => {
    if (markerId === currentReservationId) {
      // Just show info window for current reservation
      setActiveMarker(markerId)
    } else {
      setActiveMarker(markerId)
    }
  }

  const handleEditClick = (reservationId: string) => {
    router.push(`/reservation/${reservationId}/edit`)
  }

  if (loadError) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 rounded-lg"
        style={{ height }}
      >
        <p className="text-slate-500 text-sm">Error loading map</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 rounded-lg animate-pulse"
        style={{ height }}
      >
        <p className="text-slate-500 text-sm">Loading map...</p>
      </div>
    )
  }

  if (markers.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200"
        style={{ height }}
      >
        <MapPin className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-slate-500 text-sm">No locations to display</p>
        <p className="text-slate-400 text-xs mt-1">Add location details to see them on the map</p>
      </div>
    )
  }

  // Calculate center from markers
  const center = {
    lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
    lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{
              url: getMarkerIcon(marker.categoryName, marker.isCurrent),
              scaledSize: marker.isCurrent 
                ? new google.maps.Size(40, 40)
                : new google.maps.Size(32, 32),
            }}
            onClick={() => handleMarkerClick(marker.id)}
            animation={marker.isCurrent ? google.maps.Animation.BOUNCE : undefined}
            zIndex={marker.isCurrent ? 1000 : 1}
          />
        ))}

        {activeMarker && (() => {
          const marker = markers.find((m) => m.id === activeMarker)
          if (!marker) return null

          return (
            <InfoWindow
              position={{ lat: marker.lat, lng: marker.lng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-1 min-w-[180px]">
                <div className="flex items-start gap-2">
                  <div className="text-slate-500 mt-0.5">
                    {getCategoryIcon(marker.categoryName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm truncate">
                      {marker.name}
                    </h4>
                    {marker.location && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {marker.location}
                      </p>
                    )}
                    {marker.startDate && (
                      <p className="text-xs text-slate-400 mt-1">
                        {formatLocalDate(marker.startDate)}
                        {marker.startTime && ` at ${formatLocalTime(marker.startTime)}`}
                      </p>
                    )}
                  </div>
                </div>
                
                {marker.isCurrent ? (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-medium text-blue-600">
                      Currently editing
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(marker.id)}
                    className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1 
                      text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Edit this reservation
                  </button>
                )}
              </div>
            </InfoWindow>
          )
        })()}
      </GoogleMap>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1.5 text-xs shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-slate-600">Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-500">Other</span>
          </div>
        </div>
      </div>
    </div>
  )
}
