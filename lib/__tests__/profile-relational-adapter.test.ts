/**
 * Unit Tests for Profile Relational Adapter
 * 
 * Tests the conversion functions that transform relational profile data
 * to GraphData format for visualization and backward compatibility.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertUserValuesToGraphData,
  convertUserValuesToProfileItems,
  formatRelationalProfileForAI,
  getProfileSummary,
  mapXmlCategoryToRelationalSlug,
  UserProfileValueWithRelations
} from '../profile-relational-adapter';

// ============================================================================
// Mock Data Factory
// ============================================================================

function createMockUserValue(overrides: Partial<{
  id: string;
  value: string;
  categorySlug: string;
  categoryName: string;
  parentSlug: string | null;
  parentName: string | null;
  rootSlug: string | null;
  rootName: string | null;
  level: number;
}>): UserProfileValueWithRelations {
  const {
    id = 'test-upv-1',
    value = 'Test Value',
    categorySlug = 'outdoor',
    categoryName = 'Outdoor Activities',
    parentSlug = 'activities',
    parentName = 'Activities',
    rootSlug = null,
    rootName = null,
    level = 2
  } = overrides;

  // Build parent chain based on level
  let parent = null;
  if (level >= 1 && parentSlug && parentName) {
    parent = {
      id: `cat-${parentSlug}`,
      name: parentName,
      slug: parentSlug,
      description: null,
      icon: null,
      color: '#3b82f6',
      parentId: rootSlug ? `cat-${rootSlug}` : null,
      level: level - 1,
      parent: rootSlug && rootName ? {
        id: `cat-${rootSlug}`,
        name: rootName,
        slug: rootSlug,
        color: '#6b7280'
      } : null
    };
  }

  return {
    id,
    userId: 'test-user-123',
    valueId: `value-${id}`,
    metadata: {},
    notes: null,
    addedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    value: {
      id: `value-${id}`,
      value,
      categoryId: `cat-${categorySlug}`,
      description: null,
      icon: null,
      aliases: [],
      category: {
        id: `cat-${categorySlug}`,
        name: categoryName,
        slug: categorySlug,
        description: null,
        icon: null,
        color: '#10b981',
        parentId: parent ? parent.id : null,
        level,
        sortOrder: 0,
        parent
      }
    }
  };
}

// ============================================================================
// convertUserValuesToGraphData Tests
// ============================================================================

describe('convertUserValuesToGraphData', () => {
  it('should return empty graph with only user node when no values provided', () => {
    const { graphData, duplicateIds } = convertUserValuesToGraphData([], 'user-123', 'Test User');
    
    expect(graphData.nodes).toHaveLength(1);
    expect(graphData.nodes[0]).toMatchObject({
      id: 'user',
      type: 'user',
      label: 'Test User'
    });
    expect(graphData.edges).toHaveLength(0);
    expect(duplicateIds).toHaveLength(0);
  });

  it('should return empty graph with default label when no username provided', () => {
    const { graphData } = convertUserValuesToGraphData([], 'user-123');
    
    expect(graphData.nodes[0].label).toBe('You');
  });

  it('should create category nodes and item nodes from user values', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Hiking',
        categorySlug: 'outdoor',
        categoryName: 'Outdoor',
        parentSlug: 'activities',
        parentName: 'Activities',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-2',
        value: 'Photography',
        categorySlug: 'outdoor',
        categoryName: 'Outdoor',
        parentSlug: 'activities',
        parentName: 'Activities',
        level: 2
      })
    ];

    const { graphData } = convertUserValuesToGraphData(mockValues, 'user-123', 'Alex');

    // Should have: user node + category node + item nodes (may have subnodes)
    expect(graphData.nodes.length).toBeGreaterThanOrEqual(3);
    
    // Check user node exists
    const userNode = graphData.nodes.find(n => n.id === 'user');
    expect(userNode).toBeDefined();
    expect(userNode?.type).toBe('user');
    
    // Check category node exists
    const categoryNode = graphData.nodes.find(n => n.type === 'category');
    expect(categoryNode).toBeDefined();
    
    // Check item nodes exist
    const itemNodes = graphData.nodes.filter(n => n.type === 'item');
    expect(itemNodes.length).toBeGreaterThanOrEqual(2);
    
    // Check edges connect user to category
    const userToCategoryEdge = graphData.edges.find(e => e.from === 'user');
    expect(userToCategoryEdge).toBeDefined();
  });

  it('should group items by root category', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Hiking',
        categorySlug: 'outdoor',
        parentSlug: 'activities',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-2',
        value: 'Paris',
        categorySlug: 'cities',
        parentSlug: 'destinations',
        level: 2
      })
    ];

    const { graphData } = convertUserValuesToGraphData(mockValues, 'user-123');

    // Should have 2 category nodes (activities and destinations)
    const categoryNodes = graphData.nodes.filter(n => n.type === 'category');
    expect(categoryNodes.length).toBe(2);
  });

  it('should include metadata with userProfileValueId and use unique IDs', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-unique-123',
        value: 'Scuba Diving',
        categorySlug: 'water-sports',
        parentSlug: 'activities',
        level: 2
      })
    ];

    const { graphData } = convertUserValuesToGraphData(mockValues, 'user-123');
    
    const itemNode = graphData.nodes.find(n => n.type === 'item');
    expect(itemNode?.metadata?.userProfileValueId).toBe('upv-unique-123');
    // ID should be based on the unique UserProfileValue ID
    expect(itemNode?.id).toBe('item-upv-unique-123');
  });

  it('should detect and return duplicate values across categories', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Spanish',
        categorySlug: 'primary-languages',
        parentSlug: 'languages',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-2',
        value: 'spanish', // Same value, different case
        categorySlug: 'other-languages',
        parentSlug: 'languages',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-3',
        value: 'French',
        categorySlug: 'primary-languages',
        parentSlug: 'languages',
        level: 2
      })
    ];

    const { graphData, duplicateIds } = convertUserValuesToGraphData(mockValues, 'user-123');

    // Should detect 'spanish' (upv-2) as duplicate of 'Spanish' (upv-1)
    expect(duplicateIds).toContain('upv-2');
    expect(duplicateIds).toHaveLength(1);
    
    // Graph should only have unique values
    const itemNodes = graphData.nodes.filter(n => n.type === 'item');
    const itemValues = itemNodes.map(n => n.label?.toLowerCase());
    expect(itemValues.filter(v => v === 'spanish')).toHaveLength(1);
  });
});

// ============================================================================
// convertUserValuesToProfileItems Tests
// ============================================================================

describe('convertUserValuesToProfileItems', () => {
  it('should return empty array when no values provided', () => {
    const result = convertUserValuesToProfileItems([]);
    expect(result).toEqual([]);
  });

  it('should return empty array when null/undefined provided', () => {
    const result = convertUserValuesToProfileItems(null as any);
    expect(result).toEqual([]);
  });

  it('should convert user values to ProfileGraphItem array', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Running',
        categorySlug: 'sports',
        parentSlug: 'activities',
        level: 2
      })
    ];

    const result = convertUserValuesToProfileItems(mockValues);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      value: 'Running',
      metadata: expect.objectContaining({
        userProfileValueId: 'upv-1'
      })
    });
  });

  it('should preserve category mapping in items', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Budget Hotels',
        categorySlug: 'types',
        categoryName: 'Types',
        parentSlug: 'accommodations',
        parentName: 'Accommodations',
        level: 2
      })
    ];

    const result = convertUserValuesToProfileItems(mockValues);

    expect(result[0].metadata?.rootCategorySlug).toBe('accommodations');
    expect(result[0].metadata?.categorySlug).toBe('types');
  });
});

// ============================================================================
// formatRelationalProfileForAI Tests
// ============================================================================

describe('formatRelationalProfileForAI', () => {
  it('should return default message when no values provided', () => {
    const result = formatRelationalProfileForAI([]);
    expect(result).toBe('No profile information available.');
  });

  it('should return default message when null provided', () => {
    const result = formatRelationalProfileForAI(null as any);
    expect(result).toBe('No profile information available.');
  });

  it('should format values grouped by category', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Hiking',
        categorySlug: 'outdoor',
        parentSlug: 'activities',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-2',
        value: 'Swimming',
        categorySlug: 'outdoor',
        parentSlug: 'activities',
        level: 2
      })
    ];

    const result = formatRelationalProfileForAI(mockValues);

    // Note: activities maps to "Hobbies & Interests" via mapSlugToGraphCategory
    expect(result).toContain('Hobbies & Interests');
    expect(result).toContain('Hiking');
    expect(result).toContain('Swimming');
  });

  it('should include subcategory in parentheses when not general', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Japanese',
        categorySlug: 'cuisines',
        categoryName: 'Cuisines',
        parentSlug: 'dining-cuisine',
        parentName: 'Dining & Cuisine',
        level: 2
      })
    ];

    const result = formatRelationalProfileForAI(mockValues);

    expect(result).toContain('Japanese');
    expect(result).toContain('(cuisines)');
  });
});

// ============================================================================
// getProfileSummary Tests
// ============================================================================

describe('getProfileSummary', () => {
  it('should return empty summary when no values provided', () => {
    const result = getProfileSummary([]);

    expect(result).toEqual({
      hasData: false,
      itemCount: 0,
      categories: [],
      lastUpdated: null
    });
  });

  it('should return correct summary with values', () => {
    const mockValues: UserProfileValueWithRelations[] = [
      createMockUserValue({
        id: 'upv-1',
        value: 'Hiking',
        categorySlug: 'outdoor',
        parentSlug: 'activities',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-2',
        value: 'Paris',
        categorySlug: 'cities',
        parentSlug: 'destinations',
        level: 2
      })
    ];

    const result = getProfileSummary(mockValues);

    expect(result.hasData).toBe(true);
    expect(result.itemCount).toBe(2);
    expect(result.categories).toHaveLength(2);
    expect(result.categories).toContain('activities');
    expect(result.categories).toContain('destinations');
    expect(result.lastUpdated).toBeInstanceOf(Date);
  });

  it('should track the most recent update date', () => {
    const olderDate = new Date('2024-01-10');
    const newerDate = new Date('2024-02-15');

    const mockValues: UserProfileValueWithRelations[] = [
      {
        ...createMockUserValue({ id: 'upv-1', value: 'A' }),
        updatedAt: olderDate
      },
      {
        ...createMockUserValue({ id: 'upv-2', value: 'B' }),
        updatedAt: newerDate
      }
    ];

    const result = getProfileSummary(mockValues);

    expect(result.lastUpdated).toEqual(newerDate);
  });
});

// ============================================================================
// mapXmlCategoryToRelationalSlug Tests
// ============================================================================

describe('mapXmlCategoryToRelationalSlug', () => {
  describe('Travel Style mappings', () => {
    it('should map travel-style:pace to pace', () => {
      expect(mapXmlCategoryToRelationalSlug('travel-style', 'pace')).toBe('pace');
    });

    it('should map travel-style:luxury-vs-budget to luxury-level', () => {
      expect(mapXmlCategoryToRelationalSlug('travel-style', 'luxury-vs-budget')).toBe('luxury-level');
    });

    it('should map travel-style:general to travel-style', () => {
      expect(mapXmlCategoryToRelationalSlug('travel-style', 'general')).toBe('travel-style');
    });
  });

  describe('Activities/Hobbies mappings', () => {
    it('should map activities:outdoor to outdoor', () => {
      expect(mapXmlCategoryToRelationalSlug('activities', 'outdoor')).toBe('outdoor');
    });

    it('should map hobbies:sports to sports', () => {
      expect(mapXmlCategoryToRelationalSlug('hobbies', 'sports')).toBe('sports');
    });

    it('should map activities:cultural to cultural', () => {
      expect(mapXmlCategoryToRelationalSlug('activities', 'cultural')).toBe('cultural');
    });
  });

  describe('Accommodations mappings', () => {
    it('should map accommodations:types to types', () => {
      expect(mapXmlCategoryToRelationalSlug('accommodations', 'types')).toBe('types');
    });

    it('should map accommodations:brands to brands', () => {
      expect(mapXmlCategoryToRelationalSlug('accommodations', 'brands')).toBe('brands');
    });
  });

  describe('Transportation/Travel Preferences mappings', () => {
    it('should map transportation:airlines to airlines', () => {
      expect(mapXmlCategoryToRelationalSlug('transportation', 'airlines')).toBe('airlines');
    });

    it('should map travel-preferences:airlines to airlines', () => {
      expect(mapXmlCategoryToRelationalSlug('travel-preferences', 'airlines')).toBe('airlines');
    });

    it('should map transportation:travel-class to travel-class', () => {
      expect(mapXmlCategoryToRelationalSlug('transportation', 'travel-class')).toBe('travel-class');
    });
  });

  describe('Dining/Culinary mappings', () => {
    it('should map dining:cuisines to cuisines', () => {
      expect(mapXmlCategoryToRelationalSlug('dining', 'cuisines')).toBe('cuisines');
    });

    it('should map culinary-preferences:dietary to dietary', () => {
      expect(mapXmlCategoryToRelationalSlug('culinary-preferences', 'dietary')).toBe('dietary');
    });
  });

  describe('Family/Companions mappings', () => {
    it('should map family:spouse to partner', () => {
      expect(mapXmlCategoryToRelationalSlug('family', 'spouse')).toBe('partner');
    });

    it('should map companions:family to family-companion', () => {
      expect(mapXmlCategoryToRelationalSlug('companions', 'family')).toBe('family-companion');
    });
  });

  describe('Destinations mappings', () => {
    it('should map destinations:wishlist to wishlist', () => {
      expect(mapXmlCategoryToRelationalSlug('destinations', 'wishlist')).toBe('wishlist');
    });

    it('should map destinations:regions to regions', () => {
      expect(mapXmlCategoryToRelationalSlug('destinations', 'regions')).toBe('regions');
    });
  });

  describe('Edge cases', () => {
    it('should handle case insensitivity', () => {
      expect(mapXmlCategoryToRelationalSlug('ACTIVITIES', 'OUTDOOR')).toBe('outdoor');
    });

    it('should handle whitespace', () => {
      expect(mapXmlCategoryToRelationalSlug('  activities  ', '  outdoor  ')).toBe('outdoor');
    });

    it('should return subcategory as fallback for unknown mappings', () => {
      expect(mapXmlCategoryToRelationalSlug('unknown', 'custom-value')).toBe('custom-value');
    });

    it('should return other for completely unknown category', () => {
      expect(mapXmlCategoryToRelationalSlug('unknown', '')).toBe('other');
    });
  });
});

// ============================================================================
// Integration-style Tests
// ============================================================================

describe('Integration: Full data transformation flow', () => {
  it('should correctly transform a realistic profile dataset', () => {
    const mockProfile: UserProfileValueWithRelations[] = [
      // Activities
      createMockUserValue({
        id: 'upv-hiking',
        value: 'Hiking',
        categorySlug: 'outdoor',
        categoryName: 'Outdoor',
        parentSlug: 'activities',
        parentName: 'Activities',
        level: 2
      }),
      createMockUserValue({
        id: 'upv-photography',
        value: 'Photography',
        categorySlug: 'cultural',
        categoryName: 'Cultural',
        parentSlug: 'activities',
        parentName: 'Activities',
        level: 2
      }),
      // Destinations
      createMockUserValue({
        id: 'upv-japan',
        value: 'Japan',
        categorySlug: 'wishlist',
        categoryName: 'Wishlist',
        parentSlug: 'destinations',
        parentName: 'Destinations',
        level: 2
      }),
      // Accommodations
      createMockUserValue({
        id: 'upv-boutique',
        value: 'Boutique Hotels',
        categorySlug: 'types',
        categoryName: 'Types',
        parentSlug: 'accommodations',
        parentName: 'Accommodations',
        level: 2
      })
    ];

    // Test GraphData conversion
    const { graphData, duplicateIds } = convertUserValuesToGraphData(mockProfile, 'user-123', 'Test User');
    
    expect(graphData.nodes.some(n => n.type === 'user')).toBe(true);
    expect(graphData.nodes.filter(n => n.type === 'category').length).toBeGreaterThanOrEqual(3);
    expect(graphData.edges.length).toBeGreaterThan(0);
    expect(duplicateIds).toHaveLength(0); // No duplicates in this dataset

    // Test ProfileGraphItem conversion
    const items = convertUserValuesToProfileItems(mockProfile);
    
    expect(items).toHaveLength(4);
    expect(items.map(i => i.value)).toContain('Hiking');
    expect(items.map(i => i.value)).toContain('Japan');
    expect(items.map(i => i.value)).toContain('Boutique Hotels');

    // Test AI formatting
    const aiFormat = formatRelationalProfileForAI(mockProfile);
    
    expect(aiFormat).toContain('Hiking');
    expect(aiFormat).toContain('Japan');
    expect(aiFormat).toContain('Boutique Hotels');

    // Test summary
    const summary = getProfileSummary(mockProfile);
    
    expect(summary.hasData).toBe(true);
    expect(summary.itemCount).toBe(4);
    expect(summary.categories.length).toBe(3);
  });
});
