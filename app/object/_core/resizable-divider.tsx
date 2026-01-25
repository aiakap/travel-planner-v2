"use client";

/**
 * Resizable divider for split panels
 * Allows dragging to adjust panel widths
 */

import { useRef, useEffect } from "react";
import { ResizableDividerProps } from "./types";

export function ResizableDivider({ onResize }: ResizableDividerProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const containerWidth = window.innerWidth;
      const deltaX = e.clientX - startX.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(20, Math.min(80, startWidth.current + deltaPercent));
      
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    
    // Get current width from parent
    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (parent) {
      const leftPanel = parent.querySelector("div:first-child");
      if (leftPanel) {
        const width = leftPanel.getBoundingClientRect().width;
        const containerWidth = parent.getBoundingClientRect().width;
        startWidth.current = (width / containerWidth) * 100;
      }
    }
    
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: "4px",
        background: "#e5e7eb",
        cursor: "col-resize",
        transition: "background 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#3b82f6";
      }}
      onMouseLeave={(e) => {
        if (!isDragging.current) {
          e.currentTarget.style.background = "#e5e7eb";
        }
      }}
    >
      {/* Grip icon */}
      <div
        style={{
          width: "16px",
          height: "32px",
          background: "#9ca3af",
          borderRadius: "4px",
          opacity: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          color: "white",
        }}
      >
        ⋮
      </div>
    </div>
  );
}
