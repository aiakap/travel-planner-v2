"use client";

/**
 * Generic chat layout with split panels
 * Works for ANY object type - completely configuration-driven
 */

import { useState, useEffect } from "react";
import { ChatLayoutProps, PanelState } from "./types";
import { ChatPanel } from "./chat-panel";
import { DataPanel } from "./data-panel";
import { ResizableDivider } from "./resizable-divider";

const DEFAULT_PANEL_STATE: PanelState = {
  leftWidth: 40,
  isLeftCollapsed: false,
  isRightCollapsed: false,
};

export function ChatLayout({ 
  config, 
  userId, 
  initialData, 
  params 
}: ChatLayoutProps) {
  const [data, setData] = useState(initialData);
  const [panelState, setPanelState] = useState<PanelState>(DEFAULT_PANEL_STATE);

  // Load panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`object-panel-state-${config.id}`);
    if (saved) {
      try {
        setPanelState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load panel state:", e);
      }
    }
  }, [config.id]);

  // Save panel state to localStorage
  useEffect(() => {
    localStorage.setItem(
      `object-panel-state-${config.id}`,
      JSON.stringify(panelState)
    );
  }, [panelState, config.id]);

  // Calculate actual widths based on collapse state
  const actualLeftWidth = panelState.isLeftCollapsed 
    ? 0 
    : panelState.isRightCollapsed 
    ? 100 
    : panelState.leftWidth;
  
  const actualRightWidth = panelState.isRightCollapsed 
    ? 0 
    : panelState.isLeftCollapsed 
    ? 100 
    : 100 - panelState.leftWidth;

  const handleResize = (width: number) => {
    setPanelState(prev => ({ ...prev, leftWidth: width }));
  };

  const toggleLeftPanel = () => {
    setPanelState(prev => ({ ...prev, isLeftCollapsed: !prev.isLeftCollapsed }));
  };

  const toggleRightPanel = () => {
    setPanelState(prev => ({ ...prev, isRightCollapsed: !prev.isRightCollapsed }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        toggleLeftPanel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "]") {
        e.preventDefault();
        toggleRightPanel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setPanelState(DEFAULT_PANEL_STATE);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left Panel - Chat */}
      {!panelState.isLeftCollapsed && (
        <div
          style={{
            width: `${actualLeftWidth}%`,
            borderRight: "1px solid #e5e7eb",
            position: "relative",
            transition: "width 0.3s ease-in-out",
          }}
        >
          <ChatPanel
            config={config}
            userId={userId}
            params={params}
            onDataUpdate={setData}
          />
          
          {/* Collapse button */}
          <button
            onClick={toggleLeftPanel}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              background: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            title="Collapse chat (Cmd+[)"
          >
            ←
          </button>
        </div>
      )}

      {/* Resizable Divider */}
      {!panelState.isLeftCollapsed && !panelState.isRightCollapsed && (
        <ResizableDivider onResize={handleResize} />
      )}

      {/* Expand Left Button */}
      {panelState.isLeftCollapsed && (
        <button
          onClick={toggleLeftPanel}
          style={{
            position: "fixed",
            left: "0",
            top: "50%",
            transform: "translateY(-50%)",
            padding: "8px 12px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            zIndex: 10,
            fontSize: "14px",
          }}
          title="Expand chat (Cmd+[)"
        >
          →
        </button>
      )}

      {/* Right Panel - Data View */}
      {!panelState.isRightCollapsed && (
        <div
          style={{
            width: `${actualRightWidth}%`,
            position: "relative",
            transition: "width 0.3s ease-in-out",
          }}
        >
          <DataPanel config={config} data={data} params={params} />
          
          {/* Collapse button */}
          <button
            onClick={toggleRightPanel}
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              background: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            title="Collapse data view (Cmd+])"
          >
            →
          </button>
        </div>
      )}

      {/* Expand Right Button */}
      {panelState.isRightCollapsed && (
        <button
          onClick={toggleRightPanel}
          style={{
            position: "fixed",
            right: "0",
            top: "50%",
            transform: "translateY(-50%)",
            padding: "8px 12px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            zIndex: 10,
            fontSize: "14px",
          }}
          title="Expand data view (Cmd+])"
        >
          ←
        </button>
      )}
    </div>
  );
}
