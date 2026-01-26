"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Plane, CheckCircle, Mail, Hotel } from "lucide-react";
import { ApiTestLayout } from "../apis/_components/api-test-layout";
import { DetailSection } from "../apis/_components/detail-section";
import { InfoGrid } from "../apis/_components/info-grid";
import { formatDate, formatPrice } from "@/lib/format-helpers";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseEMLFile } from "@/lib/utils/eml-parser";
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
  const [isDragging, setIsDragging] = useState(false);
  const [clusterPreview, setClusterPreview] = useState<ClusterPreview | null>(null);
  const [loadingClusters, setLoadingClusters] = useState(false);

  // Fetch user trips on mount
  useEffect(() => {
    fetchTrips();
  }, []);

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

  // Suggest segments based on flight dates
  const getSuggestedSegments = (): Segment[] => {
    if (!selectedTrip || !extractedData?.flights?.length) return [];
    
    const flightDates = extractedData.flights.map((f: any) => ({
      departure: new Date(f.departureDate),
      arrival: new Date(f.arrivalDate),
    }));

    const earliestDate = new Date(Math.min(...flightDates.map(d => d.departure.getTime())));
    const latestDate = new Date(Math.max(...flightDates.map(d => d.arrival.getTime())));

    return selectedTrip.segments.filter(segment => {
      if (!segment.startTime || !segment.endTime) return false;
      
      const segmentStart = new Date(segment.startTime);
      const segmentEnd = new Date(segment.endTime);
      
      // Check if segment overlaps with flight dates
      return (
        (segmentStart <= latestDate && segmentEnd >= earliestDate) ||
        (earliestDate <= segmentEnd && latestDate >= segmentStart)
      );
    });
  };

  const suggestedSegments = getSuggestedSegments();

  // Auto-select first suggested segment
  useEffect(() => {
    if (suggestedSegments.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(suggestedSegments[0].id);
    } else if (selectedTrip && selectedTrip.segments.length > 0 && !selectedSegmentId) {
      // Fallback to first segment if no suggestions
      setSelectedSegmentId(selectedTrip.segments[0].id);
    }
  }, [selectedTripId, extractedData, suggestedSegments.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await parseEMLFile(file);
      setEmailText(text);
      setError(null);
    } catch (err) {
      setError("Failed to parse .eml file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    try {
      // Check for files first
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        
        // Handle .eml files
        if (file.name.endsWith('.eml') || file.type === 'message/rfc822') {
          const text = await parseEMLFile(file);
          setEmailText(text);
          return;
        }
        
        // Handle text files
        if (file.type === 'text/plain') {
          const text = await file.text();
          setEmailText(text);
          return;
        }
      }

      // Check for text/html (dragged email content from some clients)
      const html = e.dataTransfer.getData('text/html');
      if (html) {
        // Strip HTML tags to get plain text
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        if (text.trim()) {
          setEmailText(text);
          return;
        }
      }

      // Check for plain text
      const text = e.dataTransfer.getData('text/plain');
      if (text && text.trim()) {
        setEmailText(text);
        return;
      }

      // If we got here, we couldn't extract any text
      setError("Could not extract text from the dropped content. Try saving the email as a .eml file first.");
    } catch (err: any) {
      console.error('Drop error:', err);
      setError(err.message || "Failed to process dropped content");
    }
  };

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setExtractedData(null);
    setExtractionType(null);

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
      console.error('Error previewing clusters:', err);
      setError('Failed to analyze flight grouping');
    } finally {
      setLoadingClusters(false);
    }
  };

  const handleAddToTrip = async () => {
    if (!selectedTripId || !extractedData || !extractionType) return;

    setAddingToTrip(true);
    setError(null);
    setAddSuccess(false);

    try {
      let result;
      if (extractionType === 'flight') {
        // Use intelligent clustering for flights
        result = await addFlightsToTrip(selectedTripId, null, extractedData, {
          autoCluster: true,
          maxGapHours: 48,
          createSuggestedSegments: true,
        });
      } else {
        // Hotels use the segment selector
        if (!selectedSegmentId) {
          throw new Error("Please select a segment");
        }
        result = await addHotelsToTrip(selectedTripId, selectedSegmentId, extractedData);
      }
      
      if (result.success) {
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 5000);
      }
    } catch (err: any) {
      setError(err.message || `Failed to add ${extractionType} to trip`);
    } finally {
      setAddingToTrip(false);
    }
  };

  return (
    <ApiTestLayout
      title="Email Flight Extraction"
      description="Upload .eml files or paste email text to extract flight booking data"
    >
      <div className="space-y-4">
        
        {/* Upload/Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input Email Data</CardTitle>
            <CardDescription>
              Drag an email from your email client, upload a .eml file, or paste email text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className={`
                  p-3 rounded-full transition-colors
                  ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-muted'}
                `}>
                  <Mail className={`h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragging ? 'Drop your email here' : 'Drag & Drop Email'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag an email from your email client (Gmail, Outlook, Apple Mail, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="eml-upload">Upload .eml File</Label>
              <Input
                id="eml-upload"
                type="file"
                accept=".eml,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="email-text">Paste Email Text</Label>
              <Textarea
                id="email-text"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                rows={10}
                placeholder="Paste your flight confirmation email here..."
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleExtract}
              disabled={loading || !emailText}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Extract Flight Data
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {addSuccess && extractionType && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {extractionType === 'flight' 
                ? `Successfully added flights to trip! Flights were automatically grouped and matched to appropriate segments.`
                : 'Successfully added hotel reservation to trip!'}
            </AlertDescription>
          </Alert>
        )}

        {/* Extracted Data Display */}
        {extractedData && extractionType && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {extractionType === 'flight' ? (
                  <><Plane className="h-5 w-5 text-blue-600" />Extracted Flight Data</>
                ) : (
                  <><Hotel className="h-5 w-5 text-purple-600" />Extracted Hotel Data</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Flight Display */}
              {extractionType === 'flight' && (
                <>
                  {/* Booking Summary */}
                  <DetailSection title="Booking Summary" defaultOpen>
                    <InfoGrid
                      columns={2}
                      items={[
                        { label: "Confirmation Number", value: extractedData.confirmationNumber },
                        { label: "Passenger", value: extractedData.passengerName },
                        { label: "E-Ticket", value: extractedData.eTicketNumber && extractedData.eTicketNumber !== "" ? extractedData.eTicketNumber : "N/A" },
                        { label: "Purchase Date", value: extractedData.purchaseDate && extractedData.purchaseDate !== "" ? formatDate(extractedData.purchaseDate) : "N/A" },
                        { label: "Total Cost", value: extractedData.totalCost && extractedData.totalCost !== 0 ? formatPrice(extractedData.totalCost, extractedData.currency) : "N/A" },
                        { label: "Flights", value: `${extractedData.flights.length} segment(s)` },
                      ]}
                    />
                  </DetailSection>

                  {/* Flight Segments */}
                  {extractedData.flights.map((flight: any, idx: number) => (
                    <DetailSection
                      key={idx}
                      title={`Flight ${idx + 1}: ${flight.flightNumber}`}
                      icon={<Plane className="h-4 w-4" />}
                    >
                      <InfoGrid
                        columns={2}
                        items={[
                          { label: "Carrier", value: `${flight.carrier} (${flight.carrierCode})` },
                          { label: "Flight Number", value: flight.flightNumber },
                          { label: "Departure", value: `${flight.departureCity} (${flight.departureAirport})`, fullWidth: true },
                          { label: "Departure Time", value: `${formatDate(flight.departureDate)} ${flight.departureTime}` },
                          { label: "Arrival", value: `${flight.arrivalCity} (${flight.arrivalAirport})`, fullWidth: true },
                          { label: "Arrival Time", value: `${formatDate(flight.arrivalDate)} ${flight.arrivalTime}` },
                          ...(flight.cabin && flight.cabin !== "" ? [{ label: "Cabin", value: flight.cabin }] : []),
                          ...(flight.seatNumber && flight.seatNumber !== "" ? [{ label: "Seat", value: flight.seatNumber }] : []),
                          ...(flight.operatedBy && flight.operatedBy !== "" ? [{ label: "Operated By", value: flight.operatedBy, fullWidth: true }] : []),
                        ]}
                      />
                    </DetailSection>
                  ))}
                </>
              )}

              {/* Hotel Display */}
              {extractionType === 'hotel' && (
                <>
                  {/* Hotel Details */}
                  <DetailSection title="Hotel Details" defaultOpen>
                    <InfoGrid
                      columns={2}
                      items={[
                        { label: "Confirmation Number", value: extractedData.confirmationNumber },
                        { label: "Guest Name", value: extractedData.guestName },
                        { label: "Hotel Name", value: extractedData.hotelName, fullWidth: true },
                        { label: "Address", value: extractedData.address && extractedData.address !== "" ? extractedData.address : "N/A", fullWidth: true },
                      ]}
                    />
                  </DetailSection>

                  {/* Stay Information */}
                  <DetailSection title="Stay Information" defaultOpen>
                    <InfoGrid
                      columns={2}
                      items={[
                        { label: "Check-In Date", value: formatDate(extractedData.checkInDate) },
                        { label: "Check-In Time", value: extractedData.checkInTime && extractedData.checkInTime !== "" ? extractedData.checkInTime : "N/A" },
                        { label: "Check-Out Date", value: formatDate(extractedData.checkOutDate) },
                        { label: "Check-Out Time", value: extractedData.checkOutTime && extractedData.checkOutTime !== "" ? extractedData.checkOutTime : "N/A" },
                        { label: "Room Type", value: extractedData.roomType && extractedData.roomType !== "" ? extractedData.roomType : "N/A" },
                        { label: "Number of Rooms", value: extractedData.numberOfRooms || 1 },
                        { label: "Number of Guests", value: extractedData.numberOfGuests || "N/A" },
                        { label: "Total Cost", value: extractedData.totalCost && extractedData.totalCost !== 0 ? formatPrice(extractedData.totalCost, extractedData.currency) : "N/A" },
                        { label: "Booking Date", value: extractedData.bookingDate && extractedData.bookingDate !== "" ? formatDate(extractedData.bookingDate) : "N/A" },
                      ]}
                    />
                  </DetailSection>
                </>
              )}

              {/* Add to Trip Section */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Add to Trip</CardTitle>
                  <CardDescription>
                    Select a trip and segment to add {extractionType === 'flight' ? 'these flights' : 'this hotel'} as {extractionType === 'flight' ? 'reservations' : 'a reservation'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingTrips ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading trips...</span>
                    </div>
                  ) : trips.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No trips found. Create a trip first to add reservations.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
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
                          <SelectTrigger id="trip-select">
                            <SelectValue placeholder="Select a trip..." />
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

                      {/* Segment selector only for hotels - flights use auto-clustering */}
                      {extractionType === 'hotel' && selectedTrip && selectedTrip.segments.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="segment-select">Select Segment</Label>
                          <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                            <SelectTrigger id="segment-select">
                              <SelectValue placeholder="Select a segment..." />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedTrip.segments.map((segment) => {
                                const isSuggested = suggestedSegments.some(s => s.id === segment.id);
                                return (
                                  <SelectItem key={segment.id} value={segment.id}>
                                    {segment.name} - {segment.startTitle} → {segment.endTitle}
                                    {isSuggested && " ⭐ (Suggested)"}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {suggestedSegments.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              ⭐ Suggested segments overlap with your reservation dates
                            </p>
                          )}
                        </div>
                      )}

                      {/* Flight Clustering Preview (only for flights) */}
                      {extractionType === 'flight' && selectedTripId && (
                        <div className="space-y-3 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Flight Grouping Preview</Label>
                            {clusterPreview && (
                              <Badge variant="secondary">
                                {clusterPreview.summary.totalClusters} cluster{clusterPreview.summary.totalClusters !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          
                          {loadingClusters ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Analyzing flights...</span>
                            </div>
                          ) : clusterPreview ? (
                            <div className="space-y-3">
                              {clusterPreview.clusters.map((cluster, idx) => (
                                <Card key={idx} className="border-2">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-sm font-medium">
                                          Cluster {idx + 1}: {cluster.startLocation} → {cluster.endLocation}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                          {cluster.flights.length} flight{cluster.flights.length !== 1 ? 's' : ''}
                                          {' • '}
                                          {formatDate(cluster.startTime.toISOString())} - {formatDate(cluster.endTime.toISOString())}
                                        </CardDescription>
                                      </div>
                                      {cluster.matchedSegment ? (
                                        <Badge variant="default" className="text-xs">
                                          Match: {Math.round(cluster.matchedSegment.score)}%
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          New Segment
                                        </Badge>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    {/* Flight list */}
                                    <div className="text-xs space-y-1">
                                      {cluster.flights.map((flight, fidx) => (
                                        <div key={fidx} className="flex items-center text-muted-foreground">
                                          <Plane className="h-3 w-3 mr-2" />
                                          {flight.carrier} {flight.flightNumber}: {flight.departureAirport} → {flight.arrivalAirport}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Matched or suggested segment */}
                                    <div className="pt-2 border-t">
                                      {cluster.matchedSegment ? (
                                        <div className="text-xs">
                                          <span className="text-muted-foreground">Will be added to:</span>
                                          <span className="ml-1 font-medium">{cluster.matchedSegment.name}</span>
                                        </div>
                                      ) : cluster.suggestedSegment ? (
                                        <div className="text-xs">
                                          <span className="text-muted-foreground">Will create segment:</span>
                                          <span className="ml-1 font-medium">{cluster.suggestedSegment.name}</span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              
                              {/* Summary */}
                              <Alert>
                                <AlertDescription className="text-xs">
                                  {clusterPreview.summary.matchedClusters > 0 && (
                                    <div>{clusterPreview.summary.matchedClusters} cluster(s) will be added to existing segments</div>
                                  )}
                                  {clusterPreview.summary.suggestedClusters > 0 && (
                                    <div>{clusterPreview.summary.suggestedClusters} new segment(s) will be created</div>
                                  )}
                                </AlertDescription>
                              </Alert>
                            </div>
                          ) : (
                            <Alert>
                              <AlertDescription className="text-xs">
                                Select a trip to see how flights will be grouped
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {extractionType === 'hotel' && selectedTrip && selectedTrip.segments.length === 0 && (
                        <Alert>
                          <AlertDescription>
                            This trip has no segments. A default segment will be created.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                  
                  <Button
                    onClick={handleAddToTrip}
                    disabled={
                      addingToTrip || 
                      !selectedTripId || 
                      (extractionType === 'hotel' && !selectedSegmentId) ||
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
              
            </CardContent>
          </Card>
        )}
        
      </div>
    </ApiTestLayout>
  );
}
