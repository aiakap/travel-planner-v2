/**
 * Profile view component
 * Displays user profile data
 */

export function ProfileView({ data }: { data: any }) {
  if (!data || !data.profile) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
        <p>No profile data available</p>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div>
      {/* Profile Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          Profile
        </h1>
        <p style={{ color: "#6b7280" }}>Your travel preferences and information</p>
      </div>

      {/* Profile Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Hobbies */}
        {profile.hobbies && profile.hobbies.length > 0 && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
              Hobbies & Interests
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {profile.hobbies.map((hobby: any, index: number) => (
                <span
                  key={index}
                  style={{
                    padding: "6px 12px",
                    background: "#eff6ff",
                    color: "#1e40af",
                    borderRadius: "16px",
                    fontSize: "14px",
                  }}
                >
                  {hobby.name || hobby}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Travel Preferences */}
        {profile.travelPreferences && profile.travelPreferences.length > 0 && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
              Travel Preferences
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.travelPreferences.map((pref: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ fontWeight: "500" }}>{pref.type || pref.name}</p>
                  {pref.value && (
                    <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                      {pref.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!profile.hobbies || profile.hobbies.length === 0) &&
          (!profile.travelPreferences || profile.travelPreferences.length === 0) && (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
              No profile data yet. Start chatting to build your profile!
            </p>
          )}
      </div>
    </div>
  );
}
