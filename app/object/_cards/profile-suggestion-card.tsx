/**
 * Profile suggestion card component
 * Displays a suggestion to add to profile
 */

import { CardProps } from "../_core/types";

interface ProfileSuggestionData {
  category: string;
  subcategory?: string;
  value: string;
  metadata?: Record<string, string>;
}

export function ProfileSuggestionCard({
  data,
  onAction,
  onDataUpdate,
}: CardProps<ProfileSuggestionData>) {
  const handleAccept = () => {
    if (onAction) {
      onAction("accept", data);
    }
    if (onDataUpdate) {
      onDataUpdate({ action: "add_to_profile", suggestion: data });
    }
  };

  const handleReject = () => {
    if (onAction) {
      onAction("reject", data);
    }
  };

  return (
    <div
      style={{
        padding: "12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
          {data.category}
          {data.subcategory && ` • ${data.subcategory}`}
        </p>
        <p style={{ fontSize: "14px", fontWeight: "500" }}>{data.value}</p>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleReject}
          style={{
            padding: "6px 12px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Reject
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: "6px 12px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
