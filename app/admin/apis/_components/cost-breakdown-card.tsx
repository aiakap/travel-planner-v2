"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Coins, TrendingUp, Clock } from "lucide-react";
import { CostBreakdown, ImageCostBreakdown, formatCost, formatTokens } from "@/lib/utils/model-pricing";

interface CostBreakdownCardProps {
  cost: CostBreakdown | ImageCostBreakdown | null;
  duration?: number;
  title?: string;
  showEstimate?: boolean;
}

function isTextCost(cost: CostBreakdown | ImageCostBreakdown): cost is CostBreakdown {
  return "inputTokens" in cost;
}

export function CostBreakdownCard({
  cost,
  duration,
  title = "Cost Breakdown",
  showEstimate = false,
}: CostBreakdownCardProps) {
  if (!cost) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {title}
        </CardTitle>
        {showEstimate && (
          <CardDescription>
            Estimated cost (actual cost may vary)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Model</span>
          <Badge variant="outline">{cost.model}</Badge>
        </div>

        {/* Text Model Breakdown */}
        {isTextCost(cost) && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Input Tokens</span>
                <span className="font-mono">{formatTokens(cost.inputTokens)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Output Tokens</span>
                <span className="font-mono">{formatTokens(cost.outputTokens)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t">
                <span>Total Tokens</span>
                <span className="font-mono">
                  {formatTokens(cost.inputTokens + cost.outputTokens)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Input Cost</span>
                <span className="font-mono">{formatCost(cost.inputCost)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Output Cost</span>
                <span className="font-mono">{formatCost(cost.outputCost)}</span>
              </div>
            </div>
          </>
        )}

        {/* Image Model Breakdown */}
        {!isTextCost(cost) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Images Generated</span>
              <span className="font-mono">{cost.imageCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost per Image</span>
              <span className="font-mono">{formatCost(cost.costPerImage)}</span>
            </div>
          </div>
        )}

        {/* Total Cost */}
        <div className="flex items-center justify-between text-base font-bold pt-2 border-t">
          <span className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Total Cost
          </span>
          <span className="font-mono text-lg">
            {formatCost(cost.totalCost)} {cost.currency}
          </span>
        </div>

        {/* Duration */}
        {duration !== undefined && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Generation Time
            </span>
            <span className="font-mono">{(duration / 1000).toFixed(2)}s</span>
          </div>
        )}

        {/* Cost Efficiency */}
        {isTextCost(cost) && duration !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Tokens per Second
            </span>
            <span className="font-mono">
              {((cost.inputTokens + cost.outputTokens) / (duration / 1000)).toFixed(0)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
