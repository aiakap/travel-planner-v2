/**
 * Trip preview view component
 * Shows trip structure before committing to database
 */

export function TripPreviewView({ data }: { data: any }) {
  if (!data || !data.inMemoryTrip) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
        <p>Start chatting to create your trip structure</p>
      </div>
    );
  }

  const { inMemoryTrip } = data;

  return (
    <div>
      {/* Trip Metadata */}
      <div
        style={{
          padding: "20px",
          background: "#f9fafb",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          {inMemoryTrip.title || "Untitled Trip"}
        </h1>
        {inMemoryTrip.description && (
          <p style={{ color: "#6b7280", marginBottom: "8px" }}>
            {inMemoryTrip.description}
          </p>
        )}
        {inMemoryTrip.startDate && inMemoryTrip.endDate && (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            {new Date(inMemoryTrip.startDate).toLocaleDateString()} -{" "}
            {new Date(inMemoryTrip.endDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Segments */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
          Trip Structure
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {inMemoryTrip.segments && inMemoryTrip.segments.length > 0 ? (
            inMemoryTrip.segments.map((segment: any, index: number) => (
              <div
                key={segment.tempId || index}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>
                    {segment.segmentType === "FLIGHT"
                      ? "✈️"
                      : segment.segmentType === "LODGING"
                      ? "🏨"
                      : segment.segmentType === "TRANSPORT"
                      ? "🚗"
                      : "📍"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600" }}>
                      {segment.name}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                      {segment.startLocation}
                      {segment.endLocation && segment.endLocation !== segment.startLocation
                        ? ` → ${segment.endLocation}`
                        : ""}
                    </p>
                    {segment.startTime && (
                      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                        {new Date(segment.startTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {segment.notes && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginTop: "8px",
                      fontStyle: "italic",
                    }}
                  >
                    {segment.notes}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
              No segments yet
            </p>
          )}
        </div>
      </div>

      {/* Commit Button */}
      {inMemoryTrip.title && inMemoryTrip.segments && inMemoryTrip.segments.length > 0 && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            style={{
              padding: "12px 24px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={() => alert("Commit functionality not yet implemented")}
          >
            Commit Trip to Database
          </button>
        </div>
      )}
    </div>
  );
}
