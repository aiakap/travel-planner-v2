/**
 * Profile Graph Page
 * 
 * Server component that fetches initial graph data
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { ProfileGraphClient } from "./client";

export const metadata = {
  title: "Profile Graph Builder",
  description: "Build your interactive profile graph"
};

export default async function ProfileGraphPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth-landing");
  }

  // Fetch initial profile graph data
  const profileGraph = await getUserProfileGraph(session.user.id);

  return (
    <ProfileGraphClient
      initialGraphData={profileGraph.graphData}
      initialXmlData={profileGraph.xmlData || null}
      user={profileGraph.user}
    />
  );
}
