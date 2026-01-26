/**
 * Generic Chip Component
 * Reusable chip/button component with consistent styling
 */

"use client";

import { ReactNode } from "react";

export interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "success" | "primary";
}

export function Chip({
  children,
  selected = false,
  loading = false,
  disabled = false,
  onClick,
  icon,
  variant = "default",
}: ChipProps) {
  const colors = {
    default: {
      border: selected ? "#10b981" : "#d1d5db",
      bg: selected ? "#f0fdf4" : "white",
      text: selected ? "#059669" : "#374151",
      hoverBorder: selected ? "#10b981" : "#9ca3af",
      hoverBg: selected ? "#f0fdf4" : "#f9fafb",
    },
    success: {
      border: "#10b981",
      bg: "#f0fdf4",
      text: "#059669",
      hoverBorder: "#10b981",
      hoverBg: "#f0fdf4",
    },
    primary: {
      border: selected ? "#3b82f6" : "#d1d5db",
      bg: selected ? "#eff6ff" : "white",
      text: selected ? "#1e40af" : "#374151",
      hoverBorder: selected ? "#3b82f6" : "#9ca3af",
      hoverBg: selected ? "#eff6ff" : "#f9fafb",
    },
  };

  const color = colors[variant];

  return (
    <button
      onClick={(e) => {
        console.log('💎 Chip: CLICKED!', {disabled, loading, hasOnClick: !!onClick, children});
        if (onClick) {
          onClick();
        }
      }}
      disabled={disabled || loading}
      style={{
        padding: "8px 16px",
        border: `1px solid ${color.border}`,
        borderRadius: "20px",
        background: color.bg,
        color: color.text,
        fontSize: "14px",
        fontWeight: selected ? "500" : "400",
        cursor: disabled || loading ? "default" : "pointer",
        transition: "all 0.2s ease",
        opacity: loading ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && onClick) {
          e.currentTarget.style.borderColor = color.hoverBorder;
          e.currentTarget.style.background = color.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading && onClick) {
          e.currentTarget.style.borderColor = color.border;
          e.currentTarget.style.background = color.bg;
        }
      }}
    >
      {loading && (
        <span
          style={{
            display: "inline-block",
            animation: "spin 1s linear infinite",
            fontSize: "12px",
          }}
        >
          ⟳
        </span>
      )}
      {!loading && icon}
      {children}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
