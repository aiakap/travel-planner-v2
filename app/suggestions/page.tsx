import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { extractItemsFromXml } from "@/lib/profile-graph-xml";
import { SuggestionsClient } from "./client";

export const metadata = {
  title: "Trip Suggestions",
  description: "Get AI-powered personalized trip suggestions based on your profile"
};

export default async function SuggestionsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/suggestions");
  }

  // Fetch profile graph data
  const profileGraph = await getUserProfileGraph(session.user.id);
  
  // Extract items from XML
  const profileItems = extractItemsFromXml(profileGraph.xmlData || null);

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
