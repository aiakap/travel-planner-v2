"use client";

/**
 * Suggestion Bubble Component
 * 
 * Compact, clickable bubble for profile suggestions
 * - Color-coded by category
 * - Smooth fade-in/fade-out animations
 * - Two types: 'add' (with × to remove) and 'prompt' (clickable text)
 */

import { X, Loader2, Waves, Map, Music, Sparkles, Link } from "lucide-react";
import { GraphCategory, GRAPH_CATEGORIES, SuggestionDimension } from "@/lib/types/profile-graph";
import { useState } from "react";

export interface SuggestionBubbleProps {
  id: string;
  value: string;
  category?: GraphCategory;
  subcategory?: string;
  metadata?: Record<string, string>;
  type: 'add' | 'prompt';
  isFadingOut?: boolean;
  isLoading?: boolean;
  dimension?: SuggestionDimension;
  onAccept?: () => void;
  onReject?: () => void;
  onClick?: () => void;
}

export function SuggestionBubble({
  id,
  value,
  category,
  type,
  isFadingOut = false,
  isLoading = false,
  dimension,
  onAccept,
  onReject,
  onClick
}: SuggestionBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get dimension icon
  const getDimensionIcon = () => {
    if (!dimension) return null;
    
    const iconProps = { className: "w-3 h-3", strokeWidth: 2.5 };
    
    switch (dimension) {
      case 'direct':
        return <Waves {...iconProps} />;
      case 'related':
        return <Link {...iconProps} />;
      case 'destination':
        return <Map {...iconProps} />;
      case 'culture':
        return <Music {...iconProps} />;
      case 'tangential':
        return <Sparkles {...iconProps} />;
      default:
        return null;
    }
  };

  // Get category color
  const getCategoryColor = () => {
    if (!category) return "#6b7280"; // gray for prompts
    const categoryConfig = GRAPH_CATEGORIES.find(c => c.id === category);
    return categoryConfig?.color || "#6b7280";
  };

  const categoryColor = getCategoryColor();

  // Handle click based on type
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (type === 'add' && onAccept) {
      onAccept();
    } else if (type === 'prompt' && onClick) {
      onClick();
    }
  };

  // Handle reject (× button)
  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) {
      onReject();
    }
  };

  return (
    <div
      className={`
        relative inline-flex items-center gap-2 px-4 py-2 rounded-full
        text-white text-sm font-medium
        transition-all duration-300 ease-out
        ${!isLoading && 'hover:brightness-110 hover:scale-105 cursor-pointer'}
        ${!isLoading && 'active:scale-95'}
        ${isFadingOut ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}
        ${type === 'prompt' ? 'border-2 border-white/30' : ''}
        ${isLoading ? 'opacity-60 cursor-wait' : ''}
      `}
      style={{ 
        backgroundColor: categoryColor,
        animation: isFadingOut ? 'none' : 'bubble-in 200ms ease-out'
      }}
      onClick={handleClick}
      onMouseEnter={() => !isLoading && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="whitespace-nowrap">Generating...</span>
        </>
      ) : (
        <>
          {dimension && getDimensionIcon()}
          <span className="whitespace-nowrap">{value}</span>
          
          {type === 'add' && (
            <button
              onClick={handleReject}
              className={`
                flex-shrink-0 w-4 h-4 rounded-full
                bg-white/20 hover:bg-white/30
                flex items-center justify-center
                transition-all duration-200
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
              `}
              aria-label="Remove suggestion"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
