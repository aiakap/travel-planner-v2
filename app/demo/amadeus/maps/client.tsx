"use client";

import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const containerStyle = { width: "100%", height: "400px" };

// Shared Google Maps loader - must be used by all map components on the page
const useSharedMapsLoader = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return useJsApiLoader({
    id: "google-map-script", // Single shared ID for all maps
    googleMapsApiKey: apiKey || "",
  });
};

interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

interface DemoMapProps {
  locations: MapLocation[];
  showPath?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function DemoInteractiveMap({ locations, showPath = false, center, zoom = 6 }: DemoMapProps) {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useSharedMapsLoader();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapCenter = center || (locations.length > 0 ? { lat: locations[0].lat, lng: locations[0].lng } : { lat: 48.8566, lng: 2.3522 });

  useEffect(() => {
    if (!mapInstance || locations.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    locations.forEach((location) => {
      bounds.extend({ lat: location.lat, lng: location.lng });
    });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, locations]);

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Missing Google Maps API key.</p>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">Error loading maps.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading maps...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={zoom}
      center={mapCenter}
      onLoad={(map) => setMapInstance(map)}
    >
      {showPath && locations.length > 1 && (
        <Polyline
          path={locations.map((loc) => ({ lat: loc.lat, lng: loc.lng }))}
          options={{
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 3,
          }}
        />
      )}
      
      {locations.map((location, index) => (
        <div key={index}>
          <Marker
            position={{ lat: location.lat, lng: location.lng }}
            title={location.title}
            label={(index + 1).toString()}
            onClick={() => setActiveMarker(index)}
          />
          {activeMarker === index && (
            <InfoWindow
              position={{ lat: location.lat, lng: location.lng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="text-sm">
                <div className="font-semibold">{location.title}</div>
                {location.description && (
                  <div className="text-xs text-gray-500 mt-1">{location.description}</div>
                )}
              </div>
            </InfoWindow>
          )}
        </div>
      ))}
    </GoogleMap>
  );
}

interface FlightMapProps {
  departure: { lat: number; lng: number; name: string };
  arrival: { lat: number; lng: number; name: string };
}

export function DemoFlightMap({ departure, arrival }: FlightMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useSharedMapsLoader();

  // Calculate curved path for flight
  const calculateFlightPath = () => {
    const points: google.maps.LatLngLiteral[] = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = departure.lat + (arrival.lat - departure.lat) * t;
      const lng = departure.lng + (arrival.lng - departure.lng) * t;
      
      // Add curve (arc) to simulate flight path
      const arcHeight = 0.2;
      const curveLat = lat + Math.sin(t * Math.PI) * arcHeight * Math.abs(arrival.lat - departure.lat);
      
      points.push({ lat: curveLat, lng });
    }
    
    return points;
  };

  useEffect(() => {
    if (!mapInstance) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: departure.lat, lng: departure.lng });
    bounds.extend({ lat: arrival.lat, lng: arrival.lng });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, departure, arrival]);

  if (!apiKey) return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  if (loadError) return <div className="text-sm text-destructive">Error loading maps.</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading flight map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={4}
      center={{ lat: (departure.lat + arrival.lat) / 2, lng: (departure.lng + arrival.lng) / 2 }}
      onLoad={(map) => setMapInstance(map)}
    >
      <Marker
        position={{ lat: departure.lat, lng: departure.lng }}
        title={departure.name}
        label="D"
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        }}
      />
      <Marker
        position={{ lat: arrival.lat, lng: arrival.lng }}
        title={arrival.name}
        label="A"
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        }}
      />
      <Polyline
        path={calculateFlightPath()}
        options={{
          strokeColor: "#3b82f6",
          strokeOpacity: 0.7,
          strokeWeight: 2,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 1,
              },
              offset: "100%",
            },
          ],
        }}
      />
    </GoogleMap>
  );
}

interface StaticMapDisplayProps {
  url: string;
  title: string;
  description: string;
  apiCall: string;
}

export function StaticMapDisplay({ url, title, description, apiCall }: StaticMapDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg overflow-hidden border">
          <img src={url} alt={title} className="w-full h-auto" />
        </div>
        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs font-mono break-all">{apiCall}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StreetViewDisplayProps {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  title: string;
}

export function StreetViewDisplay({ lat, lng, heading = 0, pitch = 0, title }: StreetViewDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  }

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Street View Static API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg overflow-hidden border">
          <img src={streetViewUrl} alt={title} className="w-full h-auto" />
        </div>
        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs font-mono break-all">
            https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lng}&heading={heading}&pitch={pitch}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlaceCardProps {
  name: string;
  rating: number;
  userRatingsTotal: number;
  formattedAddress: string;
  types: string[];
  priceLevel?: number;
}

export function PlaceCard({ name, rating, userRatingsTotal, formattedAddress, types, priceLevel }: PlaceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="text-yellow-500">★</span>
          <span className="font-semibold">{rating}</span>
          <span className="text-xs">({userRatingsTotal.toLocaleString()} reviews)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{formattedAddress}</p>
        <div className="flex flex-wrap gap-1">
          {types.slice(0, 3).map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
        {priceLevel && (
          <div className="text-sm">
            <span className="text-muted-foreground">Price: </span>
            <span className="text-green-600">{"$".repeat(priceLevel)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GeocodingDisplayProps {
  title: string;
  input: string;
  output: string;
  apiEndpoint: string;
}

export function GeocodingDisplay({ title, input, output, apiEndpoint }: GeocodingDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-semibold mb-1">Input:</p>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{input}</p>
        </div>
        <div>
          <p className="text-sm font-semibold mb-1">Output:</p>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{output}</p>
        </div>
        <div>
          <p className="text-xs font-mono text-muted-foreground break-all bg-muted p-2 rounded">
            {apiEndpoint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimezoneCardProps {
  city: string;
  timeZoneId: string;
  timeZoneName: string;
  currentTime: string;
  location: { lat: number; lng: number };
}

export function TimezoneCard({ city, timeZoneId, timeZoneName, currentTime, location }: TimezoneCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{city}</CardTitle>
        <CardDescription>{timeZoneName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Timezone ID:</p>
          <p className="text-sm font-mono">{timeZoneId}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Time:</p>
          <p className="text-lg font-semibold">{new Date(currentTime).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Coordinates:</p>
          <p className="text-xs font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface RouteInfoProps {
  from: string;
  to: string;
  distance: string;
  duration: string;
  mode: string;
}

export function RouteInfoCard({ from, to, distance, duration, mode }: RouteInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{from} → {to}</CardTitle>
        <CardDescription>Routes API - {mode}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Distance:</span>
          <span className="text-lg font-semibold">{distance}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Duration:</span>
          <span className="text-lg font-semibold">{duration}</span>
        </div>
        <div className="bg-muted p-2 rounded">
          <p className="text-xs font-mono">
            POST https://routes.googleapis.com/directions/v2:computeRoutes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
