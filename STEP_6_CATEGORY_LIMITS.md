# Step 6: Category Limits Validation

## Goal
Add 5 categories / 5 items per category limits and return reorganization flags.

## Status
⏳ PENDING

## Files to Modify
- `lib/actions/profile-graph-actions.ts`

## Changes Required

### 1. Add Constants

```typescript
const MAX_CATEGORIES = 5;
const MAX_ITEMS_PER_CATEGORY = 5;
```

### 2. Create validateCategoryLimits Function

```typescript
export async function validateCategoryLimits(
  userId: string,
  newCategory?: string
): Promise<{
  canAdd: boolean;
  requiresReorganization: boolean;
  reason?: string;
  categoryItemCount?: number;
}> {
  // Get current profile graph
  const profileGraph = await getUserProfileGraph(userId);
  const graphData = profileGraph.graphData;
  
  // Count primary categories
  const primaryCategories = new Set(
    graphData.nodes
      .filter(n => n.type === 'category' && !n.metadata?.parentCategory)
      .map(n => n.category)
  );
  
  // Check if adding new category would exceed limit
  if (newCategory && !primaryCategories.has(newCategory)) {
    if (primaryCategories.size >= MAX_CATEGORIES) {
      return {
        canAdd: false,
        requiresReorganization: false,
        reason: `Maximum of ${MAX_CATEGORIES} primary categories reached`
      };
    }
  }
  
  // Check items per category
  const categoryItemCounts = new Map<string, number>();
  graphData.nodes
    .filter(n => n.type === 'item' && n.category)
    .forEach(n => {
      const count = categoryItemCounts.get(n.category!) || 0;
      categoryItemCounts.set(n.category!, count + 1);
    });
  
  // Check if any category needs reorganization
  for (const [category, count] of categoryItemCounts.entries()) {
    if (count >= MAX_ITEMS_PER_CATEGORY) {
      return {
        canAdd: true,
        requiresReorganization: true,
        reason: `Category "${category}" has ${count} items and needs reorganization into subcategories`,
        categoryItemCount: count
      };
    }
  }
  
  return {
    canAdd: true,
    requiresReorganization: false
  };
}
```

### 3. Update addGraphItem to Use Validation

```typescript
export async function addGraphItem(
  userId: string,
  item: {
    category: string;
    subcategory: string;
    value: string;
    metadata?: Record<string, string>;
  }
): Promise<{
  graphData: GraphData;
  xmlData: string;
  requiresReorganization: boolean;
  reorganizationReason?: string;
}> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // Only allow users to modify their own profile
  if (userId !== session.user.id) {
    throw new Error("Unauthorized");
  }
  
  try {
    // Validate category limits
    const validation = await validateCategoryLimits(userId, item.category);
    
    if (!validation.canAdd) {
      throw new Error(validation.reason || "Cannot add item");
    }

    // Get current profile graph
    let profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId }
    });

    if (!profileGraph) {
      // Create new profile graph
      profileGraph = await prisma.userProfileGraph.create({
        data: {
          userId,
          xmlData: `<profile><user id="${userId}"/></profile>`
        }
      });
    }

    // Add item to XML
    const updatedXml = addItemToXml(
      profileGraph.xmlData,
      item.category,
      item.subcategory,
      item.value,
      item.metadata
    );

    // Update database
    await prisma.userProfileGraph.update({
      where: { userId },
      data: { xmlData: updatedXml }
    });

    // Parse updated XML to graph data
    const graphData = parseXmlToGraphData(updatedXml);

    return {
      graphData,
      xmlData: updatedXml,
      requiresReorganization: validation.requiresReorganization,
      reorganizationReason: validation.reason
    };
  } catch (error) {
    console.error("Error adding graph item:", error);
    throw error;
  }
}
```

## Testing
- ✅ Add 5 items to "hobbies" category
- ✅ Try adding 6th item
- ✅ Should return `requiresReorganization: true`
- ✅ Toast notification shows: "Category 'hobbies' has 6 items and needs reorganization"
- ✅ Item still gets added (reorganization happens in Step 7)

## Expected Behavior
- First 5 items in a category: Normal behavior
- 6th item in a category:
  - Item gets added
  - Returns `requiresReorganization: true`
  - Returns reason: "Category 'hobbies' has 6 items and needs reorganization"
  - Toast notification appears
  - Triggers reorganization API call (Step 7)

## Next Step
Proceed to Step 7: AI Reorganization System
