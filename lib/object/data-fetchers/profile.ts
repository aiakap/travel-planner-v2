"use server";

/**
 * Profile data fetcher
 * Fetches user profile graph data (dossier) from database using Prisma
 * This is a server action that can be called from client components
 */

import { prisma } from "@/lib/prisma";
import { parseXmlToGraph } from "@/lib/profile-graph-xml";

export async function fetchProfileData(userId: string) {
  try {
    const profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId },
    });

    // Parse XML to graph data structure
    const graphData = parseXmlToGraph(
      profileGraph?.graphData || null,
      userId
    );

    return {
      graphData,
      hasData: graphData.nodes.length > 1, // More than just the user node
    };
  } catch (error) {
    console.error("Error fetching profile graph data:", error);
    // Return empty graph with user node
    return {
      graphData: { nodes: [], edges: [] },
      hasData: false,
    };
  }
}
