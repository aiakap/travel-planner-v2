/**
 * Category Processor
 * Automatically categorizes items based on keywords and rules
 * Now uses database categories instead of hardcoded ones
 */

import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export interface CategoryRule {
  keywords: string[];
  categorySlug: string; // Changed from category to categorySlug
  priority?: number; // Higher priority rules checked first
}

export interface ProcessorConfig {
  rules: CategoryRule[];
  defaultCategorySlug?: string; // Changed from defaultCategory/defaultSubcategory
}

export interface CategorizedItem {
  value: string;
  categorySlug: string; // The slug of the category to use
  confidence: number; // 0-1 score
  matchedKeyword?: string;
}

/**
 * Process a value and determine its category slug
 */
export function categorizeItem(
  value: string,
  config: ProcessorConfig
): CategorizedItem {
  const normalizedValue = value.toLowerCase().trim();
  
  // Sort rules by priority (highest first)
  const sortedRules = [...config.rules].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );
  
  // Check each rule
  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      if (normalizedValue.includes(keyword.toLowerCase())) {
        return {
          value,
          categorySlug: rule.categorySlug,
          confidence: 1.0,
          matchedKeyword: keyword
        };
      }
    }
  }
  
  // Fallback to default
  return {
    value,
    categorySlug: config.defaultCategorySlug || "general",
    confidence: 0.5
  };
}

/**
 * Batch process multiple items
 */
export function categorizeItems(
  values: string[],
  config: ProcessorConfig
): CategorizedItem[] {
  return values.map(value => categorizeItem(value, config));
}

/**
 * Validate that category slug exists in database
 */
export async function validateCategorySlug(
  categorySlug: string
): Promise<boolean> {
  const category = await prisma.profileCategory.findUnique({
    where: { slug: categorySlug, isActive: true }
  });
  
  return category !== null;
}

/**
 * Get all active category slugs from database
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await prisma.profileCategory.findMany({
    where: { isActive: true },
    select: { slug: true }
  });
  
  return categories.map(c => c.slug);
}
