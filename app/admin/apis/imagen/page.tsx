"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, Download } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ApiResponseViewer } from "../_components/api-response-viewer";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface TestResult {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  aspectRatio: string;
  generatedAt: string;
}

export default function ImagenTestPage() {
  const [prompt, setPrompt] = useState("A serene mountain landscape with a lake reflecting snow-capped peaks at sunset, professional photography, high detail");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  const testImageGeneration = async () => {
    setLoading(true);
    setGeneratedImage(null);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/test/imagen-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
        }),
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      setResult({
        response: data,
        status: response.status,
        duration,
      });

      if (data.success && data.imageUrl) {
        setGeneratedImage({
          url: data.imageUrl,
          prompt: data.prompt,
          aspectRatio: data.aspectRatio,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      setResult({
        response: null,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (generatedImage) {
      try {
        // Fetch the image as a blob
        const response = await fetch(generatedImage.url);
        const blob = await response.blob();
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `imagen-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download image");
      }
    }
  };

  const aspectRatioOptions = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:4", label: "Portrait (3:4)" },
  ];

  return (
    <ApiTestLayout
      title="Vertex AI Imagen"
      description="Test Google's Imagen 4.0 AI image generation"
      breadcrumbs={[{ label: "Imagen" }]}
    >
      <Alert className="mb-6">
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          These tests use Google Vertex AI with your configured credentials. Image generation consumes API quota and may incur costs.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Generation</CardTitle>
              <CardDescription>
                Generate images using Imagen 4.0
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  placeholder="Describe the image you want to generate..."
                />
                <p className="text-xs text-muted-foreground">
                  Be descriptive and specific for best results
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatioOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={testImageGeneration}
                disabled={loading || !prompt}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Image
              </Button>

              <div className="space-y-2">
                <Label className="text-sm">Example Prompts</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setPrompt("A cozy Parisian cafe with outdoor seating, evening ambiance, string lights, people enjoying coffee");
                      setResult(null);
                      setGeneratedImage(null);
                    }}
                  >
                    Paris Cafe
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setPrompt("Modern minimalist hotel room with city view, large windows, natural light, clean design");
                      setResult(null);
                      setGeneratedImage(null);
                    }}
                  >
                    Hotel Room
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setPrompt("Tropical beach resort at sunset, palm trees, turquoise water, luxury villa in background");
                      setResult(null);
                      setGeneratedImage(null);
                    }}
                  >
                    Beach Resort
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /image-generator/api/generate-image
              </div>
            </CardContent>
          </Card>

          {result && (
            <ApiResponseViewer
              response={result.response}
              status={result.status}
              duration={result.duration}
              error={result.error}
            />
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="font-medium">Generating image...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take 10-30 seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedImage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Image</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Prompt</div>
                    <div className="text-sm">{generatedImage.prompt}</div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Aspect Ratio</div>
                      <Badge variant="secondary">{generatedImage.aspectRatio}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Generated</div>
                      <div className="text-sm">
                        {new Date(generatedImage.generatedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !generatedImage && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Generated image will appear here
                </p>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Imagen 4.0</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">High Quality</div>
                  <div className="text-muted-foreground">
                    State-of-the-art image generation with fine details
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Multiple Aspect Ratios</div>
                  <div className="text-muted-foreground">
                    Support for square, landscape, and portrait formats
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Fast Generation</div>
                  <div className="text-muted-foreground">
                    Typically completes in 10-30 seconds
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ApiTestLayout>
  );
}
