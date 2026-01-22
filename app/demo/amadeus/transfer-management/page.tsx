import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { TransferManagementTable } from "../additional-client";
import { demoTransferManagement } from "@/lib/amadeus-demo-data";
import { MultiLocationMap } from "../map-components";

export default function TransferManagementPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Transfer Management API</h1>
        <p className="text-muted-foreground mb-6">
          Manage and cancel transfer bookings. View order details, check booking status, and process cancellations with refund information.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              View and manage existing transfer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoints:</h3>
              <code className="text-xs bg-muted p-2 rounded block mb-2">
                GET https://api.amadeus.com/v1/ordering/transfer-orders/{'{orderId}'}
              </code>
              <code className="text-xs bg-muted p-2 rounded block">
                DELETE https://api.amadeus.com/v1/ordering/transfer-orders/{'{orderId}'}
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Response:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": {
    "type": "transfer-order",
    "id": "TRANSFER_BOOKING001",
    "reference": "TRF123456",
    "status": "CONFIRMED",
    "confirmNbr": "CONF123",
    "transfers": [
      {
        "transferType": "PRIVATE",
        "start": {
          "dateTime": "2026-07-15T10:30:00",
          "locationCode": "CDG"
        },
        "end": {
          "address": {
            "line": "70 Avenue des Champs-Elysees",
            "cityName": "Paris"
          }
        },
        "quotation": {
          "monetaryAmount": "85.00",
          "currencyCode": "USD"
        }
      }
    ]
  }
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <TransferManagementTable orders={demoTransferManagement} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Active and cancelled transfer orders with route visualization
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiLocationMap 
            locations={[
              { 
                lat: 49.0097, 
                lng: 2.5479, 
                name: "Paris CDG Airport", 
                category: "Pickup - Confirmed",
                details: {
                  type: 'transfer',
                  distance: "32 km",
                  duration: "45 min",
                  price: "$85"
                }
              },
              { 
                lat: 48.8661, 
                lng: 2.3048, 
                name: "Hôtel Plaza Athénée", 
                category: "Dropoff - Confirmed",
                details: {
                  type: 'transfer',
                  distance: "32 km",
                  duration: "45 min",
                  price: "$85"
                }
              }
            ]}
            title="Order TRANSFER_BOOKING001"
            description="Status: CONFIRMED - Reference: TRF123456"
            showPath={true}
          />
          <MultiLocationMap 
            locations={[
              { 
                lat: 48.8661, 
                lng: 2.3048, 
                name: "Hôtel Plaza Athénée", 
                category: "Pickup - Cancelled",
                details: {
                  type: 'transfer',
                  distance: "32 km",
                  duration: "50 min",
                  price: "$45"
                }
              },
              { 
                lat: 49.0097, 
                lng: 2.5479, 
                name: "Paris CDG Airport", 
                category: "Dropoff - Cancelled",
                details: {
                  type: 'transfer',
                  distance: "32 km",
                  duration: "50 min",
                  price: "$45"
                }
              }
            ]}
            title="Order TRANSFER_BOOKING002"
            description="Status: CANCELLED - Reference: TRF789012"
            showPath={true}
          />
        </div>
      </div>
    </div>
  );
}
