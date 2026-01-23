"use client";

/**
 * Inline Suggestion Bubble Component
 * 
 * Smaller, inline variant of SuggestionBubble for use within mad-lib text
 * - Compact size (text-xs)
 * - Inline display (inline-flex)
 * - Color-coded by category
 * - Supports "other" type that becomes an input field
 */

import { useState, useRef, useEffect } from "react";
import { GraphCategory, GRAPH_CATEGORIES } from "@/lib/types/profile-graph";

export interface InlineSuggestionBubbleProps {
  value: string;
  category: GraphCategory;
  subcategory: string;
  metadata?: Record<string, string>;
  isOther?: boolean;
  onSelect: (value: string) => void;
  className?: string;
}

export function InlineSuggestionBubble({
  value,
  category,
  subcategory,
  metadata,
  isOther = false,
  onSelect,
  className = ""
}: InlineSuggestionBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get category color
  const getCategoryColor = () => {
    const categoryConfig = GRAPH_CATEGORIES.find(c => c.id === category);
    return categoryConfig?.color || "#6b7280";
  };

  const categoryColor = getCategoryColor();

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Handle click
  const handleClick = () => {
    if (isOther) {
      setIsEditing(true);
    } else {
      onSelect(value);
    }
  };

  // Handle custom input submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (customValue.trim()) {
      onSelect(customValue.trim());
      setCustomValue("");
      setIsEditing(false);
    }
  };

  // Handle blur
  const handleBlur = () => {
    if (customValue.trim()) {
      handleSubmit();
    } else {
      setIsEditing(false);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setCustomValue("");
      setIsEditing(false);
    }
  };

  // Render input field if editing
  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="inline-flex">
        <input
          ref={inputRef}
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Type here..."
          className="inline-flex px-2 py-1 text-xs rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            borderColor: categoryColor,
            minWidth: "120px"
          }}
        />
      </form>
    );
  }

  // Render clickable bubble
  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center px-2 py-1 mx-0.5
        text-xs font-medium text-white rounded-full
        transition-all duration-200 ease-out
        hover:brightness-110 hover:scale-105
        active:scale-95
        cursor-pointer
        ${className}
      `}
      style={{
        backgroundColor: categoryColor
      }}
    >
      {value}
    </button>
  );
}
