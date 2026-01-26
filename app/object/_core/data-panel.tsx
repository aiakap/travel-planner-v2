"use client";

/**
 * Generic data panel
 * Renders the right panel view based on config
 */

import { useState } from "react";
import { DataPanelProps } from "./types";
import * as LucideIcons from "lucide-react";
import { ChevronRight } from "lucide-react";

export function DataPanel({ 
  config, 
  data, 
  params, 
  hasUnsavedChanges, 
  onSave,
  onDataUpdate,
  onDelete,
  onCollapse
}: DataPanelProps) {
  // Support both new views[] and legacy component
  const views = config.rightPanel.views;
  const [currentViewId, setCurrentViewId] = useState<string>(
    views?.[0]?.id || "default"
  );
  
  const ViewComponent = views 
    ? views.find(v => v.id === currentViewId)?.component || views[0].component
    : config.rightPanel.component;
  const EmptyComponent = config.rightPanel.emptyState;

  // Get icon component dynamically
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header Section */}
      {config.rightPanel.header && (
        <div style={{
          padding: "16px 20px",
          borderBottom: "2px solid #e5e7eb",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px"
        }}>
          {/* Left: Icon + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {config.rightPanel.header.icon && (
              <div style={{ color: "#6b7280" }}>
                {getIcon(config.rightPanel.header.icon)}
              </div>
            )}
            <div>
              <h2 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "2px"
              }}>
                {config.rightPanel.header.title}
              </h2>
              {config.rightPanel.header.subtitle && (
                <p style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic"
                }}>
                  {config.rightPanel.header.subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Center: View Switcher - only show if multiple views */}
          {views && views.length > 1 && (
            <div style={{
              display: "flex",
              gap: "4px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "2px",
              background: "white"
            }}>
              {views.map(view => {
                const Icon = (LucideIcons as any)[view.icon];
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentViewId(view.id)}
                    style={{
                      padding: "4px 8px",
                      border: "none",
                      background: currentViewId === view.id ? "#3b82f6" : "transparent",
                      color: currentViewId === view.id ? "white" : "#6b7280",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (currentViewId !== view.id) {
                        e.currentTarget.style.background = "#f3f4f6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentViewId !== view.id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                    title={view.name}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    <span>{view.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Right: Collapse button */}
          {onCollapse && (
            <button
              onClick={onCollapse}
              style={{
                padding: "6px",
                border: "1px solid #e5e7eb",
                background: "white",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#6b7280",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
              title="Hide profile panel (Cmd+])"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Show empty state if no data and empty component provided */}
        {!data && EmptyComponent ? (
          <div style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
          }}>
            <EmptyComponent />
          </div>
        ) : !data ? (
          <div style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            color: "#9ca3af",
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", marginBottom: "8px" }}>No data yet</p>
              <p style={{ fontSize: "14px" }}>Start chatting to see results here</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px", background: "white" }}>
            <ViewComponent 
              data={data} 
              params={params} 
              onDelete={onDelete}
              onDataUpdate={onDataUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
