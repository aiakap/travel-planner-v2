/**
 * Profile Relational Adapter
 * 
 * Converts relational profile data (UserProfileValue) to GraphData format
 * for visualization and backward compatibility with existing consumers.
 */

import { 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  GraphCategory, 
  ProfileGraphItem,
  GRAPH_CATEGORIES,
  CategoryConfig
} from './types/profile-graph';
import { createSubnodes } from './subnode-logic';
import { calculateHubSpokeLayout } from './graph-layout';
import { normalizeProfileValueText } from "./profile/normalize-profile-value";

/**
 * Type for UserProfileValue with full category relations
 * This matches the return type of getUserProfileValues()
 */
export interface UserProfileValueWithRelations {
  id: string;
  userId: string;
  valueId: string;
  metadata: any;
  notes: string | null;
  addedAt: Date;
  updatedAt: Date;
  value: {
    id: string;
    value: string;
    categoryId: string;
    description: string | null;
    icon: string | null;
    aliases: string[];
    category: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      icon: string | null;
      color: string | null;
      parentId: string | null;
      level: number;
      sortOrder: number;
      parent: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
        color: string | null;
        parentId: string | null;
        level: number;
        parent: {
          id: string;
          name: string;
          slug: string;
          color: string | null;
        } | null;
      } | null;
    };
  };
}

/**
 * Map relational category slugs to GraphCategory for visualization
 * Uses the root-level category slug
 */
function mapSlugToGraphCategory(slug: string): GraphCategory {
  // Map relational root slugs to GraphCategory
  const slugMapping: Record<string, GraphCategory> = {
    'travel-style': 'travel-style',
    'destinations': 'destinations',
    'accommodations': 'accommodations',
    'transportation': 'travel-preferences',
    'activities': 'hobbies',
    'dining-cuisine': 'hobbies',
    'budget-spending': 'spending-priorities',
    'travel-companions': 'family',
    'travel-timing': 'other',
    'travel-logistics': 'travel-preferences',
    'accessibility-mobility': 'other',
    'accessibility': 'other',
    'languages': 'other-languages', // Default for languages without proficiency
    'native-language': 'native-language',
    'other-languages': 'other-languages',
    'other': 'other'
  };

  return slugMapping[slug] || 'other';
}

/**
 * Get root category slug from a UserProfileValue
 */
function getRootCategorySlug(userValue: UserProfileValueWithRelations): string {
  let category = userValue.value.category;
  
  // Traverse up to root
  while (category.parent) {
    category = category.parent as any;
  }
  
  return category.slug;
}

/**
 * Get subcategory slug (level 1 or level 2 if applicable)
 */
function getSubcategorySlug(userValue: UserProfileValueWithRelations): string {
  const category = userValue.value.category;
  
  // If it's a leaf category (level 2), return its slug
  if (category.level === 2) {
    return category.slug;
  }
  
  // If it's level 1, also return its slug
  if (category.level === 1) {
    return category.slug;
  }
  
  // For root level, return 'general'
  return 'general';
}

/**
 * Get category color from GRAPH_CATEGORIES config or category data
 */
function getCategoryColor(rootSlug: string, categoryColor: string | null): string {
  // First try to get from GRAPH_CATEGORIES
  const graphCategory = mapSlugToGraphCategory(rootSlug);
  const config = GRAPH_CATEGORIES.find(c => c.id === graphCategory);
  if (config) {
    return config.color;
  }
  
  // Fall back to category color from database
  if (categoryColor) {
    return categoryColor;
  }
  
  // Default gray
  return '#6b7280';
}

/**
 * Get category label from GRAPH_CATEGORIES or generate from slug
 */
function getCategoryLabel(rootSlug: string): string {
  const graphCategory = mapSlugToGraphCategory(rootSlug);
  const config = GRAPH_CATEGORIES.find(c => c.id === graphCategory);
  if (config) {
    return config.label;
  }
  
  // Generate label from slug
  return rootSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Result type for convertUserValuesToGraphData
 * Includes duplicate IDs for async cleanup
 */
export interface ConvertResult {
  graphData: GraphData;
  duplicateIds: string[];
}

/**
 * Convert UserProfileValue records to GraphData structure for visualization
 * Returns both graph data and IDs of duplicate entries that should be cleaned up
 */
export function convertUserValuesToGraphData(
  userValues: UserProfileValueWithRelations[],
  userId: string,
  userName?: string
): ConvertResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Add user node at center
  nodes.push({
    id: 'user',
    type: 'user',
    label: userName || 'You',
    x: 0,
    y: 0,
    size: 60,
    color: '#ffffff'
  });
  
  if (!userValues || userValues.length === 0) {
    return { graphData: { nodes, edges }, duplicateIds: [] };
  }
  
  // Track ALL seen values for deduplication (not just languages)
  // Key: lowercase value text, Value: first UserProfileValue ID encountered
  const seenValues = new Map<string, string>();
  const duplicateIds: string[] = [];
  
  // Group values by root category
  const categoryGroups = new Map<string, UserProfileValueWithRelations[]>();
  
  for (const uv of userValues) {
    const valueKey = normalizeProfileValueText(uv.value.value).toLowerCase();
    
    // Check if we've seen this value before (in ANY category)
    if (seenValues.has(valueKey)) {
      // This is a duplicate - collect its ID for cleanup
      duplicateIds.push(uv.id);
      console.log(`[convertUserValuesToGraphData] Found duplicate: "${uv.value.value}" (id: ${uv.id})`);
      continue;
    }
    seenValues.set(valueKey, uv.id);
    
    let rootSlug = getRootCategorySlug(uv);
    
    // Route languages to different categories based on proficiency
    if (rootSlug === 'languages') {
      const proficiency = uv.metadata?.proficiency;
      if (proficiency === 'native') {
        rootSlug = 'native-language';
      } else {
        rootSlug = 'other-languages';
      }
    }
    
    if (!categoryGroups.has(rootSlug)) {
      categoryGroups.set(rootSlug, []);
    }
    categoryGroups.get(rootSlug)!.push(uv);
  }
  
  if (duplicateIds.length > 0) {
    console.log(`[convertUserValuesToGraphData] Total duplicates found: ${duplicateIds.length}`);
  }
  
  // Create category nodes and item nodes
  let categoryIndex = 0;
  const totalCategories = categoryGroups.size;
  
  for (const [rootSlug, values] of categoryGroups) {
    const graphCategory = mapSlugToGraphCategory(rootSlug);
    const categoryColor = getCategoryColor(rootSlug, values[0]?.value.category.parent?.parent?.color || values[0]?.value.category.parent?.color || values[0]?.value.category.color);
    const categoryLabel = getCategoryLabel(rootSlug);
    
    // Calculate position for category node (radial layout)
    const angle = (categoryIndex / totalCategories) * 2 * Math.PI;
    const radius = 200;
    const categoryX = Math.cos(angle) * radius;
    const categoryY = Math.sin(angle) * radius;
    
    const categoryId = `category-${rootSlug}`;
    
    // Add category node
    nodes.push({
      id: categoryId,
      type: 'category',
      category: graphCategory,
      label: categoryLabel,
      x: categoryX,
      y: categoryY,
      size: 40 + (values.length * 2),
      color: categoryColor,
      itemCount: values.length
    });
    
    // Add edge from user to category
    edges.push({
      from: 'user',
      to: categoryId
    });
    
    // Add item nodes
    let itemIndex = 0;
    
    for (const uv of values) {
      const subcategorySlug = getSubcategorySlug(uv);
      // Use the unique UserProfileValue ID to ensure no collisions
      const itemId = `item-${uv.id}`;
      
      // Position items around their category
      const itemAngle = (itemIndex / Math.max(values.length, 1)) * 2 * Math.PI;
      const itemRadius = 80;
      const itemX = categoryX + Math.cos(itemAngle) * itemRadius;
      const itemY = categoryY + Math.sin(itemAngle) * itemRadius;
      
      nodes.push({
        id: itemId,
        type: 'item',
        category: graphCategory,
        label: uv.value.value,
        value: uv.value.value,
        metadata: {
          subcategory: subcategorySlug,
          userProfileValueId: uv.id,
          valueId: uv.valueId,
          categorySlug: uv.value.category.slug,
          rootCategorySlug: rootSlug,
          ...(typeof uv.metadata === 'object' ? uv.metadata : {})
        },
        x: itemX,
        y: itemY,
        size: 20,
        color: categoryColor
      });
      
      // Add edge from category to item
      edges.push({
        from: categoryId,
        to: itemId
      });
      
      itemIndex++;
    }
    
    categoryIndex++;
  }
  
  // Apply subnode logic to create subnodes for groups of 2+ items
  const graphWithSubnodes = createSubnodes({ nodes, edges });
  
  // Apply hub-and-spoke layout
  const layoutedGraph = calculateHubSpokeLayout(graphWithSubnodes);
  
  return { graphData: layoutedGraph, duplicateIds };
}

/**
 * Convert UserProfileValue records to ProfileGraphItem[] for backward compatibility
 */
export function convertUserValuesToProfileItems(
  userValues: UserProfileValueWithRelations[]
): ProfileGraphItem[] {
  if (!userValues || userValues.length === 0) {
    return [];
  }
  
  return userValues.map((uv, index) => {
    const rootSlug = getRootCategorySlug(uv);
    const subcategorySlug = getSubcategorySlug(uv);
    const graphCategory = mapSlugToGraphCategory(rootSlug);
    
    return {
      id: `${rootSlug}-${subcategorySlug}-${uv.value.value}`,
      category: graphCategory,
      value: uv.value.value,
      metadata: {
        subcategory: subcategorySlug,
        userProfileValueId: uv.id,
        valueId: uv.valueId,
        categorySlug: uv.value.category.slug,
        rootCategorySlug: rootSlug,
        ...(typeof uv.metadata === 'object' && uv.metadata !== null 
          ? Object.fromEntries(
              Object.entries(uv.metadata).map(([k, v]) => [k, String(v)])
            ) 
          : {})
      }
    };
  });
}

/**
 * Format relational profile data for AI prompts
 */
export function formatRelationalProfileForAI(
  userValues: UserProfileValueWithRelations[]
): string {
  if (!userValues || userValues.length === 0) {
    return 'No profile information available.';
  }
  
  // Group by root category
  const categoryGroups = new Map<string, UserProfileValueWithRelations[]>();
  
  for (const uv of userValues) {
    const rootSlug = getRootCategorySlug(uv);
    if (!categoryGroups.has(rootSlug)) {
      categoryGroups.set(rootSlug, []);
    }
    categoryGroups.get(rootSlug)!.push(uv);
  }
  
  // Format as readable text
  const sections: string[] = [];
  
  for (const [rootSlug, values] of categoryGroups) {
    const label = getCategoryLabel(rootSlug);
    const items = values.map(v => {
      const subcategory = getSubcategorySlug(v);
      return `  - ${v.value.value}${subcategory !== 'general' ? ` (${subcategory})` : ''}`;
    });
    
    sections.push(`${label}:\n${items.join('\n')}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Get a summary of user profile for context
 */
export function getProfileSummary(userValues: UserProfileValueWithRelations[]): {
  hasData: boolean;
  itemCount: number;
  categories: string[];
  lastUpdated: Date | null;
} {
  if (!userValues || userValues.length === 0) {
    return {
      hasData: false,
      itemCount: 0,
      categories: [],
      lastUpdated: null
    };
  }
  
  const categorySet = new Set<string>();
  let lastUpdated: Date | null = null;
  
  for (const uv of userValues) {
    const rootSlug = getRootCategorySlug(uv);
    categorySet.add(rootSlug);
    
    if (!lastUpdated || uv.updatedAt > lastUpdated) {
      lastUpdated = uv.updatedAt;
    }
  }
  
  return {
    hasData: true,
    itemCount: userValues.length,
    categories: Array.from(categorySet),
    lastUpdated
  };
}

/**
 * Map old XML category/subcategory to relational category slug
 * Used when AI extracts items in old format
 */
export function mapXmlCategoryToRelationalSlug(
  category: string,
  subcategory: string
): string {
  // Normalize inputs
  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();
  
  // Comprehensive mapping from XML categories to relational slugs
  const mappings: Record<string, string> = {
    // Travel Style
    'travel-style:solo-vs-group': 'group-preference',
    'travel-style:luxury-vs-budget': 'luxury-level',
    'travel-style:adventure-vs-relaxation': 'adventure-level',
    'travel-style:pace': 'pace',
    'travel-style:general': 'travel-style',
    
    // Destinations
    'destinations:regions': 'regions',
    'destinations:visited': 'visited',
    'destinations:wishlist': 'wishlist',
    'destinations:favorites': 'favorites',
    'destinations:countries': 'countries',
    'destinations:cities': 'cities',
    'destinations:climate': 'climate',
    'destinations:setting': 'setting',
    'destinations:general': 'destinations',
    
    // Accommodations
    'accommodations:types': 'types',
    'accommodations:brands': 'brands',
    'accommodations:amenities': 'amenities',
    'accommodations:preference': 'types',
    'accommodations:general': 'accommodations',
    
    // Transportation
    'transportation:airlines': 'airlines',
    'transportation:travel-class': 'travel-class',
    'transportation:loyalty-programs': 'loyalty-programs',
    'transportation:ground-transport': 'ground-transport',
    'transportation:preference': 'airlines',
    'transportation:general': 'transportation',
    
    // Travel Preferences (legacy XML category)
    'travel-preferences:airlines': 'airlines',
    'travel-preferences:hotels': 'brands',
    'travel-preferences:travel-class': 'travel-class',
    'travel-preferences:loyalty-programs': 'loyalty-programs',
    'travel-preferences:amenities': 'amenities',
    'travel-preferences:priorities': 'splurge-categories',
    'travel-preferences:preference': 'airlines',
    'travel-preferences:general': 'transportation',
    
    // Activities / Hobbies
    'activities:outdoor': 'outdoor',
    'activities:sports': 'sports',
    'activities:cultural': 'cultural',
    'activities:culinary': 'culinary-activities',
    'activities:wellness': 'wellness',
    'activities:adventure': 'adventure-activities',
    'activities:nightlife': 'nightlife',
    'activities:shopping': 'shopping',
    'activities:activity': 'outdoor',
    'activities:general': 'activities',
    
    'hobbies:sports': 'sports',
    'hobbies:outdoor': 'outdoor',
    'hobbies:hobby': 'outdoor',
    'hobbies:culinary': 'culinary-activities',
    'hobbies:arts': 'cultural',
    'hobbies:entertainment': 'cultural',
    'hobbies:preference': 'outdoor',
    'hobbies:general': 'activities',
    
    // Dining / Culinary
    'dining:cuisines': 'cuisines',
    'dining:dietary': 'dietary',
    'dining:dining-style': 'dining-style',
    'dining:beverages': 'beverages',
    'dining:general': 'dining-cuisine',
    
    'culinary-preferences:cuisines': 'cuisines',
    'culinary-preferences:dietary': 'dietary',
    'culinary-preferences:dining-style': 'dining-style',
    'culinary-preferences:beverages': 'beverages',
    'culinary-preferences:general': 'dining-cuisine',
    
    // Budget
    'budget:daily-budget': 'daily-budget',
    'budget:splurge-categories': 'splurge-categories',
    'budget:savings-priorities': 'splurge-categories',
    'budget:loyalty-programs': 'loyalty-programs',
    'budget:credit-cards': 'credit-cards',
    'budget:general': 'budget-spending',
    
    'spending-priorities:budget-allocation': 'daily-budget',
    'spending-priorities:priorities': 'splurge-categories',
    'spending-priorities:general': 'budget-spending',
    
    // Companions / Family
    'companions:solo': 'solo-companion',
    'companions:partner': 'partner',
    'companions:family': 'family-companion',
    'companions:friends': 'friends',
    'companions:organized-groups': 'organized-groups',
    'companions:special-needs': 'special-needs',
    'companions:general': 'travel-companions',
    
    'family:spouse': 'partner',
    'family:children': 'family-companion',
    'family:parents': 'family-companion',
    'family:siblings': 'family-companion',
    'family:friends': 'friends',
    'family:general': 'travel-companions',
    
    // Timing
    'timing:seasons': 'seasons',
    'timing:holidays': 'holidays',
    'timing:peak-vs-offpeak': 'peak-vs-offpeak',
    'timing:trip-length': 'trip-length',
    'timing:general': 'travel-timing',
    
    // Languages - normalize all to primary-languages
    'other:languages': 'primary-languages',
    'other:language': 'primary-languages',
    'other:primary-languages': 'primary-languages',
    'other:spoken-languages': 'primary-languages',
    'languages:general': 'primary-languages',
    'languages:primary': 'primary-languages',
    'languages:spoken': 'primary-languages',
    'languages:fluent': 'primary-languages',
    'languages:native': 'primary-languages',
    
    // Other
    'other:general': 'other'
  };
  
  const key = `${cat}:${sub}`;
  return mappings[key] || sub || 'other';
}
