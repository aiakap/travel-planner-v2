# Step 3: Auto-Add Items Backend

## Goal
Process auto-add items from AI in the backend and add them to the database, but don't show toast notifications in UI yet.

## Status
⏳ PENDING

## Files to Modify
- `app/api/profile-graph/chat/route.ts`
- `lib/actions/profile-graph-actions.ts`

## Changes Required

### 1. Update `addGraphItem` Function Signature

**File:** `lib/actions/profile-graph-actions.ts`

**Change from:**
```typescript
export async function addGraphItem(
  category: string,
  subcategory: string,
  value: string,
  metadata?: Record<string, string>
)
```

**To:**
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
}>
```

**Add validation:**
```typescript
// Validate category limits (will be implemented in Step 6)
// For now, just add the item

// Add item to XML
let updatedXml = addItemToXml(
  currentXml,
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

// Return updated graph
return {
  graphData: parseXmlToGraphData(updatedXml),
  xmlData: updatedXml,
  requiresReorganization: false
};
```

### 2. Process Auto-Add Items in Chat Route

**File:** `app/api/profile-graph/chat/route.ts`

**Add import:**
```typescript
import { addGraphItem, getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
```

**Process auto-add items:**
```typescript
// Process message with AI
const aiResponse = await processProfileGraphChat(message, conversationHistory);

console.log("🤖 [Profile Graph API] Auto-add items:", aiResponse.autoAddItems?.length || 0);
console.log("🤖 [Profile Graph API] Suggestion items:", aiResponse.suggestionItems?.length || 0);

// Auto-add high-confidence items to database
const autoAddedItems = [];
let requiresReorganization = false;
let reorganizationReason = "";

if (aiResponse.autoAddItems && aiResponse.autoAddItems.length > 0) {
  for (const item of aiResponse.autoAddItems) {
    try {
      const result = await addGraphItem(session.user.id, {
        category: item.category,
        subcategory: item.subcategory,
        value: item.value,
        metadata: item.metadata
      });
      
      autoAddedItems.push({
        value: item.value,
        category: item.category,
        subcategory: item.subcategory
      });
      
      if (result.requiresReorganization) {
        requiresReorganization = true;
        reorganizationReason = result.reorganizationReason || "";
      }
    } catch (error) {
      console.error("❌ Failed to auto-add item:", item.value, error);
    }
  }
}

// Get updated graph data
const profileGraph = await getUserProfileGraph(session.user.id);

// Parse suggestion items for UI
const parsedSuggestions = (aiResponse.suggestionItems || []).map((item, index) => ({
  id: `suggestion-${Date.now()}-${index}`,
  value: item.value,
  category: item.category,
  subcategory: item.subcategory,
  metadata: item.metadata,
  confidence: item.confidence
}));

// Return response
return NextResponse.json({
  success: true,
  message: aiResponse.message,
  autoAdded: autoAddedItems,
  suggestions: parsedSuggestions,
  inlineSuggestions: aiResponse.inlineSuggestions || [],
  requiresReorganization,
  reorganizationReason,
  graphData: profileGraph.graphData,
  xmlData: profileGraph.xmlData
});
```

## Testing
- ✅ Type "I like swimming"
- ✅ Item auto-adds to graph (check database)
- ✅ Graph visualization updates with new node
- ✅ No toast notification yet (that's Step 4)
- ✅ Console logs show auto-added items

## Expected Behavior
- User types "I like swimming"
- AI returns: `autoAddItems: [{value: "Swimming", category: "hobbies", ...}]`
- Backend adds "Swimming" to database
- Graph updates to show new "Swimming" node
- No UI feedback yet (silent auto-add)

## Next Step
Proceed to Step 4: Toast Notifications
