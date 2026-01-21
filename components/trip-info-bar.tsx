import { Calendar, Globe, MapPin, Route } from "lucide-react";
import type { GlobeTripData } from "@/lib/globe-types";

interface TripInfoBarProps {
  trip: GlobeTripData;
}

export function TripInfoBar({ trip }: TripInfoBarProps) {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-6">
        {/* Dates */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Dates</div>
            <div className="font-medium">
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Countries</div>
            <div className="font-medium">{trip.countries?.length || 0}</div>
          </div>
        </div>

        {/* Segments */}
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Segments</div>
            <div className="font-medium">{trip.segments?.length || 0}</div>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Distance</div>
            <div className="font-medium">
              {formatDistance(trip.totalDistance || 0)} km
            </div>
          </div>
        </div>

        {/* Description */}
        {trip.description && (
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm text-muted-foreground">Description</div>
            <div className="text-sm">{trip.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDistance(km: number): string {
  if (km >= 1000) {
    return (km / 1000).toFixed(1) + "K";
  }
  return km.toFixed(0);
}
