"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Code, Sparkles, MapPin, FileText, Eye, Image as ImageIcon } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ApiResponseViewer } from "../_components/api-response-viewer";
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
  getModelsByCapability,
  calculateTextCost,
  estimateCost as estimateModelCost,
  estimateTokens,
} from "@/lib/utils/model-pricing";

interface TestResult {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export default function OpenAITestPage() {
  // Available models
  const allModels = getAllTextModels();
  const streamingModels = getModelsByCapability("streaming");
  const structuredModels = getModelsByCapability("structuredOutput");
  const visionModels = getModelsByCapability("vision");

  // Chat State
  const [chatMessage, setChatMessage] = useState("Generate a 3-day itinerary for Paris including museums, cafes, and iconic landmarks.");
  const [chatModel, setChatModel] = useState("gpt-4o");
  const [chatSystemPrompt, setChatSystemPrompt] = useState("You are a helpful travel planning assistant.");
  const [chatResult, setChatResult] = useState<TestResult | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");

  // Structured Generation State
  const [structuredPrompt, setStructuredPrompt] = useState("Extract the following details from this text: 'Flight AA123 from New York (JFK) to Los Angeles (LAX) on July 15, 2026 at 10:30 AM'");
  const [structuredModel, setStructuredModel] = useState("gpt-4o");
  const [structuredSchema, setStructuredSchema] = useState(`{
  "type": "object",
  "properties": {
    "flightNumber": { "type": "string" },
    "origin": { "type": "string" },
    "destination": { "type": "string" },
    "date": { "type": "string" },
    "time": { "type": "string" }
  },
  "required": ["flightNumber", "origin", "destination", "date"]
}`);
  const [structuredResult, setStructuredResult] = useState<TestResult | null>(null);
  const [structuredLoading, setStructuredLoading] = useState(false);

  // Itinerary Generation State
  const [itineraryDestination, setItineraryDestination] = useState("Tokyo, Japan");
  const [itineraryDuration, setItineraryDuration] = useState("5");
  const [itineraryInterests, setItineraryInterests] = useState("temples, food, technology, shopping");
  const [itineraryBudget, setItineraryBudget] = useState("moderate");
  const [itineraryModel, setItineraryModel] = useState("gpt-4o");
  const [itineraryResult, setItineraryResult] = useState<TestResult | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  // Email Extraction State
  const [extractionText, setExtractionText] = useState(`Subject: Your Flight Confirmation - AA123

Dear John Smith,

Your flight has been confirmed!

Flight Details:
- Flight Number: AA123
- Airline: American Airlines
- From: New York JFK
- To: Los Angeles LAX
- Departure: July 15, 2026 at 10:30 AM
- Arrival: July 15, 2026 at 1:45 PM
- Confirmation Code: ABC123XYZ
- Seat: 12A

Hotel Reservation:
- Hotel: The Beverly Hills Hotel
- Address: 9641 Sunset Boulevard, Beverly Hills, CA
- Check-in: July 15, 2026 at 3:00 PM
- Check-out: July 18, 2026 at 11:00 AM
- Confirmation: HTL456DEF
- Room Type: Deluxe King
- Guests: John Smith

Thank you for booking with us!`);
  const [extractionModel, setExtractionModel] = useState("gpt-4o");
  const [extractionResult, setExtractionResult] = useState<TestResult | null>(null);
  const [extractionLoading, setExtractionLoading] = useState(false);

  // Vision Analysis State
  const [visionImageUrl, setVisionImageUrl] = useState("");
  const [visionPrompt, setVisionPrompt] = useState("");
  const [visionModel, setVisionModel] = useState("gpt-4o");
  const [visionResult, setVisionResult] = useState<TestResult | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);

  const testChat = async () => {
    setChatLoading(true);
    setStreamedResponse("");
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/test/openai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: chatSystemPrompt },
            { role: "user", content: chatMessage },
          ],
          model: chatModel,
        }),
      });

      const duration = Date.now() - startTime;

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              const content = line.substring(2).trim();
              if (content && content !== '""') {
                const text = content.replace(/^"|"$/g, "");
                fullResponse += text;
                setStreamedResponse(fullResponse);
              }
            }
          }
        }

        setChatResult({
          response: { text: fullResponse, streaming: true },
          status: response.status,
          duration,
        });
      } else {
        const data = await response.json();
        setChatResult({
          response: data,
          status: response.status,
          duration,
        });
      }
    } catch (error: any) {
      setChatResult({
        response: null,
        error: error.message,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const testStructuredGeneration = async () => {
    setStructuredLoading(true);
    const startTime = Date.now();

    try {
      let schema;
      try {
        schema = JSON.parse(structuredSchema);
      } catch (e) {
        throw new Error("Invalid JSON schema");
      }

      const response = await fetch("/api/admin/test/openai-structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: structuredPrompt,
          schema,
        }),
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      setStructuredResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setStructuredResult({
        response: null,
        error: error.message,
      });
    } finally {
      setStructuredLoading(false);
    }
  };

  const testItinerary = async () => {
    setItineraryLoading(true);
    setItineraryResult(null);

    try {
      const response = await fetch("/api/admin/test/openai-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: itineraryDestination,
          duration: itineraryDuration,
          interests: itineraryInterests,
          budget: itineraryBudget,
          model: itineraryModel,
        }),
      });

      const data = await response.json();
      setItineraryResult({
        response: data,
        status: response.status,
        duration: data.duration,
        usage: data.usage,
      });
    } catch (error: any) {
      setItineraryResult({
        response: null,
        error: error.message,
      });
    } finally {
      setItineraryLoading(false);
    }
  };

  const testExtraction = async () => {
    setExtractionLoading(true);
    setExtractionResult(null);

    try {
      const response = await fetch("/api/admin/test/openai-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractionText,
          model: extractionModel,
        }),
      });

      const data = await response.json();
      setExtractionResult({
        response: data,
        status: response.status,
        duration: data.duration,
        usage: data.usage,
      });
    } catch (error: any) {
      setExtractionResult({
        response: null,
        error: error.message,
      });
    } finally {
      setExtractionLoading(false);
    }
  };

  const testVision = async () => {
    setVisionLoading(true);
    setVisionResult(null);

    try {
      const response = await fetch("/api/admin/test/openai-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: visionImageUrl,
          prompt: visionPrompt,
          model: visionModel,
          extractStructured: true,
        }),
      });

      const data = await response.json();
      setVisionResult({
        response: data,
        status: response.status,
        duration: data.duration,
        usage: data.usage,
      });
    } catch (error: any) {
      setVisionResult({
        response: null,
        error: error.message,
      });
    } finally {
      setVisionLoading(false);
    }
  };

  return (
    <ApiTestLayout
      title="OpenAI APIs"
      description="Test GPT-4o chat completions and structured generation"
      breadcrumbs={[{ label: "OpenAI" }]}
    >
      <Alert className="mb-6">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          These tests use your configured OpenAI API key. Tokens will be consumed from your account.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="structured">
            <Code className="h-4 w-4 mr-2" />
            Structured
          </TabsTrigger>
          <TabsTrigger value="itinerary">
            <MapPin className="h-4 w-4 mr-2" />
            Itinerary
          </TabsTrigger>
          <TabsTrigger value="extraction">
            <FileText className="h-4 w-4 mr-2" />
            Extraction
          </TabsTrigger>
          <TabsTrigger value="vision">
            <Eye className="h-4 w-4 mr-2" />
            Vision
          </TabsTrigger>
        </TabsList>

        {/* Chat Completion */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Completion API</CardTitle>
              <CardDescription>
                Test chat completions with streaming responses and model comparison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={streamingModels}
                selectedModel={chatModel}
                onModelChange={setChatModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
                <Textarea
                  id="system-prompt"
                  value={chatSystemPrompt}
                  onChange={(e) => setChatSystemPrompt(e.target.value)}
                  rows={2}
                  placeholder="Set the behavior of the assistant..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-message">User Message</Label>
                <Textarea
                  id="chat-message"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your message..."
                />
                {chatMessage && (
                  <CostBreakdownCard
                    cost={estimateModelCost(chatMessage + chatSystemPrompt, 500, chatModel)}
                    title="Estimated Cost"
                    showEstimate={true}
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testChat}
                  disabled={chatLoading || !chatMessage}
                  className="flex-1"
                >
                  {chatLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChatMessage("What are the top 5 things to do in Tokyo for first-time visitors?");
                    setChatResult(null);
                    setStreamedResponse("");
                  }}
                >
                  Example 1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChatMessage("Create a 7-day road trip itinerary from San Francisco to Los Angeles along the Pacific Coast Highway.");
                    setChatResult(null);
                    setStreamedResponse("");
                  }}
                >
                  Example 2
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/chat/simple
              </div>
            </CardContent>
          </Card>

          {(chatLoading || streamedResponse) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Streaming Response
                  {chatLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg min-h-32 whitespace-pre-wrap">
                  {streamedResponse || "Waiting for response..."}
                </div>
              </CardContent>
            </Card>
          )}

          {chatResult && !chatLoading && (
            <>
              {chatResult.usage && streamedResponse && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      chatMessage + chatSystemPrompt,
                      streamedResponse,
                      chatModel
                    )}
                    duration={chatResult.duration}
                  />
                  <PerformanceMetrics
                    duration={chatResult.duration}
                    tokenCount={chatResult.usage.totalTokens}
                    model={chatModel}
                    status="success"
                  />
                </div>
              )}
              <ApiResponseViewer
                response={chatResult.response}
                status={chatResult.status}
                duration={chatResult.duration}
                error={chatResult.error}
              />
            </>
          )}
        </TabsContent>

        {/* Structured Generation */}
        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structured Generation API</CardTitle>
              <CardDescription>
                Extract structured data using JSON schema validation (Note: o1 models don't support this)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={structuredModels}
                selectedModel={structuredModel}
                onModelChange={setStructuredModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="structured-prompt">Prompt</Label>
                <Textarea
                  id="structured-prompt"
                  value={structuredPrompt}
                  onChange={(e) => setStructuredPrompt(e.target.value)}
                  rows={3}
                  placeholder="Enter text to extract structured data from..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="structured-schema">JSON Schema</Label>
                <Textarea
                  id="structured-schema"
                  value={structuredSchema}
                  onChange={(e) => setStructuredSchema(e.target.value)}
                  rows={10}
                  placeholder="Enter JSON schema..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Define the structure of data you want to extract
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testStructuredGeneration}
                  disabled={structuredLoading || !structuredPrompt || !structuredSchema}
                  className="flex-1"
                >
                  {structuredLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Structured Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStructuredPrompt("Extract restaurant details: 'Joe's Pizza at 123 Main St, open 11am-10pm, serves Italian cuisine, price range $$'");
                    setStructuredSchema(`{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "address": { "type": "string" },
    "hours": { "type": "string" },
    "cuisine": { "type": "string" },
    "priceRange": { "type": "string" }
  }
}`);
                    setStructuredResult(null);
                  }}
                >
                  Example: Restaurant
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/chat/structure
              </div>
            </CardContent>
          </Card>

          {structuredResult && (
            <div className="space-y-4">
              {structuredResult.response?.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(structuredResult.response.data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              {structuredResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      structuredPrompt,
                      JSON.stringify(structuredResult.response.data || {}),
                      structuredModel
                    )}
                    duration={structuredResult.duration}
                  />
                  <PerformanceMetrics
                    duration={structuredResult.duration}
                    tokenCount={structuredResult.usage.totalTokens}
                    model={structuredModel}
                    status="success"
                  />
                </div>
              )}
              <ApiResponseViewer
                response={structuredResult.response}
                status={structuredResult.status}
                duration={structuredResult.duration}
                error={structuredResult.error}
              />
            </div>
          )}
        </TabsContent>

        {/* Itinerary Generation */}
        <TabsContent value="itinerary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Travel Itinerary Generation</CardTitle>
              <CardDescription>
                Generate detailed travel itineraries with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={allModels}
                selectedModel={itineraryModel}
                onModelChange={setItineraryModel}
                label="Model"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="itinerary-destination">Destination</Label>
                  <Input
                    id="itinerary-destination"
                    value={itineraryDestination}
                    onChange={(e) => setItineraryDestination(e.target.value)}
                    placeholder="e.g., Tokyo, Japan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itinerary-duration">Duration (days)</Label>
                  <Input
                    id="itinerary-duration"
                    type="number"
                    value={itineraryDuration}
                    onChange={(e) => setItineraryDuration(e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itinerary-interests">Interests</Label>
                <Input
                  id="itinerary-interests"
                  value={itineraryInterests}
                  onChange={(e) => setItineraryInterests(e.target.value)}
                  placeholder="e.g., temples, food, technology, shopping"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itinerary-budget">Budget Level</Label>
                <Select value={itineraryBudget} onValueChange={setItineraryBudget}>
                  <SelectTrigger id="itinerary-budget">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testItinerary}
                  disabled={itineraryLoading || !itineraryDestination}
                  className="flex-1"
                >
                  {itineraryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Itinerary
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setItineraryDestination("Barcelona, Spain");
                    setItineraryDuration("4");
                    setItineraryInterests("architecture, beaches, tapas, nightlife");
                    setItineraryBudget("moderate");
                  }}
                >
                  Example
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/admin/test/openai-itinerary
              </div>
            </CardContent>
          </Card>

          {itineraryResult && (
            <div className="space-y-4">
              {itineraryResult.response?.itinerary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Itinerary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap">{itineraryResult.response.itinerary}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {itineraryResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      `${itineraryDestination} ${itineraryDuration} ${itineraryInterests}`,
                      itineraryResult.response.itinerary || "",
                      itineraryModel
                    )}
                    duration={itineraryResult.duration}
                  />
                  <PerformanceMetrics
                    duration={itineraryResult.duration}
                    tokenCount={itineraryResult.usage.totalTokens}
                    model={itineraryModel}
                    status="success"
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Email/Text Extraction */}
        <TabsContent value="extraction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email & Text Extraction</CardTitle>
              <CardDescription>
                Extract structured travel data from emails and text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={structuredModels}
                selectedModel={extractionModel}
                onModelChange={setExtractionModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="extraction-text">Email or Text Content</Label>
                <Textarea
                  id="extraction-text"
                  value={extractionText}
                  onChange={(e) => setExtractionText(e.target.value)}
                  rows={12}
                  placeholder="Paste email or text with travel information..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testExtraction}
                  disabled={extractionLoading || !extractionText}
                  className="flex-1"
                >
                  {extractionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extract Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExtractionText(`Booking Confirmation #HTL789

The Grand Hotel Paris
15 Rue de la Paix, 75002 Paris, France

Guest: Jane Doe
Check-in: August 1, 2026 - 3:00 PM
Check-out: August 5, 2026 - 11:00 AM
Room: Superior Double Room
Guests: 2 Adults
Total: €850

Activity Booking:
Eiffel Tower Summit Tour
Date: August 2, 2026 at 10:00 AM
Participants: Jane Doe, John Doe
Confirmation: ACT123456`);
                  }}
                >
                  Example
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/admin/test/openai-extraction
              </div>
            </CardContent>
          </Card>

          {extractionResult && (
            <div className="space-y-4">
              {extractionResult.response?.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Reservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(extractionResult.response.data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              {extractionResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      extractionText,
                      JSON.stringify(extractionResult.response.data || {}),
                      extractionModel
                    )}
                    duration={extractionResult.duration}
                  />
                  <PerformanceMetrics
                    duration={extractionResult.duration}
                    tokenCount={extractionResult.usage.totalTokens}
                    model={extractionModel}
                    status="success"
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Vision Analysis */}
        <TabsContent value="vision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Analysis (Vision)</CardTitle>
              <CardDescription>
                Analyze travel documents and images with GPT-4o Vision
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={visionModels}
                selectedModel={visionModel}
                onModelChange={setVisionModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="vision-image-url">Image URL</Label>
                <Input
                  id="vision-image-url"
                  value={visionImageUrl}
                  onChange={(e) => setVisionImageUrl(e.target.value)}
                  placeholder="https://example.com/boarding-pass.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a publicly accessible image URL (boarding pass, ticket, hotel confirmation, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision-prompt">Custom Prompt (Optional)</Label>
                <Textarea
                  id="vision-prompt"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  rows={3}
                  placeholder="Leave empty for default extraction prompt..."
                />
              </div>

              <Button
                onClick={testVision}
                disabled={visionLoading || !visionImageUrl}
                className="w-full"
              >
                {visionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Image
              </Button>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/admin/test/openai-vision
              </div>
            </CardContent>
          </Card>

          {visionResult && (
            <div className="space-y-4">
              {visionResult.response?.analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap">{visionResult.response.analysis}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {visionResult.usage && (
                <div className="grid gap-4 md:grid-cols-2">
                  <CostBreakdownCard
                    cost={calculateTextCost(
                      visionPrompt || "Analyze this image",
                      visionResult.response.analysis || "",
                      visionModel
                    )}
                    duration={visionResult.duration}
                  />
                  <PerformanceMetrics
                    duration={visionResult.duration}
                    tokenCount={visionResult.usage.totalTokens}
                    model={visionModel}
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
