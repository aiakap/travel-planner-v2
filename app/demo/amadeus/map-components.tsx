"use client";

import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const containerStyle = { width: "100%", height: "400px" };

// Shared Google Maps loader
const useSharedMapsLoader = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });
};

// Airport coordinates lookup
const airportCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
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

// Great circle path calculation for realistic flight routes
const calculateGreatCirclePath = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps: number = 100
): google.maps.LatLngLiteral[] => {
  const points: google.maps.LatLngLiteral[] = [];
  
  // Convert to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  
  const lat1 = toRad(start.lat);
  const lng1 = toRad(start.lng);
  const lat2 = toRad(end.lat);
  const lng2 = toRad(end.lng);
  
  // Calculate great circle distance
  const dLng = lng2 - lng1;
  const distance = Math.acos(
    Math.max(-1, Math.min(1, 
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng)
    ))
  );
  
  // Handle case where start and end are the same or very close
  if (distance < 0.0001) {
    return [start, end];
  }
  
  // Interpolate along great circle
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

// Rich tooltip components
interface FlightMarkerInfoProps {
  airportName: string;
  iataCode: string;
  flightInfo?: {
    flightNumber?: string;
    airline?: string;
    departureTime?: string;
    arrivalTime?: string;
    departureTerminal?: string;
    arrivalTerminal?: string;
    duration?: string;
    price?: string;
    aircraft?: string;
  };
  type: 'departure' | 'arrival';
}

const FlightMarkerInfo = ({ airportName, iataCode, flightInfo, type }: FlightMarkerInfoProps) => (
  <div className="p-2 min-w-[200px]">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-2 h-2 rounded-full ${type === 'departure' ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="font-bold text-base">{airportName}</span>
    </div>
    <div className="text-xs text-gray-600 mb-2">{iataCode}</div>
    
    {flightInfo && (
      <div className="space-y-1 text-sm border-t pt-2 mt-2">
        {flightInfo.flightNumber && (
          <div className="flex justify-between">
            <span className="text-gray-600">Flight:</span>
            <span className="font-semibold">{flightInfo.airline} {flightInfo.flightNumber}</span>
          </div>
        )}
        {type === 'departure' && flightInfo.departureTime && (
          <div className="flex justify-between">
            <span className="text-gray-600">Departs:</span>
            <span className="font-semibold">{flightInfo.departureTime}</span>
          </div>
        )}
        {type === 'departure' && flightInfo.departureTerminal && (
          <div className="flex justify-between">
            <span className="text-gray-600">Terminal:</span>
            <span className="font-semibold">{flightInfo.departureTerminal}</span>
          </div>
        )}
        {type === 'arrival' && flightInfo.arrivalTime && (
          <div className="flex justify-between">
            <span className="text-gray-600">Arrives:</span>
            <span className="font-semibold">{flightInfo.arrivalTime}</span>
          </div>
        )}
        {type === 'arrival' && flightInfo.arrivalTerminal && (
          <div className="flex justify-between">
            <span className="text-gray-600">Terminal:</span>
            <span className="font-semibold">{flightInfo.arrivalTerminal}</span>
          </div>
        )}
        {flightInfo.duration && (
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold">{flightInfo.duration}</span>
          </div>
        )}
        {flightInfo.aircraft && (
          <div className="flex justify-between">
            <span className="text-gray-600">Aircraft:</span>
            <span className="font-semibold text-xs">{flightInfo.aircraft}</span>
          </div>
        )}
        {flightInfo.price && (
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-gray-600">Price:</span>
            <span className="font-bold text-blue-600">{flightInfo.price}</span>
          </div>
        )}
      </div>
    )}
  </div>
);

interface HotelMarkerInfoProps {
  name: string;
  hotelInfo?: {
    stars?: number;
    address?: string;
    bookingRef?: string;
    price?: string;
    checkIn?: string;
    checkOut?: string;
  };
}

const HotelMarkerInfo = ({ name, hotelInfo }: HotelMarkerInfoProps) => (
  <div className="p-2 min-w-[220px]">
    <div className="font-bold text-base mb-1">{name}</div>
    
    {hotelInfo?.stars && (
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: hotelInfo.stars }).map((_, i) => (
          <span key={i} className="text-yellow-500">★</span>
        ))}
      </div>
    )}
    
    {hotelInfo && (
      <div className="space-y-1 text-sm">
        {hotelInfo.address && (
          <div className="text-gray-600 text-xs">{hotelInfo.address}</div>
        )}
        {hotelInfo.bookingRef && (
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-gray-600">Booking:</span>
            <span className="font-mono text-xs">{hotelInfo.bookingRef}</span>
          </div>
        )}
        {hotelInfo.checkIn && (
          <div className="flex justify-between">
            <span className="text-gray-600">Check-in:</span>
            <span className="font-semibold text-xs">{hotelInfo.checkIn}</span>
          </div>
        )}
        {hotelInfo.checkOut && (
          <div className="flex justify-between">
            <span className="text-gray-600">Check-out:</span>
            <span className="font-semibold text-xs">{hotelInfo.checkOut}</span>
          </div>
        )}
        {hotelInfo.price && (
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-green-600">{hotelInfo.price}</span>
          </div>
        )}
      </div>
    )}
  </div>
);

interface POIMarkerInfoProps {
  name: string;
  details?: {
    type: 'poi' | 'hotel' | 'transfer';
    rating?: number;
    rank?: number;
    price?: string;
    hours?: string;
    distance?: string;
    duration?: string;
  };
}

const POIMarkerInfo = ({ name, details }: POIMarkerInfoProps) => (
  <div className="p-2 min-w-[200px]">
    <div className="font-bold text-base mb-2">{name}</div>
    
    {details && (
      <div className="space-y-1 text-sm">
        {details.rank && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs">Rank:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${details.rank}%` }}
              />
            </div>
            <span className="font-semibold text-xs">{details.rank}/100</span>
          </div>
        )}
        {details.rating && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-semibold">{details.rating.toFixed(1)}</span>
          </div>
        )}
        {details.hours && (
          <div className="text-xs text-gray-600 border-t pt-1 mt-1">
            {details.hours}
          </div>
        )}
        {details.distance && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-xs">Distance:</span>
            <span className="font-semibold text-xs">{details.distance}</span>
          </div>
        )}
        {details.duration && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-xs">Duration:</span>
            <span className="font-semibold text-xs">{details.duration}</span>
          </div>
        )}
        {details.price && (
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-gray-600">From:</span>
            <span className="font-bold text-green-600">{details.price}</span>
          </div>
        )}
      </div>
    )}
  </div>
);

// Component interfaces with rich data support
interface FlightPathMapProps {
  departure: string;
  arrival: string;
  title?: string;
  description?: string;
  flightInfo?: {
    flightNumber?: string;
    airline?: string;
    departureTime?: string;
    arrivalTime?: string;
    departureTerminal?: string;
    arrivalTerminal?: string;
    duration?: string;
    price?: string;
    aircraft?: string;
  };
}

export function FlightPathMap({ departure, arrival, title, description, flightInfo }: FlightPathMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<'departure' | 'arrival' | null>(null);
  const { isLoaded, loadError } = useSharedMapsLoader();

  const departureCoords = airportCoordinates[departure];
  const arrivalCoords = airportCoordinates[arrival];

  if (!departureCoords || !arrivalCoords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Flight Path"}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Airport coordinates not available for {departure} or {arrival}</p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (!mapInstance) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: departureCoords.lat, lng: departureCoords.lng });
    bounds.extend({ lat: arrivalCoords.lat, lng: arrivalCoords.lng });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, departureCoords, arrivalCoords]);

  if (!apiKey) return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  if (loadError) return <div className="text-sm text-destructive">Error loading maps.</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading flight map...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || `${departure} → ${arrival}`}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={4}
          center={{ lat: (departureCoords.lat + arrivalCoords.lat) / 2, lng: (departureCoords.lng + arrivalCoords.lng) / 2 }}
          onLoad={(map) => setMapInstance(map)}
        >
          <Marker
            position={{ lat: departureCoords.lat, lng: departureCoords.lng }}
            title={departureCoords.name}
            label="D"
            onMouseOver={() => setHoveredMarker('departure')}
            onMouseOut={() => setHoveredMarker(null)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
          />
          {hoveredMarker === 'departure' && (
            <InfoWindow
              position={{ lat: departureCoords.lat, lng: departureCoords.lng }}
              options={{ disableAutoPan: true }}
            >
              <FlightMarkerInfo 
                airportName={departureCoords.name}
                iataCode={departure}
                flightInfo={flightInfo}
                type="departure"
              />
            </InfoWindow>
          )}
          
          <Marker
            position={{ lat: arrivalCoords.lat, lng: arrivalCoords.lng }}
            title={arrivalCoords.name}
            label="A"
            onMouseOver={() => setHoveredMarker('arrival')}
            onMouseOut={() => setHoveredMarker(null)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
          />
          {hoveredMarker === 'arrival' && (
            <InfoWindow
              position={{ lat: arrivalCoords.lat, lng: arrivalCoords.lng }}
              options={{ disableAutoPan: true }}
            >
              <FlightMarkerInfo 
                airportName={arrivalCoords.name}
                iataCode={arrival}
                flightInfo={flightInfo}
                type="arrival"
              />
            </InfoWindow>
          )}
          
          <Polyline
            path={calculateGreatCirclePath(departureCoords, arrivalCoords)}
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
      </CardContent>
    </Card>
  );
}

interface MultiDestinationMapProps {
  destinations: Array<{ iataCode: string; price?: string }>;
  origin?: string;
  title?: string;
  description?: string;
}

export function MultiDestinationMap({ destinations, origin = "JFK", title, description }: MultiDestinationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<number | 'origin' | null>(null);
  const { isLoaded, loadError } = useSharedMapsLoader();

  const originCoords = airportCoordinates[origin];
  const validDestinations = destinations
    .map((dest, idx) => ({ ...dest, coords: airportCoordinates[dest.iataCode], idx }))
    .filter(dest => dest.coords);

  useEffect(() => {
    if (!mapInstance || validDestinations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    if (originCoords) bounds.extend({ lat: originCoords.lat, lng: originCoords.lng });
    validDestinations.forEach(dest => {
      bounds.extend({ lat: dest.coords.lat, lng: dest.coords.lng });
    });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, validDestinations, originCoords]);

  if (!apiKey) return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  if (loadError) return <div className="text-sm text-destructive">Error loading maps.</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading map...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Flight Destinations"}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={3}
          center={originCoords ? { lat: originCoords.lat, lng: originCoords.lng } : { lat: 40, lng: -20 }}
          onLoad={(map) => setMapInstance(map)}
        >
          {originCoords && (
            <>
              <Marker
                position={{ lat: originCoords.lat, lng: originCoords.lng }}
                title={originCoords.name}
                label="O"
                onMouseOver={() => setHoveredMarker('origin')}
                onMouseOut={() => setHoveredMarker(null)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#22c55e",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                }}
              />
              {hoveredMarker === 'origin' && (
                <InfoWindow
                  position={{ lat: originCoords.lat, lng: originCoords.lng }}
                  options={{ disableAutoPan: true }}
                >
                  <div className="p-2">
                    <div className="font-bold text-base">{originCoords.name}</div>
                    <div className="text-xs text-gray-600">{origin}</div>
                    <div className="text-xs text-gray-500 mt-1">Origin Airport</div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
          {validDestinations.map((dest) => (
            <div key={dest.idx}>
              <Marker
                position={{ lat: dest.coords.lat, lng: dest.coords.lng }}
                title={dest.coords.name}
                label={(dest.idx + 1).toString()}
                onMouseOver={() => setHoveredMarker(dest.idx)}
                onMouseOut={() => setHoveredMarker(null)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#3b82f6",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                }}
              />
              {hoveredMarker === dest.idx && (
                <InfoWindow
                  position={{ lat: dest.coords.lat, lng: dest.coords.lng }}
                  options={{ disableAutoPan: true }}
                >
                  <div className="p-2 min-w-[180px]">
                    <div className="font-bold text-base">{dest.coords.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{dest.iataCode}</div>
                    {dest.price && (
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-gray-600 text-sm">From:</span>
                        <span className="font-bold text-blue-600">{dest.price}</span>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </div>
          ))}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}

interface LocationMapProps {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  markerLabel?: string;
  hotelInfo?: {
    stars?: number;
    address?: string;
    bookingRef?: string;
    price?: string;
    checkIn?: string;
    checkOut?: string;
  };
}

export function LocationMap({ lat, lng, title, description, markerLabel, hotelInfo }: LocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [hoveredMarker, setHoveredMarker] = useState(false);
  const { isLoaded, loadError } = useSharedMapsLoader();

  if (!apiKey) return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  if (loadError) return <div className="text-sm text-destructive">Error loading maps.</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading map...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={15}
          center={{ lat, lng }}
        >
          <Marker
            position={{ lat, lng }}
            title={title}
            label={markerLabel}
            onMouseOver={() => setHoveredMarker(true)}
            onMouseOut={() => setHoveredMarker(false)}
          />
          {hoveredMarker && (
            <InfoWindow
              position={{ lat, lng }}
              options={{ disableAutoPan: true }}
            >
              <HotelMarkerInfo name={title} hotelInfo={hotelInfo} />
            </InfoWindow>
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}

interface MultiLocationMapProps {
  locations: Array<{ 
    lat: number; 
    lng: number; 
    name: string; 
    category?: string;
    details?: {
      type: 'poi' | 'hotel' | 'transfer';
      rating?: number;
      rank?: number;
      price?: string;
      hours?: string;
      distance?: string;
      duration?: string;
    };
  }>;
  title?: string;
  description?: string;
  showPath?: boolean;
}

export function MultiLocationMap({ locations, title, description, showPath = false }: MultiLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const { isLoaded, loadError } = useSharedMapsLoader();

  useEffect(() => {
    if (!mapInstance || locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    locations.forEach(loc => {
      bounds.extend({ lat: loc.lat, lng: loc.lng });
    });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, locations]);

  if (!apiKey) return <div className="text-sm text-muted-foreground">Missing Google Maps API key.</div>;
  if (loadError) return <div className="text-sm text-destructive">Error loading maps.</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading map...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Locations"}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={12}
          center={locations.length > 0 ? { lat: locations[0].lat, lng: locations[0].lng } : { lat: 0, lng: 0 }}
          onLoad={(map) => setMapInstance(map)}
        >
          {showPath && locations.length > 1 && (
            <Polyline
              path={locations.map(loc => ({ lat: loc.lat, lng: loc.lng }))}
              options={{
                strokeColor: "#3b82f6",
                strokeOpacity: 0.7,
                strokeWeight: 3,
              }}
            />
          )}
          {locations.map((location, index) => (
            <div key={index}>
              <Marker
                position={{ lat: location.lat, lng: location.lng }}
                title={location.name}
                label={(index + 1).toString()}
                onMouseOver={() => setHoveredMarker(index)}
                onMouseOut={() => setHoveredMarker(null)}
              />
              {hoveredMarker === index && (
                <InfoWindow
                  position={{ lat: location.lat, lng: location.lng }}
                  options={{ disableAutoPan: true }}
                >
                  <POIMarkerInfo name={location.name} details={location.details} />
                </InfoWindow>
              )}
            </div>
          ))}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}

// Static map URL generator for simple displays
export function generateStaticMapUrl(
  lat: number,
  lng: number,
  zoom: number = 15,
  width: number = 600,
  height: number = 300
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return "/placeholder.svg";
  
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red|${lat},${lng}&key=${apiKey}`;
}

export function generateStreetViewUrl(
  lat: number,
  lng: number,
  heading: number = 0,
  pitch: number = 0,
  width: number = 600,
  height: number = 300
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return "/placeholder.svg";
  
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;
}

// Client component for static map display
interface StaticMapImageProps {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  title: string;
  description?: string;
}

export function StaticMapImage({ lat, lng, zoom = 15, width = 600, height = 300, title, description }: StaticMapImageProps) {
  const mapUrl = generateStaticMapUrl(lat, lng, zoom, width, height);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <img 
          src={mapUrl} 
          alt={title} 
          className="w-full rounded-lg"
        />
      </CardContent>
    </Card>
  );
}

// Client component for street view display
interface StreetViewImageProps {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  width?: number;
  height?: number;
  title: string;
  description?: string;
}

export function StreetViewImage({ lat, lng, heading = 0, pitch = 0, width = 600, height = 300, title, description }: StreetViewImageProps) {
  const streetViewUrl = generateStreetViewUrl(lat, lng, heading, pitch, width, height);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <img 
          src={streetViewUrl} 
          alt={title} 
          className="w-full rounded-lg"
        />
      </CardContent>
    </Card>
  );
}
