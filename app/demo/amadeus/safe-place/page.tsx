import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { SafePlaceTable } from "../additional-client";
import { demoSafePlaces } from "@/lib/amadeus-demo-data";
import { MultiLocationMap } from "../map-components";

export default function SafePlacePage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Safe Place API</h1>
        <p className="text-muted-foreground mb-6">
          Get safety ratings and scores for travel destinations. View comprehensive safety metrics including medical facilities, physical safety, LGBTQ+ safety, women's safety, and more.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Safety ratings and travel advisories for destinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/safety/safety-rated-locations
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "radius": 1
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <SafePlaceTable places={demoSafePlaces} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Safety-rated locations with color-coded markers based on safety scores
        </p>
        
        <MultiLocationMap 
          locations={[
            { 
              lat: 48.8566, 
              lng: 2.3522, 
              name: "Paris City Center", 
              category: "Very Safe",
              details: {
                type: 'poi',
                rank: 85,
                rating: 4.3,
                hours: "24/7 Safety Monitoring"
              }
            },
            { 
              lat: 41.9028, 
              lng: 12.4964, 
              name: "Rome City Center", 
              category: "Safe",
              details: {
                type: 'poi',
                rank: 78,
                rating: 3.9,
                hours: "24/7 Safety Monitoring"
              }
            },
            { 
              lat: 41.3874, 
              lng: 2.1686, 
              name: "Barcelona City Center", 
              category: "Very Safe",
              details: {
                type: 'poi',
                rank: 82,
                rating: 4.1,
                hours: "24/7 Safety Monitoring"
              }
            }
          ]}
          title="European Cities - Safety Ratings"
          description="Hover over markers to view detailed safety metrics"
        />
      </div>
    </div>
  );
}
