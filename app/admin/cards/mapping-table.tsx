"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CardMapping {
  cardType: string;
  icon: string;
  triggerConditions: string;
  exampleScenarios: string[];
  relatedPlugins: string[];
  usageNotes: string;
}

const CARD_MAPPINGS: CardMapping[] = [
  {
    cardType: "trip_card",
    icon: "📅",
    triggerConditions: "User creates new trip or views trip overview",
    exampleScenarios: [
      "Plan a trip to Paris",
      "Show me my upcoming trips",
      "Create a new trip for next month",
    ],
    relatedPlugins: ["base-exp-prompt", "card-syntax"],
    usageNotes: "Always available. Used to display trip overview with dates and description.",
  },
  {
    cardType: "segment_card",
    icon: "📍",
    triggerConditions: "User discusses specific parts of trip itinerary",
    exampleScenarios: [
      "Add a stay in Paris",
      "Show me the flight segment",
      "Update the hotel segment",
    ],
    relatedPlugins: ["base-exp-prompt", "card-syntax", "context-awareness"],
    usageNotes: "Used for stays, flights, and other trip segments. Includes location and time details.",
  },
  {
    cardType: "reservation_card",
    icon: "🏨",
    triggerConditions: "User discusses general reservations or bookings",
    exampleScenarios: [
      "I booked a hotel",
      "Add this restaurant reservation",
      "Here's my activity booking",
    ],
    relatedPlugins: ["base-exp-prompt", "card-syntax"],
    usageNotes: "General reservation format. Use hotel_reservation_card for detailed hotel confirmations.",
  },
  {
    cardType: "hotel_reservation_card",
    icon: "🏨",
    triggerConditions: "User pastes hotel confirmation email",
    exampleScenarios: [
      "Here's my Hotels.com confirmation email",
      "Booking confirmation from Expedia...",
      "Hotel confirmation number HT12345",
    ],
    relatedPlugins: ["email-parsing", "card-syntax"],
    usageNotes: "Specifically for parsing hotel confirmation emails. Includes detailed fields like confirmation number, check-in time, cancellation policy.",
  },
  {
    cardType: "dining_schedule_card",
    icon: "🍽️",
    triggerConditions: "User asks about restaurants for their trip",
    exampleScenarios: [
      "Where should I eat each night?",
      "Suggest restaurants for my Paris trip",
      "Plan my dining schedule",
    ],
    relatedPlugins: ["base-exp-prompt", "context-awareness"],
    usageNotes: "Triggers component that shows restaurant suggestions for each night of the trip.",
  },
  {
    cardType: "activity_table_card",
    icon: "🎯",
    triggerConditions: "User asks about things to do in a location",
    exampleScenarios: [
      "What should I do in Paris?",
      "Show me activities in Tokyo",
      "Things to do in Rome",
    ],
    relatedPlugins: ["base-exp-prompt"],
    usageNotes: "Interactive table with filterable activity categories (Tours, Museums, Food, etc.).",
  },
  {
    cardType: "flight_comparison_card",
    icon: "✈️",
    triggerConditions: "User asks about flight options",
    exampleScenarios: [
      "Find flights from JFK to Paris",
      "Compare flights to Tokyo",
      "Show me flight options",
    ],
    relatedPlugins: ["base-exp-prompt", "card-syntax"],
    usageNotes: "Triggers Amadeus flight search component with comparison UI.",
  },
  {
    cardType: "budget_breakdown_card",
    icon: "💰",
    triggerConditions: "User asks about trip costs or budget",
    exampleScenarios: [
      "How much will this trip cost?",
      "Show me the budget breakdown",
      "What's my total spending?",
    ],
    relatedPlugins: ["base-exp-prompt"],
    usageNotes: "Displays cost summary across all reservations and segments.",
  },
  {
    cardType: "day_plan_card",
    icon: "📋",
    triggerConditions: "User asks about plans for a specific day",
    exampleScenarios: [
      "What should I do on March 15th?",
      "Show me my itinerary for the first day",
      "Plan for tomorrow",
    ],
    relatedPlugins: ["base-exp-prompt", "context-awareness"],
    usageNotes: "Daily itinerary view with timeline of activities.",
  },
  {
    cardType: "places_map_card",
    icon: "🗺️",
    triggerConditions: "User asks to see places on a map",
    exampleScenarios: [
      "Show me on a map",
      "Where are the restaurants near me?",
      "Map view of hotels",
    ],
    relatedPlugins: ["base-exp-prompt"],
    usageNotes: "Interactive Google Maps component showing places with markers.",
  },
];

export function CardMappingTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card-to-Prompt Mapping Reference</CardTitle>
        <CardDescription>
          Understanding which prompts/plugins generate which card types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Card Type</TableHead>
              <TableHead>Trigger Conditions</TableHead>
              <TableHead>Example Scenarios</TableHead>
              <TableHead>Related Plugins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CARD_MAPPINGS.map((mapping) => (
              <TableRow key={mapping.cardType}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{mapping.icon}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {mapping.cardType}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{mapping.triggerConditions}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mapping.usageNotes}</p>
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    {mapping.exampleScenarios.map((scenario, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        • "{scenario}"
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {mapping.relatedPlugins.map((plugin, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {plugin}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
