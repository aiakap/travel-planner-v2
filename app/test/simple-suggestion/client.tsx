"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  Sparkles, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react";
import { PipelineResponse, MessageSegment } from "@/lib/types/place-pipeline";
import { MessageSegmentsRenderer } from "@/components/message-segments-renderer";
import { TripSuggestionCard } from "@/components/trip-suggestion-card";
import type { AITripSuggestion } from "@/lib/ai/generate-single-trip-suggestion";
import { searchPlace, getPhotoUrl } from "@/lib/actions/google-places";
import { generateLoadingMessages } from "@/lib/loading-messages";

type StageStatus = "idle" | "running" | "success" | "error";

interface StageState {
  status: StageStatus;
  data?: any;
  timing?: number;
  error?: string;
}

interface SimpleSuggestionClientProps {
  user: { id: string; name: string; email: string } | null;
  profileData: {
    profile: any | null;
    contacts: any[];
    hobbies: any[];
    travelPreferences: any[];
    relationships: any[];
  } | null;
}

export function SimpleSuggestionClient({ user, profileData }: SimpleSuggestionClientProps) {
  const [destination, setDestination] = useState("Paris");
  const [isRunning, setIsRunning] = useState(false);
  
  // Pipeline stages
  const [stage1, setStage1] = useState<StageState>({ status: "idle" });
  const [stage2, setStage2] = useState<StageState>({ status: "idle" });
  const [stage3, setStage3] = useState<StageState>({ status: "idle" });
  
  // Stage visibility
  const [stage1Open, setStage1Open] = useState(true);
  const [stage2Open, setStage2Open] = useState(false);
  const [stage3Open, setStage3Open] = useState(false);
  
  // Trip suggestion (extracted from Stage 1)
  const [tripSuggestion, setTripSuggestion] = useState<AITripSuggestion | null>(null);
  const [suggestionImage, setSuggestionImage] = useState<string | undefined>();
  
  // Loading messages
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const [error, setError] = useState<string | null>(null);

  // Fetch suggestion image when tripSuggestion loads
  useEffect(() => {
    if (tripSuggestion) {
      const fetchImage = async () => {
        try {
          const query = tripSuggestion.imageQuery || tripSuggestion.destination;
          const place = await searchPlace(query);

          if (place?.photos?.[0]) {
            const photo = place.photos[0] as any;
            if (photo.reference) {
              const photoUrl = await getPhotoUrl(photo.reference, 800);
              setSuggestionImage(photoUrl);
            }
          } else {
            // Fallback to Unsplash
            const searchTerms = tripSuggestion.destinationKeywords?.length
              ? tripSuggestion.destinationKeywords.join(",")
              : query;
            const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(
              searchTerms
            )},travel`;
            setSuggestionImage(unsplashUrl);
          }
        } catch (error) {
          console.error("Failed to fetch suggestion image:", error);
          const searchTerms =
            tripSuggestion.destinationKeywords?.join(",") || tripSuggestion.destination;
          const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(
            searchTerms
          )},travel`;
          setSuggestionImage(unsplashUrl);
        }
      };

      fetchImage();
    }
  }, [tripSuggestion]);

  const handleGenerateSuggestion = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination");
      return;
    }

    setIsRunning(true);
    setError(null);
    setTripSuggestion(null);
    setSuggestionImage(undefined);
    setStage1({ status: "idle" });
    setStage2({ status: "idle" });
    setStage3({ status: "idle" });
    setStage1Open(true);
    setStage2Open(false);
    setStage3Open(false);

    // Generate loading messages
    const messages = profileData
      ? generateLoadingMessages({
          hobbies: profileData.hobbies,
          preferences: profileData.travelPreferences,
          relationships: profileData.relationships,
        })
      : [
          "Finding the perfect adventure...",
          "Consulting our travel experts...",
          "Searching for hidden gems...",
          "Planning your dream trip...",
          "Asking the travel gods for recommendations...",
          "Spinning the globe really fast...",
        ];
    setLoadingMessages(messages);
    setCurrentMessageIndex(0);

    // Start rotating messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    try {
      // Run the pipeline
      setStage1({ status: "running" });
      
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Generate a trip suggestion for ${destination.trim()}`,
          destination: destination.trim(),
          profileData,
        }),
      });

      const result: PipelineResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Pipeline failed");
      }

      // Update all stages
      if (result.data?.stage1) {
        setStage1({
          status: "success",
          data: result.data.stage1,
          timing: result.data.stage1.timing,
        });
        setTripSuggestion(result.data.stage1.tripSuggestion);
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
      }
    } catch (err) {
      console.error("Pipeline error:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to generate trip suggestion: ${errorMsg}`);
      
      // Set error on the last running stage
      if (stage3.status === "running") {
        setStage3({ status: "error", error: errorMsg });
      } else if (stage2.status === "running") {
        setStage2({ status: "error", error: errorMsg });
      } else {
        setStage1({ status: "error", error: errorMsg });
      }
    } finally {
      clearInterval(messageInterval);
      setIsRunning(false);
    }
  };

  const reset = () => {
    setStage1({ status: "idle" });
    setStage2({ status: "idle" });
    setStage3({ status: "idle" });
    setTripSuggestion(null);
    setSuggestionImage(undefined);
    setError(null);
    setStage1Open(true);
    setStage2Open(false);
    setStage3Open(false);
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple Trip Suggestion Tester
          </h1>
          <p className="text-slate-600">
            Enter a destination to get one AI-powered trip suggestion with clickable place links
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Destination</CardTitle>
            <CardDescription>
              Enter a city, region, or country (e.g., "Paris", "Tokyo", "Iceland")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRunning) {
                    handleGenerateSuggestion();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleGenerateSuggestion}
                disabled={isRunning || !destination.trim()}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              {(stage1.status !== "idle" || stage2.status !== "idle" || stage3.status !== "idle") && (
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {user && profileData && (
              <p className="text-xs text-slate-500">
                ✨ Personalized based on your profile ({profileData.hobbies.length} hobbies,{" "}
                {profileData.travelPreferences.length} preferences)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isRunning && stage1.status === "running" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
                {loadingMessages.length > 0 && (
                  <p
                    className="text-lg font-medium text-slate-700 animate-fade-in"
                    key={currentMessageIndex}
                  >
                    {loadingMessages[currentMessageIndex]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Suggestion Card (if available) */}
        {tripSuggestion && (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Your Trip Suggestion</h2>
            <TripSuggestionCard
              suggestion={tripSuggestion}
              imageUrl={suggestionImage}
              onClick={() => {}}
            />
          </div>
        )}

        {/* Stage 1: AI Generation */}
        {stage1.status !== "idle" && (
          <Collapsible open={stage1Open} onOpenChange={setStage1Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage1Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 1: AI Generation</CardTitle>
                        <CardDescription>Generate trip text + structured place list</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(stage1.status)}
                      {stage1.timing && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {stage1.timing}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {stage1.status === "error" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <p className="font-semibold">Error:</p>
                      <p className="text-sm">{stage1.error}</p>
                    </div>
                  )}
                  {stage1.data && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Raw JSON Output</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(stage1.data)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
                          {JSON.stringify(stage1.data, null, 2)}
                        </pre>
                      </div>
                      {stage1.data.places && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Places Found: {stage1.data.places.length}
                          </h4>
                          <div className="space-y-1 text-sm">
                            {stage1.data.places.map((place: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {place.category}
                                </Badge>
                                <span>{place.suggestedName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Stage 2: Google Places Resolution */}
        {stage2.status !== "idle" && (
          <Collapsible open={stage2Open} onOpenChange={setStage2Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage2Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 2: Google Places Resolution</CardTitle>
                        <CardDescription>Resolve each place to real Google Places data</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(stage2.status)}
                      {stage2.timing && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {stage2.timing}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {stage2.status === "error" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <p className="font-semibold">Error:</p>
                      <p className="text-sm">{stage2.error}</p>
                    </div>
                  )}
                  {stage2.data && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Resolved Places</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(stage2.data)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(stage2.data.placeMap || {}).map(([name, data]: [string, any]) => (
                            <div
                              key={name}
                              className={`p-3 rounded-lg border ${
                                data.notFound ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{name}</span>
                                {data.notFound ? (
                                  <Badge variant="outline" className="bg-red-100 text-red-700">Not Found</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-100 text-green-700">✓ Resolved</Badge>
                                )}
                              </div>
                              {!data.notFound && (
                                <div className="text-xs text-slate-600 mt-1">
                                  {data.formattedAddress}
                                  {data.rating && ` · ⭐ ${data.rating}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Stage 3: HTML Assembly with Clickable Links */}
        {stage3.status !== "idle" && (
          <Collapsible open={stage3Open} onOpenChange={setStage3Open}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage3Open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Stage 3: Final Result</CardTitle>
                        <CardDescription>Clickable place links with hover cards</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(stage3.status)}
                      {stage3.timing && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {stage3.timing}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {stage3.status === "error" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <p className="font-semibold">Error:</p>
                      <p className="text-sm">{stage3.error}</p>
                    </div>
                  )}
                  {stage3.data?.segments && (
                    <div className="prose prose-slate max-w-none">
                      <MessageSegmentsRenderer 
                        segments={stage3.data.segments}
                        onReservationAdded={() => {}}
                      />
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Empty State */}
        {stage1.status === "idle" && !isRunning && !error && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <Sparkles className="h-12 w-12 mx-auto text-slate-400" />
                <p className="text-slate-600">
                  Enter a destination above to generate your personalized trip suggestion
                </p>
                <p className="text-xs text-slate-500">
                  The 3-stage pipeline will show: AI Generation → Google Places → Clickable Links
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
