import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { FlightPriceAnalysisTable } from "../additional-client";
import { demoFlightPriceAnalysis } from "@/lib/amadeus-demo-data";
import { FlightPathMap } from "../map-components";

export default function FlightPriceAnalysisPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Flight Price Analysis API</h1>
        <p className="text-muted-foreground mb-6">
          Analyze historical flight prices and trends. Get insights on price quartiles, averages, and recommendations on the best time to book.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Historical price data and booking recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/analytics/itinerary-price-metrics
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "originIataCode": "JFK",
  "destinationIataCode": "CDG",
  "departureDate": "2026-07-15",
  "currencyCode": "USD"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <FlightPriceAnalysisTable analysis={demoFlightPriceAnalysis} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Routes with historical price analysis
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="JFK → CDG Price Trends"
            description="Current: $456 | Average: $520 | Ranking: GOOD"
            flightInfo={{
              airline: "Various",
              duration: "8-9h",
              price: "$456 (12% below avg)"
            }}
          />
          <FlightPathMap 
            departure="LAX" 
            arrival="NRT"
            title="LAX → NRT Price Trends"
            description="Current: $789 | Average: $850 | Ranking: TYPICAL"
            flightInfo={{
              airline: "Various",
              duration: "11-12h",
              price: "$789 (7% below avg)"
            }}
          />
        </div>
      </div>
    </div>
  );
}
