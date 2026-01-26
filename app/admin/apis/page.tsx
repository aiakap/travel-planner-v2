"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Map, Plane, Bot, Image as ImageIcon, ArrowLeft } from "lucide-react";
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
      description: "Places, Geocoding, Routes, and Timezone APIs",
      icon: Map,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      status: health.googleMaps,
      endpoints: ["Places Autocomplete", "Places Details", "Geocoding", "Timezone", "Routes"],
      details: [
        { label: "API Key", status: health.googleMaps.hasKey },
        { label: "Public API Key", status: health.googleMaps.hasPublicKey },
      ],
    },
    {
      id: "amadeus",
      name: "Amadeus Travel",
      description: "Flight search, hotel booking, and airport data",
      icon: Plane,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      status: health.amadeus,
      endpoints: ["Flight Offers", "Hotel Search", "Airport Search", "Transfers"],
      details: [
        { label: "Client ID", status: health.amadeus.hasClientId },
        { label: "Client Secret", status: health.amadeus.hasClientSecret },
      ],
      info: `Environment: ${health.amadeus.environment}`,
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4o chat completions and structured generation",
      icon: Bot,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      status: health.openai,
      endpoints: ["Chat Completion", "Structured Generation", "Embeddings"],
      details: [
        { label: "API Key", status: health.openai.hasKey },
      ],
    },
    {
      id: "imagen",
      name: "Vertex AI Imagen",
      description: "AI-powered image generation with Imagen 4.0",
      icon: ImageIcon,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      status: health.imagen,
      endpoints: ["Generate Image", "Process Queue"],
      details: [
        { label: "Project ID", status: health.imagen.hasProject },
        { label: "Credentials", status: health.imagen.hasCredentials },
      ],
      info: `Model: ${health.imagen.model}, Location: ${health.imagen.location}`,
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
      <div className="grid gap-4 md:grid-cols-3">
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

      {/* API Cards */}
      <div className="grid gap-6 md:grid-cols-2">
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
