"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/exp/ui/hover-card";
import { Badge } from "@/app/exp/ui/badge";
import { Separator } from "@/app/exp/ui/separator";
import { Button } from "@/app/exp/ui/button";
import { 
  MapPin, 
  Star, 
  Phone, 
  Globe, 
  DollarSign, 
  Clock,
  ExternalLink,
  Users,
  Image as ImageIcon,
  Plus,
  Loader2,
} from "lucide-react";
import { GooglePlaceData, PlaceSuggestion as PipelinePlaceSuggestion } from "@/lib/types/place-pipeline";
import { GooglePlaceData as AmadeusGooglePlaceData, PlaceSuggestion as AmadeusPlaceSuggestion } from "@/lib/types/amadeus-pipeline";
import { PlaceSuggestion as LegacyPlaceSuggestion, GooglePlaceData as LegacyGooglePlaceData } from "@/lib/types/place-suggestion";
import { getPhotoUrl } from "@/lib/google-places/resolve-suggestions";
import { useEffect, useState } from "react";
import { SuggestionDetailModal } from "@/app/exp/components/suggestion-detail-modal";
import { QuickTripModal } from "@/app/exp/components/quick-trip-modal";
import { savePendingSuggestion, PendingSuggestion } from "@/lib/pending-suggestions";
import { trackPlaceClick } from "@/lib/anonymous-tracking";
import { createReservationFromSuggestion } from "@/lib/actions/create-reservation";

interface PlaceHoverCardProps {
  placeData: GooglePlaceData | AmadeusGooglePlaceData | undefined;
  placeName: string;
  children: React.ReactNode;
  tripId?: string; // Optional trip ID for adding to itinerary
  suggestion?: PipelinePlaceSuggestion | AmadeusPlaceSuggestion; // Original suggestion data
  onReservationAdded?: () => void; // Callback when reservation is successfully added
}

export function PlaceHoverCard({ placeData, placeName, children, tripId, suggestion, onReservationAdded }: PlaceHoverCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickTripModal, setShowQuickTripModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  useEffect(() => {
    if (placeData?.photos?.[0]) {
      getPhotoUrl(placeData.photos[0].reference, 400).then(setPhotoUrl);
    }
  }, [placeData]);

  // Track place click for anonymous users
  useEffect(() => {
    if (placeData && !placeData.notFound && suggestion) {
      // Only track if not authenticated (check will happen inside tracking function)
      trackPlaceClick(placeName, suggestion.category);
    }
  }, [placeData, placeName, suggestion]);

  // Handle "Add to Itinerary" button click
  const handleAddClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCheckingAuth(true);

    try {
      // Check auth state
      const response = await fetch("/api/auth/check");
      const { authenticated } = await response.json();

      if (!authenticated) {
        // Not logged in - save and redirect
        await handleUnauthenticatedAdd();
        return;
      }

      if (!tripId && !createdTripId) {
        // Logged in but no trip - show quick create modal
        setShowQuickTripModal(true);
        return;
      }

      // Has trip - show normal suggestion modal
      setShowAddModal(true);
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleUnauthenticatedAdd = async () => {
    if (!suggestion || !placeData) return;

    try {
      // Save pending suggestion
      const pendingData: PendingSuggestion = {
        placeName,
        placeData,
        suggestion,
        timestamp: Date.now(),
      };

      const result = await fetch("/api/suggestions/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingData),
      });

      const { id } = await result.json();

      // Redirect to GitHub auth with callback to landing page
      window.location.href = `/api/auth/signin/github?callbackUrl=/auth-landing?suggestion=${id}`;
    } catch (error) {
      console.error("Error saving suggestion:", error);
    }
  };

  const handleQuickTripCreated = (newTripId: string) => {
    setCreatedTripId(newTripId);
    setShowQuickTripModal(false);
    setShowAddModal(true);
  };

  // Extract location from address for quick trip modal
  const placeLocation = placeData?.formattedAddress?.split(",").slice(-2).join(",").trim();

  // Convert pipeline types to legacy types for SuggestionDetailModal
  const convertToLegacySuggestion = (): LegacyPlaceSuggestion | null => {
    if (!suggestion) return null;
    
    // Map category names
    const categoryMap: Record<string, "Travel" | "Stay" | "Activity" | "Dining"> = {
      "Stay": "Stay",
      "Eat": "Dining",
      "Do": "Activity",
      "Transport": "Travel",
    };
    
    return {
      placeName: suggestion.suggestedName,
      category: categoryMap[suggestion.category] || "Activity",
      type: suggestion.type,
      context: suggestion.context ? {
        dayNumber: suggestion.context.dayNumber,
        timeOfDay: suggestion.context.timeOfDay as "morning" | "afternoon" | "evening" | "night" | undefined,
        specificTime: suggestion.context.specificTime,
        notes: suggestion.context.notes,
      } : undefined,
      tripId,
      segmentId: suggestion.segmentId,
    };
  };

  const convertToLegacyPlaceData = (): LegacyGooglePlaceData | null => {
    if (!placeData || placeData.notFound) return null;
    
    return {
      placeId: placeData.placeId,
      name: placeData.name,
      formattedAddress: placeData.formattedAddress,
      phoneNumber: placeData.formattedPhoneNumber || placeData.internationalPhoneNumber,
      website: placeData.website,
      rating: placeData.rating,
      userRatingsTotal: placeData.userRatingsTotal,
      priceLevel: placeData.priceLevel,
      photos: placeData.photos?.map(p => ({
        photoReference: p.reference,
        width: p.width,
        height: p.height,
        url: photoUrl || undefined,
      })),
      openingHours: placeData.openingHours,
      geometry: placeData.location ? {
        location: placeData.location,
      } : undefined,
    };
  };

  // If place wasn't found, show minimal info
  if (!placeData || placeData.notFound) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{placeName}</h4>
            <p className="text-xs text-muted-foreground">
              Place data not available from Google Places
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  const getPriceLevelText = (level?: number) => {
    if (!level) return null;
    return "$".repeat(level);
  };

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-0" side="top" align="start">
        <div className="space-y-3">
          {/* Header Image */}
          {photoUrl && (
            <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
              <img
                src={photoUrl}
                alt={placeData.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h4 className="font-semibold text-white text-sm line-clamp-1">
                  {placeData.name}
                </h4>
              </div>
            </div>
          )}

          <div className="px-4 pb-4 space-y-3">
            {/* Title (if no image) */}
            {!photoUrl && (
              <h4 className="font-semibold text-sm pt-4">{placeData.name}</h4>
            )}

            {/* Rating & Price Level */}
            {(placeData.rating || placeData.priceLevel) && (
              <div className="flex items-center gap-2 flex-wrap">
                {placeData.rating && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                    {placeData.rating}
                    {placeData.userRatingsTotal && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({placeData.userRatingsTotal.toLocaleString()})
                      </span>
                    )}
                  </Badge>
                )}
                {placeData.priceLevel && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {getPriceLevelText(placeData.priceLevel)}
                  </Badge>
                )}
              </div>
            )}

            {/* Address */}
            {placeData.formattedAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {placeData.formattedAddress}
                </p>
              </div>
            )}

            {/* Opening Hours */}
            {placeData.openingHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="text-xs">
                  {placeData.openingHours.openNow !== undefined && (
                    <Badge 
                      variant={placeData.openingHours.openNow ? "default" : "secondary"}
                      className={`text-xs ${
                        placeData.openingHours.openNow 
                          ? "bg-green-500" 
                          : "bg-gray-400"
                      }`}
                    >
                      {placeData.openingHours.openNow ? "Open Now" : "Closed"}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Contact Information */}
            <div className="space-y-2">
              {placeData.formattedPhoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`tel:${placeData.formattedPhoneNumber}`}
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {placeData.formattedPhoneNumber}
                  </a>
                </div>
              )}

              {placeData.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={placeData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit Website
                    <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                </div>
              )}

              {placeData.url && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={placeData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on Google Maps
                    <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                </div>
              )}
            </div>

            {/* Photos Count */}
            {placeData.photos && placeData.photos.length > 1 && (
              <div className="flex items-center gap-2 pt-1">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {placeData.photos.length} photos available
                </span>
              </div>
            )}

            {/* Coordinates */}
            {placeData.location && (
              <div className="pt-1">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground font-mono bg-slate-50 p-2 rounded">
                    <div>Place ID: {placeData.placeId}</div>
                    <div>Lat: {placeData.location.lat.toFixed(6)}</div>
                    <div>Lng: {placeData.location.lng.toFixed(6)}</div>
                  </div>
                </details>
              </div>
            )}

            {/* Add to Itinerary Button - ALWAYS show if place data exists */}
            {suggestion && (
              <>
                <Separator className="my-3" />
                <Button
                  onClick={handleAddClick}
                  className="w-full"
                  size="sm"
                  disabled={isCheckingAuth}
                >
                  {isCheckingAuth ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Itinerary
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </HoverCardContent>

      {/* Quick Trip Creation Modal */}
      {showQuickTripModal && (
        <QuickTripModal
          placeName={placeName}
          placeLocation={placeLocation}
          onClose={() => setShowQuickTripModal(false)}
          onTripCreated={handleQuickTripCreated}
        />
      )}

      {/* Suggestion Detail Modal */}
      {showAddModal && (tripId || createdTripId) && suggestion && convertToLegacySuggestion() && (
        <SuggestionDetailModal
          suggestion={convertToLegacySuggestion()!}
          tripId={tripId || createdTripId!}
          onClose={() => setShowAddModal(false)}
          onAddToItinerary={async (data) => {
            const legacyPlaceData = convertToLegacyPlaceData();
            
            await createReservationFromSuggestion({
              tripId: tripId || createdTripId!,
              placeName: data.placeName,
              placeData: legacyPlaceData,
              day: data.day,
              startTime: data.startTime,
              endTime: data.endTime,
              cost: data.cost,
              category: data.category,
              type: data.type,
              status: data.status,
              segmentId: data.segmentId,
            });
            
            setShowAddModal(false);
            
            // Trigger refresh callback
            onReservationAdded?.();
          }}
        />
      )}
    </HoverCard>
  );
}
