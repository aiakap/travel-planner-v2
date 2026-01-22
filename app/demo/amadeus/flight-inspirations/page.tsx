import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { FlightInspirationsTable } from "../additional-client";
import { demoFlightInspirations } from "@/lib/amadeus-demo-data";
import { MultiDestinationMap } from "../map-components";

export default function FlightInspirationsPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Flight Inspirations API</h1>
        <p className="text-muted-foreground mb-6">
          Find the cheapest flight destinations from an origin. Perfect for travelers with flexible destinations looking for the best deals.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Discover affordable destinations and travel inspiration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/shopping/flight-destinations
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "origin": "JFK",
  "departureDate": "2026-08-15,2026-09-15",
  "oneWay": false,
  "duration": "1,15",
  "nonStop": false,
  "maxPrice": 500,
  "currency": "USD"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <FlightInspirationsTable inspirations={demoFlightInspirations} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          All affordable destinations from New York JFK displayed on an interactive map
        </p>
        
        <MultiDestinationMap 
          origin="JFK"
          destinations={[
            { iataCode: "CDG", price: "$456" },
            { iataCode: "MAD", price: "$389" },
            { iataCode: "BCN", price: "$412" }
          ]}
          title="Cheapest Destinations from JFK"
          description="Hover over markers to see destination details and prices"
        />
      </div>
    </div>
  );
}
