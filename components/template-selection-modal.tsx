"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { getTripTemplates, type TripTemplate } from "@/lib/actions/get-trip-templates";
import { updateTripTemplate } from "@/lib/actions/update-trip-template";
import { regenerateTemplateImage } from "@/lib/actions/regenerate-template-image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TemplateSelectionModalProps {
  tripId: string;
  currentStyleId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateSelectionModal({
  tripId,
  currentStyleId,
  isOpen,
  onClose,
}: TemplateSelectionModalProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerationMessage, setShowGenerationMessage] = useState(false);
  const [generatingStyleName, setGeneratingStyleName] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setShowGenerationMessage(false);
    }
  }, [isOpen, tripId]);

  // Poll for updates while modal is open and there are generating images
  useEffect(() => {
    if (!isOpen) return;
    
    const hasGenerating = templates.some(t => t.isGenerating);
    if (!hasGenerating) return;

    const interval = setInterval(() => {
      loadTemplates();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTripTemplates(tripId);
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load styles", {
        description: "Please try refreshing the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: TripTemplate) => {
    if (template.isCurrent) return;

    setSelecting(true);
    setSelectedId(template.id);
    try {
      const result = await updateTripTemplate(tripId, template.id);
      
      if (result.hasExistingImage) {
        // Image exists, page will refresh with new image
        toast.success("Style updated!", {
          description: `Switched to ${result.styleName}`,
        });
        // Close modal first to prevent race conditions
        onClose();
        // Delay refresh to ensure modal closes cleanly
        setTimeout(() => {
          router.refresh();
        }, 100);
      } else {
        // Image is being generated
        setGeneratingStyleName(result.styleName);
        setShowGenerationMessage(true);
        await loadTemplates();
        
        toast.info("Creating your new style", {
          description: `${result.styleName} is being generated. This takes 30-60 seconds.`,
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Failed to update template:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update template. Please try again.";
      toast.error("Failed to update style", {
        description: errorMessage,
      });
    } finally {
      setSelecting(false);
      setSelectedId(null);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await regenerateTemplateImage(tripId);
      await loadTemplates();
      toast.info("Regenerating image", {
        description: "Your new image will appear in 30-60 seconds.",
        duration: 6000,
      });
    } catch (error) {
      console.error("Failed to regenerate image:", error);
      toast.error("Failed to regenerate image", {
        description: "Please try again.",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleClose = () => {
    const hasGenerating = templates.some(t => t.isGenerating);
    if (hasGenerating) {
      toast.info("Image generating in background", {
        description: "Your new style will appear when ready. Feel free to continue using the app.",
        duration: 5000,
      });
    }
    onClose();
  };

  const currentTemplate = templates.find((t) => t.isCurrent);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Choose Image Style
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Generation status message */}
            {showGenerationMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Creating your new style: {generatingStyleName}
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Your image is being generated and will appear in 30-60 seconds. You can close this modal and continue using the app.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>The hero image will update automatically when ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  disabled={selecting || template.isCurrent || template.isGenerating}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    template.isCurrent
                      ? "border-blue-500 bg-blue-50"
                      : template.isGenerating
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg"
                  } ${selecting && selectedId === template.id ? "opacity-50" : ""} ${
                    template.isGenerating ? "opacity-75" : ""
                  }`}
                >
                  {/* Preview gradient based on theme */}
                  <div
                    className={`h-24 rounded-lg mb-3 ${getThemeGradient(template.slug)}`}
                  />

                  {/* Template info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {template.name}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                        {template.isCurrent && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                        {template.isGenerating && (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating
                          </Badge>
                        )}
                        {template.hasImage && !template.isGenerating && (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                        {!template.hasImage && !template.isGenerating && !template.isCurrent && (
                          <Badge variant="outline" className="text-xs text-slate-500">
                            <Clock className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-sm text-slate-600">
                        {template.description}
                      </p>
                    )}
                  </div>

                  {selecting && selectedId === template.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <DialogFooter className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Cost: $0.04 per generation
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                {currentTemplate && (
                  <Button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    variant="default"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      "Regenerate Current"
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get gradient based on theme slug
function getThemeGradient(slug: string): string {
  const gradients: Record<string, string> = {
    retro_gouache: "bg-gradient-to-br from-amber-400 via-orange-400 to-red-400",
    golden_hour: "bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500",
    map_journey: "bg-gradient-to-br from-blue-400 via-teal-400 to-green-400",
    scrapbook_collage: "bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300",
  };
  return gradients[slug] || "bg-gradient-to-br from-slate-300 to-slate-400";
}
