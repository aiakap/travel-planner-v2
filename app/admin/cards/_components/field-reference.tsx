"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FieldReferenceProps {
  cardType: string;
}

interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

const CARD_FIELDS: Record<string, FieldDefinition[]> = {
  trip_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "trip_card"', example: '"trip_card"' },
    { name: "tripId", type: "string", required: true, description: "Trip ID from database", example: '"trip_clr123abc"' },
    { name: "title", type: "string", required: true, description: "Trip title", example: '"Spring in Paris"' },
    { name: "startDate", type: "string", required: true, description: "Start date (YYYY-MM-DD)", example: '"2026-03-15"' },
    { name: "endDate", type: "string", required: true, description: "End date (YYYY-MM-DD)", example: '"2026-03-22"' },
    { name: "description", type: "string", required: true, description: "Trip description or empty string", example: '"Explore the city of lights"' },
  ],
  segment_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "segment_card"', example: '"segment_card"' },
    { name: "segmentId", type: "string", required: true, description: "Segment ID from database", example: '"seg_xyz789"' },
    { name: "name", type: "string", required: true, description: "Segment name", example: '"Paris Stay"' },
    { name: "segmentType", type: "string", required: true, description: "Type of segment", example: '"Stay"' },
    { name: "startLocation", type: "string", required: true, description: "Starting location", example: '"Paris, France"' },
    { name: "endLocation", type: "string", required: true, description: "Ending location", example: '"Paris, France"' },
    { name: "startTime", type: "string", required: true, description: "Start time (ISO) or empty string", example: '"2026-03-15T14:00:00Z"' },
    { name: "endTime", type: "string", required: true, description: "End time (ISO) or empty string", example: '"2026-03-22T10:00:00Z"' },
  ],
  reservation_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "reservation_card"', example: '"reservation_card"' },
    { name: "reservationId", type: "string", required: true, description: "Reservation ID from database", example: '"res_abc123"' },
    { name: "name", type: "string", required: true, description: "Reservation name", example: '"Hotel Le Marais"' },
    { name: "category", type: "string", required: true, description: "Category (Stay/Eat/Do/Transport)", example: '"Stay"' },
    { name: "reservationType", type: "string", required: true, description: "Specific type", example: '"Hotel"' },
    { name: "status", type: "string", required: true, description: "Reservation status", example: '"Confirmed"' },
    { name: "cost", type: "number", required: true, description: "Cost or 0", example: "450" },
    { name: "currency", type: "string", required: true, description: "Currency code or empty", example: '"USD"' },
    { name: "location", type: "string", required: true, description: "Location or empty", example: '"123 Rue de Rivoli"' },
    { name: "startTime", type: "string", required: true, description: "Start time (ISO) or empty", example: '"2026-03-15T15:00:00Z"' },
    { name: "endTime", type: "string", required: true, description: "End time (ISO) or empty", example: '"2026-03-22T11:00:00Z"' },
    { name: "imageUrl", type: "string", required: true, description: "Image URL or empty", example: '""' },
    { name: "vendor", type: "string", required: true, description: "Vendor name or empty", example: '"Hotels.com"' },
  ],
  hotel_reservation_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "hotel_reservation_card"', example: '"hotel_reservation_card"' },
    { name: "reservationId", type: "string", required: true, description: "Reservation ID or empty for new", example: '"res_abc123"' },
    { name: "hotelName", type: "string", required: true, description: "Hotel name", example: '"Grand Hotel Paris"' },
    { name: "confirmationNumber", type: "string", required: true, description: "Confirmation number or empty", example: '"HT12345678"' },
    { name: "checkInDate", type: "string", required: true, description: "Check-in date (YYYY-MM-DD)", example: '"2026-03-15"' },
    { name: "checkInTime", type: "string", required: true, description: "Check-in time or empty", example: '"3:00 PM"' },
    { name: "checkOutDate", type: "string", required: true, description: "Check-out date (YYYY-MM-DD)", example: '"2026-03-22"' },
    { name: "checkOutTime", type: "string", required: true, description: "Check-out time or empty", example: '"11:00 AM"' },
    { name: "nights", type: "number", required: true, description: "Number of nights or 0", example: "7" },
    { name: "guests", type: "number", required: true, description: "Number of guests or 0", example: "2" },
    { name: "rooms", type: "number", required: true, description: "Number of rooms or 0", example: "1" },
    { name: "roomType", type: "string", required: true, description: "Room type or empty", example: '"Deluxe King Room"' },
    { name: "address", type: "string", required: true, description: "Hotel address or empty", example: '"123 Champs-Élysées"' },
    { name: "totalCost", type: "number", required: true, description: "Total cost or 0", example: "1800" },
    { name: "currency", type: "string", required: true, description: "Currency code or empty", example: '"USD"' },
    { name: "contactPhone", type: "string", required: true, description: "Contact phone or empty", example: '"+33 1 23 45 67 89"' },
    { name: "contactEmail", type: "string", required: true, description: "Contact email or empty", example: '"info@hotel.com"' },
    { name: "cancellationPolicy", type: "string", required: true, description: "Cancellation policy or empty", example: '"Free until 24h before"' },
    { name: "imageUrl", type: "string", required: true, description: "Hotel image URL or empty", example: '""' },
    { name: "url", type: "string", required: true, description: "Hotel website URL or empty", example: '"https://hotel.com"' },
  ],
  dining_schedule_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "dining_schedule_card"', example: '"dining_schedule_card"' },
    { name: "tripId", type: "string", required: true, description: "Trip ID", example: '"trip_abc123"' },
    { name: "segmentId", type: "string", required: true, description: "Segment ID or empty", example: '"seg_xyz789"' },
  ],
  activity_table_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "activity_table_card"', example: '"activity_table_card"' },
    { name: "location", type: "string", required: true, description: "Location for activities", example: '"Paris, France"' },
    { name: "segmentId", type: "string", required: true, description: "Segment ID or empty", example: '"seg_xyz789"' },
    { name: "categories", type: "string", required: true, description: "Pipe-separated categories or empty", example: '"Tours|Museums|Food"' },
  ],
  flight_comparison_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "flight_comparison_card"', example: '"flight_comparison_card"' },
    { name: "origin", type: "string", required: true, description: "Origin airport IATA code", example: '"JFK"' },
    { name: "destination", type: "string", required: true, description: "Destination airport IATA code", example: '"CDG"' },
    { name: "departDate", type: "string", required: true, description: "Departure date (YYYY-MM-DD)", example: '"2026-03-15"' },
    { name: "returnDate", type: "string", required: true, description: "Return date or empty for one-way", example: '"2026-03-22"' },
    { name: "passengers", type: "number", required: true, description: "Number of passengers", example: "2" },
  ],
  budget_breakdown_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "budget_breakdown_card"', example: '"budget_breakdown_card"' },
    { name: "tripId", type: "string", required: true, description: "Trip ID", example: '"trip_abc123"' },
  ],
  day_plan_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "day_plan_card"', example: '"day_plan_card"' },
    { name: "tripId", type: "string", required: true, description: "Trip ID", example: '"trip_abc123"' },
    { name: "date", type: "string", required: true, description: "Date (YYYY-MM-DD)", example: '"2026-03-15"' },
    { name: "segmentId", type: "string", required: true, description: "Segment ID or empty", example: '"seg_xyz789"' },
  ],
  places_map_card: [
    { name: "type", type: "literal", required: true, description: 'Must be "places_map_card"', example: '"places_map_card"' },
    { name: "centerLat", type: "number", required: true, description: "Center latitude", example: "48.8566" },
    { name: "centerLng", type: "number", required: true, description: "Center longitude", example: "2.3522" },
    { name: "centerName", type: "string", required: true, description: "Name of center point", example: '"Paris, France"' },
    { name: "placeType", type: "string", required: true, description: "Type of places or empty", example: '"restaurant"' },
    { name: "radius", type: "number", required: true, description: "Search radius in meters", example: "1000" },
  ],
};

export function FieldReference({ cardType }: FieldReferenceProps) {
  const fields = CARD_FIELDS[cardType] || [];

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No field reference available for this card type</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Reference</CardTitle>
        <CardDescription>
          All fields for <Badge variant="outline">{cardType}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Example</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.name}>
                <TableCell className="font-mono text-sm">{field.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{field.type}</Badge>
                </TableCell>
                <TableCell>
                  {field.required ? (
                    <Badge variant="default">Required</Badge>
                  ) : (
                    <Badge variant="outline">Optional</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{field.description}</TableCell>
                <TableCell className="font-mono text-xs">{field.example}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
