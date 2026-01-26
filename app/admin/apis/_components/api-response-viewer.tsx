"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ApiResponseViewerProps {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
}

export function ApiResponseViewer({ response, status, duration, error }: ApiResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const handleCopy = async () => {
    const text = JSON.stringify(response, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return "bg-gray-500";
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const responseSize = new Blob([JSON.stringify(response)]).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Response</CardTitle>
          <div className="flex items-center gap-2">
            {status && (
              <Badge variant="outline" className="gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                {status}
              </Badge>
            )}
            {duration !== undefined && (
              <Badge variant="outline">{duration}ms</Badge>
            )}
            <Badge variant="outline">{formatBytes(responseSize)}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 text-sm font-mono bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mb-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                {isOpen ? "Hide" : "Show"} Full Response
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
