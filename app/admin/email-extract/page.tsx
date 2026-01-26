"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plane, CheckCircle, Mail, Hotel } from "lucide-react";
import { ApiTestLayout } from "../apis/_components/api-test-layout";
import { DetailSection } from "../apis/_components/detail-section";
import { InfoGrid } from "../apis/_components/info-grid";
import { formatDate, formatPrice } from "@/lib/format-helpers";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addFlightsToTrip } from "@/lib/actions/add-flights-to-trip";
import { addHotelsToTrip } from "@/lib/actions/add-hotels-to-trip";
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

type ExtractionType = "flight" | "hotel";

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
      // Import clustering functions client-side
      const { clusterFlightsByTime } = await import('@/lib/utils/flight-clustering');
      const { findBestSegmentForCluster } = await import('@/lib/utils/segment-matching');
      const { suggestSegmentForCluster } = await import('@/lib/utils/segment-suggestions');
      
      // Get trip segments
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      
      // Cluster flights
      const clusters = clusterFlightsByTime(extractedData.flights, 48);
      
      // Match/suggest segments for each cluster
      const preview = clusters.map(cluster => {
        const match = findBestSegmentForCluster(cluster, trip.segments);
        const suggestion = !match ? suggestSegmentForCluster(cluster, trip.segments) : null;
        
        return {
          ...cluster,
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
          totalClusters: clusters.length,
          matchedClusters: preview.filter(c => c.matchedSegment).length,
          suggestedClusters: preview.filter(c => c.suggestedSegment).length
        }
      });
    } catch (err) {
      console.error('Clustering preview error:', err);
      setError('Failed to preview flight clustering');
    } finally {
      setLoadingClusters(false);
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
          null, // segmentId - let auto-clustering handle it
          extractedData,
          {
            autoCluster: true,
            maxGapHours: 48,
            createSuggestedSegments: true
          }
        );
      } else if (extractionType === 'hotel' && selectedSegmentId) {
        await addHotelsToTrip({
          tripId: selectedTripId,
          segmentId: selectedSegmentId,
          hotels: extractedData.hotels,
          bookingInfo: {
            confirmationNumber: extractedData.confirmationNumber || '',
            totalCost: extractedData.totalCost || 0,
            currency: extractedData.currency || 'USD',
            purchaseDate: extractedData.purchaseDate || ''
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
      icon={<Mail className="h-6 w-6" />}
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

                {/* Flight Clustering Preview */}
                {extractionType === 'flight' && selectedTripId && (
                  <div className="space-y-4 mt-6">
                    {loadingClusters ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : clusterPreview ? (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Flight Clustering Preview</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your {clusterPreview.summary.totalFlights} flight(s) will be grouped into {clusterPreview.summary.totalClusters} reservation(s)
                          </p>
                        </div>

                        {clusterPreview.clusters.map((cluster, idx) => (
                          <Card key={idx} className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                Cluster {idx + 1}: {cluster.flights.length} flight(s)
                              </CardTitle>
                              <CardDescription>
                                {cluster.startLocation} → {cluster.endLocation}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Flight details */}
                              <div className="space-y-2">
                                {cluster.flights.map((flight: any, fIdx: number) => (
                                  <div key={fIdx} className="text-sm">
                                    <Badge variant="outline" className="mr-2">{flight.flightNumber}</Badge>
                                    {flight.departureAirport} → {flight.arrivalAirport}
                                  </div>
                                ))}
                              </div>

                              {/* Segment matching */}
                              {cluster.matchedSegment ? (
                                <Alert>
                                  <CheckCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    ✓ Matched to segment: <strong>{cluster.matchedSegment.name}</strong> (confidence: {Math.round(cluster.matchedSegment.score * 100)}%)
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
                            <strong>Summary:</strong> {clusterPreview.summary.matchedClusters} will be added to existing segments
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
                      { label: "Purchase Date", value: formatDate(extractedData.purchaseDate) },
                      { label: "Total Cost", value: formatPrice(extractedData.totalCost, extractedData.currency) },
                      { label: "Hotels", value: `${extractedData.hotels?.length || 0} booking(s)` },
                    ]}
                  />
                </DetailSection>

                {/* Hotels */}
                {extractedData.hotels?.map((hotel: any, index: number) => (
                  <DetailSection key={index} title={hotel.name || `Hotel ${index + 1}`}>
                    <InfoGrid
                      items={[
                        { label: "Hotel Name", value: hotel.name || "N/A" },
                        { label: "Location", value: hotel.address || "N/A" },
                        { label: "Check-in", value: `${formatDate(hotel.checkInDate)} ${hotel.checkInTime || ''}` },
                        { label: "Check-out", value: `${formatDate(hotel.checkOutDate)} ${hotel.checkOutTime || ''}` },
                        { label: "Room Type", value: hotel.roomType || "N/A" },
                        { label: "Guests", value: hotel.guests?.toString() || "N/A" },
                        { label: "Nights", value: hotel.nights?.toString() || "N/A" },
                      ]}
                    />
                  </DetailSection>
                ))}
              </CardContent>
            </Card>

            {/* Trip Selection for Hotels */}
            <Card>
              <CardHeader>
                <CardTitle>Add to Trip</CardTitle>
                <CardDescription>
                  Select a trip and segment to add these hotels as reservations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-select">Select Trip</Label>
                  <Select value={selectedTripId} onValueChange={setSelectedTripId}>
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

                {selectedTrip && (
                  <div className="space-y-2">
                    <Label htmlFor="segment-select">Select Segment</Label>
                    <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a segment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTrip.segments.length === 0 ? (
                          <SelectItem value="none" disabled>No segments found</SelectItem>
                        ) : (
                          selectedTrip.segments.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name} - {segment.startTitle} → {segment.endTitle}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleAddToTrip}
                  disabled={
                    addingToTrip || 
                    !selectedTripId || 
                    (extractionType === 'hotel' && !selectedSegmentId)
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
      </div>
    </ApiTestLayout>
  );
}
