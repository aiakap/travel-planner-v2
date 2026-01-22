import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { SeatmapDisplayTable } from "../additional-client";
import { demoSeatmaps } from "@/lib/amadeus-demo-data";
import { FlightPathMap, StaticMapImage } from "../map-components";

export default function SeatmapDisplayPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Seatmap Display API</h1>
        <p className="text-muted-foreground mb-6">
          View cabin layouts and seat availability for flights. Get detailed seatmaps with pricing, characteristics, and availability status for seat selection.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Display aircraft seatmaps for passenger seat selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/shopping/seatmaps
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "flightOfferId": "1",
  "segmentId": "1"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <SeatmapDisplayTable seatmaps={demoSeatmaps} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Flight route and airport location for seatmap context
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="AF007 - Boeing 777-300ER"
            description="View seatmap for this flight"
            flightInfo={{
              flightNumber: "AF007",
              airline: "Air France",
              departureTime: "18:00",
              arrivalTime: "08:30+1",
              departureTerminal: "1",
              arrivalTerminal: "2E",
              duration: "8h 30m",
              aircraft: "Boeing 777-300ER"
            }}
          />
          <StaticMapImage 
            lat={49.0097}
            lng={2.5479}
            zoom={12}
            title="Paris CDG Airport"
            description="Arrival airport location"
          />
        </div>
      </div>
    </div>
  );
}
