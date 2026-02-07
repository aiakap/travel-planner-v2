"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Star, Clock, DollarSign, CheckCircle, XCircle, ExternalLink, AlertCircle, Users, Info, Navigation, Zap } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { AdminMultiLocationMap } from "../_components/admin-map-components";
import { cachedFetch, CacheTTL } from "@/lib/admin/api-cache";
import { trackCost } from "@/lib/admin/cost-tracker";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Activity {
  productCode: string;
  title: string;
  description?: string;
  images?: Array<{ url: string; caption?: string }>;
  rating?: number;
  reviewCount?: number;
  duration?: { fixedDurationInMinutes?: number };
  pricing?: {
    summary?: { fromPrice?: number; fromPriceBeforeDiscount?: number };
    currency?: string;
  };
  location?: {
    ref?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  categories?: Array<{ name: string }>;
  bookingInfo?: {
    instantConfirmation?: boolean;
    freeCancellation?: boolean;
    cancellationPolicy?: string;
    minTravelers?: number;
    maxTravelers?: number;
    requiresAdultForBooking?: boolean;
  };
  productUrl?: string;
  flags?: string[];
}

interface ActivityDetails extends Activity {
  itinerary?: {
    duration?: string;
    fixedDurationInMinutes?: number;
    privateTour?: boolean;
    skipTheLine?: boolean;
    items?: Array<{
      title?: string;
      description: string;
      duration?: string;
    }>;
  };
  inclusions?: string[];
  exclusions?: string[];
  additionalInfo?: string[];
  meetingPoint?: string;
  endPoint?: string;
  travelerPickup?: {
    pickupOptionType?: string;
    allowCustomPickup?: boolean;
  };
  cancellationPolicy?: {
    type?: string;
    description?: string;
    refundEligibility?: Array<{
      dayRangeMin: number;
      dayRangeMax?: number;
      percentageRefundable: number;
    }>;
  };
}

export default function ActivitiesAPIPage() {
  // Search State
  const [searchDestination, setSearchDestination] = useState("New York");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  const [mockDataWarning, setMockDataWarning] = useState<string | null>(null);

  // Details State
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Map State (geocoding on demand)
  const [showMap, setShowMap] = useState(false);
  const [geocodedLocations, setGeocodedLocations] = useState<Array<{
    lat: number;
    lng: number;
    name: string;
    description: string;
    category: string;
  }>>([]);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Categories State
  const categories = [
    "Tours & Sightseeing",
    "Cultural & Theme Tours",
    "Food & Drink",
    "Outdoor Activities",
    "Water Sports",
    "Day Trips & Excursions",
    "Shows & Performances",
    "Museums & Attractions",
  ];

  const handleSearch = async () => {
    setSearchLoading(true);
    setMockDataWarning(null);
    // Reset map state on new search
    setShowMap(false);
    setGeocodedLocations([]);
    try {
      const categoryFilter = searchCategory === "all" ? undefined : searchCategory;
      const data = await cachedFetch(
        "/api/admin/test/activities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: searchDestination,
            category: categoryFilter,
            limit: 20,
          }),
        },
        { destination: searchDestination, category: categoryFilter },
        CacheTTL.ACTIVITIES
      ) as { activities?: any[]; mock?: boolean; message?: string };

      setSearchResults(data.activities || []);
      if (data.mock) {
        setMockDataWarning(data.message || "Using mock data for demonstration");
      }
      trackCost("viator", "search", { destination: searchDestination, count: data.activities?.length || 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewDetails = async (activity: Activity) => {
    setDetailsLoading(true);
    try {
      const data = await cachedFetch(
        `/api/admin/test/activities?code=${activity.productCode}`,
        { method: "GET" },
        { code: activity.productCode },
        CacheTTL.ACTIVITIES
      );

      // Merge details with original activity data (to preserve pricing from search)
      // Product details API doesn't return pricing - it requires availability check
      setSelectedActivity({
        ...data.activity,
        // Preserve pricing from search results if not in details
        pricing: data.activity.pricing?.summary?.fromPrice 
          ? data.activity.pricing 
          : activity.pricing,
      });
      trackCost("viator", "details", { code: activity.productCode });
    } catch (error) {
      console.error(error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Geocode activity meeting points on demand
  const handleAddMap = async () => {
    setGeocodingLoading(true);
    const locations: typeof geocodedLocations = [];
    
    for (const activity of searchResults) {
      // Use meeting point if available, otherwise use destination + activity title for context
      const addressToGeocode = activity.meetingPoint 
        || `${activity.title}, ${searchDestination}`;
      
      try {
        const response = await fetch(
          `/api/geocode-timezone?address=${encodeURIComponent(addressToGeocode)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.coordinates) {
            locations.push({
              lat: data.coordinates.lat,
              lng: data.coordinates.lng,
              name: activity.title,
              description: `${activity.rating?.toFixed(1) || "N/A"} ⭐ • $${activity.pricing?.summary?.fromPrice || "N/A"}`,
              category: "activity",
            });
          }
        }
      } catch (error) {
        console.error("Geocoding error for activity:", activity.title);
      }
    }
    
    setGeocodedLocations(locations);
    setShowMap(true);
    setGeocodingLoading(false);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <ApiTestLayout
      title="Activities & Tours API"
      description="Viator API integration for activities, tours, and experiences"
      breadcrumbs={[{ label: "Activities" }]}
    >
      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Search</CardTitle>
              <CardDescription>Find tours, activities, and experiences by destination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search-destination">Destination</Label>
                  <Input
                    id="search-destination"
                    placeholder="City or destination"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, "-")}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Activities
              </Button>

              {mockDataWarning && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{mockDataWarning}</AlertDescription>
                </Alert>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">
                      Found {searchResults.length} activities
                    </h3>
                    
                    {/* Add Map button - triggers geocoding on demand */}
                    {!showMap && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddMap}
                        disabled={geocodingLoading}
                      >
                        {geocodingLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Geocoding...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            Add Map
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Map shown after geocoding */}
                  {showMap && geocodedLocations.length > 0 && (
                    <AdminMultiLocationMap
                      locations={geocodedLocations}
                      title={`Activity Locations (${geocodedLocations.length} geocoded)`}
                      showDebug={true}
                      onLocationClick={(loc) => {
                        const activity = searchResults.find(a => a.title === loc.name);
                        if (activity) handleViewDetails(activity);
                      }}
                    />
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {searchResults.map((activity) => (
                      <Card key={activity.productCode} className="overflow-hidden">
                        <div className="flex flex-col">
                          {activity.images?.[0]?.url && (
                            <img
                              src={activity.images[0].url}
                              alt={activity.title}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <CardContent className="pt-4 space-y-3">
                            <div>
                              <h4 className="font-semibold mb-1">{activity.title}</h4>
                              {renderStars(activity.rating)}
                              {activity.reviewCount && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {activity.reviewCount} reviews
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              {activity.duration?.fixedDurationInMinutes && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {formatDuration(activity.duration.fixedDurationInMinutes)}
                                </div>
                              )}
                              {activity.pricing?.summary?.fromPrice && (
                                <div className="flex items-center gap-1 font-semibold text-green-600">
                                  <DollarSign className="h-4 w-4" />
                                  From ${activity.pricing.summary.fromPrice}
                                </div>
                              )}
                            </div>

                            {activity.categories && activity.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {activity.categories.slice(0, 2).map((cat, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {cat.name}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs">
                              {activity.bookingInfo?.instantConfirmation && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Instant
                                </Badge>
                              )}
                              {activity.bookingInfo?.freeCancellation && (
                                <Badge variant="secondary" className="text-xs">
                                  Free cancellation
                                </Badge>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(activity)}
                              >
                                View Details
                              </Button>
                              {activity.productUrl && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={activity.productUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Details</CardTitle>
              <CardDescription>
                {selectedActivity
                  ? "Complete activity information"
                  : "Search for an activity and click 'View Details' to see more information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detailsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}

              {selectedActivity && !detailsLoading && (
                <div className="space-y-6">
                  {selectedActivity.images && selectedActivity.images.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-3">
                      {selectedActivity.images.slice(0, 3).map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          alt={img.caption || `Image ${i + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedActivity.title}</h3>
                    {renderStars(selectedActivity.rating)}
                    {selectedActivity.reviewCount && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedActivity.reviewCount} reviews
                      </p>
                    )}
                  </div>

                  {selectedActivity.description && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm">{selectedActivity.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duration
                        </h4>
                        <p className="text-sm">
                          {selectedActivity.itinerary?.duration || formatDuration(selectedActivity.duration?.fixedDurationInMinutes)}
                        </p>
                        {/* Show tour type badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedActivity.itinerary?.privateTour && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Private Tour
                            </Badge>
                          )}
                          {selectedActivity.itinerary?.skipTheLine && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Skip the Line
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Price
                        </h4>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-green-600">
                            From ${selectedActivity.pricing?.summary?.fromPrice || "N/A"}
                          </p>
                          {selectedActivity.pricing?.summary?.fromPriceBeforeDiscount &&
                            selectedActivity.pricing.summary.fromPriceBeforeDiscount >
                              (selectedActivity.pricing.summary.fromPrice || 0) && (
                            <p className="text-sm text-muted-foreground line-through">
                              ${selectedActivity.pricing.summary.fromPriceBeforeDiscount}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Meeting Point & End Point */}
                  {(selectedActivity.meetingPoint || selectedActivity.endPoint) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedActivity.meetingPoint && (
                        <Card>
                          <CardContent className="pt-6">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              Meeting Point
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedActivity.meetingPoint}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {selectedActivity.endPoint && (
                        <Card>
                          <CardContent className="pt-6">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Navigation className="h-4 w-4 text-blue-600" />
                              End Point
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedActivity.endPoint}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Traveler Pickup Info */}
                  {selectedActivity.travelerPickup && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Pickup Information
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedActivity.travelerPickup.pickupOptionType === "PICKUP_AND_MEET_UP" 
                            ? "Pickup available or you can meet at the starting point"
                            : selectedActivity.travelerPickup.pickupOptionType === "PICKUP_EVERYONE"
                            ? "Pickup included for all travelers"
                            : "Meet at the starting point"}
                        </p>
                        {selectedActivity.travelerPickup.allowCustomPickup && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Custom pickup location requests may be accommodated
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Itinerary Items - Tour Stops */}
                  {selectedActivity.itinerary?.items && selectedActivity.itinerary.items.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Tour Itinerary</h4>
                        <div className="space-y-4">
                          {selectedActivity.itinerary.items.map((item, i) => (
                            <div key={i} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:pb-0">
                              <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-[10px] text-primary-foreground font-medium">{i + 1}</span>
                              </div>
                              {item.title && (
                                <h5 className="font-medium text-sm">{item.title}</h5>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                              {item.duration && (
                                <span className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.duration}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedActivity.inclusions && selectedActivity.inclusions.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">What's Included</h4>
                        <ul className="space-y-1">
                          {selectedActivity.inclusions.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {selectedActivity.exclusions && selectedActivity.exclusions.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">What's Not Included</h4>
                        <ul className="space-y-1">
                          {selectedActivity.exclusions.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Additional Info - Accessibility, fitness level, etc. */}
                  {selectedActivity.additionalInfo && selectedActivity.additionalInfo.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Important Information
                        </h4>
                        <ul className="space-y-2">
                          {selectedActivity.additionalInfo.map((info, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {info}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cancellation Policy */}
                  {selectedActivity.cancellationPolicy && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Cancellation Policy</h4>
                        {selectedActivity.cancellationPolicy.type && (
                          <Badge 
                            variant={selectedActivity.cancellationPolicy.type === "STANDARD" ? "default" : "secondary"}
                            className="mb-2"
                          >
                            {selectedActivity.cancellationPolicy.type === "STANDARD" 
                              ? "Free Cancellation" 
                              : selectedActivity.cancellationPolicy.type}
                          </Badge>
                        )}
                        {selectedActivity.cancellationPolicy.description && (
                          <p className="text-sm text-muted-foreground">
                            {selectedActivity.cancellationPolicy.description}
                          </p>
                        )}
                        {selectedActivity.cancellationPolicy.refundEligibility && 
                         selectedActivity.cancellationPolicy.refundEligibility.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium">Refund Schedule:</p>
                            {selectedActivity.cancellationPolicy.refundEligibility.map((refund, i) => (
                              <p key={i} className="text-xs text-muted-foreground">
                                {refund.dayRangeMin}+ days before: {refund.percentageRefundable}% refund
                              </p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {selectedActivity.bookingInfo && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Booking Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {selectedActivity.bookingInfo.instantConfirmation ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Instant Confirmation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedActivity.bookingInfo.freeCancellation ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Free Cancellation</span>
                          </div>
                          {/* Traveler Requirements */}
                          {(selectedActivity.bookingInfo.minTravelers || selectedActivity.bookingInfo.maxTravelers) && (
                            <div className="flex items-center gap-2 mt-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {selectedActivity.bookingInfo.minTravelers && selectedActivity.bookingInfo.maxTravelers
                                  ? `${selectedActivity.bookingInfo.minTravelers} - ${selectedActivity.bookingInfo.maxTravelers} travelers`
                                  : selectedActivity.bookingInfo.minTravelers
                                  ? `Minimum ${selectedActivity.bookingInfo.minTravelers} travelers`
                                  : `Maximum ${selectedActivity.bookingInfo.maxTravelers} travelers`}
                              </span>
                            </div>
                          )}
                          {selectedActivity.bookingInfo.requiresAdultForBooking && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Adult required to book
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedActivity.location?.latitude && selectedActivity.location?.longitude && (
                    <AdminMultiLocationMap
                      locations={[
                        {
                          lat: selectedActivity.location.latitude,
                          lng: selectedActivity.location.longitude,
                          name: selectedActivity.title,
                          description: selectedActivity.location.address || "",
                          category: "activity",
                        },
                      ]}
                      title="Activity Location"
                      showDebug={true}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse by Category</CardTitle>
              <CardDescription>Explore activities by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card
                    key={category}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setSearchCategory(category.toLowerCase().replace(/\s+/g, "-"));
                    }}
                  >
                    <CardContent className="pt-6">
                      <h4 className="font-semibold">{category}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Check Availability</CardTitle>
              <CardDescription>View available dates and book activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Availability checking requires additional integration with Viator's booking API.
                Activities with instant confirmation can typically be booked for any future date.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Select an activity from the search results to see its booking information.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>
                {selectedActivity
                  ? `${selectedActivity.reviewCount || 0} reviews`
                  : "Select an activity to see reviews"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedActivity ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {renderStars(selectedActivity.rating)}
                    <span className="text-sm text-muted-foreground">
                      Based on {selectedActivity.reviewCount || 0} reviews
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full review details are available on the Viator website.
                    Click the external link icon on the activity card to view reviews.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Search for activities and select one to see review information
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
