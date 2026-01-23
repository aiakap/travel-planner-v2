"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Plane, 
  Clock,
  DollarSign,
  Calendar,
  Users,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { AmadeusFlightData, AmadeusTransportData } from "@/lib/types/amadeus-pipeline";

interface FlightHoverCardProps {
  flightData?: AmadeusFlightData;
  transportData?: AmadeusTransportData;
  flightName: string;
  children: React.ReactNode;
  onAddToItinerary?: () => void;
}

export function FlightHoverCard({ flightData, transportData, flightName, children, onAddToItinerary }: FlightHoverCardProps) {
  // Support both legacy flightData and new transportData
  const data = transportData || flightData;
  
  if (!data || data.notFound) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{flightName}</h4>
            <p className="text-xs text-muted-foreground">No flight availability found</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Parse ISO 8601 duration (e.g., "PT5H30M" -> "5h 30m")
  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;
    
    const hours = match[1] ? match[1].replace('H', 'h ') : '';
    const minutes = match[2] ? match[2].replace('M', 'm') : '';
    return (hours + minutes).trim();
  };

  // Format datetime
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get first itinerary (outbound)
  const itinerary = data.itineraries?.[0];
  if (!itinerary) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>{children}</HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{flightName}</h4>
            <p className="text-xs text-muted-foreground">Flight data unavailable</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  const firstSegment = itinerary.segments[0];
  const lastSegment = itinerary.segments[itinerary.segments.length - 1];
  const isDirectFlight = itinerary.segments.length === 1;
  const stops = itinerary.segments.length - 1;
  const carrier = data.validatingAirlineCodes?.[0] || firstSegment.carrierCode;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-[420px]">
        <div className="space-y-3">
          {/* Cleaner Header with Route and Price */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="text-lg font-bold flex items-center gap-2">
                {firstSegment.departure.iataCode}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {lastSegment.arrival.iataCode}
              </h4>
              <p className="text-xs text-muted-foreground">
                {formatDate(firstSegment.departure.at)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                ${parseFloat(data.price.total).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">{data.price.currency}</p>
            </div>
          </div>

          <Separator />

          {/* Key Flight Info in Clean Grid */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Carrier</div>
                  <div className="font-semibold">{carrier}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="font-semibold">{formatDuration(itinerary.duration)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Depart</div>
                  <div className="font-semibold">{formatTime(firstSegment.departure.at)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Arrive</div>
                  <div className="font-semibold">{formatTime(lastSegment.arrival.at)}</div>
                </div>
              </div>
            </div>

            {!isDirectFlight && (
              <div className="pt-2 border-t border-slate-200">
                <Badge variant="secondary" className="text-xs">
                  {stops} stop{stops > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>

          {/* Return Flight Info */}
          {data.itineraries && data.itineraries.length > 1 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="h-4 w-4 rotate-180 text-muted-foreground" />
                <span className="text-muted-foreground">Return:</span>
                <span className="font-medium">
                  {formatDate(data.itineraries[1].segments[0].departure.at)}
                </span>
              </div>
            </>
          )}

          <Separator />

          {/* Planning Notice */}
          <div className="flex items-start gap-2 bg-blue-50 p-2 rounded text-xs">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-900">
              <strong>For planning only.</strong> You will need to book this flight separately after adding to your itinerary.
            </p>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full" 
            size="sm"
            onClick={onAddToItinerary || (() => {
              console.log('Add flight to itinerary:', data);
            })}
          >
            Add to Itinerary
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
