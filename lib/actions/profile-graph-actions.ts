"use server";

/**
 * Profile Graph Server Actions
 * 
 * Server actions for managing the profile graph data
 * Now uses relational storage (ProfileCategory/ProfileValue/UserProfileValue)
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  convertUserValuesToGraphData, 
  convertUserValuesToProfileItems,
  mapXmlCategoryToRelationalSlug,
  UserProfileValueWithRelations
} from "@/lib/profile-relational-adapter";
import { getUserProfileValues, addProfileValue, removeProfileValue, cleanupDuplicateUserValues } from "@/lib/actions/profile-relational-actions";
import { GraphData, ProfileGraphItem } from "@/lib/types/profile-graph";
import { revalidatePath } from "next/cache";

/**
 * Get user's profile graph data
 * Now reads from relational tables instead of XML
 */
export async function getUserProfileGraph(userId?: string) {
  const session = await auth();
  const targetUserId = userId || session?.user?.id;
  
  if (!targetUserId) {
    throw new Error("User not authenticated");
  }
  
  // Only allow users to access their own profile graph
  if (userId && userId !== session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  try {
    // Fetch user profile values from relational tables
    const userValues = await getUserProfileValues(targetUserId) as UserProfileValueWithRelations[];
    
    console.log('📖 [getUserProfileGraph] Reading for userId:', targetUserId, {
      valueCount: userValues.length
    });
    
    // Fetch user with profile
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        profile: {
          select: {
            dateOfBirth: true,
            city: true,
            country: true
          }
        }
      }
    });
    
    // Convert to graph data using adapter
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      userValues,
      targetUserId,
      user?.name || undefined
    );
    
    console.log('📖 [getUserProfileGraph] Converted to graph:', {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
      duplicatesFound: duplicateIds.length
    });
    
    // Fire-and-forget: Clean up duplicate entries in the background
    // This doesn't block the response but cleans up the database
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[getUserProfileGraph] Background cleanup failed:', err);
      });
    }
    
    return {
      id: `profile-${targetUserId}`, // Generate a stable ID
      userId: targetUserId,
      graphData,
      xmlData: null, // No longer using XML
      user: user || { id: targetUserId, name: null, email: null, image: null },
      createdAt: new Date(), // Would need to track this differently if needed
      updatedAt: new Date()
    };
  } catch (error) {
    console.error("Error fetching profile graph:", error);
    throw new Error("Failed to fetch profile graph");
  }
}

/**
 * Update profile graph XML data
 * @deprecated - XML storage is no longer used. Use addGraphItem/removeGraphItem instead.
 */
export async function updateProfileGraphXml(xmlData: string) {
  console.warn('[DEPRECATED] updateProfileGraphXml is no longer supported. Use addGraphItem/removeGraphItem instead.');
  throw new Error("XML storage is no longer supported. Use addGraphItem/removeGraphItem instead.");
}

/**
 * Add an item to the profile graph
 * Now writes to relational tables
 */
export async function addGraphItem(
  category: string,
  subcategory: string,
  value: string,
  metadata?: Record<string, string>
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    // Map old XML category/subcategory to relational slug
    const categorySlug = mapXmlCategoryToRelationalSlug(category, subcategory);
    
    console.log('✏️ [addGraphItem] Adding item:', {
      category,
      subcategory,
      value,
      mappedSlug: categorySlug
    });
    
    // Add to relational storage
    const result = await addProfileValue(
      session.user.id,
      value,
      categorySlug,
      {
        source: 'chat',
        originalCategory: category,
        originalSubcategory: subcategory,
        addedAt: new Date().toISOString(),
        ...metadata
      }
    );
    
    if (!result.success) {
      console.log('✏️ [addGraphItem] Value already exists or error:', result.error);
      // If it already exists, that's fine - just return current data
    }
    
    // Fetch updated profile values
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    // Convert to graph data
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      userValues,
      session.user.id,
      user?.name || undefined
    );
    
    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[addGraphItem] Background cleanup failed:', err);
      });
    }
    
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    
    return {
      success: true,
      graphData,
      xmlData: null // No longer using XML
    };
  } catch (error) {
    console.error("Error adding graph item:", error);
    throw new Error("Failed to add item to profile graph");
  }
}

/**
 * Remove an item from the profile graph
 * Now removes from relational tables
 */
export async function removeGraphItem(
  category: string,
  subcategory: string,
  value: string
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    console.log('🗑️ [removeGraphItem] Removing item:', { category, subcategory, value });
    
    // Find the UserProfileValue to remove
    // We need to find by value and category hierarchy
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    // Find the matching value
    const matchingValue = userValues.find(uv => uv.value.value === value);
    
    if (!matchingValue) {
      console.log('🗑️ [removeGraphItem] Value not found:', value);
      // Return current data anyway
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true }
      });
      
      const { graphData, duplicateIds } = convertUserValuesToGraphData(
        userValues,
        session.user.id,
        user?.name || undefined
      );
      
      // Fire-and-forget cleanup of duplicates
      if (duplicateIds.length > 0) {
        cleanupDuplicateUserValues(duplicateIds).catch(err => {
          console.error('[removeGraphItem] Background cleanup failed:', err);
        });
      }
      
      return {
        success: true,
        graphData,
        xmlData: null
      };
    }
    
    // Remove from relational storage
    await removeProfileValue(session.user.id, matchingValue.id);
    
    // Fetch updated profile values
    const updatedValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    // Convert to graph data
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      updatedValues,
      session.user.id,
      user?.name || undefined
    );
    
    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[removeGraphItem] Background cleanup failed:', err);
      });
    }
    
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    
    return {
      success: true,
      graphData,
      xmlData: null
    };
  } catch (error) {
    console.error("Error removing graph item:", error);
    throw new Error("Failed to remove item from profile graph");
  }
}

/**
 * Remove an item by its UserProfileValue ID
 * More direct method for removal
 */
export async function removeGraphItemById(userProfileValueId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    console.log('🗑️ [removeGraphItemById] Removing item:', userProfileValueId);
    
    // Remove from relational storage
    await removeProfileValue(session.user.id, userProfileValueId);
    
    // Fetch updated profile values
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    // Convert to graph data
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      userValues,
      session.user.id,
      user?.name || undefined
    );
    
    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[removeGraphItemById] Background cleanup failed:', err);
      });
    }
    
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    
    return {
      success: true,
      graphData,
      xmlData: null
    };
  } catch (error) {
    console.error("Error removing graph item by ID:", error);
    throw new Error("Failed to remove item from profile graph");
  }
}

/**
 * Get all items from profile graph as a flat list
 * Now reads from relational tables
 */
export async function getProfileGraphItems(): Promise<ProfileGraphItem[]> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    return convertUserValuesToProfileItems(userValues);
  } catch (error) {
    console.error("Error fetching profile graph items:", error);
    throw new Error("Failed to fetch profile graph items");
  }
}

/**
 * Clear all profile graph data
 * Now clears relational data
 */
export async function clearProfileGraph() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    // Delete all UserProfileValue records for this user
    await prisma.userProfileValue.deleteMany({
      where: { userId: session.user.id }
    });
    
    revalidatePath("/profile/graph");
    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error clearing profile graph:", error);
    throw new Error("Failed to clear profile graph");
  }
}
