"use client";

import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";

interface SaveIndicatorProps {
  state: SaveStatus;
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
    'floating-top': 'fixed top-4 right-4 z-[105]',
    'floating-bottom': 'fixed bottom-3 right-3 z-[105]'
  };

  const baseClasses = positionClasses[position];

  const stateConfig = {
    saving: {
      icon: Loader2,
      text: "Saving...",
      iconClasses: "h-3.5 w-3.5 text-blue-600 animate-spin",
      textClasses: "text-[10px] text-blue-700 font-bold",
      containerClasses: "bg-blue-50 border border-blue-200",
    },
    saved: {
      icon: CheckCircle,
      text: "Saved",
      iconClasses: "h-3.5 w-3.5 text-emerald-600",
      textClasses: "text-[10px] text-emerald-700 font-bold",
      containerClasses: "bg-emerald-50 border border-emerald-200",
    },
    error: {
      icon: AlertCircle,
      text: "Error",
      iconClasses: "h-3.5 w-3.5 text-rose-600",
      textClasses: "text-[10px] text-rose-700 font-bold",
      containerClasses: "bg-rose-50 border border-rose-200",
    },
  };

  const config = stateConfig[state as keyof typeof stateConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`${baseClasses} ${config.containerClasses} rounded-lg px-2 py-1 shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${className}`}
    >
      <Icon className={config.iconClasses} />
      <span className={config.textClasses}>{config.text}</span>
    </div>
  );
}
