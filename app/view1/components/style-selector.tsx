"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { RefreshCw, Check, Clock, Loader2, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

type TemplateState = "current" | "generating" | "ready" | "new";

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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousGeneratingIdsRef = useRef<Set<string>>(new Set());

  // Memoized loadTemplates function
  const loadTemplates = useCallback(async () => {
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
  }, [tripId]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Poll for updates when images are generating
  useEffect(() => {
    const hasGenerating = templates.some(t => t.isGenerating);
    if (!hasGenerating) return;
    
    const interval = setInterval(() => {
      loadTemplates();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [templates, loadTemplates]);

  // Memoized template groups for performance
  const templateGroups = useMemo(() => ({
    current: templates.find(t => t.isCurrent),
    generating: templates.filter(t => t.isGenerating),
    ready: templates.filter(t => t.hasImage && !t.isCurrent && !t.isGenerating),
    new: templates.filter(t => !t.hasImage && !t.isGenerating && !t.isCurrent)
  }), [templates]);

  // Debounced handleStyleChange to prevent rapid clicks
  const handleStyleChange = useCallback(async (newStyleId: string) => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce rapid clicks
    debounceTimerRef.current = setTimeout(async () => {
      // Don't do anything if selecting the same style
      if (newStyleId === currentStyleId) return;

      // Find the selected template
      const template = templates.find((t) => t.id === newStyleId);
      if (!template) return;

      // If no cached image and not generating, auto-generate
      if (!template.hasImage && !template.isGenerating) {
        await handleGenerateStyle(template);
        return;
      }

      // If generating, show info and return
      if (template.isGenerating) {
        toast.info("Style is generating", {
          description: `${template.name} will be ready soon.`,
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
        await loadTemplates();
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
    }, 300); // 300ms debounce
  }, [templates, currentStyleId, tripId, router, loadTemplates]);

  const handleGenerateStyle = useCallback(async (template: TripTemplate) => {
    try {
      setIsChanging(true);
      await generateStyleImage(tripId, template.id);
      toast.info("Generating image", {
        description: `${template.name} will be ready in 30-60 seconds.`,
        duration: 5000,
      });
      await loadTemplates();
    } catch (error) {
      console.error("Failed to queue image generation:", error);
      toast.error("Failed to start generation", {
        description: "Please try again.",
        action: {
          label: "Retry",
          onClick: () => handleGenerateStyle(template),
        },
      });
    } finally {
      setIsChanging(false);
    }
  }, [tripId, loadTemplates]);

  const handleRegenerate = useCallback(async () => {
    if (!currentStyleId) return;

    setIsRegenerating(true);
    try {
      await regenerateTemplateImage(tripId);
      toast.info("Regenerating image", {
        description: "Your new image will appear in 30-60 seconds.",
        duration: 5000,
      });
      await loadTemplates();
    } catch (error) {
      console.error("Failed to regenerate image:", error);
      toast.error("Failed to regenerate image", {
        description: "Please try again.",
        action: {
          label: "Retry",
          onClick: handleRegenerate,
        },
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [currentStyleId, tripId, loadTemplates]);

  // Get template state type
  const getTemplateState = (template: TripTemplate): TemplateState => {
    if (template.isCurrent) return "current";
    if (template.isGenerating) return "generating";
    if (template.hasImage) return "ready";
    return "new";
  };

  // Get state icon for a template
  const getStateIcon = (template: TripTemplate) => {
    const state = getTemplateState(template);
    
    switch (state) {
      case "current":
        return <Check className="h-3 w-3 text-green-400" />;
      case "generating":
        return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
      case "ready":
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case "new":
        return <Clock className="h-3 w-3 text-white/50" />;
      default:
        return null;
    }
  };

  // Get state badge for a template
  const getStateBadge = (template: TripTemplate) => {
    const state = getTemplateState(template);
    
    switch (state) {
      case "current":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-[10px] px-1.5 py-0.5">
            Current
          </Badge>
        );
      case "generating":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[10px] px-1.5 py-0.5">
            <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
            Generating
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-[10px] px-1.5 py-0.5">
            Ready
          </Badge>
        );
      case "new":
        return (
          <Badge className="bg-white/10 text-white/60 border-white/20 text-[10px] px-1.5 py-0.5">
            New
          </Badge>
        );
      default:
        return null;
    }
  };

  // Check if generation completed (success notification)
  useEffect(() => {
    const currentlyGeneratingIds = new Set(
      templates.filter(t => t.isGenerating).map(t => t.id)
    );
    
    // Find templates that were generating but are now ready
    const completedGenerations = templates.filter(t => 
      previousGeneratingIdsRef.current.has(t.id) &&
      !currentlyGeneratingIds.has(t.id) &&
      t.hasImage &&
      !t.isCurrent
    );
    
    // Show success notification for completed generations
    if (completedGenerations.length > 0) {
      completedGenerations.forEach(template => {
        toast.success("Style ready!", {
          description: `${template.name} is now available.`,
          duration: 4000,
        });
      });
    }
    
    // Update the ref for next comparison
    previousGeneratingIdsRef.current = currentlyGeneratingIds;
  }, [templates]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
        <SelectContent className="max-h-[300px]">
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
            templates.map((template) => {
              const state = getTemplateState(template);
              const isSelectable = state === "current" || state === "ready" || state === "new";
              
              return (
                <SelectItem
                  key={template.id}
                  value={template.id}
                  disabled={!isSelectable || isChanging}
                  className={cn(
                    "cursor-pointer",
                    state === "generating" && "opacity-75 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 w-full min-w-[200px]">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStateIcon(template)}
                      <span className="flex-1 truncate text-sm">{template.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {getStateBadge(template)}
                    </div>
                  </div>
                </SelectItem>
              );
            })
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
