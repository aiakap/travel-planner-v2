"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Play,
  RotateCcw,
  Download,
  Plus,
  Table2,
  GitBranch,
  Grid3X3,
  TestTube,
} from "lucide-react";
import { PipelineResponse, MessageSegment } from "@/lib/types/amadeus-pipeline";
import { AmadeusSegmentsRenderer } from "@/components/amadeus-segments-renderer";
import { TripSelector } from "@/components/trip-selector";
import { ActivitySidePanel } from "@/components/activity-side-panel";
import { trackSearch } from "@/lib/anonymous-tracking";
import { ItineraryEmptyState } from "@/components/itinerary-empty-state";
import { TimelineView } from "@/components/timeline-view";
import { TableView } from "@/components/table-view";
import { PhotosView } from "@/components/photos-view";
import { ReservationDetailModal } from "@/components/reservation-detail-modal";
import { transformTripToV0Format } from "@/lib/v0-data-transform";
import type { V0Itinerary } from "@/lib/v0-types";
import { Toast } from "@/components/ui/toast";
import Link from "next/link";

type StageStatus = "idle" | "running" | "success" | "error";
type ViewMode = "table" | "timeline" | "photos";

interface StageState {
  status: StageStatus;
  data?: any;
  timing?: number;
  error?: string;
}

interface PlacePipelineClientProps {
  user: { id: string; name: string; email: string; image?: string } | null;
  trips: any[]; // Full trip objects with segments and reservations
  profileData: {
    profile: any | null;
    contacts: any[];
    hobbies: any[];
    travelPreferences: any[];
    relationships: any[];
  } | null;
}

export function PlacePipelineClient({ user, trips: initialTrips, profileData }: PlacePipelineClientProps) {
  // Convert trips to state so we can update them
  const [trips, setTrips] = useState(initialTrips);
  const [input, setInput] = useState("Book a roundtrip flight from JFK to LAX on March 15-20");
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
  const [stage1, setStage1] = useState<StageState>({ status: "idle" });
  const [stage2, setStage2] = useState<StageState>({ status: "idle" });
  const [stage3, setStage3] = useState<StageState>({ status: "idle" });
  const [stage4, setStage4] = useState<StageState>({ status: "idle" });
  
  const [stage1Open, setStage1Open] = useState(true);
  const [stage2Open, setStage2Open] = useState(false);
  const [stage3Open, setStage3Open] = useState(false);
  const [stage4Open, setStage4Open] = useState(false);
  
  // Itinerary display state (copied from experience builder)
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Refetch single trip after adding reservation
  const refetchTrip = async (tripId: string) => {
    if (!user?.id) return null;
    
    try {
      const response = await fetch(`/api/trip/${tripId}`);
      if (response.ok) {
        const updatedTrip = await response.json();
        
        // Update trips array with new data
        setTrips(prevTrips => 
          prevTrips.map(t => t.id === tripId ? updatedTrip : t)
        );
        
        return updatedTrip;
      }
    } catch (error) {
      console.error("Error refetching trip:", error);
    }
    
    return null;
  };

  // Get selected trip and transform to V0 format (copied from experience builder lines 725-731)
  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const transformedTrip: V0Itinerary | null = selectedTrip
    ? transformTripToV0Format(selectedTrip as any)
    : null;

  // Calculate trip totals (copied from experience builder lines 733-752)
  const getTripTotals = () => {
    if (!transformedTrip) return { total: 0 };
    
    let total = 0;
    
    transformedTrip.segments.forEach((segment) => {
      segment.days.forEach((day) => {
        day.items.forEach((item) => {
          item.reservations.forEach((res) => {
            total += res.cost;
          });
        });
      });
    });
    
    return { total };
  };

  const tripTotals = getTripTotals();

  // Event handlers (copied from experience builder lines 754-771)
  const handleChatAboutItem = (reservation: any, itemTitle: string) => {
    const prompt = `Tell me more about ${reservation.vendor} (${itemTitle}). Here are the details: ${reservation.text || 'No additional details'}`;
    console.log("Chat prompt:", prompt); // For test page, just log
  };

  const handleEditItem = (reservation: any) => {
    setSelectedReservation({
      reservation,
      itemTitle: reservation.vendor,
      itemTime: reservation.startTime || '',
      itemType: 'reservation',
      dayDate: '',
    });
  };

  const runPipeline = async () => {
    if (!input.trim()) return;

    // Track search for anonymous users
    if (!user) {
      trackSearch(input);
    }

    setIsRunning(true);
    setStage1({ status: "idle" });
    setStage2({ status: "idle" });
    setStage3({ status: "idle" });
    setStage4({ status: "idle" });
    setStage1Open(true);
    setStage2Open(false);
    setStage3Open(false);
    setStage4Open(false);

    try {
      // Run the complete 4-stage pipeline
      setStage1({ status: "running" });
      
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const result: PipelineResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Pipeline failed");
      }

      // Update all 4 stages
      if (result.data?.stage1) {
        setStage1({
          status: "success",
          data: result.data.stage1,
          timing: result.data.stage1.timing,
        });
        setStage1Open(false);
        setStage2Open(true);
      }

      if (result.data?.stage2) {
        setStage2({
          status: "success",
          data: result.data.stage2,
          timing: result.data.stage2.timing,
        });
        setStage2Open(false);
        setStage3Open(true);
      }

      if (result.data?.stage3) {
        setStage3({
          status: "success",
          data: result.data.stage3,
          timing: result.data.stage3.timing,
        });
        setStage3Open(false);
        setStage4Open(true);
      }

      if (result.data?.stage4) {
        setStage4({
          status: "success",
          data: result.data.stage4,
          timing: result.data.stage4.timing,
        });
      }
    } catch (error) {
      console.error("Pipeline error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      
      // Set error on the last running stage
      if (stage3.status === "running") {
        setStage3({ status: "error", error: errorMsg });
      } else if (stage2.status === "running") {
        setStage2({ status: "error", error: errorMsg });
      } else {
        setStage1({ status: "error", error: errorMsg });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setStage1({ status: "idle" });
    setStage2({ status: "idle" });
    setStage3({ status: "idle" });
    setStage1Open(true);
    setStage2Open(false);
    setStage3Open(false);
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const exportResult = () => {
    const result = {
      input,
      stage1: stage1.data,
      stage2: stage2.data,
      stage3: stage3.data,
    };
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case "running":
        return <Badge variant="outline" className="bg-blue-50"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case "success":
        return <Badge variant="outline" className="bg-green-50"><CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />Complete</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50"><XCircle className="h-3 w-3 mr-1 text-red-600" />Error</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50">Waiting</Badge>;
    }
  };

  const renderSegments = (segments: MessageSegment[]) => {
    return (
      <AmadeusSegmentsRenderer 
        segments={segments} 
        tripId={selectedTripId || undefined}
        onReservationAdded={async () => {
          if (!selectedTripId) return;
          
          // Refetch trip data seamlessly
          const updatedTrip = await refetchTrip(selectedTripId);
          
          // Show success toast
          if (updatedTrip) {
            setToastMessage(`Added to ${updatedTrip.title}`);
            setShowToast(true);
          }
        }}
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Place Suggestion Pipeline Tester
            </h1>
            <p className="text-slate-600">
              Test the 3-stage pipeline: AI Generation → Google Places → HTML Assembly
            </p>
            <div className="pt-2">
              <Link href="/test/place-pipeline/amadeus-test">
                <Button variant="outline" size="sm" className="gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Amadeus APIs Directly
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile and Trip Suggestions moved to /test/profile-suggestions */}

          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Input Query</CardTitle>
              <CardDescription>Enter a request that mentions specific places</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trip Selector (Logged-in users only) */}
              {user && trips.length > 0 && (
                <div className="pb-4 border-b">
                  <TripSelector
                    trips={trips}
                    selectedTripId={selectedTripId}
                    onTripSelect={setSelectedTripId}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {selectedTripId 
                      ? "Selected trip will be used for 'Add to Itinerary' button"
                      : "Select 'New Trip' to create a trip when adding places"}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., suggest 2 hotels in Paris"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && !isRunning && runPipeline()}
                />
                <Button onClick={runPipeline} disabled={isRunning || !input.trim()}>
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Pipeline
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Sample Queries */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-500">Try:</span>
                {[
                  "Book a roundtrip flight from JFK to LAX on March 15-20",
                  "Find hotels in Paris for 3 nights starting April 10",
                  "Suggest restaurants and activities in Tokyo",
                  "Plan a weekend: flights from NYC to Miami + hotel + dinner spots",
                ].map((sample) => (
                  <Button
                    key={sample}
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput(sample)}
                    className="text-xs"
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stage 1: AI Generation */}
          <Collapsible open={stage1Open} onOpenChange={setStage1Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage1Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 1: Content Generation</CardTitle>
                        <CardDescription>AI creates natural language with lookup requirements</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage1.timing && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stage1.timing}ms
                        </span>
                      )}
                      {getStatusBadge(stage1.status)}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {stage1.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {stage1.error}
                    </div>
                  )}
                  
                  {stage1.data && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Natural Language Section</h4>
                        </div>
                        <div className="p-3 bg-slate-50 rounded border text-sm whitespace-pre-wrap">
                          {stage1.data.naturalLanguageSection}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Lookup Requirements</h4>
                        </div>
                        <div className="p-3 bg-slate-50 rounded border text-xs font-mono whitespace-pre-wrap">
                          {stage1.data.lookupRequirements}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Stage 2: XML Extraction */}
          <Collapsible open={stage2Open} onOpenChange={setStage2Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage2Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 2: XML Extraction</CardTitle>
                        <CardDescription>AI marks up text with context attributes and extracts entities</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage2.timing && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stage2.timing}ms total
                        </span>
                      )}
                      {getStatusBadge(stage2.status)}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {stage2.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {stage2.error}
                    </div>
                  )}
                  
                  {stage2.data && (
                    <>
                      {/* XML Marked Text */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">XML-Marked Text</h4>
                        </div>
                        <div className="p-3 bg-slate-50 rounded border text-xs font-mono whitespace-pre-wrap overflow-auto max-h-60">
                          {stage2.data.markedText}
                        </div>
                      </div>

                      {/* Entity Lists */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Places ({stage2.data.places?.length || 0})
                          </h4>
                          <div className="space-y-1">
                            {stage2.data.places?.map((place: any, idx: number) => (
                              <div key={idx} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <div className="font-semibold">{place.name}</div>
                                <div className="text-slate-600 text-xs">{place.context}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Transport ({stage2.data.transport?.length || 0})
                          </h4>
                          <div className="space-y-1">
                            {stage2.data.transport?.map((item: any, idx: number) => (
                              <div key={idx} className="p-2 bg-indigo-50 border border-indigo-200 rounded text-xs">
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-slate-600 text-xs">
                                  {item.origin} → {item.destination}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Hotels ({stage2.data.hotels?.length || 0})
                          </h4>
                          <div className="space-y-1">
                            {stage2.data.hotels?.map((hotel: any, idx: number) => (
                              <div key={idx} className="p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                                <div className="font-semibold">{hotel.name}</div>
                                <div className="text-slate-600 text-xs">{hotel.context}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Stage 3: API Lookups */}
          <Collapsible open={stage3Open} onOpenChange={setStage3Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage3Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 3: API Lookups</CardTitle>
                        <CardDescription>Parallel lookups: Google Places • Flights • Hotels</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage3.timing && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stage3.timing}ms total
                        </span>
                      )}
                      {getStatusBadge(stage3.status)}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {stage3.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {stage3.error}
                    </div>
                  )}
                  
                  {stage3.data && (
                    <>
                      {/* Stage 3A: Google Places */}
                      <div className="pl-4 border-l-2 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">↳ Stage 3A: Google Places Lookup</h4>
                          {stage3.data.subStages?.stage3A && (
                            <span className="text-xs text-slate-500">
                              {stage3.data.subStages.stage3A.timing}ms • {stage3.data.subStages.stage3A.count} results
                            </span>
                          )}
                        </div>
                        {Object.keys(stage3.data.placeMap || {}).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(stage3.data.placeMap).map(([name, data]: [string, any]) => (
                              <div
                                key={name}
                                className={`p-2 rounded border text-xs ${
                                  data.notFound ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                                }`}
                              >
                                <div className="font-semibold">{name}</div>
                                {!data.notFound && (
                                  <div className="text-slate-600 mt-1">
                                    {data.name} • {data.formattedAddress}
                                    {data.rating && ` • ${data.rating}⭐`}
                                  </div>
                                )}
                                {data.notFound && (
                                  <div className="text-red-600 mt-1">Not found</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No places to lookup</div>
                        )}
                      </div>

                      {/* Stage 3B: Transport */}
                      <div className="pl-4 border-l-2 border-indigo-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">↳ Stage 3B: Transport Availability Lookup</h4>
                          {stage3.data.subStages?.stage3B && (
                            <span className="text-xs text-slate-500">
                              {stage3.data.subStages.stage3B.timing}ms • {stage3.data.subStages.stage3B.count} results
                            </span>
                          )}
                        </div>
                        {Object.keys(stage3.data.transportMap || {}).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(stage3.data.transportMap).map(([name, data]: [string, any]) => (
                              <div
                                key={name}
                                className={`p-2 rounded border text-xs ${
                                  data.notFound ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-200"
                                }`}
                              >
                                <div className="font-semibold">{name}</div>
                                {!data.notFound && (
                                  <div className="text-slate-600 mt-1">
                                    ${parseFloat(data.price.total).toFixed(0)} {data.price.currency} • {data.itineraries.length} itinerary
                                  </div>
                                )}
                                {data.notFound && (
                                  <div className="text-red-600 mt-1">No flights found</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No flights to lookup</div>
                        )}
                      </div>

                      {/* Stage 3C: Hotels */}
                      <div className="pl-4 border-l-2 border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">↳ Stage 3C: Hotel Availability Lookup</h4>
                          {stage3.data.subStages?.stage3C && (
                            <span className="text-xs text-slate-500">
                              {stage3.data.subStages.stage3C.timing}ms • {stage3.data.subStages.stage3C.count} results
                            </span>
                          )}
                        </div>
                        {Object.keys(stage3.data.hotelMap || {}).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(stage3.data.hotelMap).map(([name, data]: [string, any]) => (
                              <div
                                key={name}
                                className={`p-2 rounded border text-xs ${
                                  data.notFound || !data.available ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"
                                }`}
                              >
                                <div className="font-semibold">{name}</div>
                                {!data.notFound && data.available && (
                                  <div className="text-slate-600 mt-1">
                                    {data.name} • ${parseFloat(data.price.total).toFixed(0)} {data.price.currency}
                                    {data.rating && ` • ${data.rating}⭐`}
                                  </div>
                                )}
                                {(data.notFound || !data.available) && (
                                  <div className="text-red-600 mt-1">No availability</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No hotels to lookup</div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Stage 4: HTML Assembly */}
          <Collapsible open={stage4Open} onOpenChange={setStage4Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage4Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 4: HTML Assembly</CardTitle>
                        <CardDescription>Parse XML tags and create interactive segments with hover cards</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage4.timing && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stage4.timing}ms
                        </span>
                      )}
                      {getStatusBadge(stage4.status)}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {stage4.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {stage4.error}
                    </div>
                  )}
                  
                  {stage4.data && (
                    <>
                      {/* Rendered Preview */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Rendered Preview</h4>
                        <div className="p-4 bg-white rounded border">
                          {renderSegments(stage4.data.segments)}
                        </div>
                      </div>

                      {/* Segments Summary */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                        {stage4.data.segments.length} segments created •{" "}
                        {stage4.data.segments.filter((s: MessageSegment) => s.type === "place").length} places •{" "}
                        {stage4.data.segments.filter((s: MessageSegment) => s.type === "transport" || s.type === "flight").length} transport •{" "}
                        {stage4.data.segments.filter((s: MessageSegment) => s.type === "hotel").length} hotels
                      </div>

                      {/* Raw Segments */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Segments Array</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(stage4.data)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy JSON
                          </Button>
                        </div>
                        <div className="p-3 bg-slate-50 rounded border text-xs font-mono overflow-auto max-h-60">
                          <pre>{JSON.stringify(stage4.data.segments, null, 2)}</pre>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Live Itinerary Display (copied from experience builder left panel) */}
          {selectedTripId && (
            <Card className="border-2 border-purple-100">
              {!transformedTrip ? (
                <CardContent className="py-8">
                  <ItineraryEmptyState />
                </CardContent>
              ) : (
                <>
                  {/* Trip Info Header - copied from experience builder lines 968-1017 */}
                  <CardHeader className="border-b border-slate-200 p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-sm font-bold">{transformedTrip?.title || "Select a trip"}</h1>
                        <p className="text-[10px] text-muted-foreground">{transformedTrip?.dates || ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Trip Total */}
                        <div className="text-right">
                          <div className="text-xs font-semibold">${tripTotals.total.toLocaleString()}</div>
                        </div>
                        
                        {/* View Mode Tabs */}
                        <div className="flex gap-1 border rounded-lg p-0.5">
                          <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("table")}
                            title="Table View"
                          >
                            <Table2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={viewMode === "timeline" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("timeline")}
                            title="Timeline View"
                          >
                            <GitBranch className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={viewMode === "photos" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setViewMode("photos")}
                            title="Photo Grid View"
                          >
                            <Grid3X3 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Add Button */}
                        <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Itinerary Content - copied from experience builder lines 1020-1050 */}
                  <CardContent className="p-0">
                    <div className="flex-1 overflow-y-auto p-3 overscroll-contain" style={{ maxHeight: "600px" }}>
                      {transformedTrip ? (
                        <>
                          {viewMode === "table" && (
                            <TableView 
                              segments={transformedTrip.segments} 
                              onSelectReservation={setSelectedReservation}
                              onChatAboutItem={handleChatAboutItem}
                              onEditItem={handleEditItem}
                            />
                          )}
                          {viewMode === "timeline" && (
                            <TimelineView
                              segments={transformedTrip.segments}
                              heroImage={transformedTrip.heroImage}
                              onSelectReservation={setSelectedReservation}
                              onChatAboutItem={handleChatAboutItem}
                              onEditItem={handleEditItem}
                            />
                          )}
                          {viewMode === "photos" && (
                            <PhotosView 
                              segments={transformedTrip.segments} 
                              onSelectReservation={setSelectedReservation} 
                            />
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                          <p>Select a trip from the dropdown to view details</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          )}

          {/* Export Button */}
          {stage3.status === "success" && (
            <div className="flex justify-center">
              <Button onClick={exportResult} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Full Result as JSON
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel for Anonymous Users */}
      {!user && <ActivitySidePanel />}

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <ReservationDetailModal
          selectedReservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
        />
      )}

      {/* Toast Notification */}
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
