"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, DollarSign, Car, Plane, Train } from "lucide-react";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import { generateSuggestionMapUrl } from "@/lib/map-url-generator";

interface TripSuggestionCardProps {
  suggestion: AITripSuggestion;
  imageUrl?: string;
  onClick: () => void;
}

// Type labels constant - defined outside component to avoid recreation
const TRIP_TYPE_LABELS = {
  local_experience: { label: "Local", color: "bg-green-100 text-green-700" },
  road_trip: { label: "Road Trip", color: "bg-blue-100 text-blue-700" },
  single_destination: { label: "Single Stop", color: "bg-purple-100 text-purple-700" },
  multi_destination: { label: "Multi-City", color: "bg-orange-100 text-orange-700" },
} as const;

export const TripSuggestionCard = React.memo(function TripSuggestionCard({ 
  suggestion, 
  imageUrl, 
  onClick 
}: TripSuggestionCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Intersection Observer state for lazy loading map
  const [isMapInView, setIsMapInView] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset image loaded state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

  // Intersection Observer for lazy loading map images
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMapInView(true);
          // Disconnect once the map is in view - no need to observe anymore
          observer.disconnect();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '100px', // Start loading slightly before it enters viewport
      }
    );

    observer.observe(mapContainer);

    return () => observer.disconnect();
  }, []);

  // Memoize map URL generation
  const mapUrl = useMemo(() => {
    if (!suggestion.destinationLat || !suggestion.destinationLng) return null;
    return generateSuggestionMapUrl(
      {
        destinationLat: suggestion.destinationLat,
        destinationLng: suggestion.destinationLng,
        keyLocations: suggestion.keyLocations,
        tripType: suggestion.tripType,
      },
      300, // width
      120  // height
    );
  }, [suggestion.destinationLat, suggestion.destinationLng, suggestion.keyLocations, suggestion.tripType]);

  // Memoize transport icon
  const transportIcon = useMemo(() => {
    const mode = suggestion.transportMode?.toLowerCase() || "";
    if (mode.includes("plane")) return <Plane className="h-3 w-3" />;
    if (mode.includes("car")) return <Car className="h-3 w-3" />;
    if (mode.includes("train")) return <Train className="h-3 w-3" />;
    return <MapPin className="h-3 w-3" />;
  }, [suggestion.transportMode]);

  // Memoize trip type badge info
  const tripTypeInfo = useMemo(() => {
    return TRIP_TYPE_LABELS[suggestion.tripType as keyof typeof TRIP_TYPE_LABELS] || TRIP_TYPE_LABELS.single_destination;
  }, [suggestion.tripType]);

  // Memoize callbacks
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);
  const handleMapLoad = useCallback(() => setMapLoaded(true), []);

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group border-2 border-slate-100 hover:border-purple-200"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-slate-200">
        {/* Skeleton loader - show while loading or no image yet */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-slate-300 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-slate-400" />
          </div>
        )}
        
        {/* Actual image */}
        {imageUrl && !imageError && (
          <img
            src={imageUrl}
            alt={suggestion.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {/* Error state */}
        {imageError && (
          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        
        {/* Trip Type Badge */}
        <Badge className={`text-xs ${tripTypeInfo.color} absolute top-3 right-3 shadow-sm`} variant="secondary">
          {tripTypeInfo.label}
        </Badge>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title - moved here from overlay */}
        <h3 className="text-lg font-bold text-slate-800 line-clamp-2">
          {suggestion.title}
        </h3>
        
        {/* Quick Info */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {suggestion.destination}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {suggestion.duration}
          </span>
        </div>

        {/* Mini Map - Lazy loaded with Intersection Observer */}
        {mapUrl && (
          <div 
            ref={mapContainerRef}
            className="rounded-lg overflow-hidden border border-slate-200 shadow-sm relative h-[120px]"
          >
            {/* Map skeleton loader - show while not in view or loading */}
            {(!isMapInView || !mapLoaded) && (
              <div className="absolute inset-0 animate-pulse bg-slate-200 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-slate-400" />
              </div>
            )}
            {/* Only render map image when in viewport */}
            {isMapInView && (
              <img
                src={mapUrl}
                alt={`Map of ${suggestion.destination}`}
                className={`w-full h-[120px] object-cover transition-opacity duration-500 ${
                  mapLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleMapLoad}
              />
            )}
          </div>
        )}

        {/* Budget and Transport */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <DollarSign className="h-4 w-4" />
            {suggestion.estimatedBudget}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            {transportIcon}
            <span className="text-xs">{suggestion.transportMode}</span>
          </span>
        </div>

        {/* Interest Tags */}
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {suggestion.combinedInterests.slice(0, 3).map((interest, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
          {suggestion.combinedInterests.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{suggestion.combinedInterests.length - 3}
            </Badge>
          )}
        </div>

        {/* Hover Indicator */}
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-xs text-purple-600 font-medium text-center">
            Click to view details →
          </p>
        </div>
      </div>
    </Card>
  );
});
