"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Search,
  MapPin,
  Clock,
  Zap,
  Database,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Layers,
  Globe,
  Utensils,
  Building2,
  Compass,
  ShoppingBag,
  Coffee,
  Moon,
  Wine,
} from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ApiResponseViewer } from "../_components/api-response-viewer";
import { ConsolidatedPlaceCard } from "@/components/consolidated-place-card";
import type { ConsolidatedPlace, PlaceCategory } from "@/lib/types/consolidated-place";

// ============================================================================
// Types
// ============================================================================

interface TestResult {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
}

interface SearchOptions {
  includeWeather: boolean;
  includePricing: boolean;
  useAI: boolean;
  skipCache: boolean;
}

// Category options with icons
const CATEGORY_OPTIONS: { value: PlaceCategory; label: string; icon: React.ReactNode }[] = [
  { value: "restaurant", label: "Restaurants", icon: <Utensils className="h-4 w-4" /> },
  { value: "hotel", label: "Hotels", icon: <Building2 className="h-4 w-4" /> },
  { value: "attraction", label: "Attractions", icon: <Compass className="h-4 w-4" /> },
  { value: "activity", label: "Activities", icon: <Zap className="h-4 w-4" /> },
  { value: "cafe", label: "Cafes", icon: <Coffee className="h-4 w-4" /> },
  { value: "bar", label: "Bars", icon: <Wine className="h-4 w-4" /> },
  { value: "shopping", label: "Shopping", icon: <ShoppingBag className="h-4 w-4" /> },
  { value: "nightlife", label: "Nightlife", icon: <Moon className="h-4 w-4" /> },
];

// Example presets
const PRESETS = [
  { label: "Restaurants in Paris", query: "best restaurants", city: "Paris", country: "France", categories: ["restaurant"] },
  { label: "Hotels in Rome", query: "luxury hotels", city: "Rome", country: "Italy", categories: ["hotel"] },
  { label: "Things to do in Tokyo", query: "top attractions and activities", city: "Tokyo", country: "Japan", categories: ["attraction", "activity"] },
  { label: "Coffee in SF", query: "coffee shops", city: "San Francisco", country: "USA", categories: ["cafe"] },
];

// ============================================================================
// API Status Component
// ============================================================================

function ApiStatusBadges() {
  // In a real implementation, this would fetch from an API status endpoint
  // For now, we check if env vars would be set (they're server-side, so we show "unknown")
  const apis = [
    { name: "Google", key: "GOOGLE_MAPS_API_KEY" },
    { name: "Yelp", key: "YELP_API_KEY" },
    { name: "Amadeus", key: "AMADEUS_CLIENT_ID" },
    { name: "Weather", key: "OPENWEATHER_API_KEY" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {apis.map((api) => (
        <Badge key={api.name} variant="outline" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          {api.name}
        </Badge>
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        (APIs without keys will return mock data)
      </span>
    </div>
  );
}

// ============================================================================
// Stats Panel Component
// ============================================================================

function StatsPanel({ result }: { result: TestResult | null }) {
  if (!result?.response?.meta) return null;

  const { meta } = result.response;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Pipeline Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sources Queried */}
        <div>
          <Label className="text-xs text-muted-foreground">Sources Queried</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {meta.sourcesQueried?.map((source: string) => (
              <Badge key={source} variant="secondary" className="text-xs capitalize">
                {source}
              </Badge>
            ))}
          </div>
        </div>

        {/* Cache Status */}
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Cache: {meta.cacheHit ? (
              <Badge variant="default" className="ml-1">HIT</Badge>
            ) : (
              <Badge variant="outline" className="ml-1">MISS</Badge>
            )}
          </span>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Results: <strong>{meta.totalResults}</strong>
          </span>
        </div>

        <Separator />

        {/* Timing Breakdown */}
        <div>
          <Label className="text-xs text-muted-foreground">Timing Breakdown</Label>
          <div className="space-y-2 mt-2">
            {meta.timing?.aiGeneration && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Generation</span>
                <span className="font-mono">{meta.timing.aiGeneration}ms</span>
              </div>
            )}
            {meta.timing?.apiResolution && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">API Resolution</span>
                <span className="font-mono">{meta.timing.apiResolution}ms</span>
              </div>
            )}
            {meta.timing?.consolidation && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consolidation</span>
                <span className="font-mono">{meta.timing.consolidation}ms</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="font-mono">{meta.timing?.total || result.duration}ms</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ConsolidatedApiTestPage() {
  // Form state
  const [query, setQuery] = useState("best restaurants");
  const [city, setCity] = useState("Paris");
  const [country, setCountry] = useState("France");
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>(["restaurant"]);
  const [limit, setLimit] = useState([5]);
  const [options, setOptions] = useState<SearchOptions>({
    includeWeather: true,
    includePricing: true,
    useAI: true,
    skipCache: false,
  });

  // Result state
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Toggle category selection
  const toggleCategory = (category: PlaceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Apply preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setQuery(preset.query);
    setCity(preset.city);
    setCountry(preset.country);
    setSelectedCategories(preset.categories as PlaceCategory[]);
    setResult(null);
  };

  // Run the test
  const runTest = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/suggestions/consolidated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          location: {
            city: city || undefined,
            country: country || undefined,
          },
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          limit: limit[0],
          options: {
            includeWeather: options.includeWeather,
            includePricing: options.includePricing,
            useAI: options.useAI,
            skipCache: options.skipCache,
          },
        }),
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      setResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setResult({
        response: null,
        error: error.message,
        duration: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestions: ConsolidatedPlace[] = result?.response?.suggestions || [];

  return (
    <ApiTestLayout
      title="Consolidated API Pipeline"
      description="Test the unified multi-source place suggestions pipeline with Google, Yelp, Amadeus, and Weather APIs"
      breadcrumbs={[{ label: "Consolidated Pipeline" }]}
    >
      {/* API Status */}
      <Alert className="mb-6">
        <Layers className="h-4 w-4" />
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <span>This pipeline combines data from multiple APIs and consolidates results with AI-powered deduplication.</span>
            <ApiStatusBadges />
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Configuration
              </CardTitle>
              <CardDescription>
                Configure your search query and options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Query Input */}
              <div className="space-y-2">
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., best restaurants, luxury hotels, top attractions..."
                />
              </div>

              {/* Location Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Paris, Tokyo, New York..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country (optional)</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., France, Japan, USA..."
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={selectedCategories.includes(cat.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(cat.value)}
                      className="gap-1"
                    >
                      {cat.icon}
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Limit Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Results Limit</Label>
                  <span className="text-sm text-muted-foreground">{limit[0]} results</span>
                </div>
                <Slider
                  value={limit}
                  onValueChange={setLimit}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-3">
                <Label>Pipeline Options</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeWeather"
                      checked={options.includeWeather}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, includeWeather: !!checked }))
                      }
                    />
                    <label htmlFor="includeWeather" className="text-sm cursor-pointer">
                      Include Weather Data
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePricing"
                      checked={options.includePricing}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, includePricing: !!checked }))
                      }
                    />
                    <label htmlFor="includePricing" className="text-sm cursor-pointer">
                      Include Amadeus Pricing
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useAI"
                      checked={options.useAI}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useAI: !!checked }))
                      }
                    />
                    <label htmlFor="useAI" className="text-sm cursor-pointer">
                      Use AI Consolidation
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipCache"
                      checked={options.skipCache}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, skipCache: !!checked }))
                      }
                    />
                    <label htmlFor="skipCache" className="text-sm cursor-pointer">
                      Skip Cache
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={runTest}
                disabled={loading || !query}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Pipeline...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Run Consolidated Search
                  </>
                )}
              </Button>

              {/* Endpoint Info */}
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/suggestions/consolidated
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          {result && <StatsPanel result={result} />}

          {/* Status Card */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.response?.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Response Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HTTP Status</span>
                    <Badge variant={result.status === 200 ? "default" : "destructive"}>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success</span>
                    <span>{result.response?.success ? "Yes" : "No"}</span>
                  </div>
                  {result.error && (
                    <div className="text-red-500 text-xs mt-2">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="mt-8">
          <Tabs defaultValue="results" className="space-y-4">
            <TabsList>
              <TabsTrigger value="results" className="gap-2">
                <MapPin className="h-4 w-4" />
                Results ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="raw" className="gap-2">
                <Database className="h-4 w-4" />
                Raw Response
              </TabsTrigger>
            </TabsList>

            {/* Results Grid */}
            <TabsContent value="results">
              {suggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((place) => (
                    <ConsolidatedPlaceCard
                      key={place.id}
                      place={place}
                      variant="default"
                      onViewDetails={(p) => console.log("View details:", p)}
                      onAddToTrip={(p) => console.log("Add to trip:", p)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {result.response?.success ? (
                      <>
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No results found for this query.</p>
                        <p className="text-sm">Try adjusting your search terms or location.</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <p>An error occurred while fetching results.</p>
                        <p className="text-sm">{result.response?.error || result.error}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Raw Response */}
            <TabsContent value="raw">
              <ApiResponseViewer
                response={result.response}
                status={result.status}
                duration={result.duration}
                error={result.error}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ApiTestLayout>
  );
}
