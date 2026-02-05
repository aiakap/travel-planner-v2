"use server";

/**
 * Profile CRUD Server Actions
 * 
 * Specialized, testable server actions for profile graph operations
 * Now uses relational storage (ProfileCategory/ProfileValue/UserProfileValue)
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  addGraphItem, 
  removeGraphItem, 
  getUserProfileGraph 
} from "@/lib/actions/profile-graph-actions";
import { 
  addProfileValue, 
  removeProfileValue, 
  getUserProfileValues,
  cleanupDuplicateUserValues 
} from "@/lib/actions/profile-relational-actions";
import { 
  convertUserValuesToGraphData, 
  mapXmlCategoryToRelationalSlug,
  UserProfileValueWithRelations 
} from "@/lib/profile-relational-adapter";
import { revalidatePath } from "next/cache";

/**
 * Upsert a profile item
 * Adds or updates an item in the user's profile using relational storage
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

  try {
    // Map category/subcategory to relational slug
    const categorySlug = mapXmlCategoryToRelationalSlug(params.category, params.subcategory);
    
    console.log("🔵 [upsertProfileItem] Mapped to slug:", categorySlug);
    
    // Add to relational storage
    const result = await addProfileValue(
      session.user.id,
      params.value,
      categorySlug,
      {
        source: 'crud',
        originalCategory: params.category,
        originalSubcategory: params.subcategory,
        addedAt: new Date().toISOString(),
        ...params.metadata
      }
    );
    
    if (!result.success) {
      console.log("🔵 [upsertProfileItem] Value may already exist:", result.error);
    }
    
    console.log("🟢 [upsertProfileItem] Saved to DB");
    
    // Fetch updated values and convert to graph
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      userValues,
      session.user.id,
      user?.name || undefined
    );
    
    console.log("🟢 [upsertProfileItem] Parsed graph:", {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
      duplicatesFound: duplicateIds.length
    });
    
    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[upsertProfileItem] Background cleanup failed:', err);
      });
    }
    
    // Revalidate paths
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    revalidatePath("/object/profile_attribute");
    
    return {
      success: true,
      graphData,
      xmlData: null // No longer using XML
    };
  } catch (error) {
    console.error("🔴 [upsertProfileItem] Error:", error);
    throw error;
  }
}

/**
 * Delete a profile item
 * Removes an item from the user's profile using relational storage
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
    // Find the user profile value by value text
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    const matchingValue = userValues.find(uv => uv.value.value === params.value);
    
    if (!matchingValue) {
      console.log("🔵 [deleteProfileItem] Value not found:", params.value);
    } else {
      // Remove from relational storage
      await removeProfileValue(session.user.id, matchingValue.id);
      console.log("🟢 [deleteProfileItem] Removed from DB:", matchingValue.id);
    }
    
    // Fetch updated values and convert to graph
    const updatedValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      updatedValues,
      session.user.id,
      user?.name || undefined
    );
    
    console.log("🟢 [deleteProfileItem] Parsed graph:", {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
      duplicatesFound: duplicateIds.length
    });
    
    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[deleteProfileItem] Background cleanup failed:', err);
      });
    }
    
    // Revalidate paths
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    revalidatePath("/object/profile_attribute");
    
    return {
      success: true,
      graphData,
      xmlData: null // No longer using XML
    };
  } catch (error) {
    console.error("🔴 [deleteProfileItem] Error:", error);
    throw error;
  }
}

/**
 * Delete a profile item by its UserProfileValue ID
 * More direct method for removal
 */
export async function deleteProfileItemById(userProfileValueId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  console.log("🔵 [deleteProfileItemById] Starting:", userProfileValueId);

  try {
    // Remove from relational storage
    await removeProfileValue(session.user.id, userProfileValueId);
    console.log("🟢 [deleteProfileItemById] Removed from DB");
    
    // Fetch updated values and convert to graph
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      userValues,
      session.user.id,
      user?.name || undefined
    );
    
    console.log("🟢 [deleteProfileItemById] Parsed graph:", {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
      duplicatesFound: duplicateIds.length
    });
    
    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[deleteProfileItemById] Background cleanup failed:', err);
      });
    }
    
    // Revalidate paths
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    revalidatePath("/object/profile_attribute");
    
    return {
      success: true,
      graphData,
      xmlData: null
    };
  } catch (error) {
    console.error("🔴 [deleteProfileItemById] Error:", error);
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
  
  // Reuse existing getUserProfileGraph (now uses relational data)
  const result = await getUserProfileGraph(targetUserId);
  
  console.log("🟢 [readProfileData] Fetched:", {
    nodeCount: result.graphData.nodes.length,
    edgeCount: result.graphData.edges.length
  });
  
  return result;
}
