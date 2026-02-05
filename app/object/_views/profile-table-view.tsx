"use client";

/**
 * Profile table view component
 * Displays user profile values from relational database in a table format
 * Alternative visualization to the chip-based view
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function ProfileTableView({ 
  data, 
  onDelete 
}: { 
  data: any;
  onDelete?: () => void;
}) {
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  if (!data || !data.profileValues) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const profileValues = data.profileValues || [];
  
  // Transform profile values into table rows
  const items = profileValues.map((item: any) => {
    // Find the root category (traverse up the parent chain)
    let category = item.value.category;
    while (category.parent) {
      category = category.parent;
    }
    
    return {
      id: item.id,
      category: category.name,
      subcategory: item.value.category.name,
      value: item.value.value,
      metadata: item.metadata,
      addedAt: item.addedAt
    };
  });

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
        onDelete?.(); // Trigger refresh via callback
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

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>
          No profile data yet. Start chatting to build your profile!
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "12px" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px"
      }}>
        <thead>
          <tr style={{
            background: "#f9fafb",
            borderBottom: "2px solid #e5e7eb"
          }}>
            <th style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#111827",
              borderRight: "1px solid #e5e7eb"
            }}>
              Category
            </th>
            <th style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#111827",
              borderRight: "1px solid #e5e7eb"
            }}>
              Subcategory
            </th>
            <th style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#111827",
              borderRight: "1px solid #e5e7eb"
            }}>
              Value
            </th>
            <th style={{
              padding: "10px 12px",
              textAlign: "center",
              fontWeight: "600",
              color: "#111827",
              width: "80px"
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, index: number) => {
            const isDeleting = deletingItem === item.id;
            const isEvenRow = index % 2 === 0;

            return (
              <tr
                key={`${item.category}-${item.subcategory}-${item.id}-${index}`}
                style={{
                  background: isDeleting ? "#fee2e2" : (isEvenRow ? "white" : "#f9fafb"),
                  borderBottom: "1px solid #e5e7eb",
                  transition: "background 0.2s"
                }}
              >
                <td style={{
                  padding: "10px 12px",
                  color: isDeleting ? "#991b1b" : "#374151",
                  borderRight: "1px solid #e5e7eb"
                }}>
                  {item.category}
                </td>
                <td style={{
                  padding: "10px 12px",
                  color: isDeleting ? "#991b1b" : "#6b7280",
                  borderRight: "1px solid #e5e7eb"
                }}>
                  {item.subcategory}
                </td>
                <td style={{
                  padding: "10px 12px",
                  color: isDeleting ? "#991b1b" : "#111827",
                  fontWeight: "500",
                  borderRight: "1px solid #e5e7eb"
                }}>
                  {item.value}
                </td>
                <td style={{
                  padding: "10px 12px",
                  textAlign: "center"
                }}>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isDeleting ? 0.5 : 1,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.background = "#fee2e2";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Delete item"
                  >
                    <Trash2 
                      style={{
                        width: "16px",
                        height: "16px",
                        color: isDeleting ? "#991b1b" : "#dc2626"
                      }}
                    />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
