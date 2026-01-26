/**
 * Topic Choice Card Component
 * Shows multiple-choice options as clickable chips that auto-save on click
 */

"use client";

import { useState } from "react";
import { CardProps } from "../_core/types";

export interface TopicChoiceData {
  topic: string;
  question: string;
  category: string;
  subcategory: string;
  options: Array<{
    value: string;
    icon?: string;
  }>;
  allowMultiple?: boolean;
}

export function TopicChoiceCard({
  data,
  onAction,
}: CardProps<TopicChoiceData>) {
  const [acceptedOptions, setAcceptedOptions] = useState<Set<string>>(new Set());
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  const handleClick = async (optionValue: string) => {
    if (acceptedOptions.has(optionValue) || loadingOptions.has(optionValue)) {
      return;
    }

    setLoadingOptions(prev => new Set([...prev, optionValue]));

    try {
      const response = await fetch("/api/object/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          subcategory: data.subcategory,
          value: optionValue,
          metadata: { 
            context: `user selected from ${data.topic} options`
          }
        })
      });

      if (response.ok) {
        setAcceptedOptions(prev => new Set([...prev, optionValue]));
        
        if (onAction) {
          onAction('reload', {});
        }
      }
    } catch (error) {
      console.error('❌ [TOPIC_CHOICE] Exception:', error);
    } finally {
      setLoadingOptions(prev => {
        const next = new Set(prev);
        next.delete(optionValue);
        return next;
      });
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
        marginBottom: "4px"
      }}>
        {data.question}
      </div>
      
      {data.allowMultiple && (
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
          Select all that apply
        </div>
      )}
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
        {data.options.map((option) => {
          const isAccepted = acceptedOptions.has(option.value);
          const isLoading = loadingOptions.has(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleClick(option.value)}
              disabled={isAccepted || isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
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
              {option.icon && <span>{option.icon}</span>}
              {isAccepted && <span>✓ </span>}
              {option.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
