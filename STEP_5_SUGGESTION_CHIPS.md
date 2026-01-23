# Step 5: Inline Suggestion Chips UI

## Goal
Replace Mad-Lib format with [bracket] suggestions that have (+) and (x) buttons.

## Status
⏳ PENDING

## Files to Create/Modify
- `components/inline-suggestion-chip.tsx` (NEW)
- `components/graph-chat-interface.tsx`

## Changes Required

### 1. Create InlineSuggestionChip Component

**File:** `components/inline-suggestion-chip.tsx`

```typescript
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface InlineSuggestionChipProps {
  text: string;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export function InlineSuggestionChip({
  text,
  onAccept,
  onReject,
  disabled = false
}: InlineSuggestionChipProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept();
  };

  const handleReject = () => {
    setIsRejected(true);
    setTimeout(() => onReject(), 300);
  };

  if (isRejected) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
      isAccepted 
        ? "bg-green-100 text-green-800 border border-green-300" 
        : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
    }`}>
      <span className="text-sm font-medium">{text}</span>
      {!isAccepted && (
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={handleAccept}
            disabled={disabled}
            className="p-0.5 rounded hover:bg-green-200 transition-colors"
            title="Accept and add to profile"
          >
            <Plus className="w-3.5 h-3.5 text-green-700" />
          </button>
          <button
            onClick={handleReject}
            disabled={disabled}
            className="p-0.5 rounded hover:bg-red-200 transition-colors"
            title="Reject suggestion"
          >
            <X className="w-3.5 h-3.5 text-red-700" />
          </button>
        </div>
      )}
      {isAccepted && (
        <span className="text-xs text-green-600 ml-1">✓ Added</span>
      )}
    </span>
  );
}
```

### 2. Update GraphChatInterface to Parse and Render Chips

**File:** `components/graph-chat-interface.tsx`

**Add import:**
```typescript
import { InlineSuggestionChip } from "./inline-suggestion-chip";
```

**Add interface:**
```typescript
interface Suggestion {
  id: string;
  value: string;
  category: string;
  subcategory: string;
  metadata?: Record<string, string>;
  confidence?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: Suggestion[];
  autoAdded?: Array<{value: string; category: string; subcategory: string}>;
}
```

**Add message parsing function:**
```typescript
const parseMessageWithSuggestions = (
  message: string,
  suggestions: Suggestion[]
) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Find all [text] patterns
  const bracketRegex = /\[([^\]]+)\]/g;
  let match;
  let chipIndex = 0;
  
  while ((match = bracketRegex.exec(message)) !== null) {
    // Add text before bracket
    if (match.index > lastIndex) {
      parts.push(message.substring(lastIndex, match.index));
    }
    
    // Find matching suggestion
    const suggestionText = match[1];
    const suggestion = suggestions.find(s => 
      s.value.toLowerCase() === suggestionText.toLowerCase()
    );
    
    if (suggestion) {
      parts.push(
        <InlineSuggestionChip
          key={`chip-${chipIndex++}`}
          text={suggestionText}
          onAccept={() => handleAcceptSuggestion(suggestion)}
          onReject={() => handleRejectSuggestion(suggestion.id)}
        />
      );
    } else {
      // No matching suggestion, just show text
      parts.push(`[${suggestionText}]`);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < message.length) {
    parts.push(message.substring(lastIndex));
  }
  
  return parts;
};
```

**Add handlers:**
```typescript
const handleAcceptSuggestion = async (suggestion: Suggestion) => {
  try {
    const response = await fetch("/api/profile-graph/add-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: suggestion.category,
        subcategory: suggestion.subcategory,
        value: suggestion.value,
        metadata: suggestion.metadata
      })
    });

    if (!response.ok) throw new Error("Failed to add item");

    const data = await response.json();
    
    // Update graph data
    if (data.graphData) {
      onSuggestionAccepted?.(data.graphData);
    }

    // Show toast
    setToastMessage(`Added ${suggestion.value} to your profile`);
    setShowToast(true);
  } catch (error) {
    console.error("Error accepting suggestion:", error);
  }
};

const handleRejectSuggestion = (suggestionId: string) => {
  // Just remove from UI (already handled by chip component)
  console.log("Rejected suggestion:", suggestionId);
};
```

**Update message rendering:**
```typescript
{messages.map((msg, index) => (
  <div key={index} className={msg.role === "user" ? "user-message" : "assistant-message"}>
    {msg.role === "assistant" && msg.suggestions ? (
      <div className="whitespace-pre-wrap">
        {parseMessageWithSuggestions(msg.content, msg.suggestions)}
      </div>
    ) : (
      <div className="whitespace-pre-wrap">{msg.content}</div>
    )}
  </div>
))}
```

## Testing
- ✅ Type "I like swimming"
- ✅ AI response: "I've added Swimming to your profile. Would you also like [lap pools] or [open water swimming]?"
- ✅ "lap pools" and "open water swimming" appear as blue chips with (+) and (x) buttons
- ✅ Click (+) on "lap pools" - it turns green and shows "✓ Added"
- ✅ Click (x) on "open water swimming" - it fades out and disappears
- ✅ Graph updates with accepted items

## Expected Behavior
- Suggestions appear inline as blue chips
- Each chip has (+) button to accept and (x) button to reject
- Accepting a chip:
  - Chip turns green
  - Shows "✓ Added" text
  - Item added to database
  - Graph updates
  - Toast notification appears
- Rejecting a chip:
  - Chip fades out
  - Disappears from view
  - No database change

## Next Step
Proceed to Step 6: Category Limits Validation
