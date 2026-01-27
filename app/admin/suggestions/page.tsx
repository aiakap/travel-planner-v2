"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Plane, Home } from "lucide-react";
import { SuggestionForm } from "./_components/suggestion-form";

export default function SuggestionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suggestion Testing</h2>
          <p className="text-muted-foreground">
            Test and validate place, transport, and hotel suggestion schemas
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Place Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              For restaurants, hotels, museums, and activities via Google Places API
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Transport Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              For flights, trains, buses, and transfers via Amadeus API
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Hotel Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              For hotel bookings via Amadeus Hotel API with Google Places fallback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Test Suggestion Schemas</CardTitle>
          <CardDescription>
            Fill in the forms below to validate suggestion data against exp-response-schema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="place" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="place">
                <MapPin className="mr-2 h-4 w-4" />
                Places
              </TabsTrigger>
              <TabsTrigger value="transport">
                <Plane className="mr-2 h-4 w-4" />
                Transport
              </TabsTrigger>
              <TabsTrigger value="hotel">
                <Home className="mr-2 h-4 w-4" />
                Hotels
              </TabsTrigger>
            </TabsList>

            <TabsContent value="place">
              <SuggestionForm type="place" />
            </TabsContent>

            <TabsContent value="transport">
              <SuggestionForm type="transport" />
            </TabsContent>

            <TabsContent value="hotel">
              <SuggestionForm type="hotel" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Schema Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Place Suggestions</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Used when AI recommends a place to visit, eat, or stay. The suggestion is sent to Google Places API for resolution.
            </p>
            <div className="text-xs space-y-1">
              <div><strong>Required fields:</strong> suggestedName, category, type, searchQuery, context, segmentId</div>
              <div><strong>Categories:</strong> Stay, Eat, Do, Transport</div>
              <div><strong>Context:</strong> dayNumber, timeOfDay, specificTime, notes</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Transport Suggestions</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Used when AI recommends flights, trains, or transfers. The suggestion is sent to Amadeus API for options.
            </p>
            <div className="text-xs space-y-1">
              <div><strong>Required fields:</strong> suggestedName, type, origin, destination, departureDate</div>
              <div><strong>Types:</strong> Flight, Transfer, Train, Bus</div>
              <div><strong>Travel Classes:</strong> ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST</div>
              <div><strong>Transfer Types:</strong> PRIVATE, SHARED, TAXI, AIRPORT_EXPRESS</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Hotel Suggestions</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Used when AI recommends a hotel. First tries Amadeus Hotel API, falls back to Google Places if needed.
            </p>
            <div className="text-xs space-y-1">
              <div><strong>Required fields:</strong> suggestedName, location, checkInDate, checkOutDate, guests, rooms, searchQuery</div>
              <div><strong>Location:</strong> City name or IATA code</div>
              <div><strong>Guests/Rooms:</strong> Defaults to 2 guests, 1 room if not specified</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
