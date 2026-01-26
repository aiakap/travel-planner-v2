"use client";

/**
 * Profile view component
 * Displays user profile values from relational database
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
    profileValuesCount: data?.profileValues?.length,
    timestamp: Date.now()
  });

  if (!data || !data.profileValues) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const profileValues = data.profileValues || [];
  
  // Group values by root category
  const valuesByCategory = profileValues.reduce((acc: any, item: any) => {
    // Find the root category (traverse up the parent chain)
    let category = item.value.category;
    while (category.parent) {
      category = category.parent;
    }
    
    const categoryName = category.name;
    const subcategoryName = item.value.category.name;
    
    if (!acc[categoryName]) {
      acc[categoryName] = {};
    }
    if (!acc[categoryName][subcategoryName]) {
      acc[categoryName][subcategoryName] = [];
    }
    
    acc[categoryName][subcategoryName].push({
      id: item.id,
      value: item.value.value,
      valueId: item.valueId,
      metadata: item.metadata,
      addedAt: item.addedAt
    });
    
    return acc;
  }, {});

  const handleDelete = async (item: any) => {
    setDeletingItem(item.id);

    try {
      const response = await fetch("/api/object/profile/delete-relational", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userValueId: item.id,
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
    <div style={{ height: "100%", overflow: "auto" }}>
      {/* Profile Sections - Display with subcategory grouping and delete */}
      {Object.keys(valuesByCategory).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Object.entries(valuesByCategory).map(([category, subcategories]: [string, any]) => {
            return (
              <div key={category} style={{ marginBottom: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
                  {category}
                </h3>
                {Object.entries(subcategories).map(([subcategory, items]: [string, any]) => (
                  <div key={subcategory} style={{ marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#6b7280" }}>
                      {subcategory}
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {items.map((item: any, index: number) => {
                        const isDeleting = deletingItem === item.id;
                        
                        return (
                          <div
                            key={`${item.id}-${index}`}
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
