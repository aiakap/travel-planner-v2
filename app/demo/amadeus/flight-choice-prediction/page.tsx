import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { FlightChoicePredictionTable } from "../additional-client";
import { demoFlightChoicePredictions } from "@/lib/amadeus-demo-data";
import { FlightPathMap } from "../map-components";

export default function FlightChoicePredictionPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Flight Choice Prediction API</h1>
        <p className="text-muted-foreground mb-6">
          AI-powered predictions of which flights travelers are most likely to choose. Uses machine learning to analyze flight characteristics and predict booking probability.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Predict traveler flight preferences with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                POST https://api.amadeus.com/v2/shopping/flight-offers/prediction
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": [
    {
      "type": "flight-offer",
      "id": "1",
      "source": "GDS",
      "itineraries": [...],
      "price": {...}
    },
    {
      "type": "flight-offer",
      "id": "2",
      "source": "GDS",
      "itineraries": [...],
      "price": {...}
    }
  ]
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <FlightChoicePredictionTable predictions={demoFlightChoicePredictions} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Compare flight options with AI prediction scores
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="Option 1 - Direct Flight"
            description="Prediction Score: 0.85 (High likelihood)"
            flightInfo={{
              flightNumber: "AF007",
              airline: "Air France",
              departureTime: "18:00",
              arrivalTime: "08:30+1",
              duration: "8h 30m",
              price: "$456.78",
              aircraft: "Boeing 777-300ER"
            }}
          />
          <FlightPathMap 
            departure="JFK" 
            arrival="LHR"
            title="Option 2 - Via LHR"
            description="Prediction Score: 0.42 (Lower likelihood)"
            flightInfo={{
              flightNumber: "BA112",
              airline: "British Airways",
              departureTime: "16:30",
              arrivalTime: "04:45+1",
              duration: "8h 15m",
              price: "$523.45",
              aircraft: "Boeing 787-9"
            }}
          />
        </div>
      </div>
    </div>
  );
}
