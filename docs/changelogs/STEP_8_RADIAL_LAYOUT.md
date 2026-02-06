# Step 8: Radial Layout Algorithm

## Goal
Add radial/concentric circles layout calculation (no visual change yet - just the algorithm).

## Status
⏳ PENDING

## Files to Modify
- `lib/graph-layout.ts`

## Changes Required

### Add calculateRadialLayout Function

```typescript
/**
 * Calculate radial layout - concentric circles
 * User at center, categories in first ring, subcategories in second ring, items in third ring
 */
export function calculateRadialLayout(graphData: GraphData): GraphData {
  const nodes = [...graphData.nodes];
  const edges = [...graphData.edges];

  // Find user node (center)
  const userNode = nodes.find(n => n.type === 'user');
  if (!userNode) return graphData;

  // Set user at center
  userNode.x = 0;
  userNode.y = 0;

  // Get categories (first ring)
  const categoryNodes = nodes.filter(n => n.type === 'category' && !n.metadata?.parentCategory);
  const categoryRadius = 250;
  const categoryAngleStep = (2 * Math.PI) / categoryNodes.length;

  categoryNodes.forEach((node, index) => {
    const angle = index * categoryAngleStep;
    node.x = Math.cos(angle) * categoryRadius;
    node.y = Math.sin(angle) * categoryRadius;
  });

  // Get subcategories (second ring)
  const subcategoryNodes = nodes.filter(n => n.type === 'subnode' || (n.type === 'category' && n.metadata?.parentCategory));
  const subcategoryRadius = 450;

  // Group subcategories by parent category
  const subcategoriesByParent = new Map<string, typeof nodes>();
  subcategoryNodes.forEach(node => {
    const parentCategory = node.metadata?.parentCategory || node.category;
    if (!subcategoriesByParent.has(parentCategory!)) {
      subcategoriesByParent.set(parentCategory!, []);
    }
    subcategoriesByParent.get(parentCategory!)!.push(node);
  });

  // Position subcategories around their parent categories
  subcategoriesByParent.forEach((subnodes, parentCategory) => {
    const parentNode = categoryNodes.find(n => n.category === parentCategory);
    if (!parentNode) return;

    const parentAngle = Math.atan2(parentNode.y, parentNode.x);
    const spreadAngle = Math.PI / 4; // 45 degrees spread
    const angleStep = spreadAngle / (subnodes.length + 1);

    subnodes.forEach((node, index) => {
      const angle = parentAngle - spreadAngle / 2 + (index + 1) * angleStep;
      node.x = Math.cos(angle) * subcategoryRadius;
      node.y = Math.sin(angle) * subcategoryRadius;
    });
  });

  // Get items (third ring)
  const itemNodes = nodes.filter(n => n.type === 'item');
  const itemRadius = 650;

  // Group items by parent (category or subcategory)
  const itemsByParent = new Map<string, typeof nodes>();
  itemNodes.forEach(node => {
    const parentId = node.metadata?.subcategory || node.category || '';
    if (!itemsByParent.has(parentId)) {
      itemsByParent.set(parentId, []);
    }
    itemsByParent.get(parentId)!.push(node);
  });

  // Position items around their parents
  itemsByParent.forEach((items, parentId) => {
    // Find parent node
    const parentNode = [...categoryNodes, ...subcategoryNodes].find(
      n => n.id === parentId || n.category === parentId || n.metadata?.subcategory === parentId
    );
    
    if (!parentNode) return;

    const parentAngle = Math.atan2(parentNode.y, parentNode.x);
    const spreadAngle = Math.PI / 6; // 30 degrees spread
    const angleStep = spreadAngle / (items.length + 1);

    items.forEach((node, index) => {
      const angle = parentAngle - spreadAngle / 2 + (index + 1) * angleStep;
      node.x = Math.cos(angle) * itemRadius;
      node.y = Math.sin(angle) * itemRadius;
    });
  });

  return {
    nodes,
    edges
  };
}
```

## Testing
- ✅ Call `calculateRadialLayout(graphData)` with test data
- ✅ Verify user node at (0, 0)
- ✅ Verify category nodes in circle around user (radius 250)
- ✅ Verify subcategory nodes in second circle (radius 450)
- ✅ Verify item nodes in third circle (radius 650)
- ✅ Verify nodes are evenly distributed around their parents

## Expected Behavior
- Function takes GraphData as input
- Returns GraphData with updated x, y coordinates
- Layout structure:
  ```
  Ring 1 (r=250): Categories
  Ring 2 (r=450): Subcategories
  Ring 3 (r=650): Items
  Center (0,0): User
  ```
- Nodes are positioned using polar coordinates
- Each level spreads evenly around its parent

## Visualization
```
                    Item
                     |
              Subcategory
                   |
      Item - Category - Item
            /    |    \
         User - User - User (center)
            \    |    /
      Item - Category - Item
                   |
              Subcategory
                     |
                    Item
```

## Next Step
Proceed to Step 9: Theme System Integration
