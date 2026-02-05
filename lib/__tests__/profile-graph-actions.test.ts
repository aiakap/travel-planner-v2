/**
 * Unit Tests for Profile Graph Actions
 * 
 * Tests the server actions that manage profile graph data.
 * Uses mocked auth and database to test business logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the auth module
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

// Mock the prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    userProfileValue: {
      deleteMany: vi.fn()
    }
  }
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

// Mock the relational actions
vi.mock('@/lib/actions/profile-relational-actions', () => ({
  getUserProfileValues: vi.fn(),
  addProfileValue: vi.fn(),
  removeProfileValue: vi.fn()
}));

// Import after mocks are set up
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserProfileValues, addProfileValue, removeProfileValue } from '@/lib/actions/profile-relational-actions';
import {
  getUserProfileGraph,
  addGraphItem,
  removeGraphItem,
  removeGraphItemById,
  getProfileGraphItems,
  clearProfileGraph
} from '../actions/profile-graph-actions';

// ============================================================================
// Test Helpers
// ============================================================================

const mockUserId = 'test-user-123';
const mockSession = {
  user: {
    id: mockUserId,
    name: 'Test User',
    email: 'test@example.com'
  }
};

const mockUserProfileValue = {
  id: 'upv-1',
  userId: mockUserId,
  valueId: 'value-1',
  metadata: {},
  notes: null,
  addedAt: new Date(),
  updatedAt: new Date(),
  value: {
    id: 'value-1',
    value: 'Hiking',
    categoryId: 'cat-outdoor',
    description: null,
    icon: null,
    aliases: [],
    category: {
      id: 'cat-outdoor',
      name: 'Outdoor',
      slug: 'outdoor',
      description: null,
      icon: null,
      color: '#10b981',
      parentId: 'cat-activities',
      level: 2,
      sortOrder: 0,
      parent: {
        id: 'cat-activities',
        name: 'Activities',
        slug: 'activities',
        description: null,
        icon: null,
        color: '#3b82f6',
        parentId: null,
        level: 1,
        parent: null
      }
    }
  }
};

// ============================================================================
// getUserProfileGraph Tests
// ============================================================================

describe('getUserProfileGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(getUserProfileGraph()).rejects.toThrow('User not authenticated');
  });

  it('should throw error when trying to access another users profile', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);

    await expect(getUserProfileGraph('different-user-id')).rejects.toThrow('Unauthorized');
  });

  it('should return graph data for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserProfileValues).mockResolvedValue([mockUserProfileValue]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      profile: null
    } as any);

    const result = await getUserProfileGraph();

    expect(result).toBeDefined();
    expect(result.userId).toBe(mockUserId);
    expect(result.graphData).toBeDefined();
    expect(result.graphData.nodes).toBeDefined();
    expect(result.graphData.edges).toBeDefined();
    expect(result.xmlData).toBeNull(); // Should always be null now
  });

  it('should return empty graph when user has no profile values', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserProfileValues).mockResolvedValue([]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      profile: null
    } as any);

    const result = await getUserProfileGraph();

    expect(result.graphData.nodes).toHaveLength(1); // Just the user node
    expect(result.graphData.nodes[0].type).toBe('user');
  });
});

// ============================================================================
// addGraphItem Tests
// ============================================================================

describe('addGraphItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(addGraphItem('activities', 'outdoor', 'Hiking')).rejects.toThrow('User not authenticated');
  });

  it('should add item and return updated graph', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(addProfileValue).mockResolvedValue({ success: true, data: mockUserProfileValue });
    vi.mocked(getUserProfileValues).mockResolvedValue([mockUserProfileValue]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null
    } as any);

    const result = await addGraphItem('activities', 'outdoor', 'Hiking');

    expect(result.success).toBe(true);
    expect(result.graphData).toBeDefined();
    expect(result.xmlData).toBeNull();
    expect(addProfileValue).toHaveBeenCalledWith(
      mockUserId,
      'Hiking',
      'outdoor', // mapped from activities:outdoor
      expect.objectContaining({
        source: 'chat',
        originalCategory: 'activities',
        originalSubcategory: 'outdoor'
      })
    );
  });

  it('should handle duplicate items gracefully', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(addProfileValue).mockResolvedValue({ 
      success: false, 
      error: 'Value already exists for this user' 
    });
    vi.mocked(getUserProfileValues).mockResolvedValue([mockUserProfileValue]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null
    } as any);

    // Should not throw - duplicates are handled gracefully
    const result = await addGraphItem('activities', 'outdoor', 'Hiking');

    expect(result.success).toBe(true);
    expect(result.graphData).toBeDefined();
  });

  it('should pass metadata to addProfileValue', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(addProfileValue).mockResolvedValue({ success: true });
    vi.mocked(getUserProfileValues).mockResolvedValue([]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null
    } as any);

    await addGraphItem('activities', 'outdoor', 'Hiking', { customField: 'value' });

    expect(addProfileValue).toHaveBeenCalledWith(
      mockUserId,
      'Hiking',
      'outdoor',
      expect.objectContaining({
        customField: 'value'
      })
    );
  });
});

// ============================================================================
// removeGraphItem Tests
// ============================================================================

describe('removeGraphItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(removeGraphItem('activities', 'outdoor', 'Hiking')).rejects.toThrow('User not authenticated');
  });

  it('should remove item by value and return updated graph', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserProfileValues).mockResolvedValue([mockUserProfileValue]);
    vi.mocked(removeProfileValue).mockResolvedValue({ success: true });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null
    } as any);

    const result = await removeGraphItem('activities', 'outdoor', 'Hiking');

    expect(result.success).toBe(true);
    expect(removeProfileValue).toHaveBeenCalledWith(mockUserId, 'upv-1');
  });

  it('should handle item not found gracefully', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserProfileValues).mockResolvedValue([mockUserProfileValue]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null
    } as any);

    // Try to remove a different value
    const result = await removeGraphItem('activities', 'outdoor', 'NonExistentValue');

    // Should still return success but not call removeProfileValue with a valid ID
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// removeGraphItemById Tests
// ============================================================================

describe('removeGraphItemById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(removeGraphItemById('upv-1')).rejects.toThrow('User not authenticated');
  });

  it('should remove item by ID directly', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(removeProfileValue).mockResolvedValue({ success: true });
    vi.mocked(getUserProfileValues).mockResolvedValue([]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      image: null
    } as any);

    const result = await removeGraphItemById('upv-1');

    expect(result.success).toBe(true);
    expect(removeProfileValue).toHaveBeenCalledWith(mockUserId, 'upv-1');
  });
});

// ============================================================================
// getProfileGraphItems Tests
// ============================================================================

describe('getProfileGraphItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(getProfileGraphItems()).rejects.toThrow('User not authenticated');
  });

  it('should return flat array of profile items', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserProfileValues).mockResolvedValue([mockUserProfileValue]);

    const result = await getProfileGraphItems();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('value', 'Hiking');
    expect(result[0]).toHaveProperty('category');
    expect(result[0]).toHaveProperty('metadata');
  });

  it('should return empty array when user has no items', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserProfileValues).mockResolvedValue([]);

    const result = await getProfileGraphItems();

    expect(result).toEqual([]);
  });
});

// ============================================================================
// clearProfileGraph Tests
// ============================================================================

describe('clearProfileGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(clearProfileGraph()).rejects.toThrow('User not authenticated');
  });

  it('should delete all user profile values', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.userProfileValue.deleteMany).mockResolvedValue({ count: 5 });

    const result = await clearProfileGraph();

    expect(result.success).toBe(true);
    expect(prisma.userProfileValue.deleteMany).toHaveBeenCalledWith({
      where: { userId: mockUserId }
    });
  });
});

// ============================================================================
// Deprecated Function Tests
// ============================================================================

describe('updateProfileGraphXml (deprecated)', () => {
  it('should throw error indicating XML is no longer supported', async () => {
    // Import the deprecated function
    const { updateProfileGraphXml } = await import('../actions/profile-graph-actions');

    await expect(updateProfileGraphXml('<xml></xml>')).rejects.toThrow(
      'XML storage is no longer supported'
    );
  });
});
