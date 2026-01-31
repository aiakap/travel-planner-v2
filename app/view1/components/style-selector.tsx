"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Check, Clock, Loader2, ImagePlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTripTemplates, type TripTemplate } from "@/lib/actions/get-trip-templates";
import { updateTripTemplate } from "@/lib/actions/update-trip-template";
import { regenerateTemplateImage } from "@/lib/actions/regenerate-template-image";
import { generateStyleImage } from "@/lib/actions/generate-style-image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StyleSelectorProps {
  tripId: string;
  currentStyleId?: string | null;
  currentStyleName?: string | null;
}

export function StyleSelector({
  tripId,
  currentStyleId,
  currentStyleName,
}: StyleSelectorProps) {
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [tripId]);

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

  const handleStyleChange = async (newStyleId: string) => {
    // Check if this is a "generate" action
    if (newStyleId.startsWith("generate:")) {
      const styleId = newStyleId.replace("generate:", "");
      const template = templates.find((t) => t.id === styleId);
      if (template) {
        await handleGenerateStyle(template);
      }
      return;
    }

    // Don't do anything if selecting the same style
    if (newStyleId === currentStyleId) return;

    // Find the selected template
    const template = templates.find((t) => t.id === newStyleId);
    if (!template) return;

    // If no cached image, show toast and don't switch
    if (!template.hasImage) {
      toast.info("This style needs to be generated first", {
        description: "Select 'Generate' to create it.",
        duration: 3000,
      });
      return;
    }

    // Has cached image, proceed with switch
    setIsChanging(true);
    try {
      await updateTripTemplate(tripId, newStyleId);
      toast.success("Style updated!", {
        description: `Switched to ${template.name}`,
      });
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Failed to update style:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update style. Please try again.";
      toast.error("Failed to update style", {
        description: errorMessage,
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handleGenerateStyle = async (template: TripTemplate) => {
    try {
      await generateStyleImage(tripId, template.id);
      toast.info("Generating image", {
        description: `${template.name} will be ready soon.`,
        duration: 4000,
      });
      await loadTemplates();
    } catch (error) {
      console.error("Failed to queue image generation:", error);
      toast.error("Failed to start generation", {
        description: "Please try again.",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!currentStyleId) return;

    setIsRegenerating(true);
    try {
      await regenerateTemplateImage(tripId);
      toast.info("Regenerating image", {
        description: "Your new image will show up when ready.",
        duration: 5000,
      });
      await loadTemplates();
    } catch (error) {
      console.error("Failed to regenerate image:", error);
      toast.error("Failed to regenerate image", {
        description: "Please try again.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Get state indicator for a template
  const getStateIcon = (template: TripTemplate) => {
    if (template.isGenerating) {
      return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
    }
    if (template.isCurrent) {
      return <Check className="h-3 w-3 text-green-400" />;
    }
    if (!template.hasImage) {
      return <Clock className="h-3 w-3 text-white/40" />;
    }
    return null;
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Style Dropdown */}
      <Select
        value={currentStyleId || undefined}
        onValueChange={handleStyleChange}
        disabled={isChanging || loading}
      >
        <SelectTrigger className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 hover:text-white transition-all min-w-[140px] h-8 text-xs font-medium">
          <SelectValue placeholder={loading ? "Loading..." : "Select style"} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading styles...</span>
              </div>
            </SelectItem>
          ) : templates.length === 0 ? (
            <SelectItem value="empty" disabled>
              No styles available
            </SelectItem>
          ) : (
            templates.map((template) => (
              <SelectItem
                key={template.id}
                value={template.id}
                disabled={!template.hasImage && !template.isGenerating}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="flex-1">{template.name}</span>
                  {getStateIcon(template)}
                  {!template.hasImage && !template.isGenerating && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateStyle(template);
                      }}
                      className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Small Regenerate Button */}
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating || !currentStyleId || loading}
        className="p-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 rounded-md hover:bg-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="Regenerate current style"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")}
        />
      </button>
    </div>
  );
}
