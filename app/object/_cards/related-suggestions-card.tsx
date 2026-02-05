/**
 * Related Suggestions Card Component
 * Shows suggestions as clickable chips that auto-save on click
 */

"use client";

import { useState } from "react";
import { CardProps } from "../_core/types";

export interface RelatedSuggestionsData {
  primary: string;
  suggestions: Array<{
    value: string;
    category: string;
    subcategory: string;
  }>;
}

export function RelatedSuggestionsCard({
  data,
  onAction,
}: CardProps<RelatedSuggestionsData>) {
  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const handleClick = async (suggestion: { value: string; category: string; subcategory: string }) => {
    if (acceptedItems.has(suggestion.value) || loadingItems.has(suggestion.value)) {
      return;
    }

    setLoadingItems(prev => new Set([...prev, suggestion.value]));

    try {
      // Use unified profile-graph endpoint
      const response = await fetch("/api/profile-graph/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          value: suggestion.value,
          metadata: { 
            context: "user accepted related suggestion"
          }
        })
      });

      if (response.ok) {
        setAcceptedItems(prev => new Set([...prev, suggestion.value]));
        
        if (onAction) {
          onAction('reload', {});
        }
      }
    } catch (error) {
      console.error('❌ [RELATED_SUGGESTIONS] Exception:', error);
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(suggestion.value);
        return next;
      });
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "#6b7280",
        marginBottom: "8px"
      }}>
        You might also like:
      </div>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {data.suggestions.map((suggestion) => {
          const isAccepted = acceptedItems.has(suggestion.value);
          const isLoading = loadingItems.has(suggestion.value);

          return (
            <button
              key={suggestion.value}
              onClick={() => handleClick(suggestion)}
              disabled={isAccepted || isLoading}
              style={{
                padding: "8px 16px",
                background: isAccepted ? "#10b981" : isLoading ? "#e5e7eb" : "#eff6ff",
                color: isAccepted ? "white" : "#1e40af",
                border: `1px solid ${isAccepted ? "#10b981" : "#bfdbfe"}`,
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isAccepted || isLoading ? "default" : "pointer",
              }}
            >
              {isAccepted && <span>✓ </span>}
              {suggestion.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
