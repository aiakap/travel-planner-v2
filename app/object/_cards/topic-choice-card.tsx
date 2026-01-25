/**
 * Topic Choice Card Component
 * Shows multiple-choice options with Accept buttons that save directly to database
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

  const handleAccept = async (optionValue: string) => {
    if (acceptedOptions.has(optionValue) || loadingOptions.has(optionValue)) {
      return;
    }

    setLoadingOptions(prev => new Set([...prev, optionValue]));

    try {
      console.log('🎯 [TOPIC_CHOICE] Accepting:', optionValue);
      
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

      console.log('🎯 [TOPIC_CHOICE] API response:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        setAcceptedOptions(prev => new Set([...prev, optionValue]));
        
        if (onAction) {
          console.log('🎯 [TOPIC_CHOICE] Triggering reload');
          onAction('reload', {});
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [TOPIC_CHOICE] API error:', errorText);
        alert('Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('❌ [TOPIC_CHOICE] Exception:', error);
      alert('Error adding item. Please try again.');
    } finally {
      setLoadingOptions(prev => {
        const next = new Set(prev);
        next.delete(optionValue);
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
        marginBottom: "4px"
      }}>
        {data.question}
      </div>
      
      {data.allowMultiple && (
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
          Select all that apply
        </div>
      )}
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        {data.options.map((option) => {
          const isAccepted = acceptedOptions.has(option.value);
          const isLoading = loadingOptions.has(option.value);

          return (
            <div
              key={option.value}
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {option.icon && <span>{option.icon}</span>}
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>
                  {option.value}
                </span>
              </div>
              
              {!isAccepted && (
                <button
                  onClick={() => handleAccept(option.value)}
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
