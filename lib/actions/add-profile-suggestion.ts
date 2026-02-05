"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addProfileValue, getUserProfileValues, cleanupDuplicateUserValues } from "@/lib/actions/profile-relational-actions";
import { 
  convertUserValuesToGraphData, 
  mapXmlCategoryToRelationalSlug,
  UserProfileValueWithRelations 
} from "@/lib/profile-relational-adapter";

interface ProfileSuggestion {
  type: "hobby" | "preference";
  category: string;
  value: string;
  hobbyId?: string | null;
  preferenceTypeId?: string | null;
  optionId?: string | null;
}

export async function addProfileSuggestion(suggestion: ProfileSuggestion) {
  console.log('🔵 addProfileSuggestion CALLED with:', suggestion);
  
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    // Map category/type to relational slug
    const categorySlug = mapXmlCategoryToRelationalSlug(suggestion.category, suggestion.type);
    
    console.log('🔵 Mapped to slug:', categorySlug);
    
    // Add to relational storage
    const result = await addProfileValue(
      session.user.id,
      suggestion.value,
      categorySlug,
      {
        source: 'suggestion',
        originalCategory: suggestion.category,
        originalType: suggestion.type,
        addedAt: new Date().toISOString(),
      }
    );

    if (!result.success) {
      console.log('🔵 Value may already exist:', result.error);
    } else {
      console.log('🟢 Added to relational storage');
    }
    
    // Fetch updated profile values
    const userValues = await getUserProfileValues(session.user.id) as UserProfileValueWithRelations[];
    
    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });

    // Convert to graph data for immediate UI update
    const { graphData, duplicateIds } = convertUserValuesToGraphData(
      userValues,
      session.user.id,
      user?.name || undefined
    );

    console.log('🟢 Converted to graph:', {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
      duplicatesFound: duplicateIds.length
    });

    // Fire-and-forget cleanup of duplicates
    if (duplicateIds.length > 0) {
      cleanupDuplicateUserValues(duplicateIds).catch(err => {
        console.error('[addProfileSuggestion] Background cleanup failed:', err);
      });
    }

    revalidatePath("/profile/graph", "page");
    revalidatePath("/profile", "page");
    revalidatePath("/object/profile_attribute", "page");
    revalidatePath("/", "layout");

    return { 
      success: true, 
      message: "Added to profile graph",
      graphData,
      xmlData: null // No longer using XML
    };
  } catch (error) {
    console.error('🔴 ERROR in addProfileSuggestion:', error);
    throw new Error("Failed to add suggestion to profile");
  }
}
