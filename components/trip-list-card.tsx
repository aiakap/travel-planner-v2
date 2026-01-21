"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Route } from "lucide-react";
import type { GlobeTripData } from "@/lib/globe-types";

interface TripListCardProps {
  trips: GlobeTripData[];
  selectedTripId: string | null;
  onTripClick: (tripId: string) => void;
}

export function TripListCard({
  trips,
  selectedTripId,
  onTripClick,
}: TripListCardProps) {
  // Filter trips by status
  const now = new Date();
  const upcomingTrips = trips.filter(
    (trip) => new Date(trip.startDate) > now
  );
  const pastTrips = trips.filter((trip) => new Date(trip.endDate) < now);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Trips</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All <span className="ml-1 text-xs">({trips.length})</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming{" "}
              <span className="ml-1 text-xs">({upcomingTrips.length})</span>
            </TabsTrigger>
            <TabsTrigger value="past">
              Past <span className="ml-1 text-xs">({pastTrips.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TripList
              trips={trips}
              selectedTripId={selectedTripId}
              onTripClick={onTripClick}
            />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <TripList
              trips={upcomingTrips}
              selectedTripId={selectedTripId}
              onTripClick={onTripClick}
            />
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            <TripList
              trips={pastTrips}
              selectedTripId={selectedTripId}
              onTripClick={onTripClick}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface TripListProps {
  trips: GlobeTripData[];
  selectedTripId: string | null;
  onTripClick: (tripId: string) => void;
}

function TripList({
  trips,
  selectedTripId,
  onTripClick,
}: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No trips found
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {trips.map((trip) => {
        const isSelected = selectedTripId === trip.id;

        return (
          <div
            key={trip.id}
            className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${
              isSelected
                ? "border-primary shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            }`}
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: isSelected ? (trip.color || "#3b82f6") : "transparent",
            }}
            onClick={() => onTripClick(trip.id)}
          >
            <div className="p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{trip.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(trip.startDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}{" "}
                        -{" "}
                        {new Date(trip.endDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {trip.countries?.length || 0}{" "}
                        {(trip.countries?.length || 0) === 1
                          ? "country"
                          : "countries"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Route className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {trip.segments?.length || 0}{" "}
                        {(trip.segments?.length || 0) === 1
                          ? "segment"
                          : "segments"}
                      </span>
                    </div>
                  </div>
                  {/* Country badges */}
                  {trip.countries && trip.countries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trip.countries.slice(0, 3).map((country) => (
                        <Badge
                          key={country}
                          variant="secondary"
                          className="text-xs"
                        >
                          {country}
                        </Badge>
                      ))}
                      {trip.countries.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{trip.countries.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: trip.color || "#3b82f6" }}
                    title="Selected on globe"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
