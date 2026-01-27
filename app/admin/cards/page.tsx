"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, Code, BookOpen, Calendar, MapPin, Home, Utensils, Plane, DollarSign } from "lucide-react";
import { SchemaEditor } from "./_components/schema-editor";
import { FieldReference } from "./_components/field-reference";
import { CardMappingTable } from "./mapping-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CARD_TYPES = [
  {
    id: "trip_card",
    name: "Trip Card",
    icon: <Calendar className="h-5 w-5" />,
    description: "Trip overview with dates and description",
    usage: "When user creates a new trip or views trip details",
    exampleJson: JSON.stringify({
      type: "trip_card",
      tripId: "trip_clr123abc",
      title: "Spring in Paris",
      startDate: "2026-03-15",
      endDate: "2026-03-22",
      description: "Explore the city of lights with museums, cafes, and the Eiffel Tower"
    }, null, 2),
  },
  {
    id: "segment_card",
    name: "Segment Card",
    icon: <MapPin className="h-5 w-5" />,
    description: "Trip segment (stay, flight, activity)",
    usage: "When displaying parts of a trip itinerary",
    exampleJson: JSON.stringify({
      type: "segment_card",
      segmentId: "seg_xyz789",
      name: "Paris Stay",
      segmentType: "Stay",
      startLocation: "Paris, France",
      endLocation: "Paris, France",
      startTime: "2026-03-15T14:00:00Z",
      endTime: "2026-03-22T10:00:00Z"
    }, null, 2),
  },
  {
    id: "reservation_card",
    name: "Reservation Card",
    icon: <Home className="h-5 w-5" />,
    description: "General reservation details",
    usage: "For hotels, restaurants, activities, or any booking",
    exampleJson: JSON.stringify({
      type: "reservation_card",
      reservationId: "res_abc123",
      name: "Hotel Le Marais",
      category: "Stay",
      reservationType: "Hotel",
      status: "Confirmed",
      cost: 450,
      currency: "USD",
      location: "123 Rue de Rivoli, Paris",
      startTime: "2026-03-15T15:00:00Z",
      endTime: "2026-03-22T11:00:00Z",
      imageUrl: "",
      vendor: "Booking.com"
    }, null, 2),
  },
  {
    id: "hotel_reservation_card",
    name: "Hotel Reservation Card",
    icon: <Home className="h-5 w-5" />,
    description: "Detailed hotel booking information",
    usage: "When user pastes hotel confirmation email",
    exampleJson: JSON.stringify({
      type: "hotel_reservation_card",
      reservationId: "",
      hotelName: "Grand Hotel Paris",
      confirmationNumber: "HT12345678",
      checkInDate: "2026-03-15",
      checkInTime: "3:00 PM",
      checkOutDate: "2026-03-22",
      checkOutTime: "11:00 AM",
      nights: 7,
      guests: 2,
      rooms: 1,
      roomType: "Deluxe King Room",
      address: "123 Champs-Élysées, 75008 Paris, France",
      totalCost: 1800,
      currency: "USD",
      contactPhone: "+33 1 23 45 67 89",
      contactEmail: "info@grandhotel.com",
      cancellationPolicy: "Free cancellation until 24 hours before check-in",
      imageUrl: "",
      url: "https://grandhotel.com"
    }, null, 2),
  },
  {
    id: "dining_schedule_card",
    name: "Dining Schedule Card",
    icon: <Utensils className="h-5 w-5" />,
    description: "Restaurant suggestions for each night",
    usage: "When user asks about restaurants for their trip",
    exampleJson: JSON.stringify({
      type: "dining_schedule_card",
      tripId: "trip_abc123",
      segmentId: "seg_xyz789"
    }, null, 2),
  },
  {
    id: "activity_table_card",
    name: "Activity Table Card",
    icon: <MapPin className="h-5 w-5" />,
    description: "Activities with filtering by category",
    usage: "When user asks about things to do in a location",
    exampleJson: JSON.stringify({
      type: "activity_table_card",
      location: "Paris, France",
      segmentId: "seg_xyz789",
      categories: "Tours|Museums|Food"
    }, null, 2),
  },
  {
    id: "flight_comparison_card",
    name: "Flight Comparison Card",
    icon: <Plane className="h-5 w-5" />,
    description: "Flight options comparison",
    usage: "When user asks about flights between cities",
    exampleJson: JSON.stringify({
      type: "flight_comparison_card",
      origin: "JFK",
      destination: "CDG",
      departDate: "2026-03-15",
      returnDate: "2026-03-22",
      passengers: 2
    }, null, 2),
  },
  {
    id: "budget_breakdown_card",
    name: "Budget Breakdown Card",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Cost summary for trip",
    usage: "When user asks about trip costs or budget",
    exampleJson: JSON.stringify({
      type: "budget_breakdown_card",
      tripId: "trip_abc123"
    }, null, 2),
  },
  {
    id: "day_plan_card",
    name: "Day Plan Card",
    icon: <Calendar className="h-5 w-5" />,
    description: "Daily itinerary for specific date",
    usage: "When user asks about plans for a specific day",
    exampleJson: JSON.stringify({
      type: "day_plan_card",
      tripId: "trip_abc123",
      date: "2026-03-15",
      segmentId: "seg_xyz789"
    }, null, 2),
  },
  {
    id: "places_map_card",
    name: "Places Map Card",
    icon: <MapPin className="h-5 w-5" />,
    description: "Interactive map with places",
    usage: "When user asks to show places on a map",
    exampleJson: JSON.stringify({
      type: "places_map_card",
      centerLat: 48.8566,
      centerLng: 2.3522,
      centerName: "Paris, France",
      placeType: "restaurant",
      radius: 1000
    }, null, 2),
  },
];

export default function CardsPage() {
  const [selectedCardType, setSelectedCardType] = useState<string>("trip_card");
  const selectedCard = CARD_TYPES.find((c) => c.id === selectedCardType);

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
          <h2 className="text-3xl font-bold tracking-tight">Card Type Explorer</h2>
          <p className="text-muted-foreground">
            Interactive reference for all 10 card types in the exp system
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Card Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">
              Defined in exp-response-schema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Exp</div>
            <p className="text-xs text-muted-foreground">
              Structured outputs with Zod
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              OpenAI guarantees schema compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Sparkles className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Code className="mr-2 h-4 w-4" />
            Schema Editor
          </TabsTrigger>
          <TabsTrigger value="reference">
            <BookOpen className="mr-2 h-4 w-4" />
            Field Reference
          </TabsTrigger>
          <TabsTrigger value="mapping">
            <MapPin className="mr-2 h-4 w-4" />
            Prompt Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Types Grid</CardTitle>
              <CardDescription>
                Click on any card type to see details, examples, and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {CARD_TYPES.map((cardType) => (
                  <Card
                    key={cardType.id}
                    className={`cursor-pointer transition-colors hover:border-primary ${
                      selectedCardType === cardType.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => setSelectedCardType(cardType.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {cardType.icon}
                        <CardTitle className="text-base">{cardType.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {cardType.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="text-xs">
                        {cardType.id}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCard && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedCard.icon}
                      {selectedCard.name}
                    </CardTitle>
                    <CardDescription>{selectedCard.description}</CardDescription>
                  </div>
                  <Badge>{selectedCard.id}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">When to Use</h4>
                  <p className="text-sm text-muted-foreground">{selectedCard.usage}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example JSON</h4>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {selectedCard.exampleJson}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Card Type</CardTitle>
              <CardDescription>
                Choose a card type to see its example JSON and start editing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCardType} onValueChange={setSelectedCardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_TYPES.map((cardType) => (
                    <SelectItem key={cardType.id} value={cardType.id}>
                      {cardType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <SchemaEditor
            initialValue={selectedCard?.exampleJson || ""}
            cardType={selectedCardType}
          />
        </TabsContent>

        <TabsContent value="reference" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Card Type</CardTitle>
              <CardDescription>
                Choose a card type to see its complete field reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCardType} onValueChange={setSelectedCardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_TYPES.map((cardType) => (
                    <SelectItem key={cardType.id} value={cardType.id}>
                      {cardType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <FieldReference cardType={selectedCardType} />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <CardMappingTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
