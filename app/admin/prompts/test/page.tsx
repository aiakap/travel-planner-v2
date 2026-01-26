"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, Play, ChevronDown, ChevronRight, Copy, Check, Database, X, CheckCircle2 } from "lucide-react";

interface TestResult {
  prompt: string;
  activePlugins: string[];
  stats: {
    totalLength: number;
    pluginCount: number;
    estimatedTokens: number;
  };
}

interface EntityInfo {
  type: string;
  [key: string]: any;
}

export default function PromptTestPage() {
  const [userMessage, setUserMessage] = useState("Plan a trip to Tokyo");
  const [messageCount, setMessageCount] = useState(1);
  const [hasExistingTrip, setHasExistingTrip] = useState(false);
  const [chatType, setChatType] = useState<string>("none");
  const [metadata, setMetadata] = useState("{}");
  
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Entity selection state
  const [entityType, setEntityType] = useState<string>("trip");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");
  
  const [users, setUsers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  
  const [loadedEntityInfo, setLoadedEntityInfo] = useState<EntityInfo | null>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch trips when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchTrips(selectedUserId);
    } else {
      setTrips([]);
      setSelectedTripId("");
    }
  }, [selectedUserId]);

  // Fetch segments when trip is selected
  useEffect(() => {
    if (selectedTripId && (entityType === "segment" || entityType === "reservation")) {
      fetchSegments(selectedTripId);
    } else {
      setSegments([]);
      setSelectedSegmentId("");
    }
  }, [selectedTripId, entityType]);

  // Fetch reservations when segment is selected
  useEffect(() => {
    if (selectedSegmentId && entityType === "reservation") {
      fetchReservations(selectedSegmentId);
    } else {
      setReservations([]);
      setSelectedReservationId("");
    }
  }, [selectedSegmentId, entityType]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/prompts/entities?type=users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTrips = async (userId: string) => {
    setLoadingTrips(true);
    try {
      const response = await fetch(`/api/admin/prompts/entities?type=trips&userId=${userId}`);
      const data = await response.json();
      setTrips(data.trips || []);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchSegments = async (tripId: string) => {
    setLoadingSegments(true);
    try {
      const response = await fetch(`/api/admin/prompts/entities?type=segments&tripId=${tripId}`);
      const data = await response.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    } finally {
      setLoadingSegments(false);
    }
  };

  const fetchReservations = async (segmentId: string) => {
    setLoadingReservations(true);
    try {
      const response = await fetch(`/api/admin/prompts/entities?type=reservations&segmentId=${segmentId}`);
      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleLoadEntityContext = async () => {
    let entityId = "";
    let type = entityType;

    switch (entityType) {
      case "trip":
        entityId = selectedTripId;
        break;
      case "segment":
        entityId = selectedSegmentId;
        break;
      case "reservation":
        entityId = selectedReservationId;
        break;
    }

    if (!entityId) {
      setError("Please select an entity to load");
      return;
    }

    setLoadingContext(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/prompts/entities/${type}/${entityId}`);
      if (!response.ok) {
        throw new Error("Failed to load entity context");
      }
      
      const data = await response.json();
      
      // Populate context fields
      setMessageCount(data.context.messageCount || 0);
      setHasExistingTrip(data.context.hasExistingTrip || false);
      setChatType(data.context.chatType || "none");
      setMetadata(JSON.stringify(data.context.metadata || {}, null, 2));
      
      // Store entity info for display
      setLoadedEntityInfo(data.entityInfo);
      
      // Clear user message so tester can enter their own
      setUserMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entity context");
    } finally {
      setLoadingContext(false);
    }
  };

  const handleClearEntity = () => {
    setLoadedEntityInfo(null);
    setSelectedUserId("");
    setSelectedTripId("");
    setSelectedSegmentId("");
    setSelectedReservationId("");
    setMessageCount(1);
    setHasExistingTrip(false);
    setChatType("none");
    setMetadata("{}");
    setUserMessage("Plan a trip to Tokyo");
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      let parsedMetadata = {};
      if (metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch {
          throw new Error("Invalid JSON in metadata field");
        }
      }

      const context = {
        userMessage,
        messageCount,
        hasExistingTrip,
        chatType: chatType === "none" ? undefined : chatType,
        metadata: parsedMetadata,
      };

      const response = await fetch("/api/admin/prompts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to build prompt");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setTesting(false);
    }
  };

  const copyPromptToClipboard = () => {
    if (result?.prompt) {
      navigator.clipboard.writeText(result.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const loadPreset = (preset: string) => {
    // Clear entity when loading preset
    setLoadedEntityInfo(null);
    
    switch (preset) {
      case "trip-creation":
        setUserMessage("Plan a trip to Tokyo");
        setMessageCount(1);
        setHasExistingTrip(false);
        setChatType("none");
        break;
      case "email-parsing":
        setUserMessage("Here is my hotel confirmation: Itinerary #12345, Check-in: Jan 30, Check-out: Feb 6...");
        setMessageCount(5);
        setHasExistingTrip(true);
        setChatType("none");
        break;
      case "vague-dates":
        setUserMessage("I want to go next summer");
        setMessageCount(2);
        setHasExistingTrip(false);
        setChatType("none");
        break;
      case "segment-focus":
        setUserMessage("Update this segment");
        setMessageCount(10);
        setHasExistingTrip(true);
        setChatType("SEGMENT");
        break;
      case "simple-query":
        setUserMessage("What time is checkout?");
        setMessageCount(15);
        setHasExistingTrip(true);
        setChatType("none");
        break;
    }
  };

  const splitPromptSections = (prompt: string): string[] => {
    return prompt.split(/\n\n---\n\n/);
  };

  const canLoadContext = () => {
    switch (entityType) {
      case "trip":
        return !!selectedTripId;
      case "segment":
        return !!selectedSegmentId;
      case "reservation":
        return !!selectedReservationId;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/prompts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prompt Testing</h2>
          <p className="text-muted-foreground">
            Test how prompts are assembled with different contexts
          </p>
        </div>
      </div>

      {/* Load from Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Load from Database
          </CardTitle>
          <CardDescription>
            Select a real entity from your database to automatically populate test context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entity Type Selection */}
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <RadioGroup value={entityType} onValueChange={setEntityType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trip" id="type-trip" />
                <Label htmlFor="type-trip" className="font-normal cursor-pointer">Trip</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="segment" id="type-segment" />
                <Label htmlFor="type-segment" className="font-normal cursor-pointer">Segment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reservation" id="type-reservation" />
                <Label htmlFor="type-reservation" className="font-normal cursor-pointer">Reservation</Label>
              </div>
            </RadioGroup>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder={loadingUsers ? "Loading users..." : "Choose a user"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.tripCount} trips
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Selection */}
          {selectedUserId && (
            <div className="space-y-2">
              <Label htmlFor="trip-select">Select Trip</Label>
              <Select value={selectedTripId} onValueChange={setSelectedTripId} disabled={loadingTrips}>
                <SelectTrigger id="trip-select">
                  <SelectValue placeholder={loadingTrips ? "Loading trips..." : "Choose a trip"} />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.title} ({new Date(trip.startDate).toLocaleDateString()}) - {trip.segmentCount} segments
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Segment Selection */}
          {selectedTripId && (entityType === "segment" || entityType === "reservation") && (
            <div className="space-y-2">
              <Label htmlFor="segment-select">Select Segment</Label>
              <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId} disabled={loadingSegments}>
                <SelectTrigger id="segment-select">
                  <SelectValue placeholder={loadingSegments ? "Loading segments..." : "Choose a segment"} />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}: {segment.startTitle} → {segment.endTitle} ({segment.reservationCount} reservations)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reservation Selection */}
          {selectedSegmentId && entityType === "reservation" && (
            <div className="space-y-2">
              <Label htmlFor="reservation-select">Select Reservation</Label>
              <Select value={selectedReservationId} onValueChange={setSelectedReservationId} disabled={loadingReservations}>
                <SelectTrigger id="reservation-select">
                  <SelectValue placeholder={loadingReservations ? "Loading reservations..." : "Choose a reservation"} />
                </SelectTrigger>
                <SelectContent>
                  {reservations.map((reservation) => (
                    <SelectItem key={reservation.id} value={reservation.id}>
                      {reservation.name} ({reservation.category}: {reservation.type})
                      {reservation.confirmationNumber && ` - ${reservation.confirmationNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleLoadEntityContext} 
              disabled={!canLoadContext() || loadingContext}
              className="flex-1"
            >
              {loadingContext ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Load Entity Context
                </>
              )}
            </Button>
            {loadedEntityInfo && (
              <Button variant="outline" onClick={handleClearEntity}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Loaded Entity Info Display */}
          {loadedEntityInfo && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Loaded: {loadedEntityInfo.type.charAt(0).toUpperCase() + loadedEntityInfo.type.slice(1)}</span>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                {loadedEntityInfo.type === "trip" && (
                  <>
                    <div>• <strong>{loadedEntityInfo.title}</strong></div>
                    <div>• {loadedEntityInfo.segmentCount} segments</div>
                    <div>• User: {loadedEntityInfo.userName} ({loadedEntityInfo.userEmail})</div>
                    <div>• {loadedEntityInfo.messageCount} messages in conversation</div>
                  </>
                )}
                {loadedEntityInfo.type === "segment" && (
                  <>
                    <div>• <strong>{loadedEntityInfo.name}</strong></div>
                    <div>• {loadedEntityInfo.startTitle} → {loadedEntityInfo.endTitle}</div>
                    <div>• Trip: {loadedEntityInfo.tripTitle}</div>
                    <div>• {loadedEntityInfo.reservationCount} reservations</div>
                    <div>• {loadedEntityInfo.messageCount} messages in conversation</div>
                  </>
                )}
                {loadedEntityInfo.type === "reservation" && (
                  <>
                    <div>• <strong>{loadedEntityInfo.name}</strong></div>
                    <div>• Type: {loadedEntityInfo.category} - {loadedEntityInfo.reservationType}</div>
                    {loadedEntityInfo.confirmationNumber && <div>• Confirmation: {loadedEntityInfo.confirmationNumber}</div>}
                    <div>• Segment: {loadedEntityInfo.segmentName}</div>
                    <div>• Trip: {loadedEntityInfo.tripTitle}</div>
                    <div>• {loadedEntityInfo.messageCount} messages in conversation</div>
                  </>
                )}
                <div className="pt-2 border-t mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Chat Type: {chatType === "none" ? "TRIP" : chatType}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Scenarios</CardTitle>
          <CardDescription>Load pre-configured test contexts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => loadPreset("trip-creation")}>
              Trip Creation
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadPreset("email-parsing")}>
              Email Parsing
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadPreset("vague-dates")}>
              Vague Dates
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadPreset("segment-focus")}>
              Segment Focus
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadPreset("simple-query")}>
              Simple Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Context</CardTitle>
          <CardDescription>
            {loadedEntityInfo 
              ? "Context auto-filled from entity (you can override any field)" 
              : "Configure the context for prompt building"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userMessage">User Message</Label>
            <Textarea
              id="userMessage"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Enter the user's message..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="messageCount">Message Count</Label>
              <Input
                id="messageCount"
                type="number"
                value={messageCount}
                onChange={(e) => setMessageCount(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatType">Chat Type</Label>
              <Select value={chatType} onValueChange={setChatType}>
                <SelectTrigger id="chatType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="TRIP">Trip</SelectItem>
                  <SelectItem value="SEGMENT">Segment</SelectItem>
                  <SelectItem value="RESERVATION">Reservation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="hasExistingTrip"
              checked={hasExistingTrip}
              onCheckedChange={setHasExistingTrip}
            />
            <Label htmlFor="hasExistingTrip">Has Existing Trip</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"key": "value"}'
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={handleTest} disabled={testing || !userMessage} className="w-full">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Building Prompt...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Build Prompt
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Prompt successfully built</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold">{result.stats.pluginCount}</div>
                  <p className="text-xs text-muted-foreground">Plugins Used</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{result.stats.totalLength.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Characters</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{result.stats.estimatedTokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Estimated Tokens</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((1 - result.stats.totalLength / 11211) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Token Savings</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Active Plugins</Label>
                <div className="flex flex-wrap gap-2">
                  {result.activePlugins.map((plugin, idx) => (
                    <Badge key={idx} variant="secondary">
                      {plugin}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Prompt */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assembled Prompt</CardTitle>
                  <CardDescription>
                    Full prompt text with all active plugins
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPromptToClipboard}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {splitPromptSections(result.prompt).map((section, idx) => {
                  const sectionId = `section-${idx}`;
                  const isExpanded = expandedSections.has(sectionId);
                  
                  return (
                    <Collapsible key={idx}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => toggleSection(sectionId)}
                        >
                          <span className="font-mono text-sm">
                            Section {idx + 1} ({section.length} chars)
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 rounded-md bg-muted p-4">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {section}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
