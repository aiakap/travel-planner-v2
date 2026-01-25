/**
 * Related Suggestions Card Component
 * Shows suggestions with Accept buttons that save directly to database
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

  const handleAccept = async (suggestion: { value: string; category: string; subcategory: string }) => {
    if (acceptedItems.has(suggestion.value) || loadingItems.has(suggestion.value)) {
      return;
    }

    setLoadingItems(prev => new Set([...prev, suggestion.value]));

    try {
      console.log('🎯 [RELATED_SUGGESTIONS] Accepting:', suggestion);
      
      const response = await fetch("/api/object/profile/upsert", {
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

      console.log('🎯 [RELATED_SUGGESTIONS] API response:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        setAcceptedItems(prev => new Set([...prev, suggestion.value]));
        
        if (onAction) {
          console.log('🎯 [RELATED_SUGGESTIONS] Triggering reload');
          onAction('reload', {});
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [RELATED_SUGGESTIONS] API error:', errorText);
        alert('Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('❌ [RELATED_SUGGESTIONS] Exception:', error);
      alert('Error adding item. Please try again.');
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(suggestion.value);
        return next;
      });
    }
  };

  return (
    <div style={{
      padding: "16px",
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      marginBottom: "12px"
    }}>
      <div style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
        marginBottom: "12px"
      }}>
        You might also like:
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.suggestions.map((suggestion) => {
          const isAccepted = acceptedItems.has(suggestion.value);
          const isLoading = loadingItems.has(suggestion.value);

          return (
            <div
              key={suggestion.value}
              style={{
                padding: "12px",
                background: isAccepted ? "#f0fdf4" : "white",
                border: `1px solid ${isAccepted ? "#86efac" : "#e5e7eb"}`,
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>
                  {suggestion.value}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {suggestion.category} → {suggestion.subcategory}
                </div>
              </div>
              
              {!isAccepted && (
                <button
                  onClick={() => handleAccept(suggestion)}
                  disabled={isLoading}
                  style={{
                    padding: "6px 12px",
                    background: isLoading ? "#d1d5db" : "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "500"
                  }}
                >
                  {isLoading ? "Adding..." : "Accept"}
                </button>
              )}
              
              {isAccepted && (
                <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "500" }}>
                  ✓ Added
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
