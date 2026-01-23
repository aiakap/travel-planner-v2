import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plane,
  Train,
  Car,
  Ship,
  Footprints,
  MoreHorizontal,
  Hotel,
  Home,
  Building,
  Palmtree,
  MapPin,
  Utensils,
  Coffee,
  Wine,
  UtensilsCrossed,
  Ticket,
  Building2,
  Mountain,
  Compass,
  Sparkles,
} from "lucide-react";
import {
  DemoInteractiveMap,
  DemoFlightMap,
  StaticMapDisplay,
  StreetViewDisplay,
  PlaceCard,
  GeocodingDisplay,
  TimezoneCard,
  RouteInfoCard,
} from "./client";
import { AmadeusNav } from "../nav";
import {
  demoTripWithData,
  demoSegments,
  demoReservations,
  demoPlacesData,
  demoGeocodingData,
  demoTimezoneData,
  demoRoutesData,
  demoSegmentTypes,
  demoReservationTypes,
  demoReservationCategories,
} from "@/lib/demo-data";
import {
  generateTripMapUrl,
  generateLocationMapUrl,
  generateMultiMarkerMapUrl,
  generateDayItineraryMapUrl,
} from "@/lib/static-map-utils";

const segmentTypeIcons = {
  Flight: Plane,
  Train: Train,
  Drive: Car,
  Ferry: Ship,
  Walk: Footprints,
  Other: MoreHorizontal,
};

const reservationTypeIcons = {
  Flight: Plane,
  Train: Train,
  "Car Rental": Car,
  Bus: Car,
  Ferry: Ship,
  Hotel: Hotel,
  Airbnb: Home,
  Hostel: Building,
  Resort: Palmtree,
  "Vacation Rental": Home,
  Tour: Compass,
  "Event Tickets": Ticket,
  Museum: Building2,
  Hike: Mountain,
  Excursion: MapPin,
  Adventure: Sparkles,
  Restaurant: Utensils,
  Cafe: Coffee,
  Bar: Wine,
  "Food Tour": UtensilsCrossed,
};

export default function DemoPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Generate static map URLs
  const tripMapUrl = generateTripMapUrl(
    demoSegments.map((seg) => ({
      startLat: seg.startLat,
      startLng: seg.startLng,
      endLat: seg.endLat,
      endLng: seg.endLng,
    })),
    800,
    400
  );

  const parisHotelMapUrl = generateLocationMapUrl(48.8661, 2.3048, 600, 300, 15, "red");

  const parisItineraryMapUrl = generateDayItineraryMapUrl(
    [
      { lat: 48.8606, lng: 2.3376, name: "Louvre Museum" },
      { lat: 48.8584, lng: 2.2945, name: "Eiffel Tower" },
      { lat: 48.8530, lng: 2.3499, name: "Notre-Dame" },
      { lat: 48.8867, lng: 2.3431, name: "Sacré-Cœur" },
    ],
    800,
    400
  );

  const multiCityMapUrl = generateMultiMarkerMapUrl(
    [
      { lat: 48.8566, lng: 2.3522, label: "1", color: "green" },
      { lat: 41.9028, lng: 12.4964, label: "2", color: "blue" },
      { lat: 41.3874, lng: 2.1686, label: "3", color: "red" },
    ],
    800,
    400
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AmadeusNav />
      <div className="flex-1">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Travel Planner Demo</h1>
          <p className="text-xl md:text-2xl mb-6 text-blue-100">
            Comprehensive Showcase of All Capabilities
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-3xl">
            <h2 className="text-2xl font-semibold mb-2">{demoTripWithData.title}</h2>
            <p className="text-blue-100 mb-4">{demoTripWithData.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-blue-200">Dates:</span>{" "}
                <span className="font-semibold">
                  {demoTripWithData.startDate.toLocaleDateString()} -{" "}
                  {demoTripWithData.endDate.toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-blue-200">Duration:</span>{" "}
                <span className="font-semibold">10 days</span>
              </div>
              <div>
                <span className="text-blue-200">Cities:</span>{" "}
                <span className="font-semibold">Paris, Rome, Barcelona</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Section 1: Static Maps API */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Static Maps API</h2>
            <p className="text-muted-foreground">
              Generate static map images with markers, paths, and custom styling
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StaticMapDisplay
              url={tripMapUrl}
              title="Trip Route Map"
              description="Multi-segment polyline showing entire journey"
              apiCall="https://maps.googleapis.com/maps/api/staticmap?size=800x400&markers=color:green|label:S|..."
            />
            <StaticMapDisplay
              url={parisHotelMapUrl}
              title="Single Location Map"
              description="Hotel pinpoint with custom zoom and marker"
              apiCall="https://maps.googleapis.com/maps/api/staticmap?center=48.8661,2.3048&zoom=15&..."
            />
            <StaticMapDisplay
              url={parisItineraryMapUrl}
              title="Day Itinerary Map"
              description="Numbered markers with connecting path"
              apiCall="https://maps.googleapis.com/maps/api/staticmap?size=800x400&markers=color:blue|label:1|..."
            />
            <StaticMapDisplay
              url={multiCityMapUrl}
              title="Multi-City Map"
              description="Multiple destinations with color-coded markers"
              apiCall="https://maps.googleapis.com/maps/api/staticmap?size=800x400&markers=color:green|label:1|..."
            />
          </div>
        </section>

        <Separator />

        {/* Section 2: Interactive Maps */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Interactive Maps (JavaScript API)</h2>
            <p className="text-muted-foreground">
              Dynamic maps with markers, polylines, and info windows using @react-google-maps/api
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Full Trip Map</CardTitle>
                <CardDescription>All segments with connecting polylines</CardDescription>
              </CardHeader>
              <CardContent>
                <DemoInteractiveMap
                  locations={[
                    { lat: 40.6413, lng: -73.7781, title: "New York JFK", description: "Departure" },
                    { lat: 49.0097, lng: 2.5479, title: "Paris CDG", description: "Arrival" },
                    { lat: 48.8443, lng: 2.3744, title: "Paris Gare de Lyon", description: "Train Departure" },
                    { lat: 41.9009, lng: 12.5028, title: "Roma Termini", description: "Train Arrival" },
                    { lat: 41.9028, lng: 12.4964, title: "Rome", description: "Drive Start" },
                    { lat: 41.3874, lng: 2.1686, title: "Barcelona", description: "Drive End" },
                  ]}
                  showPath={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flight Path Map</CardTitle>
                <CardDescription>Curved arc showing transatlantic flight</CardDescription>
              </CardHeader>
              <CardContent>
                <DemoFlightMap
                  departure={{ lat: 40.6413, lng: -73.7781, name: "New York JFK" }}
                  arrival={{ lat: 49.0097, lng: 2.5479, name: "Paris CDG" }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservations Map</CardTitle>
                <CardDescription>All reservation locations in Paris</CardDescription>
              </CardHeader>
              <CardContent>
                <DemoInteractiveMap
                  locations={[
                    { lat: 48.8661, lng: 2.3048, title: "Hôtel Plaza Athénée", description: "Luxury Hotel" },
                    { lat: 48.8584, lng: 2.2945, title: "Le Jules Verne", description: "Michelin Restaurant" },
                    { lat: 48.8606, lng: 2.3376, title: "Louvre Museum", description: "Guided Tour" },
                  ]}
                  showPath={false}
                  zoom={13}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rome Attractions Map</CardTitle>
                <CardDescription>Vatican and Colosseum locations</CardDescription>
              </CardHeader>
              <CardContent>
                <DemoInteractiveMap
                  locations={[
                    { lat: 41.9064, lng: 12.4536, title: "Vatican Museums", description: "Morning Tour" },
                    { lat: 41.8902, lng: 12.4922, title: "Colosseum", description: "Underground Tour" },
                    { lat: 41.9062, lng: 12.4828, title: "Hotel Hassler", description: "Spanish Steps Hotel" },
                  ]}
                  showPath={false}
                  zoom={13}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Section 3: Street View API */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Street View Static API</h2>
            <p className="text-muted-foreground">
              Immersive street-level imagery of locations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StreetViewDisplay
              lat={48.8584}
              lng={2.2945}
              heading={90}
              pitch={10}
              title="Eiffel Tower View"
            />
            <StreetViewDisplay
              lat={41.8902}
              lng={12.4922}
              heading={180}
              pitch={0}
              title="Colosseum View"
            />
          </div>
        </section>

        <Separator />

        {/* Section 4: Places API */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Places API</h2>
            <p className="text-muted-foreground">
              Search for places, get details, ratings, and photos
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Text Search Results: "Restaurants in Paris"</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {demoPlacesData.parisRestaurants.map((place, index) => (
                  <PlaceCard
                    key={index}
                    name={place.name}
                    rating={place.rating}
                    userRatingsTotal={place.userRatingsTotal}
                    formattedAddress={place.formattedAddress}
                    types={place.types}
                    priceLevel={place.priceLevel}
                  />
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Autocomplete API</CardTitle>
                <CardDescription>Place suggestions as user types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">Query: "Paris"</p>
                  {demoPlacesData.autocompleteResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{result}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-muted p-2 rounded">
                  <p className="text-xs font-mono">
                    https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Paris
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Section 5: Geocoding API */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Geocoding API</h2>
            <p className="text-muted-foreground">
              Convert between addresses and coordinates
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GeocodingDisplay
              title="Forward Geocoding"
              input={demoGeocodingData.forwardGeocoding.address}
              output={`${demoGeocodingData.forwardGeocoding.result.formattedAddress}\nLat: ${demoGeocodingData.forwardGeocoding.result.location.lat}, Lng: ${demoGeocodingData.forwardGeocoding.result.location.lng}`}
              apiEndpoint="https://maps.googleapis.com/maps/api/geocode/json"
            />
            <GeocodingDisplay
              title="Reverse Geocoding"
              input={`Lat: ${demoGeocodingData.reverseGeocoding.location.lat}, Lng: ${demoGeocodingData.reverseGeocoding.location.lng}`}
              output={demoGeocodingData.reverseGeocoding.result.formattedAddress}
              apiEndpoint="https://maps.googleapis.com/maps/api/geocode/json"
            />
          </div>
        </section>

        <Separator />

        {/* Section 6: Timezone API */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Time Zone API</h2>
            <p className="text-muted-foreground">
              Get timezone information for any location on Earth
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoTimezoneData.map((tz, index) => (
              <TimezoneCard
                key={index}
                city={tz.city}
                timeZoneId={tz.timeZoneId}
                timeZoneName={tz.timeZoneName}
                currentTime={tz.currentTime}
                location={tz.location}
              />
            ))}
          </div>
        </section>

        <Separator />

        {/* Section 7: Routes API */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Routes API (Directions)</h2>
            <p className="text-muted-foreground">
              Calculate routes, distances, and travel times between locations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RouteInfoCard
              from="Paris"
              to="Rome"
              distance={demoRoutesData.parisToRome.distance.text}
              duration={demoRoutesData.parisToRome.duration.text}
              mode={demoRoutesData.parisToRome.mode}
            />
            <RouteInfoCard
              from="Rome"
              to="Barcelona"
              distance={demoRoutesData.romeToBarcelona.distance.text}
              duration={demoRoutesData.romeToBarcelona.duration.text}
              mode={demoRoutesData.romeToBarcelona.mode}
            />
          </div>
        </section>

        <Separator />

        {/* Section 8: Segment Types */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Segment Types</h2>
            <p className="text-muted-foreground">
              All transportation modes supported in the travel planner
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(demoSegmentTypes).map(([key, type]) => {
              const Icon = segmentTypeIcons[type.name as keyof typeof segmentTypeIcons] || MoreHorizontal;
              return (
                <Card key={key} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-12 w-12 mx-auto mb-3 text-primary" />
                    <p className="font-semibold">{type.name}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Section 9: Reservation Types */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Reservation Types by Category</h2>
            <p className="text-muted-foreground">
              All reservation categories and types available in the system
            </p>
          </div>
          <div className="space-y-8">
            {/* Travel Category */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Travel
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(demoReservationTypes)
                  .filter(([_, type]) => type.categoryId === demoReservationCategories.travel.id)
                  .map(([key, type]) => {
                    const Icon = reservationTypeIcons[type.name as keyof typeof reservationTypeIcons] || MapPin;
                    return (
                      <Card key={key}>
                        <CardContent className="pt-6 text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium">{type.name}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Stay Category */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Stay
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(demoReservationTypes)
                  .filter(([_, type]) => type.categoryId === demoReservationCategories.stay.id)
                  .map(([key, type]) => {
                    const Icon = reservationTypeIcons[type.name as keyof typeof reservationTypeIcons] || Hotel;
                    return (
                      <Card key={key}>
                        <CardContent className="pt-6 text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="text-sm font-medium">{type.name}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Activity Category */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Compass className="h-5 w-5" />
                Activity
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(demoReservationTypes)
                  .filter(([_, type]) => type.categoryId === demoReservationCategories.activity.id)
                  .map(([key, type]) => {
                    const Icon = reservationTypeIcons[type.name as keyof typeof reservationTypeIcons] || Sparkles;
                    return (
                      <Card key={key}>
                        <CardContent className="pt-6 text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <p className="text-sm font-medium">{type.name}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Dining Category */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Dining
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(demoReservationTypes)
                  .filter(([_, type]) => type.categoryId === demoReservationCategories.dining.id)
                  .map(([key, type]) => {
                    const Icon = reservationTypeIcons[type.name as keyof typeof reservationTypeIcons] || Utensils;
                    return (
                      <Card key={key}>
                        <CardContent className="pt-6 text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                          <p className="text-sm font-medium">{type.name}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 10: Sample Reservations */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Sample Reservations</h2>
            <p className="text-muted-foreground">
              Detailed examples showing all reservation data fields
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Flight Reservation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      {demoReservations[0].name}
                    </CardTitle>
                    <CardDescription>{demoReservations[0].vendor}</CardDescription>
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Confirmation:</span>{" "}
                  <span className="font-mono">{demoReservations[0].confirmationNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Departure:</span>{" "}
                  {(demoReservations[0] as any).departureLocation || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Arrival:</span>{" "}
                  {(demoReservations[0] as any).arrivalLocation || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">
                    ${demoReservations[0].cost?.toFixed(2)} {demoReservations[0].currency}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {demoReservations[0].notes}
                </div>
              </CardContent>
            </Card>

            {/* Hotel Reservation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Hotel className="h-5 w-5" />
                      {demoReservations[1].name}
                    </CardTitle>
                    <CardDescription>{demoReservations[1].vendor}</CardDescription>
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Confirmation:</span>{" "}
                  <span className="font-mono">{demoReservations[1].confirmationNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span> {demoReservations[1].location}
                </div>
                <div>
                  <span className="text-muted-foreground">Check-in:</span>{" "}
                  {demoReservations[1].startTime?.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>{" "}
                  {demoReservations[1].endTime?.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">
                    €{demoReservations[1].cost?.toFixed(2)} {demoReservations[1].currency}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {demoReservations[1].notes}
                </div>
              </CardContent>
            </Card>

            {/* Restaurant Reservation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Utensils className="h-5 w-5" />
                      {demoReservations[2].name}
                    </CardTitle>
                    <CardDescription>{demoReservations[2].vendor}</CardDescription>
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Confirmation:</span>{" "}
                  <span className="font-mono">{demoReservations[2].confirmationNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span> {demoReservations[2].location}
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  {demoReservations[2].startTime?.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">
                    €{demoReservations[2].cost?.toFixed(2)} {demoReservations[2].currency}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {demoReservations[2].notes}
                </div>
              </CardContent>
            </Card>

            {/* Museum/Tour Reservation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {demoReservations[5].name}
                    </CardTitle>
                    <CardDescription>{demoReservations[5].vendor}</CardDescription>
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Confirmation:</span>{" "}
                  <span className="font-mono">{demoReservations[5].confirmationNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span> {demoReservations[5].location}
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  {demoReservations[5].startTime?.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span> 4 hours
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">
                    €{demoReservations[5].cost?.toFixed(2)} {demoReservations[5].currency}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {demoReservations[5].notes}
                </div>
              </CardContent>
            </Card>

            {/* Car Rental Reservation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      {demoReservations[7].name}
                    </CardTitle>
                    <CardDescription>{demoReservations[7].vendor}</CardDescription>
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Confirmation:</span>{" "}
                  <span className="font-mono">{demoReservations[7].confirmationNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pickup:</span> {demoReservations[7].location}
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span> 3 days
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">
                    €{demoReservations[7].cost?.toFixed(2)} {demoReservations[7].currency}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {demoReservations[7].notes}
                </div>
              </CardContent>
            </Card>

            {/* Activity/Tickets Reservation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      {demoReservations[9].name}
                    </CardTitle>
                    <CardDescription>{demoReservations[9].vendor}</CardDescription>
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Confirmation:</span>{" "}
                  <span className="font-mono">{demoReservations[9].confirmationNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span> {demoReservations[9].location}
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  {demoReservations[9].startTime?.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">
                    €{demoReservations[9].cost?.toFixed(2)} {demoReservations[9].currency}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {demoReservations[9].notes}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Footer */}
        <section className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Demo Complete</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This demo showcases all Google Maps & Places API integrations, segment types, reservation
            categories, and data structures available in the travel planner. All data is hardcoded for
            demonstration purposes.
          </p>
        </section>
      </div>
      </div>
    </div>
  );
}
