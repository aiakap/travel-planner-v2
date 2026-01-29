"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Check } from "lucide-react";
import Image from "next/image";

export interface LogoResult {
  id: string;
  url: string;
  selected: boolean;
  originalPrompt: string;
  generation: number;
}

interface LogoSelectorGridProps {
  logos: LogoResult[];
  onToggleSelect: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
  maxSelections?: number;
  disabled?: boolean;
}

export function LogoSelectorGrid({
  logos,
  onToggleSelect,
  onDownload,
  maxSelections = 2,
  disabled = false,
}: LogoSelectorGridProps) {
  const selectedCount = logos.filter((logo) => logo.selected).length;
  const maxReached = selectedCount >= maxSelections;

  if (logos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No logos generated yet. Enter a description and click "Generate 4 Logos" to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {logos.map((logo) => {
        const canToggle = !disabled && (!maxReached || logo.selected);
        
        return (
          <Card
            key={logo.id}
            className={`relative overflow-hidden transition-all ${
              logo.selected
                ? "ring-2 ring-primary shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <div className="aspect-square relative bg-muted/30">
              {/* Logo Image */}
              <Image
                src={logo.url}
                alt={`Logo ${logo.id}`}
                fill
                className="object-contain p-4"
                unoptimized
              />

              {/* Selection Overlay */}
              <div className="absolute top-3 left-3 z-10">
                <div
                  className={`flex items-center gap-2 p-2 rounded-md transition-all ${
                    logo.selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/80 backdrop-blur-sm"
                  }`}
                >
                  <Checkbox
                    checked={logo.selected}
                    onCheckedChange={() => canToggle && onToggleSelect(logo.id)}
                    disabled={!canToggle}
                    className="border-2"
                  />
                  <span className="text-sm font-medium">
                    {logo.selected ? "Selected" : "Select"}
                  </span>
                </div>
              </div>

              {/* Selected Badge */}
              {logo.selected && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Generation Badge */}
              <div className="absolute bottom-3 left-3 z-10">
                <Badge variant="secondary" className="text-xs">
                  Gen {logo.generation}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {logo.originalPrompt.substring(0, 40)}
                  {logo.originalPrompt.length > 40 ? "..." : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDownload(logo.url, `logo-${logo.id}.png`)}
                  className="shrink-0 ml-2"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
