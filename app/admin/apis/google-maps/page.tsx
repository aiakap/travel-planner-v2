"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Navigation, Clock, Phone, Globe, Star, DollarSign, Accessibility, ExternalLink, Plane } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ApiResponseViewer } from "../_components/api-response-viewer";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DetailSection } from "../_components/detail-section";
import { InfoGrid } from "../_components/info-grid";
import { formatCoordinates, formatPhoneNumber } from "@/lib/format-helpers";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface TestResult {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
}

export default function GoogleMapsTestPage() {
  const [autocompleteInput, setAutocompleteInput] = useState("New York");
  const [autocompleteResult, setAutocompleteResult] = useState<TestResult | null>(null);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  const [placeId, setPlaceId] = useState("ChIJOwg_06VPwokRYv534QaPC8g");
  const [detailsResult, setDetailsResult] = useState<TestResult | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [geocodeAddress, setGeocodeAddress] = useState("1600 Amphitheatre Parkway, Mountain View, CA");
  const [geocodeResult, setGeocodeResult] = useState<TestResult | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  const [airportQuery, setAirportQuery] = useState("Palo Alto");
  const [airportResult, setAirportResult] = useState<TestResult | null>(null);
  const [airportLoading, setAirportLoading] = useState(false);
  const [airportApiSource, setAirportApiSource] = useState<"google" | "amadeus" | "both">("google");

  const testAutocomplete = async () => {
    setAutocompleteLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(autocompleteInput)}`
      );
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      setAutocompleteResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setAutocompleteResult({
        response: null,
        error: error.message,
      });
    } finally {
      setAutocompleteLoading(false);
    }
  };

  const testPlaceDetails = async () => {
    setDetailsLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(placeId)}`
      );
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      setDetailsResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setDetailsResult({
        response: null,
        error: error.message,
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const testGeocode = async () => {
    setGeocodeLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `/api/geocode-timezone?address=${encodeURIComponent(geocodeAddress)}`
      );
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      setGeocodeResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setGeocodeResult({
        response: null,
        error: error.message,
      });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const testAirportSearch = async () => {
    setAirportLoading(true);
    const startTime = Date.now();
    
    try {
      let combinedResponse: any = {};
      
      if (airportApiSource === "google" || airportApiSource === "both") {
        const googleResponse = await fetch(
          `/api/airports/search-google?q=${encodeURIComponent(airportQuery)}`
        );
        const googleData = await googleResponse.json();
        combinedResponse.google = {
          data: googleData,
          status: googleResponse.status,
        };
      }
      
      if (airportApiSource === "amadeus" || airportApiSource === "both") {
        const amadeusResponse = await fetch(
          `/api/airports/search?q=${encodeURIComponent(airportQuery)}`
        );
        const amadeusData = await amadeusResponse.json();
        combinedResponse.amadeus = {
          data: amadeusData,
          status: amadeusResponse.status,
        };
      }
      
      const duration = Date.now() - startTime;
      
      setAirportResult({
        response: combinedResponse,
        status: 200,
        duration,
      });
    } catch (error: any) {
      setAirportResult({
        response: null,
        error: error.message,
      });
    } finally {
      setAirportLoading(false);
    }
  };

  return (
    <ApiTestLayout
      title="Google Maps Platform"
      description="Test Places Autocomplete, Place Details, Geocoding, Timezone, and Airport Search APIs"
      breadcrumbs={[{ label: "Google Maps" }]}
    >
      <Alert className="mb-6">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          These tests use your configured Google Maps API key. Make sure you have the Places API, Geocoding API, and Timezone API enabled in your Google Cloud Console.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="airports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="airports">
            <Plane className="h-4 w-4 mr-2" />
            Airport Search
          </TabsTrigger>
          <TabsTrigger value="autocomplete">
            <MapPin className="h-4 w-4 mr-2" />
            Autocomplete
          </TabsTrigger>
          <TabsTrigger value="details">
            <Navigation className="h-4 w-4 mr-2" />
            Place Details
          </TabsTrigger>
          <TabsTrigger value="geocode">
            <Clock className="h-4 w-4 mr-2" />
            Geocoding & Timezone
          </TabsTrigger>
        </TabsList>

        {/* Airport Search */}
        <TabsContent value="airports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Airport Search API</CardTitle>
              <CardDescription>
                Compare Google Places and Amadeus airport search results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Source</Label>
                <div className="flex gap-2">
                  <Button
                    variant={airportApiSource === "google" ? "default" : "outline"}
                    onClick={() => setAirportApiSource("google")}
                    size="sm"
                  >
                    Google Places
                  </Button>
                  <Button
                    variant={airportApiSource === "amadeus" ? "default" : "outline"}
                    onClick={() => setAirportApiSource("amadeus")}
                    size="sm"
                  >
                    Amadeus
                  </Button>
                  <Button
                    variant={airportApiSource === "both" ? "default" : "outline"}
                    onClick={() => setAirportApiSource("both")}
                    size="sm"
                  >
                    Both (Compare)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="airport-query">Search Query</Label>
                <Input
                  id="airport-query"
                  value={airportQuery}
                  onChange={(e) => setAirportQuery(e.target.value)}
                  placeholder="Enter city, airport code, or location..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testAirportSearch}
                  disabled={airportLoading || !airportQuery}
                  className="flex-1"
                >
                  {airportLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Airports
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAirportQuery("Palo Alto");
                    setAirportResult(null);
                  }}
                >
                  Palo Alto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAirportQuery("SFO");
                    setAirportResult(null);
                  }}
                >
                  SFO
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAirportQuery("San Francisco");
                    setAirportResult(null);
                  }}
                >
                  San Francisco
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-1">
                <div><strong>Google Endpoint:</strong> GET /api/airports/search-google</div>
                <div><strong>Amadeus Endpoint:</strong> GET /api/airports/search</div>
              </div>
            </CardContent>
          </Card>

          {airportResult && (
            <div className="space-y-4">
              {/* Test Status for Palo Alto */}
              {airportQuery.toLowerCase().includes("palo alto") && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Palo Alto Test Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {airportResult.response?.google && (
                      <div>
                        <div className="text-sm font-medium mb-1">Google Places API:</div>
                        <div className="flex gap-3 text-sm ml-4">
                          <Badge variant={
                            airportResult.response.google.data?.airports?.some((a: any) => a.iataCode === "SFO")
                              ? "default"
                              : "destructive"
                          }>
                            SFO: {airportResult.response.google.data?.airports?.some((a: any) => a.iataCode === "SFO") ? "✅ FOUND" : "❌ NOT FOUND"}
                          </Badge>
                          <Badge variant={
                            airportResult.response.google.data?.airports?.some((a: any) => a.iataCode === "SJC")
                              ? "default"
                              : "destructive"
                          }>
                            SJC: {airportResult.response.google.data?.airports?.some((a: any) => a.iataCode === "SJC") ? "✅ FOUND" : "❌ NOT FOUND"}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {airportResult.response?.amadeus && (
                      <div>
                        <div className="text-sm font-medium mb-1">Amadeus API:</div>
                        <div className="flex gap-3 text-sm ml-4">
                          <Badge variant={
                            airportResult.response.amadeus.data?.airports?.some((a: any) => a.iataCode === "SFO")
                              ? "default"
                              : "destructive"
                          }>
                            SFO: {airportResult.response.amadeus.data?.airports?.some((a: any) => a.iataCode === "SFO") ? "✅ FOUND" : "❌ NOT FOUND"}
                          </Badge>
                          <Badge variant={
                            airportResult.response.amadeus.data?.airports?.some((a: any) => a.iataCode === "SJC")
                              ? "default"
                              : "destructive"
                          }>
                            SJC: {airportResult.response.amadeus.data?.airports?.some((a: any) => a.iataCode === "SJC") ? "✅ FOUND" : "❌ NOT FOUND"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Google Results */}
              {airportResult.response?.google && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Google Places Results</CardTitle>
                      <Badge variant="outline">
                        {airportResult.response.google.data?.count || 0} airports
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {airportResult.response.google.data?.airports?.length > 0 ? (
                      <div className="space-y-2">
                        {airportResult.response.google.data.airports.map((airport: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold flex items-center gap-2">
                                  <span>{airport.iataCode}</span>
                                  {!airport.hasIATA && (
                                    <Badge variant="secondary" className="text-xs">estimated</Badge>
                                  )}
                                </div>
                                <div className="text-sm">{airport.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {airport.city}, {airport.country}
                                </div>
                              </div>
                              <Badge variant="outline">#{idx + 1}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No airports found
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Amadeus Results */}
              {airportResult.response?.amadeus && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Amadeus Results</CardTitle>
                      <Badge variant="outline">
                        {airportResult.response.amadeus.data?.count || 0} airports
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {airportResult.response.amadeus.data?.airports?.length > 0 ? (
                      <div className="space-y-2">
                        {airportResult.response.amadeus.data.airports.map((airport: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold">{airport.iataCode}</div>
                                <div className="text-sm">{airport.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {airport.city}, {airport.country}
                                </div>
                              </div>
                              <Badge variant="outline">#{idx + 1}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No airports found
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <ApiResponseViewer
                response={airportResult.response}
                status={airportResult.status}
                duration={airportResult.duration}
                error={airportResult.error}
              />
            </div>
          )}
        </TabsContent>

        {/* Places Autocomplete */}
        <TabsContent value="autocomplete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Places Autocomplete API</CardTitle>
              <CardDescription>
                Get place predictions based on user input
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="autocomplete-input">Search Input</Label>
                <Input
                  id="autocomplete-input"
                  value={autocompleteInput}
                  onChange={(e) => setAutocompleteInput(e.target.value)}
                  placeholder="Enter a place name..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testAutocomplete}
                  disabled={autocompleteLoading || !autocompleteInput}
                  className="flex-1"
                >
                  {autocompleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Autocomplete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAutocompleteInput("Paris");
                    setAutocompleteResult(null);
                  }}
                >
                  Example: Paris
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAutocompleteInput("Tokyo Station");
                    setAutocompleteResult(null);
                  }}
                >
                  Example: Tokyo
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> GET /api/places/autocomplete
              </div>
            </CardContent>
          </Card>

          {autocompleteResult && (
            <div className="space-y-4">
              {autocompleteResult.response?.predictions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {autocompleteResult.response.predictions.map((pred: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setPlaceId(pred.placeId);
                          }}
                        >
                          <div className="font-medium">{pred.mainText}</div>
                          <div className="text-sm text-muted-foreground">{pred.secondaryText}</div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {pred.placeId}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <ApiResponseViewer
                response={autocompleteResult.response}
                status={autocompleteResult.status}
                duration={autocompleteResult.duration}
                error={autocompleteResult.error}
              />
            </div>
          )}
        </TabsContent>

        {/* Place Details */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Place Details API</CardTitle>
              <CardDescription>
                Get detailed information about a specific place
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="place-id">Place ID</Label>
                <Input
                  id="place-id"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="Enter a Google Place ID..."
                />
                <p className="text-xs text-muted-foreground">
                  Get a Place ID from the Autocomplete test above
                </p>
              </div>

              <Button
                onClick={testPlaceDetails}
                disabled={detailsLoading || !placeId}
                className="w-full"
              >
                {detailsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Place Details
              </Button>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> GET /api/places/details
              </div>
            </CardContent>
          </Card>

          {detailsResult && (
            <div className="space-y-4">
              {detailsResult.response?.result && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-lg">{detailsResult.response.result.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {detailsResult.response.result.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < Math.floor(detailsResult.response.result.rating) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                            <span className="font-semibold ml-1">{detailsResult.response.result.rating}</span>
                            {detailsResult.response.result.user_ratings_total && (
                              <span className="text-muted-foreground">({detailsResult.response.result.user_ratings_total})</span>
                            )}
                          </div>
                        )}
                        {detailsResult.response.result.price_level && (
                          <div className="flex items-center text-green-600">
                            {[...Array(detailsResult.response.result.price_level)].map((_, i) => (
                              <DollarSign key={i} className="h-4 w-4" />
                            ))}
                          </div>
                        )}
                        {detailsResult.response.result.business_status && (
                          <Badge variant={
                            detailsResult.response.result.business_status === 'OPERATIONAL' ? 'default' : 'secondary'
                          }>
                            {detailsResult.response.result.business_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <span>View Full Details</span>
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        
                        {/* Basic Information */}
                        <DetailSection title="Basic Information" defaultOpen icon={<MapPin className="h-4 w-4" />}>
                          <InfoGrid 
                            columns={2}
                            items={[
                              { 
                                label: "Address", 
                                value: detailsResult.response.result.formatted_address,
                                fullWidth: true
                              },
                              ...(detailsResult.response.result.vicinity ? [{
                                label: "Vicinity",
                                value: detailsResult.response.result.vicinity,
                                fullWidth: true
                              }] : []),
                              ...(detailsResult.response.result.geometry?.location ? [{
                                label: "Coordinates",
                                value: formatCoordinates(
                                  detailsResult.response.result.geometry.location.lat,
                                  detailsResult.response.result.geometry.location.lng
                                )
                              }] : []),
                              ...(detailsResult.response.result.plus_code?.compound_code ? [{
                                label: "Plus Code",
                                value: detailsResult.response.result.plus_code.compound_code
                              }] : []),
                              { 
                                label: "Place ID", 
                                value: <span className="font-mono text-xs">{detailsResult.response.result.place_id}</span>,
                                fullWidth: true
                              },
                            ]}
                          />
                          {detailsResult.response.result.types && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm font-medium mb-2">Categories</div>
                              <div className="flex flex-wrap gap-1">
                                {detailsResult.response.result.types.map((type: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {type.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </DetailSection>

                        {/* Contact & Website */}
                        {(detailsResult.response.result.formatted_phone_number || detailsResult.response.result.website) && (
                          <DetailSection title="Contact & Website" icon={<Phone className="h-4 w-4" />}>
                            <InfoGrid 
                              columns={1}
                              items={[
                                ...(detailsResult.response.result.formatted_phone_number ? [{
                                  label: "Phone",
                                  value: formatPhoneNumber(detailsResult.response.result.formatted_phone_number)
                                }] : []),
                                ...(detailsResult.response.result.international_phone_number ? [{
                                  label: "International Phone",
                                  value: detailsResult.response.result.international_phone_number
                                }] : []),
                                ...(detailsResult.response.result.website ? [{
                                  label: "Website",
                                  value: (
                                    <a href={detailsResult.response.result.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                      {detailsResult.response.result.website}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )
                                }] : []),
                                ...(detailsResult.response.result.url ? [{
                                  label: "Google Maps",
                                  value: (
                                    <a href={detailsResult.response.result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                      View on Google Maps
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )
                                }] : []),
                              ]}
                            />
                          </DetailSection>
                        )}

                        {/* Opening Hours */}
                        {detailsResult.response.result.opening_hours && (
                          <DetailSection title="Opening Hours" icon={<Clock className="h-4 w-4" />}>
                            {detailsResult.response.result.opening_hours.open_now !== undefined && (
                              <div className="mb-3">
                                <Badge variant={detailsResult.response.result.opening_hours.open_now ? 'default' : 'secondary'}>
                                  {detailsResult.response.result.opening_hours.open_now ? 'Open Now' : 'Closed'}
                                </Badge>
                              </div>
                            )}
                            {detailsResult.response.result.opening_hours.weekday_text && (
                              <div className="space-y-1 text-sm">
                                {detailsResult.response.result.opening_hours.weekday_text.map((day: string, idx: number) => (
                                  <div key={idx} className="text-muted-foreground">{day}</div>
                                ))}
                              </div>
                            )}
                          </DetailSection>
                        )}

                        {/* Reviews */}
                        {detailsResult.response.result.reviews && detailsResult.response.result.reviews.length > 0 && (
                          <DetailSection title="Recent Reviews" icon={<Star className="h-4 w-4" />} badge={detailsResult.response.result.reviews.length}>
                            <div className="space-y-3">
                              {detailsResult.response.result.reviews.slice(0, 3).map((review: any, idx: number) => (
                                <div key={idx} className="border-b pb-3 last:border-b-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{review.author_name}</span>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{review.relative_time_description}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{review.text}</p>
                                </div>
                              ))}
                            </div>
                          </DetailSection>
                        )}

                        {/* Photos */}
                        {detailsResult.response.result.photos && detailsResult.response.result.photos.length > 0 && (
                          <DetailSection title="Photos" icon={<Globe className="h-4 w-4" />} badge={detailsResult.response.result.photos.length}>
                            <div className="text-sm text-muted-foreground space-y-2">
                              {detailsResult.response.result.photos.slice(0, 5).map((photo: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between py-1 border-b last:border-b-0">
                                  <span>Photo {idx + 1}</span>
                                  <span className="text-xs">{photo.width}x{photo.height}</span>
                                </div>
                              ))}
                              <p className="text-xs pt-2">Photo references available (use with Google Places Photo API)</p>
                            </div>
                          </DetailSection>
                        )}

                        {/* Accessibility */}
                        {detailsResult.response.result.wheelchair_accessible_entrance !== undefined && (
                          <DetailSection title="Accessibility" icon={<Accessibility className="h-4 w-4" />}>
                            <div className="flex items-center gap-2">
                              <Badge variant={detailsResult.response.result.wheelchair_accessible_entrance ? 'default' : 'secondary'}>
                                {detailsResult.response.result.wheelchair_accessible_entrance ? 'Wheelchair Accessible' : 'Not Wheelchair Accessible'}
                              </Badge>
                            </div>
                          </DetailSection>
                        )}

                        {/* Editorial Summary */}
                        {detailsResult.response.result.editorial_summary?.overview && (
                          <DetailSection title="About" icon={<Globe className="h-4 w-4" />}>
                            <p className="text-sm text-muted-foreground">
                              {detailsResult.response.result.editorial_summary.overview}
                            </p>
                          </DetailSection>
                        )}
                        
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              )}
              <ApiResponseViewer
                response={detailsResult.response}
                status={detailsResult.status}
                duration={detailsResult.duration}
                error={detailsResult.error}
              />
            </div>
          )}
        </TabsContent>

        {/* Geocoding & Timezone */}
        <TabsContent value="geocode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geocoding & Timezone API</CardTitle>
              <CardDescription>
                Convert address to coordinates and get timezone information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geocode-address">Address</Label>
                <Input
                  id="geocode-address"
                  value={geocodeAddress}
                  onChange={(e) => setGeocodeAddress(e.target.value)}
                  placeholder="Enter an address..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testGeocode}
                  disabled={geocodeLoading || !geocodeAddress}
                  className="flex-1"
                >
                  {geocodeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Geocode
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeocodeAddress("Eiffel Tower, Paris");
                    setGeocodeResult(null);
                  }}
                >
                  Example
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> GET /api/geocode-timezone
              </div>
            </CardContent>
          </Card>

          {geocodeResult && (
            <div className="space-y-4">
              {geocodeResult.response && !geocodeResult.error && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-blue-600" />
                      <span className="font-bold text-lg">Geocoding Result</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <span>View Full Details</span>
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        
                        {/* Coordinates */}
                        <DetailSection title="Coordinates" defaultOpen icon={<Navigation className="h-4 w-4" />}>
                          <InfoGrid 
                            columns={2}
                            items={[
                              ...(geocodeResult.response.coordinates ? [
                                {
                                  label: "Latitude",
                                  value: geocodeResult.response.coordinates.lat.toFixed(6)
                                },
                                {
                                  label: "Longitude",
                                  value: geocodeResult.response.coordinates.lng.toFixed(6)
                                },
                                {
                                  label: "Coordinates",
                                  value: formatCoordinates(
                                    geocodeResult.response.coordinates.lat,
                                    geocodeResult.response.coordinates.lng
                                  ),
                                  fullWidth: true
                                }
                              ] : []),
                              ...(geocodeResult.response.formattedAddress ? [{
                                label: "Formatted Address",
                                value: geocodeResult.response.formattedAddress,
                                fullWidth: true
                              }] : []),
                            ]}
                          />
                        </DetailSection>

                        {/* Address Components */}
                        {geocodeResult.response.addressComponents && geocodeResult.response.addressComponents.length > 0 && (
                          <DetailSection title="Address Components" icon={<MapPin className="h-4 w-4" />}>
                            <div className="space-y-2">
                              {(() => {
                                const components = geocodeResult.response.addressComponents;
                                const getComponent = (type: string) => 
                                  components.find((c: any) => c.types.includes(type))?.long_name;
                                
                                return (
                                  <InfoGrid 
                                    columns={2}
                                    items={[
                                      ...(getComponent('street_number') ? [{
                                        label: "Street Number",
                                        value: getComponent('street_number')
                                      }] : []),
                                      ...(getComponent('route') ? [{
                                        label: "Street Name",
                                        value: getComponent('route')
                                      }] : []),
                                      ...(getComponent('locality') ? [{
                                        label: "City",
                                        value: getComponent('locality')
                                      }] : []),
                                      ...(getComponent('administrative_area_level_1') ? [{
                                        label: "State/Province",
                                        value: getComponent('administrative_area_level_1')
                                      }] : []),
                                      ...(getComponent('postal_code') ? [{
                                        label: "Postal Code",
                                        value: getComponent('postal_code')
                                      }] : []),
                                      ...(getComponent('country') ? [{
                                        label: "Country",
                                        value: getComponent('country')
                                      }] : []),
                                    ]}
                                  />
                                );
                              })()}
                            </div>
                          </DetailSection>
                        )}

                        {/* Location Details */}
                        <DetailSection title="Location Details" icon={<MapPin className="h-4 w-4" />}>
                          <InfoGrid 
                            columns={2}
                            items={[
                              ...(geocodeResult.response.placeId ? [{
                                label: "Place ID",
                                value: <span className="font-mono text-xs">{geocodeResult.response.placeId}</span>,
                                fullWidth: true
                              }] : []),
                              ...(geocodeResult.response.locationType ? [{
                                label: "Location Type",
                                value: (
                                  <Badge variant="outline">
                                    {geocodeResult.response.locationType}
                                  </Badge>
                                )
                              }] : []),
                              ...(geocodeResult.response.plusCode ? [{
                                label: "Plus Code",
                                value: geocodeResult.response.plusCode.global_code || geocodeResult.response.plusCode.compound_code
                              }] : []),
                            ]}
                          />
                          {geocodeResult.response.types && geocodeResult.response.types.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm font-medium mb-2">Address Types</div>
                              <div className="flex flex-wrap gap-1">
                                {geocodeResult.response.types.map((type: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {type.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </DetailSection>

                        {/* Timezone */}
                        {geocodeResult.response.timezone && (
                          <DetailSection title="Timezone Information" icon={<Clock className="h-4 w-4" />}>
                            <InfoGrid 
                              columns={2}
                              items={[
                                {
                                  label: "Timezone ID",
                                  value: geocodeResult.response.timezone
                                },
                                ...(geocodeResult.response.timezoneName ? [{
                                  label: "Timezone Name",
                                  value: geocodeResult.response.timezoneName
                                }] : []),
                                ...(geocodeResult.response.rawOffset !== undefined ? [{
                                  label: "UTC Offset",
                                  value: `${geocodeResult.response.rawOffset / 3600} hours`
                                }] : []),
                                ...(geocodeResult.response.dstOffset !== undefined ? [{
                                  label: "DST Offset",
                                  value: `${geocodeResult.response.dstOffset / 3600} hours`
                                }] : []),
                              ]}
                            />
                          </DetailSection>
                        )}
                        
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              )}
              <ApiResponseViewer
                response={geocodeResult.response}
                status={geocodeResult.status}
                duration={geocodeResult.duration}
                error={geocodeResult.error}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
