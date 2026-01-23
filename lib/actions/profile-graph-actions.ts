"use server";

/**
 * Profile Graph Server Actions
 * 
 * Server actions for managing the profile graph data
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  parseXmlToGraph, 
  createEmptyProfileXml, 
  addItemToXml, 
  removeItemFromXml,
  extractItemsFromXml,
  validateXml
} from "@/lib/profile-graph-xml";
import { GraphData, ProfileGraphItem } from "@/lib/types/profile-graph";
import { revalidatePath } from "next/cache";

/**
 * Get user's profile graph data
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
    let profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: targetUserId }
    });
    
    // Create profile graph if it doesn't exist
    if (!profileGraph) {
      profileGraph = await prisma.userProfileGraph.create({
        data: {
          userId: targetUserId,
          graphData: createEmptyProfileXml()
        }
      });
    }
    
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
    
    // Parse XML to graph data
    const graphData = parseXmlToGraph(
      profileGraph.graphData,
      targetUserId,
      user?.name || undefined
    );
    
    return {
      id: profileGraph.id,
      userId: profileGraph.userId,
      graphData,
      xmlData: profileGraph.graphData,
      user: user || { id: targetUserId, name: null, email: null, image: null },
      createdAt: profileGraph.createdAt,
      updatedAt: profileGraph.updatedAt
    };
  } catch (error) {
    console.error("Error fetching profile graph:", error);
    throw new Error("Failed to fetch profile graph");
  }
}

/**
 * Update profile graph XML data
 */
export async function updateProfileGraphXml(xmlData: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  // Validate XML
  if (!validateXml(xmlData)) {
    throw new Error("Invalid XML data");
  }
  
  try {
    const profileGraph = await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      update: {
        graphData: xmlData
      },
      create: {
        userId: session.user.id,
        graphData: xmlData
      }
    });
    
    revalidatePath("/profile/graph");
    
    return {
      success: true,
      id: profileGraph.id
    };
  } catch (error) {
    console.error("Error updating profile graph:", error);
    throw new Error("Failed to update profile graph");
  }
}

/**
 * Add an item to the profile graph
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
    // Get current profile graph
    let profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    });
    
    let currentXml = profileGraph?.graphData || createEmptyProfileXml();
    
    // Add item to XML
    const updatedXml = addItemToXml(currentXml, category, subcategory, value, metadata);
    
    // Update database
    profileGraph = await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      update: {
        graphData: updatedXml
      },
      create: {
        userId: session.user.id,
        graphData: updatedXml
      }
    });
    
    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    // Parse to graph data
    const graphData = parseXmlToGraph(
      profileGraph.graphData,
      session.user.id,
      user?.name || undefined
    );
    
    revalidatePath("/profile/graph");
    
    return {
      success: true,
      graphData,
      xmlData: profileGraph.graphData
    };
  } catch (error) {
    console.error("Error adding graph item:", error);
    throw new Error("Failed to add item to profile graph");
  }
}

/**
 * Remove an item from the profile graph
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
    // Get current profile graph
    const profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!profileGraph) {
      throw new Error("Profile graph not found");
    }
    
    // Remove item from XML
    const updatedXml = removeItemFromXml(
      profileGraph.graphData,
      category,
      subcategory,
      value
    );
    
    // Update database
    const updated = await prisma.userProfileGraph.update({
      where: { userId: session.user.id },
      data: {
        graphData: updatedXml
      }
    });
    
    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });
    
    // Parse to graph data
    const graphData = parseXmlToGraph(
      updated.graphData,
      session.user.id,
      user?.name || undefined
    );
    
    revalidatePath("/profile/graph");
    
    return {
      success: true,
      graphData,
      xmlData: updated.graphData
    };
  } catch (error) {
    console.error("Error removing graph item:", error);
    throw new Error("Failed to remove item from profile graph");
  }
}

/**
 * Get all items from profile graph as a flat list
 */
export async function getProfileGraphItems(): Promise<ProfileGraphItem[]> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    const profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!profileGraph || !profileGraph.graphData) {
      return [];
    }
    
    return extractItemsFromXml(profileGraph.graphData);
  } catch (error) {
    console.error("Error fetching profile graph items:", error);
    throw new Error("Failed to fetch profile graph items");
  }
}

/**
 * Clear all profile graph data
 */
export async function clearProfileGraph() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  
  try {
    await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      update: {
        graphData: createEmptyProfileXml()
      },
      create: {
        userId: session.user.id,
        graphData: createEmptyProfileXml()
      }
    });
    
    revalidatePath("/profile/graph");
    
    return { success: true };
  } catch (error) {
    console.error("Error clearing profile graph:", error);
    throw new Error("Failed to clear profile graph");
  }
}
