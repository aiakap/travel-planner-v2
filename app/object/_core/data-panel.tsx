"use client";

/**
 * Generic data panel
 * Renders the right panel view based on config
 */

import { DataPanelProps } from "./types";

export function DataPanel({ 
  config, 
  data, 
  params, 
  hasUnsavedChanges, 
  onSave,
  onDataUpdate,
  onDelete 
}: DataPanelProps) {
  const ViewComponent = config.rightPanel.component;
  const EmptyComponent = config.rightPanel.emptyState;

  // Show empty state if no data and empty component provided
  if (!data && EmptyComponent) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <EmptyComponent />
      </div>
    );
  }

  // Show default empty state if no data and no empty component
  if (!data) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          color: "#9ca3af",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>No data yet</p>
          <p style={{ fontSize: "14px" }}>
            Start chatting to see results here
          </p>
        </div>
      </div>
    );
  }

  // Render the configured view component
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "24px",
        background: "white",
      }}
    >
      <ViewComponent 
        data={data} 
        params={params} 
        onDelete={onDelete}
        onDataUpdate={onDataUpdate}
      />
    </div>
  );
}
