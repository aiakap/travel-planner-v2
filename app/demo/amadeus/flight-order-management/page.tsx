import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { FlightOrderManagementTable } from "../additional-client";
import { demoFlightOrderManagement } from "@/lib/amadeus-demo-data";
import { FlightPathMap } from "../map-components";

export default function FlightOrderManagementPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Flight Order Management API</h1>
        <p className="text-muted-foreground mb-6">
          Manage and cancel flight bookings. Retrieve order details, view booking status, and process cancellations with refund information.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              View and manage existing flight orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoints:</h3>
              <code className="text-xs bg-muted p-2 rounded block mb-2">
                GET https://api.amadeus.com/v1/booking/flight-orders/{'{orderId}'}
              </code>
              <code className="text-xs bg-muted p-2 rounded block">
                DELETE https://api.amadeus.com/v1/booking/flight-orders/{'{orderId}'}
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Response:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": {
    "type": "flight-order",
    "id": "ORDER001",
    "status": "CONFIRMED",
    "associatedRecords": [
      {
        "reference": "ABC123",
        "creationDate": "2026-01-20T10:30:00"
      }
    ],
    "flightOffers": [...],
    "travelers": [...]
  }
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <FlightOrderManagementTable orders={demoFlightOrderManagement} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Active flight orders with route visualization
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlightPathMap 
            departure="JFK" 
            arrival="CDG"
            title="Order ORDER001 - Active"
            description="PNR: ABC123 - John Doe"
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
            title="Order ORDER002 - Cancelled"
            description="PNR: DEF456 - Jane Smith"
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
