import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { PointsOfInterestTable } from "../additional-client";
import { demoPointsOfInterest } from "@/lib/amadeus-demo-data";
import { MultiLocationMap } from "../map-components";

export default function PointsOfInterestPage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Points of Interest API</h1>
        <p className="text-muted-foreground mb-6">
          Discover local attractions, landmarks, and points of interest. Get detailed information about tourist destinations, museums, monuments, and more with rankings and categories.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Find attractions and landmarks at any destination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/reference-data/locations/pois
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "radius": 5,
  "radiusUnit": "KM",
  "categories": "SIGHTS,MUSEUM"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <PointsOfInterestTable pois={demoPointsOfInterest} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Points of interest displayed on map with day itinerary path
        </p>
        
        <MultiLocationMap 
          locations={[
            { 
              lat: 48.8584, 
              lng: 2.2945, 
              name: "Eiffel Tower", 
              category: "Landmark",
              details: {
                type: 'poi',
                rank: 98,
                rating: 4.6,
                hours: "9:00 AM - 12:00 AM",
                price: "€26"
              }
            },
            { 
              lat: 48.8606, 
              lng: 2.3376, 
              name: "Louvre Museum", 
              category: "Museum",
              details: {
                type: 'poi',
                rank: 97,
                rating: 4.7,
                hours: "9:00 AM - 6:00 PM",
                price: "€17"
              }
            },
            { 
              lat: 48.8530, 
              lng: 2.3499, 
              name: "Notre-Dame Cathedral", 
              category: "Religious Site",
              details: {
                type: 'poi',
                rank: 95,
                rating: 4.6,
                hours: "8:00 AM - 6:45 PM",
                price: "Free"
              }
            }
          ]}
          title="Paris Top Attractions"
          description="Suggested day itinerary connecting major points of interest"
          showPath={true}
        />
      </div>
    </div>
  );
}
