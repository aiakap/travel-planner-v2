import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { SuggestionsClient } from "./client";
import { ProfileGraphItem, GraphCategory } from "@/lib/types/profile-graph";

export const metadata = {
  title: "Trip Suggestions",
  description: "Get AI-powered personalized trip suggestions based on your profile"
};

export default async function SuggestionsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/suggestions");
  }

  // Fetch profile graph data (already parses XML to graphData)
  const profileGraph = await getUserProfileGraph(session.user.id);
  
  // Extract and deduplicate items from already-parsed graphData.nodes
  const seenIds = new Set<string>();
  const profileItems: ProfileGraphItem[] = profileGraph.graphData.nodes
    .filter((n) => n.type === 'item')
    .filter((n) => {
      if (seenIds.has(n.id)) return false;
      seenIds.add(n.id);
      return true;
    })
    .map((n) => ({
      id: n.id,
      category: n.category as GraphCategory,
      value: n.value || n.label,
      metadata: n.metadata
    }));

  const user = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image || undefined,
  };

  // User profile info for trip suggestions
  const userProfile = {
    name: profileGraph.user.name || session.user.name || "",
    dateOfBirth: profileGraph.user.profile?.dateOfBirth || null,
    city: profileGraph.user.profile?.city || null,
    country: profileGraph.user.profile?.country || null,
  };

  return (
    <SuggestionsClient
      user={user}
      userProfile={userProfile}
      profileItems={profileItems}
      xmlData={profileGraph.xmlData || null}
    />
  );
}
