"use client";

import { Card as CardType } from "@/lib/schemas/exp-response-schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, Clock, User, Home, Utensils, Plane } from "lucide-react";

interface CardPreviewProps {
  card: CardType;
}

export function CardPreview({ card }: CardPreviewProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getCardIcon(card.type)}
            {getCardTitle(card)}
          </CardTitle>
          <Badge variant="outline">{card.type}</Badge>
        </div>
        <CardDescription>{getCardDescription(card)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {renderCardDetails(card)}
        </div>
      </CardContent>
    </Card>
  );
}

function getCardIcon(type: string) {
  const icons: Record<string, any> = {
    trip_card: <Calendar className="h-5 w-5" />,
    segment_card: <MapPin className="h-5 w-5" />,
    reservation_card: <Home className="h-5 w-5" />,
    hotel_reservation_card: <Home className="h-5 w-5" />,
    dining_schedule_card: <Utensils className="h-5 w-5" />,
    activity_table_card: <MapPin className="h-5 w-5" />,
    flight_comparison_card: <Plane className="h-5 w-5" />,
    budget_breakdown_card: <DollarSign className="h-5 w-5" />,
    day_plan_card: <Calendar className="h-5 w-5" />,
    places_map_card: <MapPin className="h-5 w-5" />,
  };
  return icons[type] || <Calendar className="h-5 w-5" />;
}

function getCardTitle(card: CardType): string {
  switch (card.type) {
    case "trip_card":
      return card.title;
    case "segment_card":
      return card.name;
    case "reservation_card":
      return card.name;
    case "hotel_reservation_card":
      return card.hotelName;
    case "dining_schedule_card":
      return "Dining Schedule";
    case "activity_table_card":
      return `Activities in ${card.location}`;
    case "flight_comparison_card":
      return `${card.origin} → ${card.destination}`;
    case "budget_breakdown_card":
      return "Budget Breakdown";
    case "day_plan_card":
      return `Day Plan - ${card.date}`;
    case "places_map_card":
      return `Map - ${card.centerName}`;
    default:
      return "Card";
  }
}

function getCardDescription(card: CardType): string {
  switch (card.type) {
    case "trip_card":
      return card.description || "Trip overview";
    case "segment_card":
      return `${card.startLocation} → ${card.endLocation}`;
    case "reservation_card":
      return `${card.category} - ${card.reservationType}`;
    case "hotel_reservation_card":
      return `${card.nights > 0 ? `${card.nights} nights` : "Hotel reservation"} ${card.confirmationNumber ? `- ${card.confirmationNumber}` : ""}`;
    case "dining_schedule_card":
      return "Restaurant suggestions";
    case "activity_table_card":
      return card.categories || "Activities and attractions";
    case "flight_comparison_card":
      return `${card.passengers} passenger(s)`;
    case "budget_breakdown_card":
      return "Cost summary";
    case "day_plan_card":
      return "Daily itinerary";
    case "places_map_card":
      return card.placeType || "Interactive map";
    default:
      return "";
  }
}

function renderCardDetails(card: CardType) {
  switch (card.type) {
    case "trip_card":
      return (
        <>
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Start" value={card.startDate} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="End" value={card.endDate} />
          {card.description && <DetailRow icon={<MapPin className="h-4 w-4" />} label="Description" value={card.description} />}
        </>
      );
    case "segment_card":
      return (
        <>
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Type" value={card.segmentType} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="From" value={card.startLocation} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="To" value={card.endLocation} />
          {card.startTime && <DetailRow icon={<Clock className="h-4 w-4" />} label="Start" value={new Date(card.startTime).toLocaleString()} />}
          {card.endTime && <DetailRow icon={<Clock className="h-4 w-4" />} label="End" value={new Date(card.endTime).toLocaleString()} />}
        </>
      );
    case "reservation_card":
      return (
        <>
          <DetailRow icon={<Badge className="h-4 w-4" />} label="Category" value={card.category} />
          <DetailRow icon={<Badge className="h-4 w-4" />} label="Type" value={card.reservationType} />
          <DetailRow icon={<Badge className="h-4 w-4" />} label="Status" value={card.status} />
          {card.cost > 0 && <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Cost" value={`${card.currency} ${card.cost}`} />}
          {card.location && <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={card.location} />}
          {card.vendor && <DetailRow icon={<User className="h-4 w-4" />} label="Vendor" value={card.vendor} />}
        </>
      );
    case "hotel_reservation_card":
      return (
        <>
          {card.confirmationNumber && <DetailRow icon={<Badge className="h-4 w-4" />} label="Confirmation" value={card.confirmationNumber} />}
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Check-in" value={`${card.checkInDate}${card.checkInTime ? ` ${card.checkInTime}` : ""}`} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Check-out" value={`${card.checkOutDate}${card.checkOutTime ? ` ${card.checkOutTime}` : ""}`} />
          {card.nights > 0 && <DetailRow icon={<Clock className="h-4 w-4" />} label="Nights" value={card.nights.toString()} />}
          {card.guests > 0 && <DetailRow icon={<User className="h-4 w-4" />} label="Guests" value={card.guests.toString()} />}
          {card.rooms > 0 && <DetailRow icon={<Home className="h-4 w-4" />} label="Rooms" value={card.rooms.toString()} />}
          {card.roomType && <DetailRow icon={<Home className="h-4 w-4" />} label="Room Type" value={card.roomType} />}
          {card.totalCost > 0 && <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Total" value={`${card.currency} ${card.totalCost}`} />}
          {card.address && <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={card.address} />}
        </>
      );
    case "flight_comparison_card":
      return (
        <>
          <DetailRow icon={<Plane className="h-4 w-4" />} label="Route" value={`${card.origin} → ${card.destination}`} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Depart" value={card.departDate} />
          {card.returnDate && <DetailRow icon={<Calendar className="h-4 w-4" />} label="Return" value={card.returnDate} />}
          <DetailRow icon={<User className="h-4 w-4" />} label="Passengers" value={card.passengers.toString()} />
        </>
      );
    case "places_map_card":
      return (
        <>
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Center" value={card.centerName} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Coordinates" value={`${card.centerLat}, ${card.centerLng}`} />
          {card.placeType && <DetailRow icon={<Badge className="h-4 w-4" />} label="Type" value={card.placeType} />}
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Radius" value={`${card.radius}m`} />
        </>
      );
    default:
      return <div className="text-muted-foreground">No preview available for this card type</div>;
  }
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <span className="font-medium text-muted-foreground">{label}:</span> {value}
      </div>
    </div>
  );
}
