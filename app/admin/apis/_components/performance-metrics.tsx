"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, TrendingUp, Activity } from "lucide-react";
import { formatTokens } from "@/lib/utils/model-pricing";

interface PerformanceMetricsProps {
  duration?: number;
  tokenCount?: number;
  model?: string;
  status?: "success" | "error" | "pending";
  additionalMetrics?: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }[];
}

export function PerformanceMetrics({
  duration,
  tokenCount,
  model,
  status = "success",
  additionalMetrics = [],
}: PerformanceMetricsProps) {
  const tokensPerSecond = duration && tokenCount ? (tokenCount / (duration / 1000)).toFixed(0) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        {status && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant={
                status === "success"
                  ? "default"
                  : status === "error"
                  ? "destructive"
                  : "secondary"
              }
            >
              {status}
            </Badge>
          </div>
        )}

        {/* Model */}
        {model && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Model</span>
            <Badge variant="outline">{model}</Badge>
          </div>
        )}

        {/* Duration */}
        {duration !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Duration
            </span>
            <span className="font-mono text-sm">{(duration / 1000).toFixed(2)}s</span>
          </div>
        )}

        {/* Token Count */}
        {tokenCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Tokens
            </span>
            <span className="font-mono text-sm">{formatTokens(tokenCount)}</span>
          </div>
        )}

        {/* Tokens per Second */}
        {tokensPerSecond && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Speed
            </span>
            <span className="font-mono text-sm">{tokensPerSecond} tokens/s</span>
          </div>
        )}

        {/* Additional Metrics */}
        {additionalMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              {metric.icon}
              {metric.label}
            </span>
            <span className="font-mono text-sm">{metric.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
