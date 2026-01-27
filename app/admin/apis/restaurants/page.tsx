"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Star, DollarSign, Phone, ExternalLink, Image as ImageIcon } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { AdminMultiLocationMap } from "../_components/admin-map-components";
import { cachedFetch, CacheTTL } from "@/lib/admin/api-cache";
import { trackCost } from "@/lib/admin/cost-tracker";

interface Restaurant {
  id: string;
  name: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  price?: string;
  categories?: Array<{ title: string }>;
  location?: {
    address1?: string;
    city?: string;
    display_address?: string[];
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  display_phone?: string;
  url?: string;
  distance?: number;
}

interface RestaurantDetails extends Restaurant {
  photos?: string[];
  hours?: Array<{
    open: Array<{ start: string; end: string; day: number }>;
    is_open_now?: boolean;
  }>;
  transactions?: string[];
}

export default function RestaurantsAPIPage() {
  // Search State
  const [searchLocation, setSearchLocation] = useState("San Francisco");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchPrice, setSearchPrice] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [showSearchMap, setShowSearchMap] = useState(false);

  // Details State
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Photos State
  const [photoRestaurant, setPhotoRestaurant] = useState<RestaurantDetails | null>(null);

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const categoryFilter = searchCategory === "all" ? undefined : searchCategory;
      const priceFilter = searchPrice === "any" ? undefined : searchPrice;
      
      const data = await cachedFetch(
        "/api/admin/test/restaurants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: searchLocation,
            term: searchTerm,
            categories: categoryFilter,
            price: priceFilter,
            limit: 20,
          }),
        },
        { location: searchLocation, term: searchTerm, category: categoryFilter, price: priceFilter },
        CacheTTL.RESTAURANTS
      );

      setSearchResults(data.businesses || []);
      trackCost("yelp", "search", { location: searchLocation, count: data.businesses?.length || 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewDetails = async (restaurant: Restaurant) => {
    setDetailsLoading(true);
    try {
      const data = await cachedFetch(
        `/api/admin/test/restaurants?id=${restaurant.id}`,
        { method: "GET" },
        { id: restaurant.id },
        CacheTTL.RESTAURANTS
      );

      setSelectedRestaurant(data.business);
      trackCost("yelp", "details", { id: restaurant.id });
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

  return (
    <ApiTestLayout
      title="Restaurants API"
      description="Yelp Fusion API integration for restaurant search, details, reviews, and photos"
      breadcrumbs={[{ label: "Restaurants" }]}
    >
      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Search</CardTitle>
              <CardDescription>Find restaurants by location, cuisine, and price</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search-location">Location</Label>
                  <Input
                    id="search-location"
                    placeholder="City or address"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-term">Search Term (optional)</Label>
                  <Input
                    id="search-term"
                    placeholder="e.g., pizza, sushi, burgers"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="mexican">Mexican</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="american">American</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="thai">Thai</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price Range</Label>
                  <Select value={searchPrice} onValueChange={setSearchPrice}>
                    <SelectTrigger id="price">
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any price</SelectItem>
                      <SelectItem value="1">$ (Under $10)</SelectItem>
                      <SelectItem value="2">$$ ($11-30)</SelectItem>
                      <SelectItem value="3">$$$ ($31-60)</SelectItem>
                      <SelectItem value="4">$$$$ (Above $61)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Restaurants
              </Button>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">
                      Found {searchResults.length} restaurants
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
                    {searchResults.map((restaurant) => (
                      <Card key={restaurant.id} className="overflow-hidden">
                        <div className="flex gap-4">
                          {restaurant.image_url && (
                            <img
                              src={restaurant.image_url}
                              alt={restaurant.name}
                              className="w-24 h-24 object-cover"
                            />
                          )}
                          <CardContent className="flex-1 pt-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold">{restaurant.name}</h4>
                                {restaurant.price && (
                                  <Badge variant="outline">{restaurant.price}</Badge>
                                )}
                              </div>

                              {renderStars(restaurant.rating)}

                              <p className="text-xs text-muted-foreground">
                                {restaurant.categories?.map(c => c.title).join(", ")}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {restaurant.location?.display_address?.join(", ")}
                              </p>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(restaurant)}
                                >
                                  View Details
                                </Button>
                                {restaurant.url && (
                                  <Button size="sm" variant="ghost" asChild>
                                    <a href={restaurant.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {showSearchMap && (
                    <AdminMultiLocationMap
                      locations={searchResults
                        .filter(r => r.coordinates)
                        .map((restaurant) => ({
                          lat: restaurant.coordinates!.latitude,
                          lng: restaurant.coordinates!.longitude,
                          name: restaurant.name,
                          description: `${restaurant.rating?.toFixed(1)} ⭐ • ${restaurant.price || "N/A"}`,
                          category: "restaurant",
                          rating: restaurant.rating,
                          price: restaurant.price,
                        }))}
                      title="Restaurant Locations"
                      showDebug={true}
                      onLocationClick={(loc) => {
                        const restaurant = searchResults.find(r => r.name === loc.name);
                        if (restaurant) handleViewDetails(restaurant);
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
              <CardTitle>Restaurant Details</CardTitle>
              <CardDescription>
                {selectedRestaurant
                  ? "Detailed information"
                  : "Search for a restaurant and click 'View Details' to see more information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detailsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}

              {selectedRestaurant && !detailsLoading && (
                <div className="space-y-6">
                  {selectedRestaurant.image_url && (
                    <img
                      src={selectedRestaurant.image_url}
                      alt={selectedRestaurant.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedRestaurant.name}</h3>
                    {renderStars(selectedRestaurant.rating)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRestaurant.review_count} reviews
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Location</h4>
                        <p className="text-sm">
                          {selectedRestaurant.location?.display_address?.join(", ")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Contact</h4>
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedRestaurant.display_phone || "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Price Range</h4>
                        <p className="text-sm">{selectedRestaurant.price || "N/A"}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Status</h4>
                        <Badge variant={selectedRestaurant.hours?.[0]?.is_open_now ? "default" : "secondary"}>
                          {selectedRestaurant.hours?.[0]?.is_open_now ? "Open Now" : "Closed"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRestaurant.categories?.map((cat, i) => (
                          <Badge key={i} variant="outline">
                            {cat.title}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedRestaurant.transactions && selectedRestaurant.transactions.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Available Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRestaurant.transactions.map((trans, i) => (
                            <Badge key={i} variant="secondary">
                              {trans.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedRestaurant.coordinates && (
                    <AdminMultiLocationMap
                      locations={[
                        {
                          lat: selectedRestaurant.coordinates.latitude,
                          lng: selectedRestaurant.coordinates.longitude,
                          name: selectedRestaurant.name,
                          description: `${selectedRestaurant.rating?.toFixed(1)} ⭐`,
                          category: "restaurant",
                        },
                      ]}
                      title="Location"
                      showDebug={true}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>
                Reviews are displayed in the details view. Select a restaurant to see reviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Note: Yelp API v3 does not provide review text in the API response.
                Users are redirected to Yelp.com to read full reviews.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Photos</CardTitle>
              <CardDescription>
                {photoRestaurant || selectedRestaurant
                  ? "Photo gallery"
                  : "Select a restaurant to view photos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(photoRestaurant || selectedRestaurant)?.photos && (
                <div className="grid gap-4 md:grid-cols-3">
                  {(photoRestaurant || selectedRestaurant)!.photos!.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
              {!(photoRestaurant || selectedRestaurant)?.photos && (
                <p className="text-sm text-muted-foreground">
                  Search for restaurants and view details to see photos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservations</CardTitle>
              <CardDescription>Check reservation availability</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reservation functionality requires additional integration with Yelp Reservations API
                or third-party reservation systems like OpenTable.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Restaurants that support reservations will show "restaurant_reservation" in their
                transactions list.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
