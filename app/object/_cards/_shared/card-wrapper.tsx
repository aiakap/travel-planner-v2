/**
 * Generic Card Wrapper Component
 * Provides consistent container styling for all card types
 */

"use client";

import { ReactNode } from "react";

export interface CardWrapperProps {
  style?: "chip" | "button" | "card";
  label?: string;
  children: ReactNode;
}

export function CardWrapper({ style = "chip", label, children }: CardWrapperProps) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "white",
      }}
    >
      {label && (
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
          {label}
        </p>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          flexDirection: style === "button" ? "column" : "row",
        }}
      >
        {children}
      </div>
    </div>
  );
}
