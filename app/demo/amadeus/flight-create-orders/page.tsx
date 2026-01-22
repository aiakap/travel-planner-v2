import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { FlightCreateOrdersTable } from "../additional-client";
import { demoFlightOrders } from "@/lib/amadeus-demo-data";
import { FlightPathMap } from "../map-components";

export default function FlightCreateOrdersPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Flight Create Orders API</h1>
        <p className="text-muted-foreground mb-6">
          Complete flight bookings and create orders. Returns booking confirmations with PNR, traveler details, and payment information.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Book flights and receive confirmation details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                POST https://api.amadeus.com/v1/booking/flight-orders
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": {
    "type": "flight-order",
    "flightOffers": [...],
    "travelers": [
      {
        "id": "1",
        "dateOfBirth": "1985-04-15",
        "name": {
          "firstName": "JOHN",
          "lastName": "DOE"
        },
        "contact": {...},
        "documents": [...]
      }
    ],
    "ticketingAgreement": {
      "option": "CONFIRM",
      "delay": "6D"
    }
  }
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <FlightCreateOrdersTable orders={demoFlightOrders} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Confirmed flight bookings displayed with route maps
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="Booking ABC123 - JFK → CDG"
            description="John Doe - Confirmed"
            flightInfo={{
              flightNumber: "AF007",
              airline: "Air France",
              departureTime: "Jul 15, 18:00",
              arrivalTime: "Jul 16, 08:30",
              departureTerminal: "1",
              arrivalTerminal: "2E",
              duration: "8h 30m",
              price: "$456.78",
              aircraft: "Boeing 777-300ER"
            }}
          />
          <FlightPathMap 
            departure="LAX" 
            arrival="NRT"
            title="Booking DEF456 - LAX → NRT"
            description="Jane Smith - Confirmed"
            flightInfo={{
              flightNumber: "JL061",
              airline: "Japan Airlines",
              departureTime: "Aug 1, 11:50",
              arrivalTime: "Aug 2, 15:35",
              departureTerminal: "TBIT",
              arrivalTerminal: "2",
              duration: "11h 45m",
              price: "$789.50",
              aircraft: "Boeing 787-9"
            }}
          />
        </div>
      </div>
    </div>
  );
}
