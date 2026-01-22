import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { HotelBookingTable } from "../additional-client";
import { demoHotelBookings } from "@/lib/amadeus-demo-data";
import { LocationMap, StreetViewImage } from "../map-components";

export default function HotelBookingPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Hotel Booking API</h1>
        <p className="text-muted-foreground mb-6">
          Create hotel reservations and receive booking confirmations. Complete bookings with guest information, payment details, and confirmation codes.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Book hotels and receive confirmation details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                POST https://api.amadeus.com/v1/booking/hotel-bookings
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "data": {
    "offerId": "OFFER001",
    "guests": [
      {
        "tid": 1,
        "title": "MR",
        "firstName": "JOHN",
        "lastName": "DOE",
        "phone": "+15551234567",
        "email": "john.doe@example.com"
      }
    ],
    "payments": [
      {
        "method": "CREDIT_CARD",
        "card": {
          "vendorCode": "VI",
          "cardNumber": "4111111111111111",
          "expiryDate": "2028-12"
        }
      }
    ]
  }
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <HotelBookingTable bookings={demoHotelBookings} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Hotel locations with interactive maps and street view
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LocationMap 
            lat={48.8661}
            lng={2.3048}
            title="Hôtel Plaza Athénée"
            description="Paris, France - Booking BOOK001"
            markerLabel="H"
            hotelInfo={{
              stars: 5,
              address: "25 Avenue Montaigne, 75008 Paris",
              bookingRef: "BOOK001",
              price: "€850/night",
              checkIn: "Jul 16, 3:00 PM",
              checkOut: "Jul 19, 11:00 AM"
            }}
          />
          <StreetViewImage 
            lat={48.8661}
            lng={2.3048}
            heading={90}
            pitch={10}
            title="Street View - Plaza Athénée"
            description="See the hotel entrance"
          />
        </div>
      </div>
    </div>
  );
}
