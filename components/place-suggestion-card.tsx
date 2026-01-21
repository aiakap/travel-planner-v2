"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, DollarSign, Plus, X } from "lucide-react";
import { PendingSuggestion } from "@/lib/pending-suggestions";
import { useState, useEffect } from "react";
import { getPhotoUrl } from "@/lib/google-places/resolve-suggestions";

interface PlaceSuggestionCardProps {
  suggestion: PendingSuggestion;
  onAdd: () => void;
  onSkip: () => void;
}

export function PlaceSuggestionCard({
  suggestion,
  onAdd,
  onSkip,
}: PlaceSuggestionCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { placeName, placeData } = suggestion;

  useEffect(() => {
    if (placeData?.photos?.[0]) {
      getPhotoUrl(placeData.photos[0].reference, 600).then(setPhotoUrl);
    }
  }, [placeData]);

  const getPriceLevelText = (level?: number) => {
    if (!level) return null;
    return "$".repeat(level);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Welcome! Let's add your place</CardTitle>
        <CardDescription>
          You showed interest in this place. Would you like to add it to a trip?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Place Details */}
        <div className="border rounded-lg overflow-hidden">
          {/* Hero Image */}
          {photoUrl && (
            <div className="relative w-full h-48">
              <img
                src={photoUrl}
                alt={placeName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{placeName}</h3>
              {placeData?.formattedAddress && (
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {placeData.formattedAddress}
                  </p>
                </div>
              )}
            </div>

            {/* Rating & Price */}
            {(placeData?.rating || placeData?.priceLevel) && (
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

            {/* Category & Type */}
            {suggestion.suggestion && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {suggestion.suggestion.category}
                </Badge>
                <Badge variant="outline">
                  {suggestion.suggestion.type}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onAdd}
            className="flex-1"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to New Trip
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            size="lg"
          >
            <X className="h-4 w-4 mr-2" />
            Skip for Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
