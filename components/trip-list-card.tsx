"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Route, Plus } from "lucide-react";
import type { GlobeTripData } from "@/lib/globe-types";
import { generateTripMapUrl } from "@/lib/static-map-utils";
import { AddToTripModal } from "./add-to-trip-modal";

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
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null);
  const [addToTripModalData, setAddToTripModalData] = useState<{
    tripId: string;
    tripTitle: string;
  } | null>(null);

  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No trips found
      </div>
    );
  }

  const handleAddToTrip = async (data: {
    tripId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "suggested" | "planned" | "confirmed";
  }) => {
    // TODO: Implement the actual add to trip logic
    console.log("Adding to trip:", data);
    // This would call an API endpoint to create a reservation
  };

  return (
    <>
      {addToTripModalData && (
        <AddToTripModal
          tripId={addToTripModalData.tripId}
          tripTitle={addToTripModalData.tripTitle}
          itemName="New Activity"
          onClose={() => setAddToTripModalData(null)}
          onAdd={handleAddToTrip}
        />
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {trips.map((trip) => {
          const isSelected = selectedTripId === trip.id;
          const isHovered = hoveredTripId === trip.id;

          // Generate static map preview URL
          const mapUrl = trip.segments && trip.segments.length > 0
            ? generateTripMapUrl(trip.segments, 400, 150)
            : null;

          return (
          <div
            key={trip.id}
            className={`border rounded-lg overflow-hidden transition-all cursor-pointer group ${
              isSelected
                ? "border-primary shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            }`}
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: isSelected ? (trip.color || "#3b82f6") : "transparent",
            }}
            onMouseEnter={() => setHoveredTripId(trip.id)}
            onMouseLeave={() => setHoveredTripId(null)}
            onClick={() => onTripClick(trip.id)}
          >
            {/* Map Preview */}
            {mapUrl && (
              <div className="relative h-24 bg-slate-100 overflow-hidden">
                <img
                  src={mapUrl}
                  alt={`${trip.title} route`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Hover Overlay with Add to Trip Button */}
                <div
                  className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 ${
                    isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddToTripModalData({
                        tripId: trip.id,
                        tripTitle: trip.title,
                      });
                    }}
                    className="bg-white hover:bg-white/90 text-slate-900 font-medium shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Trip
                  </Button>
                </div>
              </div>
            )}
            
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
    </>
  );
}
