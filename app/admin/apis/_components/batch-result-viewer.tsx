"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Eye } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface BatchResult {
  id: string;
  type: "image" | "text" | "data";
  content: string;
  metadata?: {
    model?: string;
    duration?: number;
    cost?: number;
    tokens?: number;
    [key: string]: any;
  };
  thumbnail?: string;
  title?: string;
  description?: string;
}

interface BatchResultViewerProps {
  results: BatchResult[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
  onDownload?: (result: BatchResult) => void;
}

export function BatchResultViewer({
  results,
  title = "Results",
  description,
  columns = 3,
  onDownload,
}: BatchResultViewerProps) {
  const [selectedResult, setSelectedResult] = useState<BatchResult | null>(null);

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{results.length} results</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid ${gridCols[columns]} gap-4`}>
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Results */}
                  {result.type === "image" && (
                    <div className="relative aspect-square w-full bg-muted">
                      <Image
                        src={result.content}
                        alt={result.title || "Generated image"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Text Results */}
                  {result.type === "text" && (
                    <div className="p-4 max-h-48 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                    </div>
                  )}

                  {/* Data Results */}
                  {result.type === "data" && (
                    <div className="p-4 max-h-48 overflow-y-auto">
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {typeof result.content === "string"
                          ? result.content
                          : JSON.stringify(result.content, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Metadata and Actions */}
                  <div className="p-3 border-t space-y-2">
                    {result.title && (
                      <h4 className="text-sm font-medium truncate">{result.title}</h4>
                    )}
                    {result.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    {result.metadata && (
                      <div className="flex flex-wrap gap-1">
                        {result.metadata.model && (
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.model}
                          </Badge>
                        )}
                        {result.metadata.duration && (
                          <Badge variant="outline" className="text-xs">
                            {(result.metadata.duration / 1000).toFixed(1)}s
                          </Badge>
                        )}
                        {result.metadata.cost && (
                          <Badge variant="outline" className="text-xs">
                            ${result.metadata.cost.toFixed(3)}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedResult(result)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {onDownload && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(result)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResult?.title || "Result Details"}</DialogTitle>
            {selectedResult?.description && (
              <DialogDescription>{selectedResult.description}</DialogDescription>
            )}
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4">
              {/* Image */}
              {selectedResult.type === "image" && (
                <div className="relative aspect-square w-full max-w-2xl mx-auto bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={selectedResult.content}
                    alt={selectedResult.title || "Generated image"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}

              {/* Text */}
              {selectedResult.type === "text" && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedResult.content}</p>
                </div>
              )}

              {/* Data */}
              {selectedResult.type === "data" && (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {typeof selectedResult.content === "string"
                      ? selectedResult.content
                      : JSON.stringify(selectedResult.content, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedResult.metadata && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Metadata</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedResult.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-mono">
                          {typeof value === "number" && key === "duration"
                            ? `${(value / 1000).toFixed(2)}s`
                            : typeof value === "number" && key === "cost"
                            ? `$${value.toFixed(3)}`
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {onDownload && (
                  <Button onClick={() => onDownload(selectedResult)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {selectedResult.type === "image" && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedResult.content, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
