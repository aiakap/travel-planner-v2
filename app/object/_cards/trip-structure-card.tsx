/**
 * Trip structure card component
 * Displays trip structure suggestion
 */

import { CardProps } from "../_core/types";

interface TripStructureData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  segments?: Array<{
    name: string;
    type: string;
    startLocation: string;
    endLocation?: string;
    startTime?: string;
  }>;
}

export function TripStructureCard({
  data,
  onAction,
  onDataUpdate,
}: CardProps<TripStructureData>) {
  const handleApply = () => {
    if (onAction) {
      onAction("apply", data);
    }
    if (onDataUpdate) {
      onDataUpdate({ action: "update_trip_structure", structure: data });
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "white",
      }}
    >
      {data.title && (
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
          {data.title}
        </h3>
      )}
      {data.description && (
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
          {data.description}
        </p>
      )}
      {data.startDate && data.endDate && (
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
          {new Date(data.startDate).toLocaleDateString()} -{" "}
          {new Date(data.endDate).toLocaleDateString()}
        </p>
      )}

      {data.segments && data.segments.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>
            Segments:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.segments.map((segment, index) => (
              <div
                key={index}
                style={{
                  padding: "8px",
                  background: "#f9fafb",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                {segment.name} ({segment.startLocation}
                {segment.endLocation && segment.endLocation !== segment.startLocation
                  ? ` → ${segment.endLocation}`
                  : ""}
                )
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleApply}
        style={{
          width: "100%",
          padding: "8px 16px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Apply Structure
      </button>
    </div>
  );
}
