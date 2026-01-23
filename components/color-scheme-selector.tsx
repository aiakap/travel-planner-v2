"use client";

/**
 * Color Scheme Selector Component
 * 
 * Allows users to choose preset color schemes or customize individual category colors
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Check } from "lucide-react";
import { GraphCategory } from "@/lib/types/profile-graph";

export interface ColorScheme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "default",
    name: "Default",
    colors: {
      "travel-preferences": "#3b82f6",
      "family": "#ec4899",
      "hobbies": "#10b981",
      "spending-priorities": "#f59e0b",
      "travel-style": "#8b5cf6",
      "destinations": "#06b6d4",
      "other": "#6b7280"
    }
  },
  {
    id: "dark",
    name: "Dark",
    colors: {
      "travel-preferences": "#1e40af",
      "family": "#be185d",
      "hobbies": "#047857",
      "spending-priorities": "#b45309",
      "travel-style": "#6d28d9",
      "destinations": "#0e7490",
      "other": "#374151"
    }
  },
  {
    id: "pastel",
    name: "Pastel",
    colors: {
      "travel-preferences": "#93c5fd",
      "family": "#f9a8d4",
      "hobbies": "#86efac",
      "spending-priorities": "#fcd34d",
      "travel-style": "#c4b5fd",
      "destinations": "#67e8f9",
      "other": "#d1d5db"
    }
  },
  {
    id: "vibrant",
    name: "Vibrant",
    colors: {
      "travel-preferences": "#2563eb",
      "family": "#db2777",
      "hobbies": "#059669",
      "spending-priorities": "#d97706",
      "travel-style": "#7c3aed",
      "destinations": "#0891b2",
      "other": "#4b5563"
    }
  },
  {
    id: "monochrome",
    name: "Monochrome",
    colors: {
      "travel-preferences": "#374151",
      "family": "#4b5563",
      "hobbies": "#6b7280",
      "spending-priorities": "#9ca3af",
      "travel-style": "#d1d5db",
      "destinations": "#e5e7eb",
      "other": "#f3f4f6"
    }
  }
];

interface ColorSchemeSelectorProps {
  activeScheme: string;
  customColors?: Record<string, string>;
  onSchemeChange: (schemeId: string) => void;
  onCustomColorChange?: (category: string, color: string) => void;
}

export function ColorSchemeSelector({
  activeScheme,
  customColors = {},
  onSchemeChange,
  onCustomColorChange
}: ColorSchemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const currentScheme = COLOR_SCHEMES.find(s => s.id === activeScheme) || COLOR_SCHEMES[0];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          {currentScheme.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-3">Color Schemes</h3>
            <div className="space-y-2">
              {COLOR_SCHEMES.map(scheme => (
                <button
                  key={scheme.id}
                  onClick={() => {
                    onSchemeChange(scheme.id);
                    setShowCustom(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    activeScheme === scheme.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {Object.values(scheme.colors).slice(0, 6).map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{scheme.name}</span>
                  </div>
                  {activeScheme === scheme.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustom(!showCustom)}
              className="w-full"
            >
              {showCustom ? 'Hide' : 'Customize Colors'}
            </Button>

            {showCustom && onCustomColorChange && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-600 mb-2">
                  Customize individual category colors:
                </p>
                {Object.entries(currentScheme.colors).map(([category, color]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-xs capitalize">
                      {category.replace(/-/g, ' ')}
                    </span>
                    <input
                      type="color"
                      value={customColors[category] || color}
                      onChange={(e) => onCustomColorChange(category, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
