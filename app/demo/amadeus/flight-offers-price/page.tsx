import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { FlightOffersPriceTable } from "../additional-client";
import { demoFlightOffersPrice } from "@/lib/amadeus-demo-data";
import { FlightPathMap } from "../map-components";

export default function FlightOffersPricePage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Flight Offers Price API</h1>
        <p className="text-muted-foreground mb-6">
          Confirm pricing and availability for selected flight offers. Returns confirmed prices with fare rules and booking details.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Validate flight offers and get final pricing before booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                POST https://api.amadeus.com/v1/shopping/flight-offers/pricing
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": {
    "type": "flight-offers-pricing",
    "flightOffers": [
      {
        "type": "flight-offer",
        "id": "1",
        "source": "GDS",
        "itineraries": [...],
        "price": {...},
        "pricingOptions": {...}
      }
    ]
  }
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <FlightOffersPriceTable offers={demoFlightOffersPrice} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Visual representation of flight routes from the pricing results
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="JFK → CDG Direct Flight"
            description="Air France AF007 - Economy Class"
            flightInfo={{
              flightNumber: "AF007",
              airline: "Air France",
              departureTime: "18:00",
              arrivalTime: "08:30+1",
              departureTerminal: "1",
              arrivalTerminal: "2E",
              duration: "8h 30m",
              price: "$456.78",
              aircraft: "Boeing 777-300ER"
            }}
          />
          <FlightPathMap 
            departure="JFK" 
            arrival="LHR"
            title="JFK → LHR → CDG Connection"
            description="British Airways BA112 - First segment"
            flightInfo={{
              flightNumber: "BA112",
              airline: "British Airways",
              departureTime: "16:30",
              arrivalTime: "04:45+1",
              departureTerminal: "4",
              arrivalTerminal: "5",
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
