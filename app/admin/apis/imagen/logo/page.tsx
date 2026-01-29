"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, RefreshCw, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { ApiTestLayout } from "../../_components/api-test-layout";
import { ModelSelector } from "../../_components/model-selector";
import { LogoSelectorGrid, LogoResult } from "../../_components/logo-selector-grid";
import { getAllImageModels, calculateImageCost } from "@/lib/utils/model-pricing";

const LOGO_PROMPT_TEMPLATE = (userDescription: string) => `${userDescription}

Style: Clean vector logo design, simple shapes, scalable, professional
Format: Solid background, centered composition
Colors: Limited palette (2-4 colors max), brand-appropriate
Design: Minimalist, memorable, works at any size
Technical: High contrast, clear silhouette, no fine details`;

export default function LogoMakerPage() {
  const imageModels = getAllImageModels();
  
  // State
  const [model, setModel] = useState("gemini-3-pro-image-preview");
  const [currentPrompt, setCurrentPrompt] = useState("Modern tech startup logo with abstract geometric shapes, minimalist design");
  const [logos, setLogos] = useState<LogoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [showRefinement, setShowRefinement] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLogos = logos.filter((logo) => logo.selected);
  const selectedCount = selectedLogos.length;

  const generateLogos = async (prompt: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const enhancedPrompt = LOGO_PROMPT_TEMPLATE(prompt);
      const response = await fetch("/api/admin/test/imagen-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          aspectRatio: "1:1",
          count: 4,
          model,
        }),
      });

      const data = await response.json();

      if (data.success && data.results) {
        const newGeneration = generationCount + 1;
        const newLogos: LogoResult[] = data.results
          .filter((r: any) => r.success)
          .map((r: any, index: number) => ({
            id: `gen${newGeneration}-${index}`,
            url: r.imageUrl,
            selected: false,
            originalPrompt: prompt,
            generation: newGeneration,
          }));

        setLogos(newLogos);
        setGenerationCount(newGeneration);
        setShowRefinement(false);
        setRefinedPrompt("");
      } else {
        setError(data.error || "Failed to generate logos");
      }
    } catch (err: any) {
      console.error("Logo generation error:", err);
      setError(err.message || "Failed to generate logos");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialGenerate = () => {
    generateLogos(currentPrompt);
  };

  const handleToggleSelect = (id: string) => {
    setLogos((prev) =>
      prev.map((logo) =>
        logo.id === id ? { ...logo, selected: !logo.selected } : logo
      )
    );
  };

  const handleRefineSelected = async () => {
    if (selectedCount === 0) return;

    setRefining(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/logo/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPrompt: currentPrompt,
          selectedCount,
          generationNumber: generationCount,
        }),
      });

      const data = await response.json();

      if (data.success && data.refinedPrompt) {
        setRefinedPrompt(data.refinedPrompt);
        setShowRefinement(true);
      } else {
        setError(data.error || "Failed to refine prompt");
      }
    } catch (err: any) {
      console.error("Prompt refinement error:", err);
      setError(err.message || "Failed to refine prompt");
    } finally {
      setRefining(false);
    }
  };

  const handleGenerateFromRefined = () => {
    if (!refinedPrompt.trim()) return;
    setCurrentPrompt(refinedPrompt);
    generateLogos(refinedPrompt);
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
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
      alert("Failed to download logo");
    }
  };

  const costBreakdown = calculateImageCost(4, model);
  const cost = costBreakdown.totalCost;

  return (
    <ApiTestLayout
      title="Logo Maker"
      description="AI-powered logo generation with iterative refinement"
      breadcrumbs={[
        { label: "Imagen", href: "/admin/apis/imagen" },
        { label: "Logo Maker" },
      ]}
    >
      <Alert className="mb-6">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Generate 4 logo variations, select your favorites, and refine with AI assistance. Each generation uses {model === "gemini-3-pro-image-preview" ? "Gemini 3 Pro" : "Imagen"} at ${cost.toFixed(2)} per batch.
        </AlertDescription>
      </Alert>

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Initial Generation Card */}
        <Card>
          <CardHeader>
            <CardTitle>1. Generate Initial Logos</CardTitle>
            <CardDescription>
              Describe your logo concept and generate 4 variations
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
              <Label htmlFor="logo-prompt">Logo Description</Label>
              <Textarea
                id="logo-prompt"
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                placeholder="E.g., Modern tech startup logo with abstract geometric shapes"
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Describe your logo concept. The system will automatically add professional logo design specifications.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Estimated cost: <Badge variant="secondary">${cost.toFixed(2)}</Badge>
              </div>
              <Button
                onClick={handleInitialGenerate}
                disabled={loading || !currentPrompt.trim()}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate 4 Logos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generated Logos */}
        {logos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>2. Select Your Favorites</CardTitle>
                  <CardDescription>
                    Choose 1-2 logos to refine (Generation {generationCount})
                  </CardDescription>
                </div>
                {selectedCount > 0 && (
                  <Badge variant="default" className="text-sm">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {selectedCount} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <LogoSelectorGrid
                logos={logos}
                onToggleSelect={handleToggleSelect}
                onDownload={handleDownload}
                maxSelections={2}
                disabled={loading || refining}
              />

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleRefineSelected}
                  disabled={selectedCount === 0 || refining || loading}
                  size="lg"
                  variant="default"
                >
                  {refining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refine Selected ({selectedCount})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refined Prompt */}
        {showRefinement && refinedPrompt && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>3. Review & Generate</CardTitle>
              <CardDescription>
                AI-refined prompt based on your selections. Edit if needed, then generate 4 more logos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refined-prompt">Refined Prompt</Label>
                <Textarea
                  id="refined-prompt"
                  value={refinedPrompt}
                  onChange={(e) => setRefinedPrompt(e.target.value)}
                  rows={4}
                  disabled={loading}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The AI analyzed your selections and created this refined prompt. You can edit it before generating.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Estimated cost: <Badge variant="secondary">${cost.toFixed(2)}</Badge>
                </div>
                <Button
                  onClick={handleGenerateFromRefined}
                  disabled={loading || !refinedPrompt.trim()}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate 4 More
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {logos.length === 0 && !loading && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">1</Badge>
                  <span>Enter a description of your logo concept and click "Generate 4 Logos"</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">2</Badge>
                  <span>Review the 4 generated logos and select 1-2 favorites using the checkboxes</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">3</Badge>
                  <span>Click "Refine Selected" to let AI create an improved prompt based on your choices</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">4</Badge>
                  <span>Edit the refined prompt if desired, then generate 4 more variations</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">5</Badge>
                  <span>Repeat until you find the perfect logo, then download your favorite</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </ApiTestLayout>
  );
}
