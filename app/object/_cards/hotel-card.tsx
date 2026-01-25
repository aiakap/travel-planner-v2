/**
 * Hotel card component
 * Displays hotel information with action buttons
 */

import { CardProps } from "../_core/types";

interface HotelData {
  name: string;
  rating?: number;
  price?: string;
  location?: string;
  description?: string;
  amenities?: string[];
}

export function HotelCard({ data, onAction, onDataUpdate }: CardProps<HotelData>) {
  const handleBook = () => {
    if (onAction) {
      onAction("book", data);
    }
    if (onDataUpdate) {
      onDataUpdate({ action: "book_hotel", hotel: data });
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
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
          {data.name}
        </h3>
        {data.location && (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>📍 {data.location}</p>
        )}
        {data.rating && (
          <p style={{ fontSize: "14px", color: "#f59e0b", marginTop: "4px" }}>
            {"⭐".repeat(Math.floor(data.rating))} {data.rating}/5
          </p>
        )}
      </div>

      {data.description && (
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
          {data.description}
        </p>
      )}

      {data.amenities && data.amenities.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
            Amenities:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {data.amenities.map((amenity, index) => (
              <span
                key={index}
                style={{
                  padding: "4px 8px",
                  background: "#f3f4f6",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {data.price && (
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#3b82f6" }}>
            {data.price}
          </p>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onAction && onAction("details", data)}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Details
          </button>
          <button
            onClick={handleBook}
            style={{
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
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
