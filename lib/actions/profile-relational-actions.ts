"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get all profile categories with their hierarchy
 */
export async function getProfileCategories() {
  return await prisma.profileCategory.findMany({
    where: { isActive: true },
    orderBy: [
      { level: 'asc' },
      { sortOrder: 'asc' }
    ],
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
}

/**
 * Get category tree (recursive hierarchy)
 */
export async function getCategoryTree(parentId: string | null = null): Promise<any[]> {
  const categories = await prisma.profileCategory.findMany({
    where: { 
      parentId, 
      isActive: true 
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      values: {
        take: 10 // Limit values for performance
      }
    }
  });

  return Promise.all(categories.map(async cat => ({
    ...cat,
    children: await getCategoryTree(cat.id)
  })));
}

/**
 * Get a category by slug
 */
export async function getCategoryBySlug(slug: string) {
  return await prisma.profileCategory.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }
    }
  });
}

/**
 * Get user's profile values with full category hierarchy
 */
export async function getUserProfileValues(userId: string) {
  const userValues = await prisma.userProfileValue.findMany({
    where: { userId },
    include: {
      value: {
        include: {
          category: {
            include: {
              parent: {
                include: {
                  parent: true // Support 3 levels deep
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      addedAt: 'desc'
    }
  });

  return userValues;
}

/**
 * Get user's profile values grouped by category
 */
export async function getUserProfileValuesByCategory(userId: string) {
  const userValues = await getUserProfileValues(userId);
  
  // Group by top-level category
  const grouped: Record<string, any[]> = {};
  
  for (const uv of userValues) {
    // Find the root category
    let rootCategory = uv.value.category;
    while (rootCategory.parent) {
      rootCategory = rootCategory.parent;
    }
    
    if (!grouped[rootCategory.slug]) {
      grouped[rootCategory.slug] = [];
    }
    
    grouped[rootCategory.slug].push({
      id: uv.id,
      value: uv.value.value,
      valueId: uv.valueId,
      category: uv.value.category,
      metadata: uv.metadata,
      notes: uv.notes,
      addedAt: uv.addedAt
    });
  }
  
  return grouped;
}

/**
 * Add a profile value for a user
 * Creates the value if it doesn't exist, then links it to the user
 * 
 * Uses a Serializable transaction to prevent race conditions where
 * two concurrent requests could both pass the duplicate check before either inserts.
 */
export async function addProfileValue(
  userId: string,
  value: string,
  categorySlug: string,
  metadata?: any
) {
  try {
    // Use a serializable transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check for existing value (case-insensitive) in ANY category first
      // This is the primary duplicate prevention check
      const existingByValue = await tx.userProfileValue.findFirst({
        where: {
          userId,
          value: {
            value: { equals: value, mode: 'insensitive' }
          }
        },
        include: {
          value: {
            include: {
              category: true
            }
          }
        }
      });

      if (existingByValue) {
        console.log(`[addProfileValue] Skipping duplicate value "${value}" - already exists in category "${existingByValue.value.category.slug}"`);
        return { success: false, error: 'Value already exists for this user', isDuplicate: true };
      }

      // 2. Find the category
      const category = await tx.profileCategory.findUnique({
        where: { slug: categorySlug }
      });

      if (!category) {
        throw new Error(`Category not found: ${categorySlug}`);
      }

      // 3. Find or create the profile value in the master table
      const profileValue = await tx.profileValue.upsert({
        where: {
          value_categoryId: {
            value: value,
            categoryId: category.id
          }
        },
        create: {
          value: value,
          categoryId: category.id
        },
        update: {}
      });

      // 4. Check if user already has this exact valueId (redundant safety check)
      const existingExact = await tx.userProfileValue.findUnique({
        where: {
          userId_valueId: {
            userId,
            valueId: profileValue.id
          }
        }
      });

      if (existingExact) {
        console.log(`[addProfileValue] Skipping - user already has exact valueId for "${value}"`);
        return { success: false, error: 'Value already exists for this user', isDuplicate: true };
      }

      // 5. Create the UserProfileValue link
      const userValue = await tx.userProfileValue.create({
        data: {
          userId,
          valueId: profileValue.id,
          metadata: metadata || { source: 'manual', addedAt: new Date().toISOString() }
        },
        include: {
          value: {
            include: {
              category: true
            }
          }
        }
      });

      console.log(`[addProfileValue] Successfully added "${value}" to category "${categorySlug}" for user ${userId}`);
      return { success: true, data: userValue };
    }, {
      // Serializable isolation level prevents phantom reads and race conditions
      // This ensures that if two requests try to add the same value simultaneously,
      // one will succeed and the other will either see the existing value or retry
      isolationLevel: 'Serializable',
      timeout: 10000 // 10 second timeout
    });

    // Revalidate paths outside the transaction
    if (result.success) {
      revalidatePath('/object/profile_attribute');
    }
    
    return result;
  } catch (error: any) {
    // Handle serialization failures gracefully - they indicate a race condition was prevented
    if (error.code === 'P2034' || error.message?.includes('could not serialize')) {
      console.log(`[addProfileValue] Transaction serialization conflict for "${value}" - likely duplicate prevented`);
      return { success: false, error: 'Value may already exist (concurrent request)' };
    }
    
    console.error('[addProfileValue] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a profile value from a user
 */
export async function removeProfileValue(userId: string, userValueId: string) {
  try {
    await prisma.userProfileValue.delete({
      where: {
        id: userValueId,
        userId // Ensure user owns this value
      }
    });

    revalidatePath('/object/profile_attribute');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error removing profile value:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update metadata for a user's profile value
 */
export async function updateProfileValueMetadata(
  userId: string,
  userValueId: string,
  metadata: any
) {
  try {
    const updated = await prisma.userProfileValue.update({
      where: {
        id: userValueId,
        userId
      },
      data: {
        metadata
      }
    });

    revalidatePath('/object/profile_attribute');
    
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating profile value metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search for categories by name or slug
 */
export async function searchCategories(query: string) {
  return await prisma.profileCategory.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      parent: true
    },
    take: 20
  });
}

/**
 * Get popular values for a category (most used by users)
 */
export async function getPopularValuesForCategory(categorySlug: string, limit = 10) {
  const category = await prisma.profileCategory.findUnique({
    where: { slug: categorySlug }
  });

  if (!category) {
    return [];
  }

  const values = await prisma.profileValue.findMany({
    where: { categoryId: category.id },
    include: {
      _count: {
        select: { userValues: true }
      }
    },
    orderBy: {
      userValues: {
        _count: 'desc'
      }
    },
    take: limit
  });

  return values;
}

/**
 * Get full category path (breadcrumb) for a category
 */
export async function getCategoryPath(categoryId: string): Promise<string[]> {
  const path: string[] = [];
  let currentCategory = await prisma.profileCategory.findUnique({
    where: { id: categoryId },
    include: { parent: true }
  });

  while (currentCategory) {
    path.unshift(currentCategory.name);
    if (currentCategory.parent) {
      currentCategory = await prisma.profileCategory.findUnique({
        where: { id: currentCategory.parent.id },
        include: { parent: true }
      });
    } else {
      break;
    }
  }

  return path;
}

/**
 * Clean up duplicate UserProfileValue entries
 * This is called asynchronously when duplicates are detected during graph display
 */
export async function cleanupDuplicateUserValues(duplicateIds: string[]) {
  if (duplicateIds.length === 0) return;
  
  try {
    const result = await prisma.userProfileValue.deleteMany({
      where: { id: { in: duplicateIds } }
    });
    
    console.log(`[cleanupDuplicateUserValues] Cleaned up ${result.count} duplicate profile values`);
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('[cleanupDuplicateUserValues] Error cleaning up duplicates:', error);
    return { success: false, error: String(error) };
  }
}
