"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { 
  MapPin, 
  Star, 
  DollarSign, 
  Loader2,
  Plus,
  Map as MapIcon,
  List,
  Maximize2
} from "lucide-react";
import { GooglePlaceData } from "@/lib/types/place-suggestion";

const containerStyle = { width: "100%", height: "500px" };

// Helper to generate photo URL (client-side)
const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return "";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
};

interface PlacesMapCardProps {
  centerLat: number;
  centerLng: number;
  centerName: string;
  placeType?: string;
  radius?: number;
  tripId?: string;
  segmentId?: string;
}

export function PlacesMapCard({
  centerLat,
  centerLng,
  centerName,
  placeType = "restaurant",
  radius = 1000,
  tripId,
  segmentId,
}: PlacesMapCardProps) {
  const [places, setPlaces] = useState<GooglePlaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceData | null>(null);
  const [activeRadius, setActiveRadius] = useState(radius);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [addingPlace, setAddingPlace] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const center = { lat: centerLat, lng: centerLng };

  useEffect(() => {
    loadNearbyPlaces();
  }, [centerLat, centerLng, activeRadius, placeType]);

  const loadNearbyPlaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: centerLat,
          lng: centerLng,
          radius: activeRadius,
          type: placeType,
        }),
      });

      if (!response.ok) throw new Error("Failed to load nearby places");

      const data = await response.json();
      setPlaces(data.places || []);
    } catch (err: any) {
      console.error("Error loading nearby places:", err);
      setError(err.message || "Failed to load places");
    } finally {
      setLoading(false);
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Fit bounds to show all markers
    if (places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      places.forEach((place) => {
        if (place.location) {
          bounds.extend({
            lat: place.location.lat,
            lng: place.location.lng,
          });
        }
      });
      map.fitBounds(bounds);
    }
  }, [places, center]);

  const handleAddPlace = async (place: GooglePlaceData) => {
    setAddingPlace(place.placeId);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          segmentId,
          name: place.name,
          vendor: place.name,
          category: getCategoryFromType(placeType),
          type: getTypeLabel(placeType),
          status: "SUGGESTED",
          location: place.formattedAddress,
          latitude: place.location?.lat,
          longitude: place.location?.lng,
          cost: 0,
          currency: "USD",
          url: place.url,
          imageUrl: place.photos?.[0]
            ? getPhotoUrl(place.photos[0].reference, 400)
            : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to add place");

      console.log("Place added successfully");
      setSelectedPlace(null);
    } catch (err: any) {
      console.error("Error adding place:", err);
      alert("Failed to add place to itinerary");
    } finally {
      setAddingPlace(null);
    }
  };

  const getCategoryFromType = (type?: string): string => {
    if (!type) return "Do";
    if (type.includes("restaurant") || type.includes("cafe") || type.includes("bar")) {
      return "Eat";
    }
    if (type.includes("hotel") || type.includes("lodging")) {
      return "Stay";
    }
    return "Do";
  };

  const getTypeLabel = (type?: string): string => {
    if (!type) return "Place";
    const labels: Record<string, string> = {
      restaurant: "Restaurant",
      cafe: "Cafe",
      bar: "Bar",
      tourist_attraction: "Attraction",
      museum: "Museum",
      park: "Park",
      shopping_mall: "Shopping",
    };
    return labels[type] || "Place";
  };

  const getMarkerColor = (type?: string): string => {
    if (!type) return "#3B82F6"; // Blue
    if (type.includes("restaurant")) return "#F97316"; // Orange
    if (type.includes("cafe") || type.includes("bar")) return "#F59E0B"; // Amber
    if (type.includes("tourist") || type.includes("museum")) return "#10B981"; // Green
    if (type.includes("shopping")) return "#A855F7"; // Purple
    return "#3B82F6"; // Blue
  };

  const getPriceSymbols = (priceLevel?: number): string => {
    if (!priceLevel) return "";
    return "$".repeat(priceLevel);
  };

  if (!isLoaded) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">
                Places Near {centerName}
              </h3>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {places.length} {getTypeLabel(placeType)}s within {activeRadius}m
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Radius slider */}
        <div className="mt-3">
          <label className="text-xs text-slate-600 block mb-1">
            Search Radius: {activeRadius}m
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="500"
            value={activeRadius}
            onChange={(e) => setActiveRadius(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Map or List View */}
      {viewMode === "map" ? (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            {/* Center marker (reference point) */}
            <Marker
              position={center}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#EF4444",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              }}
              label={{
                text: centerName.substring(0, 1),
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              title={centerName}
            />

            {/* Place markers */}
            {places.map((place) => (
              <Marker
                key={place.placeId}
                position={{
                  lat: place.location?.lat || 0,
                  lng: place.location?.lng || 0,
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: getMarkerColor(placeType),
                  fillOpacity: 0.9,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedPlace(place)}
                title={place.name}
              />
            ))}

            {/* InfoWindow */}
            {selectedPlace && selectedPlace.location && (
              <InfoWindow
                position={{
                  lat: selectedPlace.location.lat,
                  lng: selectedPlace.location.lng,
                }}
                onCloseClick={() => setSelectedPlace(null)}
              >
                <div className="p-2 max-w-xs">
                  {selectedPlace.photos && selectedPlace.photos[0] && (
                    <img
                      src={getPhotoUrl(selectedPlace.photos[0].reference, 300)}
                      alt={selectedPlace.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-slate-900">
                    {selectedPlace.name}
                  </h3>
                  {selectedPlace.rating && (
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{selectedPlace.rating}</span>
                      {selectedPlace.userRatingsTotal && (
                        <span className="text-slate-500">
                          ({selectedPlace.userRatingsTotal})
                        </span>
                      )}
                    </div>
                  )}
                  {selectedPlace.priceLevel && (
                    <div className="text-sm text-slate-600 mt-1">
                      {getPriceSymbols(selectedPlace.priceLevel)}
                    </div>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedPlace.formattedAddress}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleAddPlace(selectedPlace)}
                    disabled={addingPlace === selectedPlace.placeId}
                  >
                    {addingPlace === selectedPlace.placeId ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add to Itinerary
                      </>
                    )}
                  </Button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      ) : (
        /* List View */
        <div className="p-4 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No places found in this area
            </div>
          ) : (
            <div className="space-y-3">
              {places.map((place) => (
                <div
                  key={place.placeId}
                  className="flex gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                >
                  {place.photos && place.photos[0] && (
                    <img
                      src={getPhotoUrl(place.photos[0].reference, 200)}
                      alt={place.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">
                      {place.name}
                    </h4>
                    {place.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">
                            {place.rating}
                          </span>
                          {place.userRatingsTotal && (
                            <span className="text-sm text-slate-500">
                              ({place.userRatingsTotal})
                            </span>
                          )}
                        </div>
                        {place.priceLevel && (
                          <Badge variant="secondary" className="text-xs">
                            {getPriceSymbols(place.priceLevel)}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {place.formattedAddress}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddPlace(place)}
                    disabled={addingPlace === place.placeId}
                  >
                    {addingPlace === place.placeId ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
