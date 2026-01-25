/**
 * Auto-Add Card Component
 * Shows a suggestion with category/subcategory and Accept button
 * User can review and accept to add to their profile
 */

"use client";

import { useState } from "react";
import { CardProps } from "../_core/types";

export interface AutoAddData {
  category: string;
  subcategory: string;
  value: string;
}

export function AutoAddCard({ data, onAction }: CardProps<AutoAddData>) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    
    try {
      console.log('✅ Accepting item:', data);
      
      const response = await fetch("/api/object/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          subcategory: data.subcategory,
          value: data.value,
          metadata: { 
            addedAt: new Date().toISOString(),
            source: "auto-add-card"
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setIsAccepted(true);
        console.log('✅ Item accepted and saved to DB');
        
        // Trigger parent to reload from DB
        if (onAction) {
          console.log('🔄 Triggering reload action');
          onAction('reload', {});
        }
      } else {
        console.error('❌ Failed to accept item:', response.status);
        alert('Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error accepting item:', error);
      alert('Error adding item. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div style={{
      padding: "16px",
      background: isAccepted ? "#f0fdf4" : "#f9fafb",
      border: `1px solid ${isAccepted ? "#86efac" : "#e5e7eb"}`,
      borderRadius: "8px",
      marginBottom: "12px"
    }}>
      {/* Value - Prominent */}
      <div style={{
        fontSize: "16px",
        fontWeight: "600",
        color: "#111827",
        marginBottom: "8px"
      }}>
        {data.value}
      </div>
      
      {/* Category > Subcategory - Smaller */}
      <div style={{
        fontSize: "13px",
        color: "#6b7280",
        marginBottom: "12px"
      }}>
        {data.category} → {data.subcategory}
      </div>
      
      {/* Accept Button */}
      {!isAccepted && (
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          style={{
            padding: "8px 16px",
            background: isAccepting ? "#d1d5db" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isAccepting ? "not-allowed" : "pointer",
            fontWeight: "500",
            fontSize: "14px"
          }}
        >
          {isAccepting ? "Adding..." : "Accept"}
        </button>
      )}
      
      {isAccepted && (
        <div style={{
          fontSize: "14px",
          color: "#16a34a",
          fontWeight: "500"
        }}>
          ✓ Added to your profile
        </div>
      )}
    </div>
  );
}
