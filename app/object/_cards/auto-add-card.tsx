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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auto-add-card.tsx:18',message:'handleAccept called',data:{hasOnAction:!!onAction,category:data.category,subcategory:data.subcategory,value:data.value},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    setIsAccepting(true);

    try {
      console.log('🎯 [AUTO_ADD CARD] Starting accept flow:', {
        category: data.category,
        subcategory: data.subcategory,
        value: data.value,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch("/api/object/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          subcategory: data.subcategory,
          value: data.value,
          metadata: {
            context: "user explicitly stated preference"
          }
        })
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auto-add-card.tsx:40',message:'API response received',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion

      console.log('🎯 [AUTO_ADD CARD] API response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.ok) {
        const result = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auto-add-card.tsx:48',message:'Response OK, parsed result',data:{success:result.success,hasGraphData:!!result.graphData,nodeCount:result.graphData?.nodes?.length,hasOnAction:!!onAction},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        console.log('🎯 [AUTO_ADD CARD] Parse result:', {
          success: result.success,
          hasGraphData: !!result.graphData,
          nodeCount: result.graphData?.nodes?.length,
          hasXmlData: !!result.xmlData
        });

        setIsAccepted(true);

        if (onAction) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auto-add-card.tsx:60',message:'Calling onAction reload',data:{action:'reload'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          console.log('🎯 [AUTO_ADD CARD] Triggering reload action');
          onAction('reload', {});
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auto-add-card.tsx:65',message:'onAction is undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          console.warn('⚠️ [AUTO_ADD CARD] onAction is not defined!');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [AUTO_ADD CARD] API error:', {
          status: response.status,
          error: errorText
        });
        alert('Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('❌ [AUTO_ADD CARD] Exception:', error);
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
