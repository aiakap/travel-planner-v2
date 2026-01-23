"use client";

/**
 * Graph Controls Component
 * 
 * Control panel for graph customization (color schemes, clear all, etc.)
 */

import { Button } from "@/components/ui/button";
import { Trash2, Target } from "lucide-react";
import { ColorSchemeSelector } from "./color-scheme-selector";

interface GraphControlsProps {
  colorScheme: string;
  customColors?: Record<string, string>;
  onColorSchemeChange: (schemeId: string) => void;
  onCustomColorChange?: (category: string, color: string) => void;
  onClearAll: () => void;
  onRecenter?: () => void;
  className?: string;
}

export function GraphControls({
  colorScheme,
  customColors,
  onColorSchemeChange,
  onCustomColorChange,
  onClearAll,
  onRecenter,
  className = ""
}: GraphControlsProps) {
  return (
    <div className={`absolute top-4 right-4 z-10 flex flex-col gap-2 ${className}`}>
      <ColorSchemeSelector
        activeScheme={colorScheme}
        customColors={customColors}
        onSchemeChange={onColorSchemeChange}
        onCustomColorChange={onCustomColorChange}
      />
      
      {onRecenter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRecenter}
          className="gap-2 bg-white"
        >
          <Target className="w-4 h-4" />
          Recenter
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onClearAll}
        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white"
      >
        <Trash2 className="w-4 h-4" />
        Clear All
      </Button>
    </div>
  );
}
