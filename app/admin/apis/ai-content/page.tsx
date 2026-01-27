"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, MapPin, FileText, BookOpen, Code, CheckCircle2 } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ModelSelector } from "../_components/model-selector";
import { CostBreakdownCard } from "../_components/cost-breakdown-card";
import { PerformanceMetrics } from "../_components/performance-metrics";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllTextModels,
  calculateTextCost,
  estimateTokens,
} from "@/lib/utils/model-pricing";
import { CardPreview } from "@/app/admin/cards/_components/card-preview";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ContentResult {
  content: string;
  model: string;
  duration: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export default function AIContentPage() {
  const allModels = getAllTextModels();

  // Trip Suggestions State
  const [tripDestination, setTripDestination] = useState("Southeast Asia");
  const [tripDuration, setTripDuration] = useState("14");
  const [tripBudget, setTripBudget] = useState("$3000-5000");
  const [tripInterests, setTripInterests] = useState("beaches, culture, food");
  const [tripModel, setTripModel] = useState("gpt-4o");
  const [tripLoading, setTripLoading] = useState(false);
  const [tripResult, setTripResult] = useState<ContentResult | null>(null);

  // Place Description State
  const [placeName, setPlaceName] = useState("Santorini, Greece");
  const [placeType, setPlaceType] = useState("destination");
  const [placeTone, setPlaceTone] = useState("professional");
  const [placeModel, setPlaceModel] = useState("gpt-4o-mini");
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeResult, setPlaceResult] = useState<ContentResult | null>(null);

  // Dossier State
  const [dossierDestination, setDossierDestination] = useState("Iceland");
  const [dossierModel, setDossierModel] = useState("gpt-4o");
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierResult, setDossierResult] = useState<ContentResult | null>(null);

  // Structured Output State
  const [structuredMessage, setStructuredMessage] = useState("Plan a week-long trip to Paris");
  const [structuredModel, setStructuredModel] = useState("gpt-4o");
  const [structuredOutputType, setStructuredOutputType] = useState<"full" | "cards" | "suggestions">("full");
  const [structuredLoading, setStructuredLoading] = useState(false);
  const [structuredResult, setStructuredResult] = useState<any>(null);

  const generateTripSuggestions = async () => {
    setTripLoading(true);
    setTripResult(null);

    try {
      // Using the itinerary endpoint as a proxy for trip suggestions
      const response = await fetch("/api/admin/test/openai-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: tripDestination,
          duration: tripDuration,
          interests: tripInterests,
          budget: tripBudget,
          model: tripModel,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTripResult({
          content: data.itinerary,
          model: data.model,
          duration: data.duration,
          usage: data.usage,
        });
      }
    } catch (error: any) {
      console.error("Trip generation error:", error);
    } finally {
      setTripLoading(false);
    }
  };

  const generatePlaceDescription = async () => {
    setPlaceLoading(true);
    setPlaceResult(null);

    try {
      const prompt = `Write a compelling ${placeTone} description of ${placeName} as a ${placeType}. 
      
Include:
- Overview and what makes it special
- Key attractions and highlights
- Best time to visit
- Travel tips
- Why travelers should visit

Keep it engaging and informative, around 300-400 words.`;

      const response = await fetch("/api/admin/test/openai-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: placeName,
          duration: "1",
          interests: prompt,
          model: placeModel,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPlaceResult({
          content: data.itinerary,
          model: data.model,
          duration: data.duration,
          usage: data.usage,
        });
      }
    } catch (error: any) {
      console.error("Place description error:", error);
    } finally {
      setPlaceLoading(false);
    }
  };

  const generateDossier = async () => {
    setDossierLoading(true);
    setDossierResult(null);

    try {
      const prompt = `Create a comprehensive travel dossier for ${dossierDestination}. Include:

1. DESTINATION OVERVIEW
   - Geography and climate
   - Best time to visit
   - Language and currency

2. GETTING THERE & AROUND
   - Major airports and transportation
   - Local transportation options
   - Driving tips if applicable

3. TOP ATTRACTIONS
   - Must-see landmarks
   - Hidden gems
   - Cultural experiences

4. FOOD & DINING
   - Local cuisine highlights
   - Must-try dishes
   - Dining etiquette

5. ACCOMMODATION
   - Recommended areas to stay
   - Types of accommodation
   - Budget considerations

6. PRACTICAL TIPS
   - Safety considerations
   - Cultural customs
   - Money and tipping
   - Communication

7. SAMPLE ITINERARIES
   - 3-day highlights
   - 7-day comprehensive
   - Off-the-beaten-path options

Make it detailed, practical, and engaging.`;

      const response = await fetch("/api/admin/test/openai-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: dossierDestination,
          duration: "7",
          interests: prompt,
          model: dossierModel,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDossierResult({
          content: data.itinerary,
          model: data.model,
          duration: data.duration,
          usage: data.usage,
        });
      }
    } catch (error: any) {
      console.error("Dossier generation error:", error);
    } finally {
      setDossierLoading(false);
    }
  };

  const generateStructuredOutput = async () => {
    setStructuredLoading(true);
    setStructuredResult(null);

    try {
      const response = await fetch("/api/admin/test/exp-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: structuredMessage,
          context: {
            messageCount: 1,
            hasExistingTrip: false,
          },
          model: structuredModel,
          outputType: structuredOutputType,
        }),
      });

      const data = await response.json();
      setStructuredResult(data);
    } catch (error: any) {
      console.error("Structured output error:", error);
      setStructuredResult({
        success: false,
        error: error.message || "Failed to generate structured output",
      });
    } finally {
      setStructuredLoading(false);
    }
  };

  return (
    <ApiTestLayout
      title="AI Content Generation"
      description="Generate travel content with AI - itineraries, descriptions, and guides"
      breadcrumbs={[{ label: "AI Content" }]}
    >
      <Alert className="mb-6">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Generate high-quality travel content using OpenAI models. Compare costs and quality across different models.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="structured" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="structured">
            <Code className="h-4 w-4 mr-2" />
            Structured Output
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <MapPin className="h-4 w-4 mr-2" />
            Trip Suggestions
          </TabsTrigger>
          <TabsTrigger value="descriptions">
            <FileText className="h-4 w-4 mr-2" />
            Place Descriptions
          </TabsTrigger>
          <TabsTrigger value="dossier">
            <BookOpen className="h-4 w-4 mr-2" />
            Travel Dossier
          </TabsTrigger>
        </TabsList>

        {/* Structured Output */}
        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exp System Structured Output</CardTitle>
              <CardDescription>
                Test the exp system with structured outputs (cards + suggestions)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={allModels}
                selectedModel={structuredModel}
                onModelChange={setStructuredModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="structured-message">User Message</Label>
                <Textarea
                  id="structured-message"
                  value={structuredMessage}
                  onChange={(e) => setStructuredMessage(e.target.value)}
                  placeholder="Plan a week-long trip to Paris"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output-type">Output Type</Label>
                <Select value={structuredOutputType} onValueChange={(value: any) => setStructuredOutputType(value)}>
                  <SelectTrigger id="output-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Response (text + cards + suggestions)</SelectItem>
                    <SelectItem value="cards">Cards Only</SelectItem>
                    <SelectItem value="suggestions">Suggestions Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateStructuredOutput}
                disabled={structuredLoading || !structuredMessage}
                className="w-full"
              >
                {structuredLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Structured Output
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {structuredResult && (
            <>
              {structuredResult.success ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <CostBreakdownCard
                      usage={structuredResult.usage}
                      model={structuredResult.meta?.model}
                    />
                    <PerformanceMetrics
                      duration={structuredResult.duration}
                      tokenCount={structuredResult.usage?.totalTokens}
                    />
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Validation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {structuredResult.validation?.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <Badge variant={structuredResult.validation?.valid ? "default" : "destructive"}>
                              {structuredResult.validation?.valid ? "Valid" : "Invalid"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Schema compliance check
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {structuredResult.data?.text && (
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Response Text</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{structuredResult.data.text}</p>
                      </CardContent>
                    </Card>
                  )}

                  {structuredResult.data?.cards && structuredResult.data.cards.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Cards ({structuredResult.data.cards.length})</CardTitle>
                        <CardDescription>
                          Visual preview of generated cards
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {structuredResult.data.cards.map((card: any, idx: number) => (
                          <CardPreview key={idx} card={card} />
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {structuredResult.data?.places && structuredResult.data.places.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Place Suggestions ({structuredResult.data.places.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {structuredResult.data.places.map((place: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold">{place.suggestedName}</div>
                                  <div className="text-sm text-muted-foreground">{place.searchQuery}</div>
                                  <div className="mt-1 flex gap-2">
                                    <Badge variant="outline">{place.category}</Badge>
                                    <Badge variant="secondary">{place.type}</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {structuredResult.data?.transport && structuredResult.data.transport.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Transport Suggestions ({structuredResult.data.transport.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {structuredResult.data.transport.map((trans: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="font-semibold">{trans.suggestedName}</div>
                              <div className="text-sm text-muted-foreground">
                                {trans.origin} → {trans.destination}
                              </div>
                              <div className="mt-1 flex gap-2">
                                <Badge variant="outline">{trans.type}</Badge>
                                <Badge variant="secondary">{trans.departureDate}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {structuredResult.data?.hotels && structuredResult.data.hotels.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Hotel Suggestions ({structuredResult.data.hotels.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {structuredResult.data.hotels.map((hotel: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="font-semibold">{hotel.suggestedName}</div>
                              <div className="text-sm text-muted-foreground">{hotel.location}</div>
                              <div className="mt-1 flex gap-2">
                                <Badge variant="outline">{hotel.checkInDate}</Badge>
                                <Badge variant="outline">{hotel.checkOutDate}</Badge>
                                <Badge variant="secondary">{hotel.guests} guests</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Collapsible>
                    <Card>
                      <CardHeader>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span>View Raw JSON</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent>
                          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                            {JSON.stringify(structuredResult, null, 2)}
                          </pre>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {structuredResult.error || "Failed to generate structured output"}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>

        {/* Trip Suggestions */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trip Suggestions Generator</CardTitle>
              <CardDescription>
                Generate personalized trip suggestions based on preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={allModels}
                selectedModel={tripModel}
                onModelChange={setTripModel}
                label="Model"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trip-destination">Destination/Region</Label>
                  <Input
                    id="trip-destination"
                    value={tripDestination}
                    onChange={(e) => setTripDestination(e.target.value)}
                    placeholder="e.g., Southeast Asia, Europe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-duration">Duration (days)</Label>
                  <Input
                    id="trip-duration"
                    type="number"
                    value={tripDuration}
                    onChange={(e) => setTripDuration(e.target.value)}
                    placeholder="e.g., 14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-budget">Budget Range</Label>
                <Select value={tripBudget} onValueChange={setTripBudget}>
                  <SelectTrigger id="trip-budget">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$1000-2000">Budget ($1000-2000)</SelectItem>
                    <SelectItem value="$3000-5000">Moderate ($3000-5000)</SelectItem>
                    <SelectItem value="$7000-10000">Comfortable ($7000-10000)</SelectItem>
                    <SelectItem value="$15000+">Luxury ($15000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-interests">Interests</Label>
                <Input
                  id="trip-interests"
                  value={tripInterests}
                  onChange={(e) => setTripInterests(e.target.value)}
                  placeholder="e.g., beaches, culture, food, adventure"
                />
              </div>

              <Button
                onClick={generateTripSuggestions}
                disabled={tripLoading || !tripDestination}
                className="w-full"
              >
                {tripLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Trip Suggestions
              </Button>
            </CardContent>
          </Card>

          {tripResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Trip Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap">{tripResult.content}</div>
                  </div>
                </CardContent>
              </Card>

              {tripResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      `${tripDestination} ${tripDuration} ${tripInterests} ${tripBudget}`,
                      tripResult.content,
                      tripModel
                    )}
                    duration={tripResult.duration}
                  />
                  <PerformanceMetrics
                    duration={tripResult.duration}
                    tokenCount={tripResult.usage.totalTokens}
                    model={tripModel}
                    status="success"
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Place Descriptions */}
        <TabsContent value="descriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Place Description Generator</CardTitle>
              <CardDescription>
                Generate compelling descriptions for destinations and attractions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={allModels}
                selectedModel={placeModel}
                onModelChange={setPlaceModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="place-name">Place Name</Label>
                <Input
                  id="place-name"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g., Santorini, Greece"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="place-type">Place Type</Label>
                  <Select value={placeType} onValueChange={setPlaceType}>
                    <SelectTrigger id="place-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="destination">Destination</SelectItem>
                      <SelectItem value="attraction">Attraction</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="place-tone">Writing Tone</Label>
                  <Select value={placeTone} onValueChange={setPlaceTone}>
                    <SelectTrigger id="place-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generatePlaceDescription}
                disabled={placeLoading || !placeName}
                className="w-full"
              >
                {placeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Description
              </Button>
            </CardContent>
          </Card>

          {placeResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Description</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{placeType}</Badge>
                    <Badge variant="secondary">{placeTone} tone</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap">{placeResult.content}</div>
                  </div>
                </CardContent>
              </Card>

              {placeResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      placeName,
                      placeResult.content,
                      placeModel
                    )}
                    duration={placeResult.duration}
                  />
                  <PerformanceMetrics
                    duration={placeResult.duration}
                    tokenCount={placeResult.usage.totalTokens}
                    model={placeModel}
                    status="success"
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Travel Dossier */}
        <TabsContent value="dossier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Travel Dossier Generator</CardTitle>
              <CardDescription>
                Generate comprehensive travel guides with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={allModels}
                selectedModel={dossierModel}
                onModelChange={setDossierModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="dossier-destination">Destination</Label>
                <Input
                  id="dossier-destination"
                  value={dossierDestination}
                  onChange={(e) => setDossierDestination(e.target.value)}
                  placeholder="e.g., Iceland, Morocco, New Zealand"
                />
              </div>

              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  This will generate a comprehensive travel guide including overview, transportation, attractions, food, accommodation, and practical tips. Generation may take 30-60 seconds.
                </AlertDescription>
              </Alert>

              <Button
                onClick={generateDossier}
                disabled={dossierLoading || !dossierDestination}
                className="w-full"
              >
                {dossierLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Travel Dossier
              </Button>
            </CardContent>
          </Card>

          {dossierLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="font-medium">Generating comprehensive travel dossier...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take 30-60 seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {dossierResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Travel Dossier: {dossierDestination}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap">{dossierResult.content}</div>
                  </div>
                </CardContent>
              </Card>

              {dossierResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      dossierDestination,
                      dossierResult.content,
                      dossierModel
                    )}
                    duration={dossierResult.duration}
                  />
                  <PerformanceMetrics
                    duration={dossierResult.duration}
                    tokenCount={dossierResult.usage.totalTokens}
                    model={dossierModel}
                    status="success"
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
