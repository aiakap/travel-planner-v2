import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AmadeusNav } from "../nav";
import { HotelNameAutocompleteTable } from "../additional-client";
import { demoHotelAutocomplete } from "@/lib/amadeus-demo-data";
import { MultiLocationMap } from "../map-components";

export default function HotelNameAutocompletePage() {
  return (
    <div className="flex min-h-screen">
      <AmadeusNav />
      <div className="flex-1 p-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Hotel Name Autocomplete API</h1>
        <p className="text-muted-foreground mb-6">
          Typeahead search suggestions for hotel names. Get relevant hotel matches as users type, with relevance scores and location details.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
            <CardDescription>
              Autocomplete hotel search with typeahead suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">API Endpoint:</h3>
              <code className="text-xs bg-muted p-2 rounded block">
                GET https://api.amadeus.com/v1/reference-data/locations/hotel
              </code>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sample Request:</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "keyword": "Marriott Paris",
  "subType": "HOTEL_LEISURE,HOTEL_GDS"
}`}
              </pre>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-sm font-semibold mb-3">Sample Results (hover for complete data):</h3>
            <HotelNameAutocompleteTable hotels={demoHotelAutocomplete} />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Map Visualization</h2>
        <p className="text-muted-foreground mb-6">
          Autocomplete search results displayed on interactive map
        </p>
        
        <MultiLocationMap 
          locations={[
            { 
              lat: 48.8661, 
              lng: 2.3048, 
              name: "Paris Marriott Champs Elysees", 
              category: "5-Star Hotel",
              details: {
                type: 'hotel',
                rating: 8.9,
                rank: 95,
                price: "€520/night"
              }
            },
            { 
              lat: 48.8584, 
              lng: 2.2945, 
              name: "Paris Marriott Opera Ambassador", 
              category: "5-Star Hotel",
              details: {
                type: 'hotel',
                rating: 8.7,
                rank: 88,
                price: "€480/night"
              }
            },
            { 
              lat: 48.8530, 
              lng: 2.3499, 
              name: "Marriott Rive Gauche", 
              category: "4-Star Hotel",
              details: {
                type: 'hotel',
                rating: 8.4,
                rank: 82,
                price: "€390/night"
              }
            }
          ]}
          title="Hotel Search Results: 'Marriott Paris'"
          description="Hover over markers to see hotel details and relevance scores"
        />
      </div>
    </div>
  );
}
