"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { 
  Star, 
  Clock, 
  DollarSign, 
  Users,
  Plus,
  Loader2,
  Eye,
  Filter,
  ArrowUpDown,
  MapPin
} from "lucide-react";

interface Activity {
  productCode: string;
  title: string;
  description?: string;
  images?: Array<{ imageUrl: string }>;
  rating?: number;
  reviewCount?: number;
  duration?: string;
  price?: {
    from: number;
    currency: string;
  };
  categories?: string[];
  location?: string;
}

interface ActivityTableCardProps {
  location: string;
  segmentId?: string;
  categories?: string;
}

export function ActivityTableCard({ location, segmentId, categories }: ActivityTableCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "duration">("rating");
  const [addingActivity, setAddingActivity] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, [location, categories]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [activities, categoryFilter, sortBy]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/test/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: location,
          category: categories,
          limit: 20,
        }),
      });

      if (!response.ok) throw new Error("Failed to load activities");
      const { activities: activityData } = await response.json();
      
      setActivities(activityData || []);
    } catch (err: any) {
      console.error("Error loading activities:", err);
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...activities];

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(activity => 
        activity.categories?.some(cat => 
          cat.toLowerCase().includes(categoryFilter.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price":
          return (a.price?.from || 0) - (b.price?.from || 0);
        case "duration":
          // Simple duration comparison (would need better parsing in production)
          return (a.duration || "").localeCompare(b.duration || "");
        default:
          return 0;
      }
    });

    setFilteredActivities(filtered);
  };

  const handleAddActivity = async (activity: Activity) => {
    setAddingActivity(activity.productCode);
    
    try {
      // Create reservation for this activity
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId,
          name: activity.title,
          vendor: activity.title,
          category: "Do",
          type: "Activity",
          status: "SUGGESTED",
          location: activity.location || location,
          cost: activity.price?.from || 0,
          currency: activity.price?.currency || "USD",
          imageUrl: activity.images?.[0]?.imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to add activity");
      
      console.log("Activity added successfully");
    } catch (err: any) {
      console.error("Error adding activity:", err);
      alert("Failed to add activity to itinerary");
    } finally {
      setAddingActivity(null);
    }
  };

  const getUniqueCategories = (): string[] => {
    const cats = new Set<string>();
    activities.forEach(activity => {
      activity.categories?.forEach(cat => cats.add(cat));
    });
    return Array.from(cats).slice(0, 10); // Limit to 10 categories
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading activities...</span>
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

  const uniqueCategories = getUniqueCategories();

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Activities in {location}</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {filteredActivities.length} activities available
        </p>
      </div>

      {/* Filters and Sort */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white"
            >
              <option value="rating">Sort by Rating</option>
              <option value="price">Sort by Price</option>
              <option value="duration">Sort by Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Table/Grid */}
      <div className="divide-y divide-slate-200">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No activities found matching your filters
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const isAdding = addingActivity === activity.productCode;

            return (
              <div
                key={activity.productCode}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  {activity.images && activity.images[0] && (
                    <img
                      src={activity.images[0].imageUrl}
                      alt={activity.title}
                      className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 line-clamp-2">
                          {activity.title}
                        </h4>
                        
                        {/* Rating and Reviews */}
                        {activity.rating && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium text-slate-700">
                                {activity.rating.toFixed(1)}
                              </span>
                            </div>
                            {activity.reviewCount && (
                              <span className="text-sm text-slate-500">
                                ({activity.reviewCount} reviews)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Categories */}
                        {activity.categories && activity.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {activity.categories.slice(0, 3).map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Duration and Price */}
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          {activity.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{activity.duration}</span>
                            </div>
                          )}
                          {activity.price && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>
                                From {activity.price.currency} {activity.price.from}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddActivity(activity)}
                          disabled={isAdding}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
