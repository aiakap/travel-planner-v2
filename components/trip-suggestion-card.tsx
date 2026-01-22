"use client";

import React, { useState } from "react";
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

export function TripSuggestionCard({ suggestion, imageUrl, onClick }: TripSuggestionCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Reset image loaded state when imageUrl changes
  React.useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);
  // Generate mini map URL
  const mapUrl = suggestion.destinationLat && suggestion.destinationLng
    ? generateSuggestionMapUrl(
        {
          destinationLat: suggestion.destinationLat,
          destinationLng: suggestion.destinationLng,
          keyLocations: suggestion.keyLocations,
          tripType: suggestion.tripType,
        },
        300, // width
        120  // height
      )
    : null;

  const getTransportIcon = () => {
    const mode = suggestion.transportMode?.toLowerCase() || "";
    if (mode.includes("plane")) return <Plane className="h-3 w-3" />;
    if (mode.includes("car")) return <Car className="h-3 w-3" />;
    if (mode.includes("train")) return <Train className="h-3 w-3" />;
    return <MapPin className="h-3 w-3" />;
  };

  const getTripTypeBadge = () => {
    const typeLabels = {
      local_experience: { label: "Local", color: "bg-green-100 text-green-700" },
      road_trip: { label: "Road Trip", color: "bg-blue-100 text-blue-700" },
      single_destination: { label: "Single Stop", color: "bg-purple-100 text-purple-700" },
      multi_destination: { label: "Multi-City", color: "bg-orange-100 text-orange-700" },
    };
    const typeInfo = typeLabels[suggestion.tripType as keyof typeof typeLabels] || typeLabels.single_destination;
    return (
      <Badge className={`text-xs ${typeInfo.color} absolute top-3 right-3 shadow-sm`} variant="secondary">
        {typeInfo.label}
      </Badge>
    );
  };

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
          <>
            <img
              src={imageUrl}
              alt={suggestion.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        )}
        
        {/* Error state */}
        {imageError && (
          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        
        {/* Trip Type Badge */}
        {getTripTypeBadge()}
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

        {/* Mini Map */}
        {mapUrl && (
          <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm relative">
            {/* Map skeleton loader */}
            {!mapLoaded && (
              <div className="absolute inset-0 animate-pulse bg-slate-200 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <img
              src={mapUrl}
              alt={`Map of ${suggestion.destination}`}
              className={`w-full h-[120px] object-cover transition-opacity duration-500 ${
                mapLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setMapLoaded(true)}
            />
          </div>
        )}

        {/* Budget and Transport */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <DollarSign className="h-4 w-4" />
            {suggestion.estimatedBudget}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            {getTransportIcon()}
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
}
