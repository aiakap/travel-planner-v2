"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Star, Clock, DollarSign, CheckCircle, XCircle, ExternalLink, AlertCircle } from "lucide-react";
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
  };
  productUrl?: string;
}

interface ActivityDetails extends Activity {
  itinerary?: {
    description?: string;
    duration?: string;
    highlights?: string[];
  };
  inclusions?: string[];
  exclusions?: string[];
  additionalInfo?: string[];
}

export default function ActivitiesAPIPage() {
  // Search State
  const [searchDestination, setSearchDestination] = useState("New York");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  const [showSearchMap, setShowSearchMap] = useState(false);
  const [mockDataWarning, setMockDataWarning] = useState<string | null>(null);

  // Details State
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
      );

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

      setSelectedActivity(data.activity);
      trackCost("viator", "details", { code: activity.productCode });
    } catch (error) {
      console.error(error);
    } finally {
      setDetailsLoading(false);
    }
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearchMap(!showSearchMap)}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {showSearchMap ? "Hide" : "Show"} Map
                    </Button>
                  </div>

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

                  {showSearchMap && (
                    <AdminMultiLocationMap
                      locations={searchResults
                        .filter(a => a.location?.latitude && a.location?.longitude)
                        .map((activity) => ({
                          lat: activity.location!.latitude!,
                          lng: activity.location!.longitude!,
                          name: activity.title,
                          description: `${activity.rating?.toFixed(1)} ⭐ • $${activity.pricing?.summary?.fromPrice || "N/A"}`,
                          category: "activity",
                          rating: activity.rating,
                          price: activity.pricing?.summary?.fromPrice ? `$${activity.pricing.summary.fromPrice}` : undefined,
                        }))}
                      title="Activity Locations"
                      showDebug={true}
                      onLocationClick={(loc) => {
                        const activity = searchResults.find(a => a.title === loc.name);
                        if (activity) handleViewDetails(activity);
                      }}
                    />
                  )}
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
                        <h4 className="font-semibold mb-2">Duration</h4>
                        <p className="text-sm">
                          {formatDuration(selectedActivity.duration?.fixedDurationInMinutes)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Price</h4>
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

                  {selectedActivity.itinerary?.highlights && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Highlights</h4>
                        <ul className="space-y-2">
                          {selectedActivity.itinerary.highlights.map((highlight, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
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
                          {selectedActivity.bookingInfo.cancellationPolicy && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {selectedActivity.bookingInfo.cancellationPolicy}
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
