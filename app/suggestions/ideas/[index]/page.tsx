import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { ProfileGraphItem, GraphCategory } from "@/lib/types/profile-graph";
import IdeaDetailClient from "./client";

export const metadata = {
  title: "Trip Details",
  description: "View details of your AI-generated trip idea"
};

interface IdeaDetailPageProps {
  params: Promise<{
    index: string;
  }>;
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/suggestions/ideas");
  }

  // Get the index from params
  const { index } = await params;
  const suggestionIndex = parseInt(index, 10);
  
  if (isNaN(suggestionIndex) || suggestionIndex < 0 || suggestionIndex > 3) {
    redirect("/suggestions/ideas");
  }

  // Fetch profile graph data for trip creation
  const profileGraph = await getUserProfileGraph(session.user.id);
  
  // Extract and deduplicate items
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

  // User profile info
  const userProfile = {
    name: profileGraph.user.name || session.user.name || "",
    dateOfBirth: profileGraph.user.profile?.dateOfBirth || null,
    city: profileGraph.user.profile?.city || null,
    country: profileGraph.user.profile?.country || null,
  };

  return (
    <IdeaDetailClient
      suggestionIndex={suggestionIndex}
      userProfile={userProfile}
      profileItems={profileItems}
    />
  );
}
