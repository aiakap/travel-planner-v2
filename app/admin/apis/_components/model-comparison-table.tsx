"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Eye, DollarSign } from "lucide-react";
import { ModelMetadata, ImageModelMetadata, formatCost } from "@/lib/utils/model-pricing";

interface ModelComparisonTableProps {
  models: ModelMetadata[] | ImageModelMetadata[];
  title?: string;
  description?: string;
}

function isTextModel(model: ModelMetadata | ImageModelMetadata): model is ModelMetadata {
  return "capabilities" in model;
}

export function ModelComparisonTable({
  models,
  title = "Model Comparison",
  description,
}: ModelComparisonTableProps) {
  const textModels = models.every(isTextModel);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Pricing</TableHead>
                {textModels && (
                  <>
                    <TableHead className="text-center">Streaming</TableHead>
                    <TableHead className="text-center">Structured</TableHead>
                    <TableHead className="text-center">Vision</TableHead>
                    <TableHead>Context</TableHead>
                  </>
                )}
                {!textModels && (
                  <>
                    <TableHead>Max Resolution</TableHead>
                    <TableHead>Aspect Ratios</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.name}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.displayName}</div>
                      <div className="text-xs text-muted-foreground">{model.provider}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        model.performance.speedTier === "fastest"
                          ? "text-green-500"
                          : model.performance.speedTier === "fast"
                          ? "text-blue-500"
                          : "text-yellow-500"
                      }
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {model.performance.speedTier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        model.performance.qualityTier === "highest"
                          ? "text-purple-500"
                          : model.performance.qualityTier === "high"
                          ? "text-blue-500"
                          : "text-green-500"
                      }
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {model.performance.qualityTier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {isTextModel(model) ? (
                        <>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCost(model.pricing.inputCostPer1k)}/1K in
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            {formatCost(model.pricing.outputCostPer1k)}/1K out
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCost(model.costPerImage)}/image
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {isTextModel(model) && (
                    <>
                      <TableCell className="text-center">
                        {model.capabilities.streaming ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {model.capabilities.structuredOutput ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {model.capabilities.vision ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {(model.performance.contextWindow / 1000).toFixed(0)}K
                      </TableCell>
                    </>
                  )}
                  {!isTextModel(model) && (
                    <>
                      <TableCell className="text-xs">
                        {model.performance.maxResolution}
                      </TableCell>
                      <TableCell className="text-xs">
                        {model.aspectRatios.length} options
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
