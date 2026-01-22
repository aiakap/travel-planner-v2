import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { TransferBookingTable } from "../additional-client";
import { demoTransferBookings } from "@/lib/amadeus-demo-data";
import { MultiLocationMap } from "../map-components";

export default function TransferBookingPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Transfer Booking API</h1>
        <p className="text-muted-foreground mb-6">
          Book airport transfers and ground transportation. Create bookings for private cars, shared shuttles, and other transfer services with confirmation details.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Book transfers and receive confirmation codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                POST https://api.amadeus.com/v1/ordering/transfer-orders
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": {
    "note": "Private transfer booking",
    "passengers": [
      {
        "firstName": "JOHN",
        "lastName": "DOE",
        "title": "MR",
        "contacts": {
          "phoneNumber": "+15551234567",
          "email": "john.doe@example.com"
        }
      }
    ],
    "agency": {
      "contacts": [
        {
          "email": {
            "address": "agency@example.com"
          }
        }
      ]
    },
    "payment": {
      "methodOfPayment": "CREDIT_CARD",
      "creditCard": {
        "number": "4111111111111111",
        "holderName": "JOHN DOE",
        "vendorCode": "VI",
        "expiryDate": "2028-12",
        "cvv": "123"
      }
    },
    "extraServices": [],
    "equipment": [],
    "corporation": {},
    "startConnectedSegment": {
      "transportationType": "FLIGHT",
      "transportationNumber": "AF007",
      "departure": {
        "localDateTime": "2026-07-15T18:00:00",
        "iataCode": "JFK"
      },
      "arrival": {
        "localDateTime": "2026-07-16T08:30:00",
        "iataCode": "CDG"
      }
    },
    "passengerCharacteristics": [
      {
        "passengerTypeCode": "ADT",
        "age": 40
      }
    ],
    "offerId": "TRANSFER001"
  }
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <TransferBookingTable bookings={demoTransferBookings} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Transfer routes with pickup and dropoff locations
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiLocationMap 
            locations={[
              { 
                lat: 49.0097, 
                lng: 2.5479, 
                name: "Paris CDG Airport", 
                category: "Pickup Location",
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
                category: "Dropoff Location",
                details: {
                  type: 'transfer',
                  distance: "32 km",
                  duration: "45 min",
                  price: "$85"
                }
              }
            ]}
            title="Private Transfer - CDG to Hotel"
            description="Booking TRF123456 - Mercedes E-Class"
            showPath={true}
          />
          <MultiLocationMap 
            locations={[
              { 
                lat: 48.8661, 
                lng: 2.3048, 
                name: "Hôtel Plaza Athénée", 
                category: "Pickup Location",
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
                category: "Dropoff Location",
                details: {
                  type: 'transfer',
                  distance: "32 km",
                  duration: "50 min",
                  price: "$45"
                }
              }
            ]}
            title="Shared Shuttle - Hotel to CDG"
            description="Booking TRF789012 - Shared Van"
            showPath={true}
          />
        </div>
      </div>
    </div>
  );
}
