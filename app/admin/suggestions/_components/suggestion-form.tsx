"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SuggestionFormProps {
  type: "place" | "transport" | "hotel";
}

export function SuggestionForm({ type }: SuggestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Place form state
  const [placeName, setPlaceName] = useState("");
  const [placeCategory, setPlaceCategory] = useState<string>("Eat");
  const [placeType, setPlaceType] = useState("");
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeDayNumber, setPlaceDayNumber] = useState("1");
  const [placeTimeOfDay, setPlaceTimeOfDay] = useState("");
  const [placeSpecificTime, setPlaceSpecificTime] = useState("");
  const [placeNotes, setPlaceNotes] = useState("");
  const [placeSegmentId, setPlaceSegmentId] = useState("");
  
  // Transport form state
  const [transportName, setTransportName] = useState("");
  const [transportType, setTransportType] = useState<string>("Flight");
  const [transportOrigin, setTransportOrigin] = useState("");
  const [transportDestination, setTransportDestination] = useState("");
  const [transportDepartureDate, setTransportDepartureDate] = useState("");
  const [transportDepartureTime, setTransportDepartureTime] = useState("");
  const [transportReturnDate, setTransportReturnDate] = useState("");
  const [transportAdults, setTransportAdults] = useState("1");
  const [transportTravelClass, setTransportTravelClass] = useState<string>("ECONOMY");
  const [transportTransferType, setTransportTransferType] = useState<string>("PRIVATE");
  
  // Hotel form state
  const [hotelName, setHotelName] = useState("");
  const [hotelLocation, setHotelLocation] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [hotelGuests, setHotelGuests] = useState("2");
  const [hotelRooms, setHotelRooms] = useState("1");
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");

  const handleValidate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      let data;
      
      if (type === "place") {
        data = {
          suggestedName: placeName,
          category: placeCategory,
          type: placeType,
          searchQuery: placeSearchQuery,
          context: {
            dayNumber: parseInt(placeDayNumber) || 0,
            timeOfDay: placeTimeOfDay,
            specificTime: placeSpecificTime,
            notes: placeNotes,
          },
          segmentId: placeSegmentId,
        };
      } else if (type === "transport") {
        data = {
          suggestedName: transportName,
          type: transportType,
          origin: transportOrigin,
          destination: transportDestination,
          departureDate: transportDepartureDate,
          departureTime: transportDepartureTime,
          returnDate: transportReturnDate,
          adults: parseInt(transportAdults) || 1,
          travelClass: transportTravelClass,
          transferType: transportTransferType,
        };
      } else {
        data = {
          suggestedName: hotelName,
          location: hotelLocation,
          checkInDate: hotelCheckIn,
          checkOutDate: hotelCheckOut,
          guests: parseInt(hotelGuests) || 2,
          rooms: parseInt(hotelRooms) || 1,
          searchQuery: hotelSearchQuery,
        };
      }
      
      const response = await fetch("/api/admin/suggestions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      
      const json = await response.json();
      setResult(json);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Validation failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {type === "place" && "Place Suggestion"}
            {type === "transport" && "Transport Suggestion"}
            {type === "hotel" && "Hotel Suggestion"}
          </CardTitle>
          <CardDescription>
            Fill in the form to test {type} suggestion validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === "place" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="placeName">Suggested Name *</Label>
                  <Input
                    id="placeName"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="Le Jules Verne"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeCategory">Category *</Label>
                  <Select value={placeCategory} onValueChange={setPlaceCategory}>
                    <SelectTrigger id="placeCategory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stay">Stay</SelectItem>
                      <SelectItem value="Eat">Eat</SelectItem>
                      <SelectItem value="Do">Do</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeType">Type *</Label>
                  <Input
                    id="placeType"
                    value={placeType}
                    onChange={(e) => setPlaceType(e.target.value)}
                    placeholder="Restaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeSearchQuery">Search Query *</Label>
                  <Input
                    id="placeSearchQuery"
                    value={placeSearchQuery}
                    onChange={(e) => setPlaceSearchQuery(e.target.value)}
                    placeholder="Le Jules Verne restaurant Eiffel Tower Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeDayNumber">Day Number</Label>
                  <Input
                    id="placeDayNumber"
                    type="number"
                    value={placeDayNumber}
                    onChange={(e) => setPlaceDayNumber(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeTimeOfDay">Time of Day</Label>
                  <Input
                    id="placeTimeOfDay"
                    value={placeTimeOfDay}
                    onChange={(e) => setPlaceTimeOfDay(e.target.value)}
                    placeholder="evening"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeSpecificTime">Specific Time</Label>
                  <Input
                    id="placeSpecificTime"
                    value={placeSpecificTime}
                    onChange={(e) => setPlaceSpecificTime(e.target.value)}
                    placeholder="7:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeSegmentId">Segment ID</Label>
                  <Input
                    id="placeSegmentId"
                    value={placeSegmentId}
                    onChange={(e) => setPlaceSegmentId(e.target.value)}
                    placeholder="seg_abc123"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeNotes">Notes</Label>
                <Input
                  id="placeNotes"
                  value={placeNotes}
                  onChange={(e) => setPlaceNotes(e.target.value)}
                  placeholder="Michelin-starred restaurant with Eiffel Tower views"
                />
              </div>
            </>
          )}
          
          {type === "transport" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transportName">Suggested Name *</Label>
                  <Input
                    id="transportName"
                    value={transportName}
                    onChange={(e) => setTransportName(e.target.value)}
                    placeholder="JFK to CDG flight"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportType">Type *</Label>
                  <Select value={transportType} onValueChange={setTransportType}>
                    <SelectTrigger id="transportType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flight">Flight</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Train">Train</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportOrigin">Origin *</Label>
                  <Input
                    id="transportOrigin"
                    value={transportOrigin}
                    onChange={(e) => setTransportOrigin(e.target.value)}
                    placeholder="JFK"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportDestination">Destination *</Label>
                  <Input
                    id="transportDestination"
                    value={transportDestination}
                    onChange={(e) => setTransportDestination(e.target.value)}
                    placeholder="CDG"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportDepartureDate">Departure Date *</Label>
                  <Input
                    id="transportDepartureDate"
                    type="date"
                    value={transportDepartureDate}
                    onChange={(e) => setTransportDepartureDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportDepartureTime">Departure Time</Label>
                  <Input
                    id="transportDepartureTime"
                    value={transportDepartureTime}
                    onChange={(e) => setTransportDepartureTime(e.target.value)}
                    placeholder="14:30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportReturnDate">Return Date</Label>
                  <Input
                    id="transportReturnDate"
                    type="date"
                    value={transportReturnDate}
                    onChange={(e) => setTransportReturnDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportAdults">Adults</Label>
                  <Input
                    id="transportAdults"
                    type="number"
                    value={transportAdults}
                    onChange={(e) => setTransportAdults(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportTravelClass">Travel Class</Label>
                  <Select value={transportTravelClass} onValueChange={setTransportTravelClass}>
                    <SelectTrigger id="transportTravelClass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Economy</SelectItem>
                      <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="FIRST">First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportTransferType">Transfer Type</Label>
                  <Select value={transportTransferType} onValueChange={setTransportTransferType}>
                    <SelectTrigger id="transportTransferType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="SHARED">Shared</SelectItem>
                      <SelectItem value="TAXI">Taxi</SelectItem>
                      <SelectItem value="AIRPORT_EXPRESS">Airport Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          {type === "hotel" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotelName">Suggested Name *</Label>
                  <Input
                    id="hotelName"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="Hotel Le Marais"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelLocation">Location *</Label>
                  <Input
                    id="hotelLocation"
                    value={hotelLocation}
                    onChange={(e) => setHotelLocation(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelCheckIn">Check-in Date *</Label>
                  <Input
                    id="hotelCheckIn"
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelCheckOut">Check-out Date *</Label>
                  <Input
                    id="hotelCheckOut"
                    type="date"
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelGuests">Guests</Label>
                  <Input
                    id="hotelGuests"
                    type="number"
                    value={hotelGuests}
                    onChange={(e) => setHotelGuests(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelRooms">Rooms</Label>
                  <Input
                    id="hotelRooms"
                    type="number"
                    value={hotelRooms}
                    onChange={(e) => setHotelRooms(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hotelSearchQuery">Search Query *</Label>
                  <Input
                    id="hotelSearchQuery"
                    value={hotelSearchQuery}
                    onChange={(e) => setHotelSearchQuery(e.target.value)}
                    placeholder="Hotel Le Marais Paris boutique hotel"
                  />
                </div>
              </div>
            </>
          )}
          
          <Button onClick={handleValidate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Validate
              </>
            )}
          </Button>
          
          {result && (
            <Alert variant={result.results?.valid ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {result.results?.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {result.results?.valid ? (
                      <div>
                        <strong>✓ Valid!</strong> Suggestion matches schema requirements.
                        <div className="mt-2">
                          <Badge variant="secondary">Type: {result.type}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <strong>Validation Error:</strong>
                        <ul className="mt-2 text-xs list-disc list-inside">
                          {result.results?.errors?.map((err: any, idx: number) => (
                            <li key={idx}>
                              <strong>{err.path}:</strong> {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {result?.results?.valid && result.results.data && (
        <Card>
          <CardHeader>
            <CardTitle>Validated Data</CardTitle>
            <CardDescription>JSON representation of validated suggestion</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(result.results.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
