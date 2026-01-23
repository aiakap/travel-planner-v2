"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Hotel, 
  Star,
  DollarSign,
  MapPin,
  Wifi,
  Coffee,
  Utensils,
  Dumbbell,
  Image as ImageIcon,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { AmadeusHotelData, GooglePlaceData } from "@/lib/types/amadeus-pipeline";
import { useState, useEffect } from "react";
import { getPhotoUrl } from "@/lib/google-places/resolve-suggestions";

interface HotelHoverCardProps {
  placeData?: GooglePlaceData; // Primary display info from Google Places
  hotelData?: AmadeusHotelData; // Availability and pricing from Amadeus
  hotelName: string;
  children: React.ReactNode;
  onAddToItinerary?: () => void;
}

export function HotelHoverCard({ placeData, hotelData, hotelName, children, onAddToItinerary }: HotelHoverCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Load Google Places photo if available
  useEffect(() => {
    if (placeData?.photos?.[0]) {
      getPhotoUrl(placeData.photos[0].reference, 400).then(setPhotoUrl);
    } else if (hotelData?.photos?.[0]) {
      setPhotoUrl(hotelData.photos[0]);
    }
  }, [placeData, hotelData]);

  // If no data at all, show error state
  if (!placeData && !hotelData) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{hotelName}</h4>
            <p className="text-xs text-muted-foreground">No hotel information found</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Determine primary data source (prefer Google Places for name/address/rating)
  const displayName = placeData?.name || hotelData?.name || hotelName;
  const displayAddress = placeData?.formattedAddress || hotelData?.address;
  const displayRating = placeData?.rating || hotelData?.rating;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-96">
        <div className="space-y-3">
          {/* PRIMARY: Google Places Info */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Hotel className="h-4 w-4 text-purple-600" />
              {displayName}
            </h4>
            {displayAddress && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {displayAddress}
                </p>
              </div>
            )}
            {displayRating && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{displayRating.toFixed(1)}</span>
                </div>
                {placeData?.userRatingsTotal && (
                  <span className="text-xs text-muted-foreground">
                    ({placeData.userRatingsTotal.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Hotel Photo */}
          {photoUrl && (
            <>
              <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                <img 
                  src={photoUrl} 
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </>
          )}

          {/* OVERLAY: Amadeus Availability (if available) */}
          {hotelData && !hotelData.notFound && hotelData.available && (
            <>
              <Separator />
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-900">Available</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-900">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Live pricing
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-700">
                      ${parseFloat(hotelData.price.total).toFixed(0)}
                    </div>
                    <div className="text-xs text-green-600">{hotelData.price.currency} per stay</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Info from Google */}
          {placeData && (
            <>
              {placeData.priceLevel && (
                <div className="text-xs text-muted-foreground">
                  Price level: {'$'.repeat(placeData.priceLevel)}
                </div>
              )}
              {placeData.website && (
                <div className="text-xs">
                  <a 
                    href={placeData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit website →
                  </a>
                </div>
              )}
            </>
          )}

          {/* Action Button */}
          <Button 
            className="w-full mt-2" 
            size="sm"
            onClick={onAddToItinerary || (() => {
              console.log('Add hotel to itinerary:', { placeData, hotelData });
            })}
          >
            Add to Itinerary
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
