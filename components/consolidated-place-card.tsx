"use client";

/**
 * Consolidated Place Card Component
 * Displays place data from multiple sources (Google, Yelp, Amadeus)
 * with tabs for different information views
 */

import { useState } from "react";
import Image from "next/image";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  DollarSign,
  ExternalLink,
  Thermometer,
  Wind,
  CloudRain,
  ChevronRight,
  Bookmark,
  Share2,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ConsolidatedPlace } from "@/lib/types/consolidated-place";

// ============================================================================
// Types
// ============================================================================

interface ConsolidatedPlaceCardProps {
  place: ConsolidatedPlace;
  variant?: "default" | "compact" | "expanded";
  onAddToTrip?: (place: ConsolidatedPlace) => void;
  onViewDetails?: (place: ConsolidatedPlace) => void;
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function SourceBadge({
  source,
  active = false,
}: {
  source: "google" | "yelp" | "amadeus";
  active?: boolean;
}) {
  const colors = {
    google: "bg-blue-100 text-blue-800 border-blue-200",
    yelp: "bg-red-100 text-red-800 border-red-200",
    amadeus: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-normal",
        colors[source],
        active && "ring-1 ring-offset-1"
      )}
    >
      {source.charAt(0).toUpperCase() + source.slice(1)}
    </Badge>
  );
}

function RatingDisplay({
  rating,
  reviewCount,
  source,
}: {
  rating: number;
  reviewCount?: number;
  source: "google" | "yelp" | "aggregated";
}) {
  const starColor =
    source === "yelp"
      ? "text-red-500"
      : source === "google"
        ? "text-yellow-500"
        : "text-amber-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= Math.round(rating) ? starColor : "text-gray-300"
            )}
            fill={star <= Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}

function PriceDisplay({ pricing }: { pricing: ConsolidatedPlace["pricing"] }) {
  if (!pricing) return null;

  return (
    <div className="flex items-center gap-1">
      {pricing.priceLevelDisplay && (
        <span className="text-sm font-medium text-green-700">
          {pricing.priceLevelDisplay}
        </span>
      )}
      {pricing.bookingPrice && (
        <span className="text-sm">
          From{" "}
          <span className="font-semibold">
            {pricing.bookingPrice.currency}{" "}
            {pricing.bookingPrice.amount.toFixed(2)}
          </span>
        </span>
      )}
    </div>
  );
}

function WeatherDisplay({
  weather,
}: {
  weather: ConsolidatedPlace["weather"];
}) {
  if (!weather) return null;

  return (
    <div className="flex items-center gap-3 p-2 bg-sky-50 rounded-md">
      <div className="flex items-center gap-1">
        <Thermometer className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium">{weather.temperature}°C</span>
      </div>
      <div className="flex items-center gap-1">
        <Wind className="h-4 w-4 text-blue-500" />
        <span className="text-sm">{weather.windSpeed} m/s</span>
      </div>
      {weather.precipitation !== undefined && (
        <div className="flex items-center gap-1">
          <CloudRain className="h-4 w-4 text-blue-400" />
          <span className="text-sm">{weather.precipitation}%</span>
        </div>
      )}
      <span className="text-xs text-muted-foreground capitalize">
        {weather.description}
      </span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConsolidatedPlaceCard({
  place,
  variant = "default",
  onAddToTrip,
  onViewDetails,
  className,
}: ConsolidatedPlaceCardProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");

  const hasGoogle = !!place.sources.google;
  const hasYelp = !!place.sources.yelp;
  const hasAmadeus = !!place.sources.amadeus;
  const sourceCount = [hasGoogle, hasYelp, hasAmadeus].filter(Boolean).length;

  // Compact variant
  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        onClick={() => onViewDetails?.(place)}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            {place.primaryPhoto && (
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={place.primaryPhoto}
                  alt={place.canonicalName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{place.canonicalName}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {place.formattedAddress}
              </p>
              {place.aggregatedRating && (
                <div className="mt-1">
                  <RatingDisplay
                    rating={place.aggregatedRating}
                    reviewCount={place.totalReviewCount}
                    source="aggregated"
                  />
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default and Expanded variants
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with image */}
      <CardHeader className="p-0">
        {place.primaryPhoto && (
          <div className="relative h-48 w-full">
            <Image
              src={place.primaryPhoto}
              alt={place.canonicalName}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 left-2 flex gap-1">
              {hasGoogle && <SourceBadge source="google" />}
              {hasYelp && <SourceBadge source="yelp" />}
              {hasAmadeus && <SourceBadge source="amadeus" />}
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {/* Title and category */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-lg">{place.canonicalName}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {place.category}
              </Badge>
              {place.subcategory && (
                <span className="text-xs">{place.subcategory}</span>
              )}
            </div>
          </div>
          <PriceDisplay pricing={place.pricing} />
        </div>

        {/* Aggregated rating */}
        {place.aggregatedRating && (
          <div className="mb-3">
            <RatingDisplay
              rating={place.aggregatedRating}
              reviewCount={place.totalReviewCount}
              source="aggregated"
            />
            {sourceCount > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Combined from {sourceCount} sources
              </p>
            )}
          </div>
        )}

        {/* Quick info */}
        <div className="flex flex-wrap gap-2 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="truncate max-w-[200px]">
              {place.city || place.formattedAddress}
            </span>
          </div>
          {place.availability?.isOpenNow !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span
                className={
                  place.availability.isOpenNow
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {place.availability.isOpenNow ? "Open now" : "Closed"}
              </span>
            </div>
          )}
        </div>

        {/* Weather (if available) */}
        {place.weather && <WeatherDisplay weather={place.weather} />}

        {/* Tabs for detailed info */}
        {variant === "expanded" && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="booking">Book</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3 space-y-3">
              {place.description && (
                <p className="text-sm text-muted-foreground">
                  {place.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                {place.formattedAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{place.formattedAddress}</span>
                  </div>
                )}
                {place.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${place.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {place.phone}
                    </a>
                  </div>
                )}
                {place.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[250px]"
                    >
                      {new URL(place.website).hostname}
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-3 space-y-3">
              {/* Google rating */}
              {place.ratingBreakdown?.google && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <SourceBadge source="google" />
                    <RatingDisplay
                      rating={place.ratingBreakdown.google.rating}
                      reviewCount={place.ratingBreakdown.google.count}
                      source="google"
                    />
                  </div>
                  {place.sources.google?.url && (
                    <a
                      href={place.sources.google.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Yelp rating */}
              {place.ratingBreakdown?.yelp && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <SourceBadge source="yelp" />
                    <RatingDisplay
                      rating={place.ratingBreakdown.yelp.rating}
                      reviewCount={place.ratingBreakdown.yelp.count}
                      source="yelp"
                    />
                  </div>
                  {place.sources.yelp?.url && (
                    <a
                      href={place.sources.yelp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              {!place.ratingBreakdown?.google &&
                !place.ratingBreakdown?.yelp && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reviews available
                  </p>
                )}
            </TabsContent>

            <TabsContent value="booking" className="mt-3 space-y-3">
              {place.availability?.canBook && place.availability.bookingUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Book directly through{" "}
                    {place.availability.bookingSource || "partner"}
                  </p>
                  <Button className="w-full" asChild>
                    <a
                      href={place.availability.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Book Now
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Online booking not available
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onAddToTrip && (
            <Button
              className="flex-1"
              onClick={() => onAddToTrip(place)}
            >
              Add to Trip
            </Button>
          )}
          {onViewDetails && variant !== "expanded" && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onViewDetails(place)}
            >
              View Details
            </Button>
          )}
        </div>

        {/* Data quality indicator */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Data from {sourceCount} source{sourceCount !== 1 ? "s" : ""}</span>
          <span>
            Confidence: {Math.round(place.confidence * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConsolidatedPlaceCard;
