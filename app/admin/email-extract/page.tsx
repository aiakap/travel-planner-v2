"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plane, CheckCircle, Mail, Hotel, Car } from "lucide-react";
import { ApiTestLayout } from "../apis/_components/api-test-layout";
import { DetailSection } from "../apis/_components/detail-section";
import { InfoGrid } from "../apis/_components/info-grid";
import { formatDate, formatPrice } from "@/lib/format-helpers";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addFlightsToTrip } from "@/lib/actions/add-flights-to-trip";
import { addHotelsToTrip } from "@/lib/actions/add-hotels-to-trip";
import { addCarRentalToTrip } from "@/lib/actions/add-car-rentals-to-trip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  segments: Segment[];
}

interface Segment {
  id: string;
  name: string;
  startTitle: string;
  endTitle: string;
  startTime: string | null;
  endTime: string | null;
  order: number;
}

interface ClusterPreview {
  clusters: Array<{
    flights: any[];
    startLocation: string;
    endLocation: string;
    startTime: Date;
    endTime: Date;
    matchedSegment?: {
      id: string;
      name: string;
      score: number;
    };
    suggestedSegment?: {
      name: string;
      startLocation: string;
      endLocation: string;
    };
  }>;
  summary: {
    totalFlights: number;
    totalClusters: number;
    matchedClusters: number;
    suggestedClusters: number;
  };
}

interface HotelPreview {
  hotel: any;
  matchedSegment?: {
    id: string;
    name: string;
    score: number;
  };
  willCreateSegment: boolean;
  suggestedSegmentName?: string;
}

interface CarRentalPreview {
  carRental: any;
  matchedSegment?: {
    id: string;
    name: string;
    score: number;
  };
  willCreateSegment: boolean;
  suggestedSegmentName?: string;
  isOneWay: boolean;
}

type ExtractionType = "flight" | "hotel" | "car-rental";

// Helper to parse .eml files
async function parseEMLFile(file: File): Promise<string> {
  const text = await file.text();
  return text;
}

export default function EmailExtractionPage() {
  const [emailText, setEmailText] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractionType, setExtractionType] = useState<ExtractionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [clusterPreview, setClusterPreview] = useState<ClusterPreview | null>(null);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [hotelPreview, setHotelPreview] = useState<HotelPreview | null>(null);
  const [loadingHotelPreview, setLoadingHotelPreview] = useState(false);
  const [carRentalPreview, setCarRentalPreview] = useState<CarRentalPreview | null>(null);
  const [loadingCarRentalPreview, setLoadingCarRentalPreview] = useState(false);

  // Fetch user trips on mount
  useEffect(() => {
    fetchTrips();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const text = await parseEMLFile(file);
      setEmailText(text);
    } catch (err) {
      setError("Failed to parse file");
    }
  };

  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const response = await fetch('/api/admin/user-trips');
      const data = await response.json();
      
      if (data.success) {
        setTrips(data.trips);
      } else {
        console.error('Failed to fetch trips:', data.error);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Get selected trip data
  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setExtractedData(null);
    setExtractionType(null);
    setClusterPreview(null);

    try {
      const response = await fetch("/api/admin/email-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Extraction failed");
      }

      setExtractedData(result.data);
      setExtractionType(result.type);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewClustering = async (tripId: string) => {
    if (extractionType !== 'flight' || !extractedData) return;
    
    setLoadingClusters(true);
    setClusterPreview(null);
    
    try {
      // Import matching functions client-side
      const { findBestSegmentForCluster } = await import('@/lib/utils/segment-matching');
      const { suggestSegmentForCluster } = await import('@/lib/utils/segment-suggestions');
      
      // Get trip segments
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      
      // Helper to convert time string to 24-hour format
      const convertTo24Hour = (time: string): string => {
        const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return "12:00:00";
        
        let [_, hours, minutes, period] = match;
        let h = parseInt(hours);
        
        if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
        if (period.toUpperCase() === 'AM' && h === 12) h = 0;
        
        return `${h.toString().padStart(2, '0')}:${minutes}:00`;
      };
      
      // Process each flight individually (no clustering)
      const preview = extractedData.flights.map((flight: any) => {
        // Create a single-flight "cluster" for matching
        const singleFlightCluster = {
          flights: [flight],
          startTime: new Date(`${flight.departureDate}T${convertTo24Hour(flight.departureTime)}`),
          endTime: new Date(`${flight.arrivalDate}T${convertTo24Hour(flight.arrivalTime)}`),
          startLocation: flight.departureCity,
          endLocation: flight.arrivalCity,
          startAirport: flight.departureAirport,
          endAirport: flight.arrivalAirport,
        };
        
        const match = findBestSegmentForCluster(singleFlightCluster, trip.segments);
        const suggestion = !match ? suggestSegmentForCluster(singleFlightCluster, trip.segments) : null;
        
        return {
          ...singleFlightCluster,
          matchedSegment: match ? {
            id: match.segmentId,
            name: match.segmentName,
            score: match.score
          } : undefined,
          suggestedSegment: suggestion ? {
            name: suggestion.name,
            startLocation: suggestion.startLocation,
            endLocation: suggestion.endLocation
          } : undefined
        };
      });
      
      setClusterPreview({
        clusters: preview,
        summary: {
          totalFlights: extractedData.flights.length,
          totalClusters: extractedData.flights.length, // Each flight is its own "cluster"
          matchedClusters: preview.filter((c: any) => c.matchedSegment).length,
          suggestedClusters: preview.filter((c: any) => c.suggestedSegment).length
        }
      });
    } catch (err) {
      console.error('Flight preview error:', err);
      setError('Failed to preview flight assignments');
    } finally {
      setLoadingClusters(false);
    }
  };

  const previewHotelMatching = async (tripId: string) => {
    if (extractionType !== 'hotel' || !extractedData) return;
    
    setLoadingHotelPreview(true);
    setHotelPreview(null);
    
    try {
      // Import matching functions client-side
      const { createHotelCluster } = await import('@/lib/utils/hotel-clustering');
      const { findBestSegmentForHotel } = await import('@/lib/utils/segment-matching');
      
      // Get trip segments
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      
      // Create hotel cluster
      const hotelCluster = createHotelCluster(extractedData);
      
      // Find best match
      const match = findBestSegmentForHotel(hotelCluster, trip.segments, 70);
      
      // Determine if we'll create a new segment
      const willCreateSegment = !match;
      let suggestedSegmentName = '';
      
      if (willCreateSegment) {
        // Extract city from address
        const cityMatch = extractedData.address.match(/([^,]+),/);
        const city = cityMatch ? cityMatch[1].trim() : extractedData.hotelName;
        suggestedSegmentName = `Stay in ${city}`;
      }
      
      setHotelPreview({
        hotel: extractedData,
        matchedSegment: match ? {
          id: match.segmentId,
          name: match.segmentName,
          score: match.score
        } : undefined,
        willCreateSegment,
        suggestedSegmentName
      });
    } catch (err) {
      console.error('Hotel preview error:', err);
      setError('Failed to preview hotel assignment');
    } finally {
      setLoadingHotelPreview(false);
    }
  };

  const previewCarRentalMatching = async (tripId: string) => {
    if (extractionType !== 'car-rental' || !extractedData) return;
    
    setLoadingCarRentalPreview(true);
    setCarRentalPreview(null);
    
    try {
      // Import matching functions client-side
      const { createCarRentalCluster } = await import('@/lib/utils/car-rental-clustering');
      const { findBestSegmentForCarRental } = await import('@/lib/utils/segment-matching');
      
      // Get trip segments
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      
      // Create car rental cluster
      const carRentalCluster = createCarRentalCluster(extractedData);
      
      // Find best match
      const match = findBestSegmentForCarRental(carRentalCluster, trip.segments, 70);
      
      // Determine if we'll create a new segment
      const willCreateSegment = !match;
      let suggestedSegmentName = '';
      
      // Determine if one-way rental
      const isOneWay = extractedData.pickupLocation !== extractedData.returnLocation || 
                       extractedData.oneWayCharge > 0;
      
      if (willCreateSegment) {
        // Extract city from pickup address
        const extractCity = (address: string, location: string) => {
          if (!address) return location;
          const parts = address.split(',');
          return parts.length >= 2 ? parts[0].trim() : location;
        };
        
        const pickupCity = extractCity(extractedData.pickupAddress, extractedData.pickupLocation);
        const returnCity = extractCity(extractedData.returnAddress, extractedData.returnLocation);
        
        suggestedSegmentName = isOneWay 
          ? `Drive from ${pickupCity} to ${returnCity}`
          : `Drive in ${pickupCity}`;
      }
      
      setCarRentalPreview({
        carRental: extractedData,
        matchedSegment: match ? {
          id: match.segmentId,
          name: match.segmentName,
          score: match.score
        } : undefined,
        willCreateSegment,
        suggestedSegmentName,
        isOneWay
      });
    } catch (err) {
      console.error('Car rental preview error:', err);
      setError('Failed to preview car rental assignment');
    } finally {
      setLoadingCarRentalPreview(false);
    }
  };

  const handleAddToTrip = async () => {
    if (!selectedTripId) return;

    setAddingToTrip(true);
    setError(null);
    setAddSuccess(false);

    try {
      if (extractionType === 'flight') {
        await addFlightsToTrip(
          selectedTripId,
          null, // segmentId - process each flight individually
          extractedData,
          {
            autoCluster: false, // Process each flight as individual reservation
            maxGapHours: 48,
            createSuggestedSegments: true
          }
        );
      } else if (extractionType === 'hotel') {
        await addHotelsToTrip({
          tripId: selectedTripId,
          segmentId: selectedSegmentId || null, // Use manual selection if provided, otherwise auto-match
          hotelData: extractedData,
          options: {
            autoMatch: !selectedSegmentId, // Only auto-match if no manual selection
            minScore: 70,
            createSuggestedSegments: !selectedSegmentId // Only create segment if no manual selection
          }
        });
      } else if (extractionType === 'car-rental') {
        await addCarRentalToTrip({
          tripId: selectedTripId,
          segmentId: selectedSegmentId || null, // Use manual selection if provided, otherwise auto-match
          carRentalData: extractedData,
          options: {
            autoMatch: !selectedSegmentId, // Only auto-match if no manual selection
            minScore: 70,
            createSuggestedSegments: !selectedSegmentId // Only create segment if no manual selection
          }
        });
      }

      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add to trip');
    } finally {
      setAddingToTrip(false);
    }
  };

  return (
    <ApiTestLayout
      title="Email Extraction"
      description="Extract flight or hotel booking information from confirmation emails"
    >
      <div className="space-y-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Email Text</CardTitle>
            <CardDescription>
              Paste email text or upload a .eml file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Upload .eml file (optional)</Label>
              <Input
                id="fileUpload"
                type="file"
                accept=".eml,.txt,message/rfc822"
                onChange={handleFileUpload}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailText">Or paste email content</Label>
              <Textarea
                id="emailText"
                placeholder="Paste your booking confirmation email here..."
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleExtract}
              disabled={!emailText || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Booking Info'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {addSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Successfully added to trip!</AlertDescription>
          </Alert>
        )}

        {/* Extracted Data Display */}
        {extractedData && extractionType === 'flight' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Extracted Flight Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Summary */}
                <DetailSection title="Booking Summary">
                  <InfoGrid
                    items={[
                      { label: "Confirmation Number", value: extractedData.confirmationNumber || "N/A" },
                      { label: "Passenger", value: extractedData.passengers?.[0]?.name || "N/A" },
                      { label: "E-Ticket", value: extractedData.passengers?.[0]?.eTicket || "N/A" },
                      { label: "Purchase Date", value: formatDate(extractedData.purchaseDate) },
                      { label: "Total Cost", value: formatPrice(extractedData.totalCost, extractedData.currency) },
                      { label: "Flights", value: `${extractedData.flights?.length || 0} segment(s)` },
                    ]}
                  />
                </DetailSection>

                {/* Flights */}
                {extractedData.flights?.map((flight: any, index: number) => (
                  <DetailSection key={index} title={`Flight ${index + 1}: ${flight.flightNumber}`}>
                    <InfoGrid
                      items={[
                        { label: "Carrier", value: `${flight.carrier} (${flight.carrierCode})` },
                        { label: "Flight Number", value: flight.flightNumber },
                        { label: "Departure", value: `${flight.departureCity} (${flight.departureAirport})` },
                        { label: "Departure Time", value: `${formatDate(flight.departureDate)} ${flight.departureTime}` },
                        { label: "Arrival", value: `${flight.arrivalCity} (${flight.arrivalAirport})` },
                        { label: "Arrival Time", value: `${formatDate(flight.arrivalDate)} ${flight.arrivalTime}` },
                        { label: "Cabin", value: flight.cabin || "N/A" },
                        { label: "Seat", value: flight.seat || "N/A" },
                        ...(flight.operatedBy ? [{ label: "Operated By", value: flight.operatedBy }] : []),
                      ]}
                    />
                  </DetailSection>
                ))}
              </CardContent>
            </Card>

            {/* Trip Selection for Flights */}
            <Card>
              <CardHeader>
                <CardTitle>Add to Trip</CardTitle>
                <CardDescription>
                  Select a trip to add these flights as reservations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-select">Select Trip</Label>
                  <Select 
                    value={selectedTripId} 
                    onValueChange={(value) => {
                      setSelectedTripId(value);
                      if (extractionType === 'flight') {
                        previewClustering(value);
                      } else if (extractionType === 'hotel') {
                        previewHotelMatching(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trip..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingTrips ? (
                        <SelectItem value="loading" disabled>Loading trips...</SelectItem>
                      ) : trips.length === 0 ? (
                        <SelectItem value="none" disabled>No trips found</SelectItem>
                      ) : (
                        trips.map((trip) => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.title} - {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flight Assignment Preview */}
                {extractionType === 'flight' && selectedTripId && (
                  <div className="space-y-4 mt-6">
                    {loadingClusters ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : clusterPreview ? (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Flight Assignment Preview</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Each of your {clusterPreview.summary.totalFlights} flight(s) will be added as a separate reservation
                          </p>
                        </div>

                        {clusterPreview.clusters.map((cluster, idx) => (
                          <Card key={idx} className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                Flight {idx + 1}: {cluster.flights[0].flightNumber}
                              </CardTitle>
                              <CardDescription>
                                {cluster.startLocation} → {cluster.endLocation}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Flight details */}
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <Badge variant="outline" className="mr-2">{cluster.flights[0].flightNumber}</Badge>
                                  {cluster.flights[0].departureAirport} → {cluster.flights[0].arrivalAirport}
                                </div>
                              </div>

                              {/* Segment matching */}
                              {cluster.matchedSegment ? (
                                <Alert>
                                  <CheckCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    ✓ Will be added to segment: <strong>{cluster.matchedSegment.name}</strong> (confidence: {Math.round(cluster.matchedSegment.score * 100)}%)
                                  </AlertDescription>
                                </Alert>
                              ) : cluster.suggestedSegment ? (
                                <Alert>
                                  <AlertDescription>
                                    ⭐ Will create new segment: <strong>{cluster.suggestedSegment.name}</strong>
                                    <br />
                                    <span className="text-xs text-muted-foreground">
                                      {cluster.suggestedSegment.startLocation} → {cluster.suggestedSegment.endLocation}
                                    </span>
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <Alert variant="destructive">
                                  <AlertDescription>
                                    ⚠️ No matching segment found - manual assignment needed
                                  </AlertDescription>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        ))}

                        {/* Summary */}
                        <Alert>
                          <AlertDescription>
                            <strong>Summary:</strong> {clusterPreview.summary.matchedClusters} flight(s) will be added to existing segments
                            {clusterPreview.summary.suggestedClusters > 0 && `, ${clusterPreview.summary.suggestedClusters} will create new segments`}
                          </AlertDescription>
                        </Alert>
                      </>
                    ) : null}
                  </div>
                )}

                <Button
                  onClick={handleAddToTrip}
                  disabled={
                    addingToTrip || 
                    !selectedTripId || 
                    (extractionType === 'flight' && !clusterPreview)
                  }
                  className="w-full"
                >
                  {addingToTrip ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Trip...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {extractionType === 'flight' 
                        ? `Add ${clusterPreview?.summary.totalFlights || 0} Flight(s) to Trip`
                        : 'Add Hotel to Trip'
                      }
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Hotel Display */}
        {extractedData && extractionType === 'hotel' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Extracted Hotel Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Summary */}
                <DetailSection title="Booking Summary">
                  <InfoGrid
                    items={[
                      { label: "Confirmation Number", value: extractedData.confirmationNumber || "N/A" },
                      { label: "Guest Name", value: extractedData.guestName || "N/A" },
                      { label: "Purchase Date", value: formatDate(extractedData.bookingDate) },
                      { label: "Total Cost", value: formatPrice(extractedData.totalCost, extractedData.currency) },
                    ]}
                  />
                </DetailSection>

                {/* Hotel Details */}
                <DetailSection title={extractedData.hotelName || "Hotel"}>
                  <InfoGrid
                    items={[
                      { label: "Hotel Name", value: extractedData.hotelName || "N/A" },
                      { label: "Location", value: extractedData.address || "N/A" },
                      { label: "Check-in", value: `${formatDate(extractedData.checkInDate)} ${extractedData.checkInTime || ''}` },
                      { label: "Check-out", value: `${formatDate(extractedData.checkOutDate)} ${extractedData.checkOutTime || ''}` },
                      { label: "Room Type", value: extractedData.roomType || "N/A" },
                      { label: "Rooms", value: extractedData.numberOfRooms?.toString() || "1" },
                      { label: "Guests", value: extractedData.numberOfGuests?.toString() || "N/A" },
                    ]}
                  />
                </DetailSection>
              </CardContent>
            </Card>

            {/* Trip Selection for Hotels */}
            <Card>
              <CardHeader>
                <CardTitle>Add to Trip</CardTitle>
                <CardDescription>
                  Select a trip to add this hotel reservation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-select">Select Trip</Label>
                  <Select 
                    value={selectedTripId} 
                    onValueChange={(value) => {
                      setSelectedTripId(value);
                      previewHotelMatching(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trip..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingTrips ? (
                        <SelectItem value="loading" disabled>Loading trips...</SelectItem>
                      ) : trips.length === 0 ? (
                        <SelectItem value="none" disabled>No trips found</SelectItem>
                      ) : (
                        trips.map((trip) => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.title} - {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hotel Assignment Preview */}
                {selectedTripId && (
                  <div className="space-y-4 mt-6">
                    {loadingHotelPreview ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : hotelPreview ? (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Hotel Assignment Preview</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your hotel will be automatically assigned to the best matching segment
                          </p>
                        </div>

                        <Card className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {hotelPreview.hotel.hotelName}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(hotelPreview.hotel.checkInDate)} → {formatDate(hotelPreview.hotel.checkOutDate)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Segment matching */}
                            {hotelPreview.matchedSegment ? (
                              <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                  ✓ Will be added to segment: <strong>{hotelPreview.matchedSegment.name}</strong> (confidence: {Math.round(hotelPreview.matchedSegment.score)}%)
                                  <br />
                                  <span className="text-xs text-muted-foreground mt-1 block">
                                    You can change this later if needed
                                  </span>
                                </AlertDescription>
                              </Alert>
                            ) : hotelPreview.willCreateSegment ? (
                              <>
                                <Alert>
                                  <AlertDescription>
                                    ⭐ Will create new segment: <strong>{hotelPreview.suggestedSegmentName}</strong>
                                    <br />
                                    <span className="text-xs text-muted-foreground mt-1 block">
                                      No existing segment matches this hotel stay
                                    </span>
                                  </AlertDescription>
                                </Alert>
                                
                                {/* Manual segment selection */}
                                <div className="space-y-2">
                                  <Label htmlFor="manual-segment-hotel" className="text-sm">
                                    Or choose an existing segment:
                                  </Label>
                                  <Select
                                    value={selectedSegmentId}
                                    onValueChange={(value) => setSelectedSegmentId(value)}
                                  >
                                    <SelectTrigger id="manual-segment-hotel">
                                      <SelectValue placeholder="Select a segment (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {trips.find(t => t.id === selectedTripId)?.segments.map((segment) => (
                                        <SelectItem key={segment.id} value={segment.id}>
                                          {segment.name} ({formatDate(segment.startTime || '')} - {formatDate(segment.endTime || '')})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground">
                                    Leave empty to create the suggested new segment
                                  </p>
                                </div>
                              </>
                            ) : (
                              <Alert variant="destructive">
                                <AlertDescription>
                                  ⚠️ No matching segment found - manual assignment needed
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    ) : null}
                  </div>
                )}

                <Button
                  onClick={handleAddToTrip}
                  disabled={
                    addingToTrip || 
                    !selectedTripId || 
                    (extractionType === 'hotel' && !hotelPreview)
                  }
                  className="w-full"
                >
                  {addingToTrip ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Trip...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Add Hotel to Trip
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Car Rental Display */}
        {extractedData && extractionType === 'car-rental' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Car Rental Booking Details
                </CardTitle>
                <CardDescription>
                  Extracted from confirmation email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DetailSection title="Rental Information" defaultOpen>
                  <InfoGrid
                    items={[
                      { label: "Company", value: extractedData.company },
                      { label: "Confirmation", value: extractedData.confirmationNumber },
                      { label: "Guest Name", value: extractedData.guestName },
                      { label: "Vehicle Class", value: extractedData.vehicleClass || "Not specified" },
                      { label: "Vehicle Model", value: extractedData.vehicleModel || "Not specified" },
                    ]}
                  />
                </DetailSection>

                <DetailSection title="Pickup Details">
                  <InfoGrid
                    items={[
                      { label: "Location", value: extractedData.pickupLocation },
                      { label: "Address", value: extractedData.pickupAddress || "Not provided" },
                      { label: "Date", value: formatDate(extractedData.pickupDate) },
                      { label: "Time", value: extractedData.pickupTime || "Not specified" },
                      { label: "Flight", value: extractedData.pickupFlightNumber || "N/A" },
                    ]}
                  />
                </DetailSection>

                <DetailSection title="Return Details">
                  <InfoGrid
                    items={[
                      { label: "Location", value: extractedData.returnLocation },
                      { label: "Address", value: extractedData.returnAddress || "Not provided" },
                      { label: "Date", value: formatDate(extractedData.returnDate) },
                      { label: "Time", value: extractedData.returnTime || "Not specified" },
                    ]}
                  />
                </DetailSection>

                {extractedData.options && extractedData.options.length > 0 && (
                  <DetailSection title="Options & Accessories">
                    <div className="flex flex-wrap gap-2">
                      {extractedData.options.map((option: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{option}</Badge>
                      ))}
                    </div>
                  </DetailSection>
                )}

                <DetailSection title="Cost">
                  <InfoGrid
                    items={[
                      { 
                        label: "Total Cost", 
                        value: extractedData.totalCost > 0 
                          ? formatPrice(extractedData.totalCost, extractedData.currency) 
                          : "Not provided" 
                      },
                      { 
                        label: "One-way Charge", 
                        value: extractedData.oneWayCharge > 0 
                          ? formatPrice(extractedData.oneWayCharge, extractedData.currency) 
                          : "N/A (Round-trip)" 
                      },
                    ]}
                  />
                </DetailSection>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add to Trip</CardTitle>
                <CardDescription>
                  Choose a trip to add this car rental to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trip-select-car">Select Trip</Label>
                  <Select
                    value={selectedTripId}
                    onValueChange={(value) => {
                      setSelectedTripId(value);
                      setAddSuccess(false);
                      previewCarRentalMatching(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trip..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.title} ({formatDate(trip.startDate)} - {formatDate(trip.endDate)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTripId && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    {loadingCarRentalPreview ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : carRentalPreview ? (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Car Rental Assignment Preview</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your car rental will be automatically assigned to the best matching segment
                          </p>
                        </div>

                        <Card className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {carRentalPreview.carRental.company} - {carRentalPreview.carRental.vehicleClass || 'Car Rental'}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(carRentalPreview.carRental.pickupDate)} → {formatDate(carRentalPreview.carRental.returnDate)}
                              {carRentalPreview.isOneWay && <Badge variant="outline" className="ml-2">One-way</Badge>}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Segment matching */}
                            {carRentalPreview.matchedSegment ? (
                              <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                  ✓ Will be added to segment: <strong>{carRentalPreview.matchedSegment.name}</strong> (confidence: {Math.round(carRentalPreview.matchedSegment.score)}%)
                                  <br />
                                  <span className="text-xs text-muted-foreground mt-1 block">
                                    You can change this later if needed
                                  </span>
                                </AlertDescription>
                              </Alert>
                            ) : carRentalPreview.willCreateSegment ? (
                              <>
                                <Alert>
                                  <AlertDescription>
                                    ⭐ Will create new segment: <strong>{carRentalPreview.suggestedSegmentName}</strong>
                                    <br />
                                    <span className="text-xs text-muted-foreground mt-1 block">
                                      No existing segment matches this car rental
                                    </span>
                                  </AlertDescription>
                                </Alert>
                                
                                {/* Manual segment selection */}
                                <div className="space-y-2">
                                  <Label htmlFor="manual-segment-car" className="text-sm">
                                    Or choose an existing segment:
                                  </Label>
                                  <Select
                                    value={selectedSegmentId}
                                    onValueChange={(value) => setSelectedSegmentId(value)}
                                  >
                                    <SelectTrigger id="manual-segment-car">
                                      <SelectValue placeholder="Select a segment (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {trips.find(t => t.id === selectedTripId)?.segments.map((segment) => (
                                        <SelectItem key={segment.id} value={segment.id}>
                                          {segment.name} ({formatDate(segment.startTime || '')} - {formatDate(segment.endTime || '')})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground">
                                    Leave empty to create the suggested new segment
                                  </p>
                                </div>
                              </>
                            ) : null}
                          </CardContent>
                        </Card>
                      </>
                    ) : null}
                  </div>
                )}

                <Button
                  onClick={handleAddToTrip}
                  disabled={
                    addingToTrip || 
                    !selectedTripId || 
                    (extractionType === 'car-rental' && !carRentalPreview)
                  }
                  className="w-full"
                >
                  {addingToTrip ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Trip...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Add Car Rental to Trip
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ApiTestLayout>
  );
}
