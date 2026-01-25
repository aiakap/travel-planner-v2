/**
 * Trip view component
 * Displays trip with segments and reservations
 */

export function TripView({ data }: { data: any }) {
  if (!data || !data.trip) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
        <p>No trip data available</p>
      </div>
    );
  }

  const { trip } = data;

  return (
    <div>
      {/* Trip Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          {trip.name || "Untitled Trip"}
        </h1>
        <p style={{ color: "#6b7280" }}>
          {trip.startDate && trip.endDate
            ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(
                trip.endDate
              ).toLocaleDateString()}`
            : "No dates set"}
        </p>
      </div>

      {/* Segments */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {trip.segments && trip.segments.length > 0 ? (
          trip.segments.map((segment: any, index: number) => (
            <div
              key={segment.id || index}
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "white",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                  📍 {segment.name || segment.startLocation || "Segment"}
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  {segment.startTime
                    ? new Date(segment.startTime).toLocaleDateString()
                    : "No date"}
                </p>
              </div>

              {/* Reservations */}
              {segment.reservations && segment.reservations.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    Reservations:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {segment.reservations.map((reservation: any, idx: number) => (
                      <div
                        key={reservation.id || idx}
                        style={{
                          padding: "8px",
                          background: "#f9fafb",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      >
                        • {reservation.vendor || reservation.name || "Reservation"}
                        {reservation.confirmationNumber && (
                          <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                            #{reservation.confirmationNumber}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
  );
}
