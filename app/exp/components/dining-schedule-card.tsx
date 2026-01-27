"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { 
  Calendar, 
  Clock, 
  Star, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Loader2,
  MapPin,
  Phone,
  ExternalLink
} from "lucide-react";
import { PlaceHoverCard } from "@/app/exp/components/place-hover-card";

interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  review_count: number;
  price?: string;
  categories: Array<{ title: string; alias: string }>;
  location: {
    display_address: string[];
  };
  phone?: string;
  display_phone?: string;
  url?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface DiningScheduleCardProps {
  tripId: string;
  segmentId?: string;
}

export function DiningScheduleCard({ tripId, segmentId }: DiningScheduleCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<any>(null);
  const [restaurantsByDate, setRestaurantsByDate] = useState<Map<string, Restaurant[]>>(new Map());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [addingRestaurant, setAddingRestaurant] = useState<string | null>(null);

  useEffect(() => {
    loadTripAndRestaurants();
  }, [tripId, segmentId]);

  const loadTripAndRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trip data
      const tripResponse = await fetch(`/api/trips/${tripId}`);
      if (!tripResponse.ok) throw new Error("Failed to load trip");
      const trip = await tripResponse.json();
      setTripData(trip);

      // Get trip location (from first segment or trip description)
      const location = getLocationFromTrip(trip);
      if (!location) {
        setError("Could not determine trip location");
        setLoading(false);
        return;
      }

      // Generate dates for the trip
      const dates = generateDateRange(trip.startDate, trip.endDate);

      // Fetch restaurants for the location
      const restaurantsResponse = await fetch("/api/admin/test/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          categories: "restaurants",
          limit: Math.min(dates.length * 3, 30), // 3 per night, max 30
        }),
      });

      if (!restaurantsResponse.ok) throw new Error("Failed to load restaurants");
      const { businesses } = await restaurantsResponse.json();

      // Distribute restaurants across dates (3 per night)
      const restaurantMap = new Map<string, Restaurant[]>();
      dates.forEach((date, index) => {
        const startIdx = index * 3;
        const dateRestaurants = businesses.slice(startIdx, startIdx + 3);
        restaurantMap.set(date, dateRestaurants);
      });

      setRestaurantsByDate(restaurantMap);
      // Expand first date by default
      if (dates.length > 0) {
        setExpandedDates(new Set([dates[0]]));
      }
    } catch (err: any) {
      console.error("Error loading dining schedule:", err);
      setError(err.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const getLocationFromTrip = (trip: any): string | null => {
    // Try to get location from segments
    if (trip.segments && trip.segments.length > 0) {
      const firstSegment = trip.segments[0];
      if (firstSegment.startLocation) return firstSegment.startLocation;
      if (firstSegment.endLocation) return firstSegment.endLocation;
    }
    
    // Try to extract from trip title (e.g., "Trip to Paris")
    const titleMatch = trip.title?.match(/to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (titleMatch) return titleMatch[1];
    
    return null;
  };

  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleAddRestaurant = async (restaurant: Restaurant, date: string, time: string) => {
    const restaurantKey = `${restaurant.id}-${date}-${time}`;
    setAddingRestaurant(restaurantKey);
    
    try {
      // Create reservation for this restaurant
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          segmentId,
          name: restaurant.name,
          vendor: restaurant.name,
          category: "Eat",
          type: "Restaurant",
          status: "SUGGESTED",
          location: restaurant.location.display_address.join(", "),
          startTime: `${date}T${time}:00`,
          cost: 0, // User can edit later
          currency: "USD",
          phone: restaurant.phone,
          url: restaurant.url,
          imageUrl: restaurant.image_url,
        }),
      });

      if (!response.ok) throw new Error("Failed to add restaurant");
      
      // Success - could show a toast notification here
      console.log("Restaurant added successfully");
    } catch (err: any) {
      console.error("Error adding restaurant:", err);
      alert("Failed to add restaurant to itinerary");
    } finally {
      setAddingRestaurant(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading restaurant suggestions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  const dates = Array.from(restaurantsByDate.keys()).sort();

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-slate-900">Dining Schedule</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Restaurant suggestions for each night of your trip
        </p>
      </div>

      {/* Date sections */}
      <div className="divide-y divide-slate-200">
        {dates.map((date, dateIdx) => {
          const restaurants = restaurantsByDate.get(date) || [];
          const isExpanded = expandedDates.has(date);
          const suggestedTimes = ["18:00", "19:00", "20:00"];

          return (
            <div key={date} className="bg-white">
              {/* Date header */}
              <button
                onClick={() => toggleDate(date)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-700 font-semibold">
                    {dateIdx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">{formatDate(date)}</div>
                    <div className="text-sm text-slate-500">{restaurants.length} options</div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {/* Restaurant options */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {restaurants.map((restaurant, idx) => {
                    const suggestedTime = suggestedTimes[idx] || "19:00";
                    const restaurantKey = `${restaurant.id}-${date}-${suggestedTime}`;
                    const isAdding = addingRestaurant === restaurantKey;

                    return (
                      <div
                        key={restaurant.id}
                        className="flex gap-3 p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all"
                      >
                        {/* Restaurant image */}
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />

                        {/* Restaurant details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate">
                                {restaurant.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-sm font-medium text-slate-700">
                                    {restaurant.rating}
                                  </span>
                                  <span className="text-sm text-slate-500">
                                    ({restaurant.review_count})
                                  </span>
                                </div>
                                {restaurant.price && (
                                  <Badge variant="secondary" className="text-xs">
                                    {restaurant.price}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Categories */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {restaurant.categories.slice(0, 3).map((cat) => (
                              <Badge key={cat.alias} variant="outline" className="text-xs">
                                {cat.title}
                              </Badge>
                            ))}
                          </div>

                          {/* Location and time */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {restaurant.location.display_address[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{suggestedTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Add button */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddRestaurant(restaurant, date, suggestedTime)}
                            disabled={isAdding}
                            className="whitespace-nowrap"
                          >
                            {isAdding ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                          {restaurant.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(restaurant.url, '_blank')}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
