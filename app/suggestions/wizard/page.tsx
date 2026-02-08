import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { ProfileGraphItem, GraphCategory } from "@/lib/types/profile-graph";
import WizardClient from "./client";

export const metadata = {
  title: "Guided Trip Planning",
  description: "Answer a few questions and get a personalized trip recommendation"
};

export default async function WizardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/suggestions/wizard");
  }

  // Fetch profile graph data
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

  // User profile info for trip suggestions
  const userProfile = {
    name: profileGraph.user.name || session.user.name || "",
    dateOfBirth: profileGraph.user.profile?.dateOfBirth || null,
    city: profileGraph.user.profile?.city || null,
    country: profileGraph.user.profile?.country || null,
  };

  return (
    <WizardClient
      userProfile={userProfile}
      profileItems={profileItems}
    />
  );
}
