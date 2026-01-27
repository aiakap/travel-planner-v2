"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, Download, Sparkles, Grid3x3 } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ModelSelector } from "../_components/model-selector";
import { BatchResultViewer, BatchResult } from "../_components/batch-result-viewer";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { getAllImageModels, calculateImageCost } from "@/lib/utils/model-pricing";

interface GeneratedImage {
  url: string;
  prompt: string;
  aspectRatio: string;
  generatedAt: string;
  model?: string;
  duration?: number;
}

// Travel-specific prompt presets
const TRAVEL_PRESETS = [
  {
    id: "hotel-room",
    name: "Luxury Hotel Room",
    prompt: "Modern luxury hotel room with floor-to-ceiling windows overlooking a city skyline, king-size bed with white linens, minimalist design, natural lighting, marble bathroom visible, professional interior photography",
    category: "Accommodation",
  },
  {
    id: "destination-landscape",
    name: "Destination Landscape",
    prompt: "Breathtaking coastal landscape at golden hour, turquoise waters, white sand beach, palm trees, dramatic cliffs in background, professional travel photography, vibrant colors",
    category: "Destinations",
  },
  {
    id: "restaurant-ambiance",
    name: "Restaurant Interior",
    prompt: "Upscale restaurant interior with elegant table settings, ambient lighting, exposed brick walls, modern chandeliers, busy dining atmosphere, professional food photography style",
    category: "Dining",
  },
  {
    id: "activity-adventure",
    name: "Adventure Activity",
    prompt: "Exciting outdoor adventure scene, person hiking on mountain trail with panoramic views, backpack and gear visible, dramatic landscape, action photography, inspiring composition",
    category: "Activities",
  },
  {
    id: "city-architecture",
    name: "City Architecture",
    prompt: "Iconic city architecture, historic buildings mixed with modern skyscrapers, busy street scene, blue hour lighting, long exposure effect, professional urban photography",
    category: "Urban",
  },
  {
    id: "beach-resort",
    name: "Beach Resort",
    prompt: "Tropical beach resort with infinity pool overlooking ocean, luxury cabanas, palm trees, sunset colors, professional resort photography, inviting atmosphere",
    category: "Accommodation",
  },
];

export default function ImagenTestPage() {
  const imageModels = getAllImageModels();
  
  // Single Generation State
  const [prompt, setPrompt] = useState("A serene mountain landscape with a lake reflecting snow-capped peaks at sunset, professional photography, high detail");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [model, setModel] = useState("imagen-4.0-generate-001");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  // Batch Generation State
  const [batchPrompt, setBatchPrompt] = useState("Luxury hotel room interior, modern design");
  const [batchAspectRatio, setBatchAspectRatio] = useState("16:9");
  const [batchCount, setBatchCount] = useState("3");
  const [batchModel, setBatchModel] = useState("imagen-4.0-generate-001");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  // Preset State
  const [selectedPreset, setSelectedPreset] = useState(TRAVEL_PRESETS[0].id);
  const [presetAspectRatio, setPresetAspectRatio] = useState("16:9");
  const [presetModel, setPresetModel] = useState("imagen-4.0-generate-001");
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetImage, setPresetImage] = useState<GeneratedImage | null>(null);

  const aspectRatioOptions = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:4", label: "Portrait (3:4)" },
  ];

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
          model,
        }),
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGeneratedImage({
          url: data.imageUrl,
          prompt: data.prompt,
          aspectRatio: data.aspectRatio,
          generatedAt: new Date().toISOString(),
          model: data.model,
          duration,
        });
      }
    } catch (error: any) {
      console.error("Generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const testBatchGeneration = async () => {
    setBatchLoading(true);
    setBatchResults([]);

    try {
      const response = await fetch("/api/admin/test/imagen-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: batchPrompt,
          aspectRatio: batchAspectRatio,
          count: parseInt(batchCount),
          model: batchModel,
        }),
      });

      const data = await response.json();

      if (data.success && data.results) {
        const results: BatchResult[] = data.results
          .filter((r: any) => r.success)
          .map((r: any) => ({
            id: r.filename,
            type: "image" as const,
            content: r.imageUrl,
            title: `Image ${r.index + 1}`,
            metadata: {
              model: data.model,
              aspectRatio: batchAspectRatio,
              duration: data.duration / data.successCount,
              cost: calculateImageCost(1, batchModel).totalCost,
            },
          }));
        setBatchResults(results);
      }
    } catch (error: any) {
      console.error("Batch generation error:", error);
    } finally {
      setBatchLoading(false);
    }
  };

  const testPresetGeneration = async () => {
    const preset = TRAVEL_PRESETS.find(p => p.id === selectedPreset);
    if (!preset) return;

    setPresetLoading(true);
    setPresetImage(null);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/test/imagen-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: preset.prompt,
          aspectRatio: presetAspectRatio,
          model: presetModel,
        }),
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (data.success && data.imageUrl) {
        setPresetImage({
          url: data.imageUrl,
          prompt: preset.prompt,
          aspectRatio: data.aspectRatio,
          generatedAt: new Date().toISOString(),
          model: data.model,
          duration,
        });
      }
    } catch (error: any) {
      console.error("Preset generation error:", error);
    } finally {
      setPresetLoading(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string = `imagen-${Date.now()}.png`) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image");
    }
  };

  const handleBatchDownload = (result: BatchResult) => {
    downloadImage(result.content, `${result.id}.png`);
  };

  return (
    <ApiTestLayout
      title="Vertex AI Imagen"
      description="Test Google's Imagen AI image generation with model comparison"
      breadcrumbs={[{ label: "Imagen" }]}
    >
      <Alert className="mb-6">
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          These tests use Google Vertex AI. Image generation consumes API quota and incurs costs.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">
            <ImageIcon className="h-4 w-4 mr-2" />
            Single Image
          </TabsTrigger>
          <TabsTrigger value="batch">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Batch Generation
          </TabsTrigger>
          <TabsTrigger value="presets">
            <Sparkles className="h-4 w-4 mr-2" />
            Travel Presets
          </TabsTrigger>
        </TabsList>

        {/* Single Image Generation */}
        <TabsContent value="single" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Image Generation</CardTitle>
                  <CardDescription>
                    Generate a single image with model selection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ModelSelector
                    models={imageModels}
                    selectedModel={model}
                    onModelChange={setModel}
                    label="Model"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="prompt">Image Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      placeholder="Describe the image you want to generate..."
                    />
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

                  <div className="text-xs text-muted-foreground">
                    <strong>Estimated cost:</strong> ${calculateImageCost(1, model).totalCost.toFixed(3)}
                  </div>
                </CardContent>
              </Card>
            </div>

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
                        onClick={() => downloadImage(generatedImage.url)}
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
                      <div className="flex gap-4 flex-wrap">
                        <div>
                          <div className="text-sm text-muted-foreground">Model</div>
                          <Badge variant="outline">{generatedImage.model}</Badge>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Aspect Ratio</div>
                          <Badge variant="secondary">{generatedImage.aspectRatio}</Badge>
                        </div>
                        {generatedImage.duration && (
                          <div>
                            <div className="text-sm text-muted-foreground">Duration</div>
                            <div className="text-sm">{(generatedImage.duration / 1000).toFixed(1)}s</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Batch Generation */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Image Generation</CardTitle>
              <CardDescription>
                Generate multiple images with the same prompt for comparison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={imageModels}
                selectedModel={batchModel}
                onModelChange={setBatchModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="batch-prompt">Image Prompt</Label>
                <Textarea
                  id="batch-prompt"
                  value={batchPrompt}
                  onChange={(e) => setBatchPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe the images you want to generate..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch-aspect-ratio">Aspect Ratio</Label>
                  <Select value={batchAspectRatio} onValueChange={setBatchAspectRatio}>
                    <SelectTrigger id="batch-aspect-ratio">
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

                <div className="space-y-2">
                  <Label htmlFor="batch-count">Number of Images</Label>
                  <Select value={batchCount} onValueChange={setBatchCount}>
                    <SelectTrigger id="batch-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 images</SelectItem>
                      <SelectItem value="3">3 images</SelectItem>
                      <SelectItem value="4">4 images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={testBatchGeneration}
                disabled={batchLoading || !batchPrompt}
                className="w-full"
              >
                {batchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate {batchCount} Images
              </Button>

              <div className="text-xs text-muted-foreground">
                <strong>Estimated total cost:</strong> ${calculateImageCost(parseInt(batchCount), batchModel).totalCost.toFixed(3)}
              </div>
            </CardContent>
          </Card>

          {batchLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="font-medium">Generating {batchCount} images...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take {parseInt(batchCount) * 15}-{parseInt(batchCount) * 30} seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {batchResults.length > 0 && (
            <BatchResultViewer
              results={batchResults}
              title="Generated Images"
              description="Compare variations generated from the same prompt"
              columns={3}
              onDownload={handleBatchDownload}
            />
          )}
        </TabsContent>

        {/* Travel Presets */}
        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Travel-Specific Presets</CardTitle>
              <CardDescription>
                Pre-configured prompts optimized for travel imagery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector
                models={imageModels}
                selectedModel={presetModel}
                onModelChange={setPresetModel}
                label="Model"
              />

              <div className="space-y-2">
                <Label htmlFor="preset-select">Select Preset</Label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger id="preset-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAVEL_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {preset.category}
                          </Badge>
                          {preset.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPreset && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-xs font-medium mb-1">Prompt:</div>
                  <div className="text-xs text-muted-foreground">
                    {TRAVEL_PRESETS.find(p => p.id === selectedPreset)?.prompt}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="preset-aspect-ratio">Aspect Ratio</Label>
                <Select value={presetAspectRatio} onValueChange={setPresetAspectRatio}>
                  <SelectTrigger id="preset-aspect-ratio">
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
                onClick={testPresetGeneration}
                disabled={presetLoading}
                className="w-full"
              >
                {presetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate from Preset
              </Button>
            </CardContent>
          </Card>

          {presetLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="font-medium">Generating preset image...</p>
              </CardContent>
            </Card>
          )}

          {presetImage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Image</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadImage(presetImage.url)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={presetImage.url}
                    alt={presetImage.prompt}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
