/**
 * Info Request Card Component
 * Displays when AI needs clarification or wants to redirect from Moments to Chapters
 */

"use client";

import { useState } from "react";
import { CardProps } from "../_core/types";
import { Info, AlertCircle } from "lucide-react";

export interface InfoRequestData {
  type: "missing_info" | "moment_redirect";
  question?: string;
  message: string;
  suggestion?: string;
  context?: string;
}

export function InfoRequestCard({ data }: CardProps<InfoRequestData>) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isMomentRedirect = data.type === "moment_redirect";

  return (
    <div
      style={{
        padding: "16px",
        background: isMomentRedirect ? "#fef3c7" : "#dbeafe",
        border: `1px solid ${isMomentRedirect ? "#fbbf24" : "#3b82f6"}`,
        borderRadius: "12px",
        marginBottom: "12px",
        fontSize: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {isMomentRedirect ? (
          <AlertCircle 
            style={{ 
              width: "20px", 
              height: "20px", 
              color: "#d97706",
              flexShrink: 0,
              marginTop: "2px"
            }} 
          />
        ) : (
          <Info 
            style={{ 
              width: "20px", 
              height: "20px", 
              color: "#2563eb",
              flexShrink: 0,
              marginTop: "2px"
            }} 
          />
        )}
        
        <div style={{ flex: 1 }}>
          {data.question && (
            <div style={{ 
              fontWeight: "600", 
              marginBottom: "8px",
              color: isMomentRedirect ? "#92400e" : "#1e40af"
            }}>
              {data.question}
            </div>
          )}
          
          <div style={{ 
            color: isMomentRedirect ? "#78350f" : "#1e3a8a",
            lineHeight: "1.5"
          }}>
            {data.message}
          </div>
          
          {data.suggestion && (
            <div style={{ 
              marginTop: "8px",
              padding: "8px 12px",
              background: isMomentRedirect ? "#fef9c3" : "#eff6ff",
              borderRadius: "6px",
              fontSize: "13px",
              color: isMomentRedirect ? "#713f12" : "#1e40af"
            }}>
              💡 {data.suggestion}
            </div>
          )}
          
          {data.context && (
            <div style={{ 
              marginTop: "8px",
              fontSize: "12px",
              color: "#6b7280",
              fontStyle: "italic"
            }}>
              {data.context}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
