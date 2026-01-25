"use client";

/**
 * Profile view component
 * Displays user profile graph data (dossier nodes)
 * Display-only component - items are added via chat
 */

export function ProfileView({ data }: { data: any }) {
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

  return (
    <div style={{ padding: "24px", height: "100%", overflow: "auto" }}>
      {/* Profile Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          Your Travel Profile
        </h1>
        <p style={{ color: "#6b7280" }}>
          Chat on the left to add items
        </p>
      </div>

      {/* Profile Sections - Display only, no input fields */}
      {Object.keys(nodesByCategory).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(nodesByCategory).map(([category, items]: [string, any]) => (
            <div key={category}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                {category}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {items.map((item: any) => (
                  <span
                    key={item.id}
                    style={{
                      padding: "6px 12px",
                      background: "#eff6ff",
                      color: "#1e40af",
                      borderRadius: "16px",
                      fontSize: "14px",
                    }}
                  >
                    {item.value}
                  </span>
                ))}
              </div>
            </div>
          ))}
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
