import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { HotelRatingsTable } from "../additional-client";
import { demoHotelRatings } from "@/lib/amadeus-demo-data";
import { MultiLocationMap } from "../map-components";

export default function HotelRatingsPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Hotel Ratings API</h1>
        <p className="text-muted-foreground mb-6">
          Get sentiment analysis and ratings for hotels. View overall scores and detailed category breakdowns including service, location, cleanliness, and more.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Sentiment analysis and guest ratings for hotels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v2/e-reputation/hotel-sentiments
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "hotelIds": "PARCE001,PAROP002"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <HotelRatingsTable ratings={demoHotelRatings} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Compare hotel locations with ratings displayed on map
        </p>
        
        <MultiLocationMap 
          locations={[
            { 
              lat: 48.8661, 
              lng: 2.3048, 
              name: "Hôtel Plaza Athénée", 
              category: "5-Star Luxury Hotel",
              details: {
                type: 'hotel',
                rating: 9.2,
                rank: 92,
                price: "€850/night"
              }
            },
            { 
              lat: 48.8584, 
              lng: 2.2945, 
              name: "Pullman Paris Tour Eiffel", 
              category: "4-Star Hotel",
              details: {
                type: 'hotel',
                rating: 8.5,
                rank: 85,
                price: "€420/night"
              }
            }
          ]}
          title="Paris Hotels with Ratings"
          description="Hover over markers to see hotel ratings and reviews"
        />
      </div>
    </div>
  );
}
