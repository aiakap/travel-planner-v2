# Step 4: Toast Notifications for Auto-Add

## Goal
Show user feedback when items are auto-added to their profile.

## Status
⏳ PENDING

## Files to Modify
- `components/graph-chat-interface.tsx`
- `components/ui/toast.tsx` (create if doesn't exist)

## Changes Required

### 1. Create Toast Component (if needed)

**File:** `components/ui/toast.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "info" | "warning" | "error";
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: "bg-green-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
    error: "bg-red-500"
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50`}
    >
      <span>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="hover:bg-white/20 rounded p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### 2. Update GraphChatInterface

**File:** `components/graph-chat-interface.tsx`

**Add state for toast:**
```typescript
const [toastMessage, setToastMessage] = useState<string | null>(null);
const [showToast, setShowToast] = useState(false);
```

**Update message handler:**
```typescript
const handleSendMessage = async () => {
  // ... existing code ...

  const response = await fetch("/api/profile-graph/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input, conversationHistory })
  });

  const data = await response.json();

  // Show toast for auto-added items
  if (data.autoAdded && data.autoAdded.length > 0) {
    const itemNames = data.autoAdded.map((item: any) => item.value).join(", ");
    setToastMessage(`Added ${data.autoAdded.length} item${data.autoAdded.length > 1 ? 's' : ''} to your profile: ${itemNames}`);
    setShowToast(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => setShowToast(false), 3000);
  }

  // Show toast for reorganization
  if (data.requiresReorganization) {
    setTimeout(() => {
      setToastMessage(data.reorganizationReason || "Reorganizing your profile...");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 3500); // Stagger after first toast
  }

  // ... rest of existing code ...
};
```

**Add Toast to JSX:**
```typescript
return (
  <div className="flex flex-col h-full">
    {/* ... existing chat interface ... */}
    
    {/* Toast notification */}
    {showToast && toastMessage && (
      <Toast
        message={toastMessage}
        type="success"
        onClose={() => setShowToast(false)}
      />
    )}
  </div>
);
```

## Testing
- ✅ Type "I like swimming"
- ✅ Item auto-adds to graph
- ✅ Toast appears: "Added 1 item to your profile: Swimming"
- ✅ Toast disappears after 3 seconds
- ✅ Can manually close toast with X button

## Expected Behavior
- User types "I like swimming"
- AI auto-adds "Swimming" to profile
- Toast notification appears in bottom-right corner
- Toast shows: "Added 1 item to your profile: Swimming"
- Toast auto-dismisses after 3 seconds
- If reorganization needed, second toast appears after first one

## Next Step
Proceed to Step 5: Inline Suggestion Chips
