import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { TripPurposePredictionTable } from "../additional-client";
import { demoTripPurposePredictions } from "@/lib/amadeus-demo-data";
import { FlightPathMap } from "../map-components";

export default function TripPurposePredictionPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Trip Purpose Prediction API</h1>
        <p className="text-muted-foreground mb-6">
          Predict whether a trip is for business or leisure using machine learning. Analyzes travel patterns, destinations, and dates to determine trip purpose with confidence scores.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              AI-powered business vs leisure trip classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/travel/predictions/trip-purpose
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "originLocationCode": "JFK",
  "destinationLocationCode": "SFO",
  "departureDate": "2026-02-10",
  "returnDate": "2026-02-12"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <TripPurposePredictionTable predictions={demoTripPurposePredictions} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Trip routes with AI-predicted purpose classification
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="SFO"
            title="JFK → SFO - Business Trip"
            description="Prediction: BUSINESS (92% confidence) - Short 2-day trip"
            flightInfo={{
              airline: "United",
              departureTime: "Feb 10, 8:00 AM",
              arrivalTime: "Feb 10, 11:30 AM",
              duration: "6h 30m",
              price: "$320"
            }}
          />
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="JFK → CDG - Leisure Trip"
            description="Prediction: LEISURE (88% confidence) - 10-day vacation"
            flightInfo={{
              airline: "Air France",
              departureTime: "Jul 15, 6:00 PM",
              arrivalTime: "Jul 16, 8:30 AM",
              duration: "8h 30m",
              price: "$456"
            }}
          />
        </div>
      </div>
    </div>
  );
}
