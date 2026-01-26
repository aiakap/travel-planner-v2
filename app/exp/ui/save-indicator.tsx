"use client";

import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { SaveState } from "@/hooks/use-auto-save";

interface SaveIndicatorProps {
  state: SaveState;
  position?: "inline" | "floating-top" | "floating-bottom";
  className?: string;
}

/**
 * Visual indicator for auto-save state
 * Shows saving spinner, success checkmark, or error icon
 * 
 * @param state - Current save state (idle, saving, saved, error)
 * @param position - Display position (inline or floating)
 * @param className - Additional CSS classes
 */
export function SaveIndicator({ 
  state, 
  position = "inline",
  className = "" 
}: SaveIndicatorProps) {
  // Don't render anything when idle
  if (state === "idle") return null;

  const positionClasses = {
    'inline': 'inline-flex items-center gap-1.5',
    'floating-top': 'fixed top-4 right-4 z-50',
    'floating-bottom': 'fixed bottom-4 right-4 z-50'
  };

  const baseClasses = positionClasses[position];

  const stateConfig = {
    saving: {
      icon: Loader2,
      text: "Saving...",
      iconClasses: "h-4 w-4 text-blue-600 animate-spin",
      textClasses: "text-sm text-blue-600 font-medium",
      containerClasses: "bg-blue-50 border border-blue-200",
    },
    saved: {
      icon: CheckCircle,
      text: "Saved",
      iconClasses: "h-4 w-4 text-green-600",
      textClasses: "text-sm text-green-600 font-medium",
      containerClasses: "bg-green-50 border border-green-200",
    },
    error: {
      icon: AlertCircle,
      text: "Error saving",
      iconClasses: "h-4 w-4 text-red-600",
      textClasses: "text-sm text-red-600 font-medium",
      containerClasses: "bg-red-50 border border-red-200",
    },
  };

  const config = stateConfig[state as keyof typeof stateConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`${baseClasses} ${config.containerClasses} rounded-lg px-3 py-1.5 shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${className}`}
    >
      <Icon className={config.iconClasses} />
      <span className={config.textClasses}>{config.text}</span>
    </div>
  );
}
