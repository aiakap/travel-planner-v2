"use client";

import { GoogleMap, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, MapPin, Ruler } from "lucide-react";
import { MapLoaderWrapper, trackMapUsage } from "./admin-map-loader";

const containerStyle = { width: "100%", height: "400px" };

// Re-export airport coordinates from demo
export const airportCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  JFK: { lat: 40.6413, lng: -73.7781, name: "New York JFK" },
  CDG: { lat: 49.0097, lng: 2.5479, name: "Paris CDG" },
  LHR: { lat: 51.4700, lng: -0.4543, name: "London Heathrow" },
  DXB: { lat: 25.2532, lng: 55.3657, name: "Dubai DXB" },
  LAX: { lat: 33.9416, lng: -118.4085, name: "Los Angeles LAX" },
  SFO: { lat: 37.6213, lng: -122.3790, name: "San Francisco SFO" },
  ORD: { lat: 41.9742, lng: -87.9073, name: "Chicago O'Hare" },
  MIA: { lat: 25.7959, lng: -80.2870, name: "Miami MIA" },
  BCN: { lat: 41.2974, lng: 2.0833, name: "Barcelona BCN" },
  FCO: { lat: 41.8003, lng: 12.2389, name: "Rome Fiumicino" },
  MAD: { lat: 40.4983, lng: -3.5676, name: "Madrid MAD" },
  AMS: { lat: 52.3105, lng: 4.7683, name: "Amsterdam AMS" },
  FRA: { lat: 50.0379, lng: 8.5622, name: "Frankfurt FRA" },
  SYD: { lat: -33.9399, lng: 151.1753, name: "Sydney SYD" },
  NRT: { lat: 35.7720, lng: 140.3929, name: "Tokyo Narita" },
  HKG: { lat: 22.3080, lng: 113.9185, name: "Hong Kong HKG" },
  SIN: { lat: 1.3644, lng: 103.9915, name: "Singapore SIN" },
};

// Great circle path calculation
export const calculateGreatCirclePath = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps: number = 100
): google.maps.LatLngLiteral[] => {
  const points: google.maps.LatLngLiteral[] = [];
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  
  const lat1 = toRad(start.lat);
  const lng1 = toRad(start.lng);
  const lat2 = toRad(end.lat);
  const lng2 = toRad(end.lng);
  
  const dLng = lng2 - lng1;
  const distance = Math.acos(
    Math.max(-1, Math.min(1, 
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng)
    ))
  );
  
  if (distance < 0.0001) {
    return [start, end];
  }
  
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const a = Math.sin((1 - fraction) * distance) / Math.sin(distance);
    const b = Math.sin(fraction * distance) / Math.sin(distance);
    
    const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
    const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    
    points.push({ lat, lng });
  }
  
  return points;
};

// Calculate distance between two points
const calculateDistance = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLon = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Admin-specific map controls component
interface MapControlsProps {
  onExport?: () => void;
  onCopyCoordinates?: () => void;
  showDistance?: boolean;
  distance?: number;
  additionalInfo?: React.ReactNode;
}

const MapControls = ({ 
  onExport, 
  onCopyCoordinates, 
  showDistance, 
  distance,
  additionalInfo 
}: MapControlsProps) => (
  <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
    {showDistance && distance !== undefined && (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Ruler className="h-3 w-3" />
        {distance.toFixed(0)} km
      </Badge>
    )}
    {onCopyCoordinates && (
      <Button size="sm" variant="outline" onClick={onCopyCoordinates}>
        <Copy className="h-3 w-3 mr-1" />
        Copy
      </Button>
    )}
    {onExport && (
      <Button size="sm" variant="outline" onClick={onExport}>
        <Download className="h-3 w-3 mr-1" />
        Export
      </Button>
    )}
    {additionalInfo}
  </div>
);

// Admin Flight Path Map with debug features
interface AdminFlightPathMapProps {
  origin: string;
  destination: string;
  flightInfo?: {
    flightNumber?: string;
    airline?: string;
    price?: string;
    duration?: string;
  };
  showDebug?: boolean;
}

export const AdminFlightPathMap = ({ 
  origin, 
  destination, 
  flightInfo,
  showDebug = false 
}: AdminFlightPathMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<'origin' | 'destination' | null>(null);
  const [distance, setDistance] = useState<number>(0);

  const originCoords = airportCoordinates[origin];
  const destCoords = airportCoordinates[destination];

  useEffect(() => {
    if (map && originCoords && destCoords) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originCoords);
      bounds.extend(destCoords);
      map.fitBounds(bounds);
      
      const dist = calculateDistance(originCoords, destCoords);
      setDistance(dist);
      
      trackMapUsage("flight_path_view", { origin, destination, distance: dist });
    }
  }, [map, origin, destination, originCoords, destCoords]);

  if (!originCoords || !destCoords) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Airport coordinates not found for {!originCoords ? origin : destination}
          </p>
        </CardContent>
      </Card>
    );
  }

  const flightPath = calculateGreatCirclePath(originCoords, destCoords);

  const handleExport = () => {
    const data = {
      origin,
      destination,
      originCoords,
      destCoords,
      distance,
      flightInfo,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flight-${origin}-${destination}.json`;
    a.click();
  };

  const handleCopyCoordinates = () => {
    const coords = `Origin: ${originCoords.lat}, ${originCoords.lng}\nDestination: ${destCoords.lat}, ${destCoords.lng}`;
    navigator.clipboard.writeText(coords);
  };

  return (
    <MapLoaderWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Flight Route: {origin} → {destination}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={originCoords}
              zoom={4}
              onLoad={setMap}
              options={{
                disableDefaultUI: !showDebug,
                zoomControl: true,
                mapTypeControl: showDebug,
              }}
            >
              {/* Origin marker */}
              <Marker
                position={originCoords}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#22c55e",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                }}
                onClick={() => setActiveMarker('origin')}
              />

              {/* Destination marker */}
              <Marker
                position={destCoords}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#ef4444",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                }}
                onClick={() => setActiveMarker('destination')}
              />

              {/* Flight path */}
              <Polyline
                path={flightPath}
                options={{
                  strokeColor: "#3b82f6",
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  geodesic: true,
                  icons: [{
                    icon: {
                      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      scale: 3,
                      fillColor: "#3b82f6",
                      fillOpacity: 1,
                      strokeWeight: 1,
                    },
                    offset: "50%",
                  }],
                }}
              />

              {/* Info windows */}
              {activeMarker === 'origin' && (
                <InfoWindow
                  position={originCoords}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="p-2">
                    <div className="font-bold">{originCoords.name}</div>
                    <div className="text-xs text-gray-600">{origin}</div>
                    {showDebug && (
                      <div className="text-xs mt-1 text-gray-500">
                        {originCoords.lat.toFixed(4)}, {originCoords.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}

              {activeMarker === 'destination' && (
                <InfoWindow
                  position={destCoords}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="p-2">
                    <div className="font-bold">{destCoords.name}</div>
                    <div className="text-xs text-gray-600">{destination}</div>
                    {showDebug && (
                      <div className="text-xs mt-1 text-gray-500">
                        {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>

            <MapControls
              onExport={handleExport}
              onCopyCoordinates={handleCopyCoordinates}
              showDistance={true}
              distance={distance}
            />
          </div>

          {flightInfo && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {flightInfo.flightNumber && (
                <div>
                  <div className="text-xs text-muted-foreground">Flight</div>
                  <div className="text-sm font-medium">{flightInfo.flightNumber}</div>
                </div>
              )}
              {flightInfo.airline && (
                <div>
                  <div className="text-xs text-muted-foreground">Airline</div>
                  <div className="text-sm font-medium">{flightInfo.airline}</div>
                </div>
              )}
              {flightInfo.duration && (
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm font-medium">{flightInfo.duration}</div>
                </div>
              )}
              {flightInfo.price && (
                <div>
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-sm font-medium text-blue-600">{flightInfo.price}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </MapLoaderWrapper>
  );
};

// Admin Multi-Location Map with interactive features
interface Location {
  lat: number;
  lng: number;
  name: string;
  description?: string;
  category?: string;
  price?: string;
  rating?: number;
}

interface AdminMultiLocationMapProps {
  locations: Location[];
  title?: string;
  showDebug?: boolean;
  onLocationClick?: (location: Location) => void;
}

export const AdminMultiLocationMap = ({ 
  locations, 
  title = "Locations",
  showDebug = false,
  onLocationClick 
}: AdminMultiLocationMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (map && locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      map.fitBounds(bounds);
      
      trackMapUsage("multi_location_view", { count: locations.length });
    }
  }, [map, locations]);

  const handleExport = () => {
    const data = { title, locations };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locations-${Date.now()}.json`;
    a.click();
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      restaurant: "#ef4444",
      hotel: "#3b82f6",
      activity: "#8b5cf6",
      attraction: "#f59e0b",
      default: "#6b7280",
    };
    return colors[category?.toLowerCase() || "default"] || colors.default;
  };

  return (
    <MapLoaderWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {title}
            </span>
            <Badge variant="secondary">{locations.length} locations</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={locations[0] || { lat: 0, lng: 0 }}
              zoom={12}
              onLoad={setMap}
              options={{
                disableDefaultUI: !showDebug,
                zoomControl: true,
                mapTypeControl: showDebug,
              }}
            >
              {locations.map((location, index) => (
                <Marker
                  key={index}
                  position={{ lat: location.lat, lng: location.lng }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: getCategoryColor(location.category),
                    fillOpacity: 0.9,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }}
                  label={{
                    text: (index + 1).toString(),
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  onClick={() => {
                    setActiveLocation(location);
                    onLocationClick?.(location);
                  }}
                />
              ))}

              {activeLocation && (
                <InfoWindow
                  position={{ lat: activeLocation.lat, lng: activeLocation.lng }}
                  onCloseClick={() => setActiveLocation(null)}
                >
                  <div className="p-2 min-w-[200px]">
                    <div className="font-bold text-base mb-1">{activeLocation.name}</div>
                    {activeLocation.category && (
                      <Badge variant="outline" className="mb-2 text-xs">
                        {activeLocation.category}
                      </Badge>
                    )}
                    {activeLocation.rating && (
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: Math.floor(activeLocation.rating) }).map((_, i) => (
                          <span key={i} className="text-yellow-500 text-sm">★</span>
                        ))}
                      </div>
                    )}
                    {activeLocation.description && (
                      <div className="text-xs text-gray-600 mb-2">{activeLocation.description}</div>
                    )}
                    {activeLocation.price && (
                      <div className="text-sm font-bold text-blue-600">{activeLocation.price}</div>
                    )}
                    {showDebug && (
                      <div className="text-xs mt-2 text-gray-500 border-t pt-1">
                        {activeLocation.lat.toFixed(4)}, {activeLocation.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>

            <MapControls
              onExport={handleExport}
              additionalInfo={
                <div className="bg-white p-2 rounded shadow-sm text-xs">
                  <div className="font-medium mb-1">Legend:</div>
                  {Array.from(new Set(locations.map(l => l.category))).map(cat => (
                    <div key={cat} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(cat) }}
                      />
                      <span>{cat || 'Other'}</span>
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>
    </MapLoaderWrapper>
  );
};

// Simple location map for single points
interface AdminLocationMapProps {
  location: { lat: number; lng: number; name: string };
  zoom?: number;
  showDebug?: boolean;
}

export const AdminLocationMap = ({ 
  location, 
  zoom = 14,
  showDebug = false 
}: AdminLocationMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (map) {
      trackMapUsage("location_view", { name: location.name });
    }
  }, [map, location.name]);

  const handleCopyCoordinates = () => {
    const coords = `${location.lat}, ${location.lng}`;
    navigator.clipboard.writeText(coords);
  };

  return (
    <MapLoaderWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {location.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={location}
              zoom={zoom}
              onLoad={setMap}
              options={{
                disableDefaultUI: !showDebug,
                zoomControl: true,
                mapTypeControl: showDebug,
              }}
            >
              <Marker position={location} />
            </GoogleMap>

            <MapControls onCopyCoordinates={handleCopyCoordinates} />
          </div>

          {showDebug && (
            <div className="mt-2 text-xs text-muted-foreground">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          )}
        </CardContent>
      </Card>
    </MapLoaderWrapper>
  );
};
