"use server";

/**
 * Profile CRUD Server Actions
 * 
 * Specialized, testable server actions for profile graph operations
 * Used by both the generic object system and direct API calls
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  addItemToXml, 
  removeItemFromXml, 
  parseXmlToGraph, 
  createEmptyProfileXml 
} from "@/lib/profile-graph-xml";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { revalidatePath } from "next/cache";

/**
 * Upsert a profile item
 * Adds or updates an item in the user's profile graph
 */
export async function upsertProfileItem(params: {
  category: string;
  subcategory: string;
  value: string;
  metadata?: Record<string, string>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  console.log("🔵 [upsertProfileItem] Starting:", params);

  // #region agent log
  const fs = require('fs');
  fs.appendFileSync('/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/.cursor/debug.log', JSON.stringify({location:'profile-crud-actions.ts:36',message:'upsertProfileItem called',data:{category:params.category,subcategory:params.subcategory,value:params.value,userId:session.user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})+'\n');
  // #endregion

  try {
    // Get current XML
    let profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    });
    
    const currentXml = profileGraph?.graphData || createEmptyProfileXml();
    
    // #region agent log
    fs.appendFileSync('/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/.cursor/debug.log', JSON.stringify({location:'profile-crud-actions.ts:47',message:'Current XML fetched',data:{hasProfileGraph:!!profileGraph,xmlLength:currentXml.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})+'\n');
    // #endregion
    
    // Add item to XML
    const updatedXml = addItemToXml(
      currentXml,
      params.category,
      params.subcategory,
      params.value,
      params.metadata
    );
    
    // #region agent log
    fs.appendFileSync('/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/.cursor/debug.log', JSON.stringify({location:'profile-crud-actions.ts:59',message:'XML updated',data:{oldLength:currentXml.length,newLength:updatedXml.length,changed:currentXml!==updatedXml},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})+'\n');
    // #endregion
    
    console.log("🔵 [upsertProfileItem] XML updated, saving to DB...");
    
    // Save to DB
    profileGraph = await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      update: { graphData: updatedXml },
      create: { userId: session.user.id, graphData: updatedXml }
    });
    
    // #region agent log
    fs.appendFileSync('/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/.cursor/debug.log', JSON.stringify({location:'profile-crud-actions.ts:72',message:'Saved to DB',data:{profileGraphId:profileGraph.id,xmlLength:profileGraph.graphData.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})+'\n');
    // #endregion
    
    console.log("🟢 [upsertProfileItem] Saved to DB:", profileGraph.id);
    
    // Parse for return
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    const graphData = parseXmlToGraph(
      profileGraph.graphData,
      session.user.id,
      user?.name || undefined
    );
    
    console.log("🟢 [upsertProfileItem] Parsed graph:", {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length
    });
    
    // Revalidate paths
    revalidatePath("/profile/graph");
    revalidatePath("/object/profile_attribute");
    
    return {
      success: true,
      graphData,
      xmlData: profileGraph.graphData
    };
  } catch (error) {
    console.error("🔴 [upsertProfileItem] Error:", error);
    throw error;
  }
}

/**
 * Delete a profile item
 * Removes an item from the user's profile graph
 */
export async function deleteProfileItem(params: {
  category: string;
  subcategory: string;
  value: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  console.log("🔵 [deleteProfileItem] Starting:", params);

  try {
    const profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!profileGraph) {
      throw new Error("Profile not found");
    }
    
    const updatedXml = removeItemFromXml(
      profileGraph.graphData,
      params.category,
      params.subcategory,
      params.value
    );
    
    console.log("🔵 [deleteProfileItem] XML updated, saving to DB...");
    
    const updated = await prisma.userProfileGraph.update({
      where: { userId: session.user.id },
      data: { graphData: updatedXml }
    });
    
    console.log("🟢 [deleteProfileItem] Saved to DB:", updated.id);
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    const graphData = parseXmlToGraph(
      updated.graphData,
      session.user.id,
      user?.name || undefined
    );
    
    console.log("🟢 [deleteProfileItem] Parsed graph:", {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length
    });
    
    // Revalidate paths
    revalidatePath("/profile/graph");
    revalidatePath("/object/profile_attribute");
    
    return {
      success: true,
      graphData,
      xmlData: updated.graphData
    };
  } catch (error) {
    console.error("🔴 [deleteProfileItem] Error:", error);
    throw error;
  }
}

/**
 * Read profile data
 * Fetches the user's complete profile graph
 */
export async function readProfileData(userId?: string) {
  const session = await auth();
  const targetUserId = userId || session?.user?.id;
  
  if (!targetUserId) {
    throw new Error("Not authenticated");
  }
  
  console.log("🔵 [readProfileData] Reading for userId:", targetUserId);
  
  // Reuse existing getUserProfileGraph
  const result = await getUserProfileGraph(targetUserId);
  
  console.log("🟢 [readProfileData] Fetched:", {
    nodeCount: result.graphData.nodes.length,
    edgeCount: result.graphData.edges.length
  });
  
  return result;
}
