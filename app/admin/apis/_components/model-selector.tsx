"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Zap, DollarSign, Eye, Code, MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModelMetadata, ImageModelMetadata } from "@/lib/utils/model-pricing";

interface ModelSelectorProps {
  models: ModelMetadata[] | ImageModelMetadata[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  label?: string;
  showCapabilities?: boolean;
  showPerformance?: boolean;
}

function isTextModel(model: ModelMetadata | ImageModelMetadata): model is ModelMetadata {
  return "capabilities" in model;
}

function getSpeedColor(tier: string): string {
  switch (tier) {
    case "fastest":
      return "text-green-500";
    case "fast":
      return "text-blue-500";
    case "balanced":
      return "text-yellow-500";
    case "reasoning":
      return "text-purple-500";
    default:
      return "text-gray-500";
  }
}

function getQualityColor(tier: string): string {
  switch (tier) {
    case "highest":
      return "text-purple-500";
    case "high":
      return "text-blue-500";
    case "good":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  label = "Model",
  showCapabilities = true,
  showPerformance = true,
}: ModelSelectorProps) {
  const selected = models.find((m) => m.name === selectedModel);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="model-select">{label}</Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger id="model-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                <div className="flex items-center gap-2">
                  <span>{model.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({model.provider})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Description */}
            <p className="text-sm text-muted-foreground">{selected.description}</p>

            {/* Performance Metrics */}
            {showPerformance && (
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={getSpeedColor(selected.performance.speedTier)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {selected.performance.speedTier}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generation speed tier</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={getQualityColor(selected.performance.qualityTier)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {selected.performance.qualityTier} quality
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Output quality tier</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {isTextModel(selected) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline">
                          <Info className="h-3 w-3 mr-1" />
                          {(selected.performance.contextWindow / 1000).toFixed(0)}K context
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum context window size</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Capabilities */}
            {showCapabilities && isTextModel(selected) && (
              <div className="flex flex-wrap gap-2">
                {selected.capabilities.streaming && (
                  <Badge variant="secondary" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Streaming
                  </Badge>
                )}
                {selected.capabilities.structuredOutput && (
                  <Badge variant="secondary" className="text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    Structured Output
                  </Badge>
                )}
                {selected.capabilities.vision && (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Vision
                  </Badge>
                )}
                {selected.capabilities.functionCalling && (
                  <Badge variant="secondary" className="text-xs">
                    Function Calling
                  </Badge>
                )}
              </div>
            )}

            {/* Best For */}
            {isTextModel(selected) && selected.bestFor.length > 0 && (
              <div className="text-xs">
                <span className="font-medium">Best for:</span>{" "}
                <span className="text-muted-foreground">
                  {selected.bestFor.join(", ")}
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="flex items-center gap-2 text-xs">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {isTextModel(selected) ? (
                <span className="text-muted-foreground">
                  ${selected.pricing.inputCostPer1k.toFixed(4)}/1K input •{" "}
                  ${selected.pricing.outputCostPer1k.toFixed(4)}/1K output
                </span>
              ) : (
                <span className="text-muted-foreground">
                  ${selected.costPerImage.toFixed(3)}/image
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
