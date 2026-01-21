"use client";

import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";

interface FlightMapProps {
  departureLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  arrivalLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
}

const containerStyle = { width: "100%", height: "100%" };

// Generate curved path points for a great circle arc
function generateCurvedPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints: number = 50
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  
  // Convert to radians
  const lat1 = (start.lat * Math.PI) / 180;
  const lng1 = (start.lng * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const lng2 = (end.lng * Math.PI) / 180;
  
  // Calculate the angular distance
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng2 - lng1) / 2), 2)
    )
  );
  
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);
    
    points.push({
      lat: (lat * 180) / Math.PI,
      lng: (lng * 180) / Math.PI,
    });
  }
  
  return points;
}

// Calculate distance in kilometers
function calculateDistance(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function FlightMap({
  departureLocation,
  arrivalLocation,
}: FlightMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // Calculate center and curved path
  const { center, curvedPath, distance } = useMemo(() => {
    if (!departureLocation || !arrivalLocation) {
      return { center: { lat: 40, lng: -40 }, curvedPath: [], distance: 0 };
    }

    const centerLat = (departureLocation.lat + arrivalLocation.lat) / 2;
    const centerLng = (departureLocation.lng + arrivalLocation.lng) / 2;
    
    const path = generateCurvedPath(
      { lat: departureLocation.lat, lng: departureLocation.lng },
      { lat: arrivalLocation.lat, lng: arrivalLocation.lng }
    );
    
    const dist = calculateDistance(
      { lat: departureLocation.lat, lng: departureLocation.lng },
      { lat: arrivalLocation.lat, lng: arrivalLocation.lng }
    );

    return {
      center: { lat: centerLat, lng: centerLng },
      curvedPath: path,
      distance: dist,
    };
  }, [departureLocation, arrivalLocation]);

  // Fit bounds when locations change
  useEffect(() => {
    if (!mapInstance || !departureLocation || !arrivalLocation) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: departureLocation.lat, lng: departureLocation.lng });
    bounds.extend({ lat: arrivalLocation.lat, lng: arrivalLocation.lng });
    
    // Add some padding
    mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [mapInstance, departureLocation, arrivalLocation]);

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Google Maps API key not configured</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-red-500">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading map...</span>
        </div>
      </div>
    );
  }

  const hasLocations = departureLocation && arrivalLocation;

  return (
    <div className="h-full relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={hasLocations ? 4 : 2}
        center={center}
        onLoad={(map) => setMapInstance(map)}
        options={{
          styles: [
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
            },
          ],
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* Curved flight path */}
        {hasLocations && curvedPath.length > 0 && (
          <Polyline
            path={curvedPath}
            options={{
              strokeColor: "#2563eb",
              strokeOpacity: 0.8,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        )}

        {/* Departure marker */}
        {departureLocation && (
          <Marker
            position={{ lat: departureLocation.lat, lng: departureLocation.lng }}
            title={`Departure: ${departureLocation.name}`}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}

        {/* Arrival marker */}
        {arrivalLocation && (
          <Marker
            position={{ lat: arrivalLocation.lat, lng: arrivalLocation.lng }}
            title={`Arrival: ${arrivalLocation.name}`}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}

        {/* Airplane icon at midpoint */}
        {hasLocations && curvedPath.length > 0 && (
          <Marker
            position={curvedPath[Math.floor(curvedPath.length / 2)]}
            icon={{
              path: "M21,16v-2l-8-5V3.5C13,2.67,12.33,2,11.5,2S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z",
              fillColor: "#1e40af",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1,
              scale: 1.5,
              anchor: new google.maps.Point(12, 12),
              rotation: calculateBearing(
                departureLocation,
                arrivalLocation
              ),
            }}
          />
        )}
      </GoogleMap>

      {/* Distance overlay */}
      {hasLocations && distance > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-medium text-gray-700">
              {distance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} km
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              {(distance * 0.621371).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} mi
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      {hasLocations && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
              <span className="text-gray-600 truncate max-w-[150px]">{departureLocation.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white shadow"></div>
              <span className="text-gray-600 truncate max-w-[150px]">{arrivalLocation.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasLocations && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-sm">Enter departure and arrival locations to see the flight path</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Calculate bearing between two points for airplane rotation
function calculateBearing(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const dLng = endLng - startLng;

  const x = Math.sin(dLng) * Math.cos(endLat);
  const y = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = Math.atan2(x, y);
  return ((bearing * 180) / Math.PI + 360) % 360;
}

