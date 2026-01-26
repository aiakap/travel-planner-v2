"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Code, Sparkles, Zap, DollarSign, Clock } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ApiResponseViewer } from "../_components/api-response-viewer";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DetailSection } from "../_components/detail-section";
import { InfoGrid } from "../_components/info-grid";
import { estimateOpenAICost, formatTokensPerSecond, formatNumber } from "@/lib/format-helpers";
import { Progress } from "@/components/ui/progress";

interface TestResult {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
}

export default function OpenAITestPage() {
  // Chat State
  const [chatMessage, setChatMessage] = useState("Generate a 3-day itinerary for Paris including museums, cafes, and iconic landmarks.");
  const [chatModel, setChatModel] = useState("gpt-4o");
  const [chatSystemPrompt, setChatSystemPrompt] = useState("You are a helpful travel planning assistant.");
  const [chatResult, setChatResult] = useState<TestResult | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");

  // Structured Generation State
  const [structuredPrompt, setStructuredPrompt] = useState("Extract the following details from this text: 'Flight AA123 from New York (JFK) to Los Angeles (LAX) on July 15, 2026 at 10:30 AM'");
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

  const estimateTokens = (text: string) => {
    return Math.ceil(text.length / 4);
  };

  const estimateCost = (tokens: number, model: string) => {
    const pricing: Record<string, { input: number; output: number }> = {
      "gpt-4o": { input: 0.005, output: 0.015 }, // per 1K tokens
      "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    };
    const price = pricing[model] || pricing["gpt-4o"];
    const cost = ((tokens / 1000) * price.input + (tokens / 1000) * price.output);
    return cost.toFixed(6);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat Completion
          </TabsTrigger>
          <TabsTrigger value="structured">
            <Code className="h-4 w-4 mr-2" />
            Structured Generation
          </TabsTrigger>
        </TabsList>

        {/* Chat Completion */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Completion API</CardTitle>
              <CardDescription>
                Test GPT-4o chat with streaming responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chat-model">Model</Label>
                <Select value={chatModel} onValueChange={setChatModel}>
                  <SelectTrigger id="chat-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (most capable)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (faster, cheaper)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>~{estimateTokens(chatMessage + chatSystemPrompt)} tokens</span>
                  <span>•</span>
                  <span>~${estimateCost(estimateTokens(chatMessage + chatSystemPrompt), chatModel)} estimated cost</span>
                </div>
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
            <ApiResponseViewer
              response={chatResult.response}
              status={chatResult.status}
              duration={chatResult.duration}
              error={chatResult.error}
            />
          )}
        </TabsContent>

        {/* Structured Generation */}
        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structured Generation API</CardTitle>
              <CardDescription>
                Extract structured data using JSON schema validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <ApiResponseViewer
                response={structuredResult.response}
                status={structuredResult.status}
                duration={structuredResult.duration}
                error={structuredResult.error}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
