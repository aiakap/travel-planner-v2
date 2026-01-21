"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin, Plane, Route } from "lucide-react";
import type { TravelStats } from "@/lib/globe-types";

interface TravelStatsCardProps {
  stats: TravelStats;
}

export function TravelStatsCard({ stats }: TravelStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Travel Stats</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Trips */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Plane className="h-4 w-4" />
              <span className="text-sm">Trips</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
          </div>

          {/* Countries Visited */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Countries</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.countriesVisited.size}
            </div>
          </div>

          {/* Total Distance */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span className="text-sm">km Traveled</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalDistanceKm)}
            </div>
          </div>

          {/* Times Around World */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="text-sm">x Around World</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.timesAroundWorld.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Total Distance Display */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-1">
            Total Distance
          </div>
          <div className="text-xl font-bold">
            {formatNumber(stats.totalDistanceKm)} km
          </div>
          <div className="text-xs text-muted-foreground">
            {formatNumber(Math.round(stats.totalDistanceKm * 0.621371))} miles
          </div>
        </div>

        {/* Countries Visited */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-2">Countries Visited</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(stats.countriesVisited)
              .sort()
              .slice(0, 9)
              .map((country) => (
                <span
                  key={country}
                  className="px-2 py-1 text-xs bg-secondary rounded-md"
                >
                  {country}
                </span>
              ))}
            {stats.countriesVisited.size > 9 && (
              <span className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                +{stats.countriesVisited.size - 9} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toFixed(0);
}
