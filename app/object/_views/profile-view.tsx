"use client";

/**
 * Profile view component
 * Displays user profile graph data (dossier nodes)
 * Display-only component - items are added via chat
 */

import { useState } from "react";

export function ProfileView({ 
  data, 
  onDelete 
}: { 
  data: any;
  onDelete?: () => void;
}) {
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  // Debug logging - runs on every render
  console.log('📺 ProfileView: Rendering', {
    hasData: !!data,
    hasGraphData: !!data?.graphData,
    nodeCount: data?.graphData?.nodes?.length,
    nodes: data?.graphData?.nodes?.map((n: any) => n.value).join(', '),
    timestamp: Date.now()
  });

  if (!data || !data.graphData) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const { graphData } = data;
  const nodes = graphData.nodes || [];
  
  // Group nodes by category
  const nodesByCategory = nodes
    .filter((node: any) => node.type === 'item')
    .reduce((acc: any, node: any) => {
      const category = node.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(node);
      return acc;
    }, {});

  const handleDelete = async (item: any) => {
    const uniqueKey = `${item.category}-${item.metadata?.subcategory}-${item.value}`;
    setDeletingItem(uniqueKey);

    try {
      const response = await fetch("/api/object/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          subcategory: item.metadata?.subcategory,
          value: item.value,
        }),
      });

      if (response.ok) {
        // Trigger refresh via callback instead of page reload
        onDelete?.();
      } else {
        alert("Failed to delete item. Please try again.");
        setDeletingItem(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item. Please try again.");
      setDeletingItem(null);
    }
  };

  return (
    <div style={{ padding: "12px", height: "100%", overflow: "auto" }}>
      {/* Profile Header */}
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>
          Your Travel Profile
        </h1>
        <p style={{ color: "#6b7280", fontSize: "12px" }}>
          Chat on the left to add items
        </p>
      </div>

      {/* Profile Sections - Display with subcategory grouping and delete */}
      {Object.keys(nodesByCategory).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Object.entries(nodesByCategory).map(([category, items]: [string, any]) => {
            // Group items by subcategory
            const itemsBySubcategory = items.reduce((acc: any, item: any) => {
              const subcategory = item.metadata?.subcategory || 'other';
              if (!acc[subcategory]) acc[subcategory] = [];
              acc[subcategory].push(item);
              return acc;
            }, {});

            return (
              <div key={category} style={{ marginBottom: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
                  {category}
                </h3>
                {Object.entries(itemsBySubcategory).map(([subcategory, subItems]: [string, any]) => (
                  <div key={subcategory} style={{ marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#6b7280" }}>
                      {subcategory}
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {subItems.map((item: any, index: number) => {
                        const itemKey = `${category}-${subcategory}-${item.value}`;
                        const isDeleting = deletingItem === itemKey;
                        
                        return (
                          <div
                            key={`${category}-${subcategory}-${item.value}-${index}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              background: isDeleting ? "#fee2e2" : "#eff6ff",
                              color: isDeleting ? "#991b1b" : "#1e40af",
                              borderRadius: "12px",
                              fontSize: "13px",
                            }}
                          >
                            <span>{item.value}</span>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={isDeleting}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "14px",
                                height: "14px",
                                padding: "0",
                                background: "transparent",
                                border: "none",
                                color: isDeleting ? "#991b1b" : "#1e40af",
                                cursor: isDeleting ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "bold",
                                opacity: 0.6,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                              title="Remove item"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            No profile data yet. Start chatting to build your profile!
          </p>
        </div>
      )}
    </div>
  );
}
