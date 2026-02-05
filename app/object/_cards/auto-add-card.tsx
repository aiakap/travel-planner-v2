/**
 * Auto-Add Card Component
 * Auto-saves item and shows as a chip with green checkmark when done
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { CardProps } from "../_core/types";

export interface AutoAddData {
  category: string;
  subcategory: string;
  value: string;
  alreadyAdded?: boolean;  // Flag to skip save if item was already added in Phase 1
}

export function AutoAddCard({ data, onAction }: CardProps<AutoAddData>) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(true);
  const saveAttemptedRef = useRef(false);

  useEffect(() => {
    // Skip if already attempted or if item was already added in Phase 1
    if (saveAttemptedRef.current) return;
    saveAttemptedRef.current = true;

    // If alreadyAdded flag is set, skip the save and show as accepted
    if (data.alreadyAdded) {
      console.log('✓ [AUTO_ADD] Skipping save - item already added:', data.value);
      setIsAccepted(true);
      setIsSaving(false);
      return;
    }

    const autoSave = async () => {
      try {
        // Use unified profile-graph endpoint
        const response = await fetch("/api/profile-graph/add-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: data.category,
            subcategory: data.subcategory,
            value: data.value,
            metadata: {
              context: "user explicitly stated preference"
            }
          })
        });

        if (response.ok) {
          setIsAccepted(true);
          if (onAction) {
            onAction('reload', {});
          }
        }
      } catch (error) {
        console.error('❌ [AUTO_ADD] Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    };

    autoSave();
  }, [data.alreadyAdded, data.category, data.subcategory, data.value, onAction]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        background: isAccepted ? "#10b981" : isSaving ? "#e5e7eb" : "#eff6ff",
        color: isAccepted ? "white" : "#1e40af",
        border: `1px solid ${isAccepted ? "#10b981" : "#bfdbfe"}`,
        borderRadius: "16px",
        fontSize: "14px",
        fontWeight: "500",
        marginBottom: "8px",
      }}
    >
      {isAccepted && <span style={{ fontSize: "16px" }}>✓</span>}
      <span>{data.value}</span>
    </div>
  );
}
