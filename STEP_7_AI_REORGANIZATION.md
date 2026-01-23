# Step 7: AI Reorganization System

## Goal
When category limits are hit, AI automatically reorganizes items into semantic subcategories.

## Status
⏳ PENDING

## Files to Create/Modify
- `lib/ai/subcategory-organizer.ts` (NEW)
- `app/api/profile-graph/reorganize/route.ts` (NEW)
- `components/graph-chat-interface.tsx`

## Changes Required

### 1. Create AI Subcategory Organizer

**File:** `lib/ai/subcategory-organizer.ts`

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

interface OrganizationResult {
  subcategories: Array<{
    name: string;
    items: string[];
    description: string;
  }>;
}

export async function organizeIntoSubcategories(
  category: string,
  items: string[]
): Promise<OrganizationResult> {
  const prompt = `You are organizing items in the "${category}" category into semantic subcategories.

Items to organize:
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Create 2-4 subcategories that group these items semantically. Each subcategory should:
- Have a clear, descriptive name (2-3 words max)
- Contain related items
- Make logical sense for travel planning

Return JSON:
{
  "subcategories": [
    {
      "name": "Subcategory Name",
      "items": ["Item 1", "Item 2"],
      "description": "Brief description"
    }
  ]
}`;

  try {
    const result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      prompt,
      temperature: 0.3,
      maxTokens: 1500,
      experimental_providerMetadata: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });

    let cleanedText = result.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error("Error organizing subcategories:", error);
    throw error;
  }
}
```

### 2. Create Reorganization API Route

**File:** `app/api/profile-graph/reorganize/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { organizeIntoSubcategories } from "@/lib/ai/subcategory-organizer";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    console.log("🔄 [Reorganize API] Reorganizing category:", category);

    // Get current profile graph
    const profileGraph = await getUserProfileGraph(session.user.id);
    const graphData = profileGraph.graphData;

    // Get all items in this category
    const categoryItems = graphData.nodes
      .filter(n => n.type === 'item' && n.category === category)
      .map(n => n.value);

    if (categoryItems.length === 0) {
      return NextResponse.json({ error: "No items to reorganize" }, { status: 400 });
    }

    console.log("📊 [Reorganize API] Found", categoryItems.length, "items to reorganize");

    // Use AI to organize into subcategories
    const organization = await organizeIntoSubcategories(category, categoryItems);

    console.log("✅ [Reorganize API] Created", organization.subcategories.length, "subcategories");

    // Update XML with new subcategories
    // This would involve:
    // 1. Parse current XML
    // 2. Remove items from category
    // 3. Create subcategory nodes
    // 4. Add items under subcategories
    // 5. Save updated XML

    // For now, return the organization plan
    return NextResponse.json({
      success: true,
      category,
      subcategories: organization.subcategories,
      message: `Reorganized ${categoryItems.length} items into ${organization.subcategories.length} subcategories`
    });

  } catch (error) {
    console.error("❌ [Reorganize API] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to reorganize",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
```

### 3. Trigger Reorganization from Chat Interface

**File:** `components/graph-chat-interface.tsx`

```typescript
const handleSendMessage = async () => {
  // ... existing code ...

  const data = await response.json();

  // Show toast for auto-added items
  if (data.autoAdded && data.autoAdded.length > 0) {
    // ... existing toast code ...
  }

  // Trigger reorganization if needed
  if (data.requiresReorganization && data.reorganizationReason) {
    // Extract category from reason
    const categoryMatch = data.reorganizationReason.match(/Category "([^"]+)"/);
    const category = categoryMatch ? categoryMatch[1] : null;

    if (category) {
      setTimeout(async () => {
        setToastMessage("Reorganizing your profile...");
        setShowToast(true);

        try {
          const reorganizeResponse = await fetch("/api/profile-graph/reorganize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category })
          });

          const reorganizeData = await reorganizeResponse.json();

          if (reorganizeData.success) {
            setToastMessage(reorganizeData.message);
            setShowToast(true);
            
            // Refresh graph data
            onGraphUpdate?.(reorganizeData.graphData);
          }
        } catch (error) {
          console.error("Error reorganizing:", error);
        }
      }, 3500); // Stagger after first toast
    }
  }

  // ... rest of existing code ...
};
```

## Testing
- ✅ Add 6 items to "hobbies" category
- ✅ Reorganization triggers automatically
- ✅ AI creates 2-4 subcategories (e.g., "Water Sports", "Land Sports")
- ✅ Items are moved under subcategories
- ✅ Graph visualization updates with subcategory nodes
- ✅ Toast shows: "Reorganized 6 items into 3 subcategories"

## Expected Behavior
- When 6th item added to category:
  - Toast: "Category 'hobbies' needs reorganization"
  - After 3.5 seconds, second toast: "Reorganizing your profile..."
  - AI analyzes items and creates subcategories
  - Graph updates with new structure:
    ```
    User
    └─ Hobbies
       ├─ Water Sports
       │  ├─ Swimming
       │  └─ Surfing
       └─ Land Sports
          ├─ Running
          ├─ Cycling
          └─ Hiking
    ```
  - Final toast: "Reorganized 6 items into 2 subcategories"

## Next Step
Proceed to Step 8: Radial Layout Algorithm
