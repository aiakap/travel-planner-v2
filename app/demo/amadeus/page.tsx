import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { AmadeusNav } from "./nav";
import {
  FlightOffersTable,
  HotelsTable,
  HotelOffersTable,
  TransfersTable,
  ActivitiesTable,
  CitiesTable,
  DebugLoggerControls
} from "./client";
import {
  demoFlightOffers,
  demoHotels,
  demoHotelOffers,
  demoTransfers,
  demoActivities,
  demoCities
} from "@/lib/amadeus-demo-data";

export default function AmadeusDemoPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 py-8 px-4 max-w-7xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Amadeus Self-Service API Demo</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive demonstration of Amadeus travel APIs with static sample data.
          All prices displayed in USD. Hover over any row to see complete API response data.
        </p>
        <DebugLoggerControls />
      </div>

      {/* Flight Offers Search */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Flight Offers Search API</CardTitle>
            <CardDescription>
              Search and compare flight offers with detailed pricing, segments, and fare information.
              All prices in USD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v2/shopping/flight-offers
              </code>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "originLocationCode": "JFK",
  "destinationLocationCode": "CDG",
  "departureDate": "2026-07-15",
  "adults": 1,
  "currencyCode": "USD",
  "max": 10
}`}
              </pre>
            </div>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for details):</h3>
            <FlightOffersTable offers={demoFlightOffers} />
          </CardContent>
        </Card>
      </section>

      {/* Hotel List */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Hotel List API</CardTitle>
            <CardDescription>
              Find hotels by city code or geographic coordinates. Returns basic hotel information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/reference-data/locations/hotels/by-city
              </code>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "cityCode": "PAR",
  "radius": 5,
  "radiusUnit": "KM",
  "hotelSource": "ALL"
}`}
              </pre>
            </div>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for details):</h3>
            <HotelsTable hotels={demoHotels} />
          </CardContent>
        </Card>
      </section>

      {/* Hotel Search (with pricing) */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Search API</CardTitle>
            <CardDescription>
              Get hotel availability, room types, and pricing for specific dates. All prices in USD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v3/shopping/hotel-offers
              </code>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "hotelIds": "PARCE001,PAROP002",
  "checkInDate": "2026-07-15",
  "checkOutDate": "2026-07-17",
  "adults": 2,
  "currency": "USD"
}`}
              </pre>
            </div>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for details):</h3>
            <HotelOffersTable offers={demoHotelOffers} />
          </CardContent>
        </Card>
      </section>

      {/* Transfer Search */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Search API</CardTitle>
            <CardDescription>
              Find airport transfers including private cars, shared shuttles, and other ground transportation. All prices in USD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/shopping/transfer-offers
              </code>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "startLocationCode": "CDG",
  "endAddressLine": "70 Avenue des Champs-Elysees",
  "endCityName": "Paris",
  "endCountryCode": "FR",
  "transferType": "PRIVATE",
  "startDateTime": "2026-07-15T10:30:00",
  "passengers": 3
}`}
              </pre>
            </div>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for details):</h3>
            <TransfersTable transfers={demoTransfers} />
          </CardContent>
        </Card>
      </section>

      {/* Tours & Activities */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Tours & Activities API</CardTitle>
            <CardDescription>
              Discover tours, attractions, and activities at your destination. All prices in USD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/shopping/activities
              </code>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "radius": 10
}`}
              </pre>
            </div>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for details):</h3>
            <ActivitiesTable activities={demoActivities} />
          </CardContent>
        </Card>
      </section>

      {/* City Search */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>City Search API</CardTitle>
            <CardDescription>
              Search for cities by keyword to get IATA codes and geographic information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/reference-data/locations/cities
              </code>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "keyword": "Paris",
  "max": 10
}`}
              </pre>
            </div>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for details):</h3>
            <CitiesTable cities={demoCities} />
          </CardContent>
        </Card>
      </section>

      {/* API Information */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Additional Amadeus APIs</CardTitle>
            <CardDescription>
              Other available APIs not shown in this demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Flight APIs:</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
                  <li>Flight Offers Price - Confirm pricing and availability</li>
                  <li>Flight Create Orders - Complete flight booking</li>
                  <li>Flight Order Management - Manage/cancel bookings</li>
                  <li>Seatmap Display - View cabin layout for seat selection</li>
                  <li>Flight Inspirations - Find cheapest destinations</li>
                  <li>Flight Choice Prediction - AI-powered flight recommendations</li>
                  <li>Flight Price Analysis - Historical price trends</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Hotel APIs:</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
                  <li>Hotel Booking - Create hotel reservations</li>
                  <li>Hotel Ratings - Sentiment analysis and guest ratings</li>
                  <li>Hotel Name Autocomplete - Typeahead search suggestions</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Transfer APIs:</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
                  <li>Transfer Booking - Book selected transfer</li>
                  <li>Transfer Management - Manage/cancel transfer bookings</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Destination Content:</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
                  <li>Trip Purpose Prediction - Predict business vs leisure travel</li>
                  <li>Points of Interest - Discover local attractions</li>
                  <li>Safe Place - COVID-19 safety ratings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Additional APIs Section */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Additional Amadeus APIs</CardTitle>
            <CardDescription>
              Click any API below to see detailed demos with complete data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Flight APIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Link href="/demo/amadeus/flight-offers-price" className="text-sm text-primary hover:underline">
                    Flight Offers Price - Confirm pricing and availability
                  </Link>
                  <Link href="/demo/amadeus/flight-create-orders" className="text-sm text-primary hover:underline">
                    Flight Create Orders - Complete flight booking
                  </Link>
                  <Link href="/demo/amadeus/flight-order-management" className="text-sm text-primary hover:underline">
                    Flight Order Management - Manage/cancel bookings
                  </Link>
                  <Link href="/demo/amadeus/seatmap-display" className="text-sm text-primary hover:underline">
                    Seatmap Display - View cabin layout for seat selection
                  </Link>
                  <Link href="/demo/amadeus/flight-inspirations" className="text-sm text-primary hover:underline">
                    Flight Inspirations - Find cheapest destinations
                  </Link>
                  <Link href="/demo/amadeus/flight-choice-prediction" className="text-sm text-primary hover:underline">
                    Flight Choice Prediction - AI-powered flight recommendations
                  </Link>
                  <Link href="/demo/amadeus/flight-price-analysis" className="text-sm text-primary hover:underline">
                    Flight Price Analysis - Historical price trends
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Hotel APIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Link href="/demo/amadeus/hotel-booking" className="text-sm text-primary hover:underline">
                    Hotel Booking - Create hotel reservations
                  </Link>
                  <Link href="/demo/amadeus/hotel-ratings" className="text-sm text-primary hover:underline">
                    Hotel Ratings - Sentiment analysis and guest ratings
                  </Link>
                  <Link href="/demo/amadeus/hotel-name-autocomplete" className="text-sm text-primary hover:underline">
                    Hotel Name Autocomplete - Typeahead search suggestions
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Transfer APIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Link href="/demo/amadeus/transfer-booking" className="text-sm text-primary hover:underline">
                    Transfer Booking - Book selected transfer
                  </Link>
                  <Link href="/demo/amadeus/transfer-management" className="text-sm text-primary hover:underline">
                    Transfer Management - Manage/cancel transfer bookings
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Destination Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Link href="/demo/amadeus/trip-purpose-prediction" className="text-sm text-primary hover:underline">
                    Trip Purpose Prediction - Predict business vs leisure travel
                  </Link>
                  <Link href="/demo/amadeus/points-of-interest" className="text-sm text-primary hover:underline">
                    Points of Interest - Discover local attractions
                  </Link>
                  <Link href="/demo/amadeus/safe-place" className="text-sm text-primary hover:underline">
                    Safe Place - Safety ratings for destinations
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          All data shown is static sample data for demonstration purposes.
          Visit{" "}
          <a 
            href="https://developers.amadeus.com/self-service" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Amadeus for Developers
          </a>
          {" "}for API documentation and to get started.
        </p>
      </div>
      </div>
    </div>
  );
}
