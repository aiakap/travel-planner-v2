"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Check, Clock } from "lucide-react";
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
    // Don't do anything if selecting the same style
    if (newStyleId === currentStyleId) return;

    // Find the selected template
    const template = templates.find((t) => t.id === newStyleId);

    if (!template) return;

    // If no cached image, show toast and don't switch
    if (!template.hasImage) {
      toast.info("Generating image, come back soon", {
        description: `${template.name} needs to be generated first.`,
        duration: 4000,
      });
      return; // Don't change the value
    }

    // Has cached image, proceed with switch
    setIsChanging(true);
    try {
      const result = await updateTripTemplate(tripId, newStyleId);
      toast.success("Style updated!", {
        description: `Switched to ${template.name}`,
      });
      // Delay refresh slightly to ensure toast is visible
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

  const handleRegenerate = async () => {
    if (!currentStyleId) return;

    setIsRegenerating(true);
    try {
      await regenerateTemplateImage(tripId);
      toast.info("Regenerating image", {
        description: "Your new image will show up when ready.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Failed to regenerate image:", error);
      toast.error("Failed to regenerate image", {
        description: "Please try again.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 md:right-8 z-20 flex items-center gap-2">
      {/* Style Dropdown */}
      <Select
        value={currentStyleId || undefined}
        onValueChange={handleStyleChange}
        disabled={isChanging || loading}
      >
        <SelectTrigger className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all shadow-lg min-w-[180px]">
          <SelectValue placeholder="Select style" />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              Loading styles...
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
                disabled={!template.hasImage}
              >
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  {template.isCurrent && (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                  {!template.hasImage && (
                    <Clock className="h-3 w-3 text-slate-400" />
                  )}
                  {template.isGenerating && (
                    <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Refresh Button */}
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating || !currentStyleId || loading}
        className="p-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-md hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        title="Regenerate current style"
      >
        <RefreshCw
          className={cn("h-4 w-4", isRegenerating && "animate-spin")}
        />
      </button>

      {/* Current Style Label (optional, shown on larger screens) */}
      {currentStyleName && (
        <div className="hidden lg:block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-medium shadow-lg">
          {currentStyleName}
        </div>
      )}
    </div>
  );
}
