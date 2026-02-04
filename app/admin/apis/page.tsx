"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Map, Plane, Bot, Image as ImageIcon, ArrowLeft, Sparkles, Cloud, Utensils, Ticket, DollarSign } from "lucide-react";
import { ApiStatusBadge, ApiStatusDetail } from "./_components/api-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface HealthStatus {
  googleMaps: {
    configured: boolean;
    hasKey: boolean;
    hasPublicKey: boolean;
  };
  amadeus: {
    configured: boolean;
    hasClientId: boolean;
    hasClientSecret: boolean;
    environment: string;
  };
  openai: {
    configured: boolean;
    hasKey: boolean;
  };
  imagen: {
    configured: boolean;
    hasProject: boolean;
    hasCredentials: boolean;
    location: string;
    model: string;
  };
  uploadthing: {
    configured: boolean;
    hasSecret: boolean;
    hasAppId: boolean;
  };
  weather: {
    configured: boolean;
    hasKey: boolean;
  };
  yelp: {
    configured: boolean;
    hasKey: boolean;
  };
  viator: {
    configured: boolean;
    hasKey: boolean;
  };
  timestamp: string;
}

export default function ApiTestingPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/admin/health");
      if (!response.ok) throw new Error("Failed to fetch health status");
      const data = await response.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test and monitor external API integrations
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load API health status: {error || "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const apis = [
    {
      id: "google-maps",
      name: "Google Maps Platform",
      description: "Places, Geocoding, Routes, and Timezone APIs with interactive maps",
      icon: Map,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      status: health.googleMaps,
      endpoints: ["Interactive Maps", "Static Maps", "Street View", "Routes", "Places"],
      details: [
        { label: "API Key", status: health.googleMaps.hasKey },
        { label: "Public API Key", status: health.googleMaps.hasPublicKey },
      ],
    },
    {
      id: "amadeus",
      name: "Amadeus Travel",
      description: "Flight search, hotel booking, airport data with map visualizations",
      icon: Plane,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      status: health.amadeus,
      endpoints: ["Flight Offers", "Hotel Search", "Airport Search", "Transfers", "Maps"],
      details: [
        { label: "Client ID", status: health.amadeus.hasClientId },
        { label: "Client Secret", status: health.amadeus.hasClientSecret },
      ],
      info: `Environment: ${health.amadeus.environment}`,
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "Chat, structured generation, vision, and itinerary generation",
      icon: Bot,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      status: health.openai,
      endpoints: ["Chat", "Structured", "Itinerary", "Extraction", "Vision"],
      details: [
        { label: "API Key", status: health.openai.hasKey },
      ],
    },
    {
      id: "imagen",
      name: "Vertex AI Imagen",
      description: "AI image generation with model comparison and batch processing",
      icon: ImageIcon,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      status: health.imagen,
      endpoints: ["Single Image", "Batch Generation", "Travel Presets"],
      details: [
        { label: "Project ID", status: health.imagen.hasProject },
        { label: "Credentials", status: health.imagen.hasCredentials },
      ],
      info: `Model: ${health.imagen.model}, Location: ${health.imagen.location}`,
    },
    {
      id: "ai-content",
      name: "AI Content Generation",
      description: "Generate travel content: itineraries, descriptions, and guides",
      icon: Sparkles,
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      status: health.openai, // Uses OpenAI, so same status
      endpoints: ["Trip Suggestions", "Place Descriptions", "Travel Dossier"],
      details: [
        { label: "API Key", status: health.openai.hasKey },
      ],
    },
    {
      id: "weather",
      name: "Weather API",
      description: "OpenWeatherMap integration for weather data and travel advisories",
      icon: Cloud,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      status: health.weather,
      endpoints: ["Current Weather", "5-Day Forecast", "Multi-City", "Travel Advisory", "Alerts"],
      details: [
        { label: "API Key", status: health.weather.hasKey },
      ],
      info: health.weather.configured ? "OpenWeather API configured" : "Mock data available for testing",
    },
    {
      id: "restaurants",
      name: "Restaurants API",
      description: "Yelp Fusion API for restaurant search, details, and reviews",
      icon: Utensils,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      status: health.yelp,
      endpoints: ["Search", "Details", "Reviews", "Photos", "Reservations"],
      details: [
        { label: "API Key", status: health.yelp.hasKey },
      ],
      info: health.yelp.configured ? "Yelp API configured" : "Mock data available for testing",
    },
    {
      id: "activities",
      name: "Activities & Tours API",
      description: "Viator API for activities, tours, and experiences",
      icon: Ticket,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      status: health.viator,
      endpoints: ["Search", "Details", "Categories", "Availability", "Reviews"],
      details: [
        { label: "API Key", status: health.viator.hasKey },
      ],
      info: health.viator.configured ? "Viator API configured" : "Mock data available for testing",
    },
  ];

  const configuredCount = apis.filter((api) => api.status.configured).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Testing</h1>
        <p className="text-muted-foreground mt-2">
          Test and monitor external API integrations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apis.length}</div>
            <p className="text-xs text-muted-foreground">
              Available API integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configuredCount}</div>
            <p className="text-xs text-muted-foreground">
              APIs with valid credentials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apis.reduce((sum, api) => sum + api.endpoints.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total testable endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {configuredCount === apis.length ? "Ready" : "Partial"}
            </div>
            <p className="text-xs text-muted-foreground">
              System configuration status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common testing and management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="w-full" onClick={fetchHealth}>
              <Loader2 className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/apis/google-maps">
                <Map className="mr-2 h-4 w-4" />
                Test Maps
              </Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              const stats = {
                totalAPIs: apis.length,
                configured: configuredCount,
                endpoints: apis.reduce((sum, api) => sum + api.endpoints.length, 0),
              };
              alert(`Cost Report:\n\nTotal APIs: ${stats.totalAPIs}\nConfigured: ${stats.configured}\nEndpoints: ${stats.endpoints}\n\nSee browser console for detailed cost tracking.`);
              console.log('API Cost Report:', stats);
            }}>
              <DollarSign className="mr-2 h-4 w-4" />
              Cost Report
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/apis/imagen">
                <Sparkles className="mr-2 h-4 w-4" />
                Test Imagen
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apis.map((api) => {
          const Icon = api.icon;
          return (
            <Card key={api.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${api.bgColor}`}>
                      <Icon className={`h-6 w-6 ${api.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{api.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {api.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ApiStatusBadge configured={api.status.configured} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Endpoints</h4>
                  <div className="flex flex-wrap gap-2">
                    {api.endpoints.map((endpoint) => (
                      <Badge key={endpoint} variant="secondary">
                        {endpoint}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Configuration</h4>
                  <ApiStatusDetail items={api.details} />
                </div>

                {api.info && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {api.info}
                  </div>
                )}

                <Link href={`/admin/apis/${api.id}`}>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!api.status.configured}
                  >
                    Test {api.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last checked: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
