# exp1 Dependencies Documentation

This document describes the dependency isolation strategy for `/app/exp1`, a clean copy of the `/app/exp` experimental travel planner interface.

## Overview

The `/app/exp1` folder is a **hybrid-isolated** copy of `/app/exp`, meaning:
- **Copied (exp1-specific)**: All UI components and feature components
- **Shared (referenced from root)**: Core utilities, auth, hooks, and infrastructure

This allows you to refactor exp1 freely without affecting the original exp implementation.

## Folder Structure

```
/app/exp1/
├── DEPENDENCIES.md          # This file
├── page.tsx                 # Server component - entry point
├── client.tsx               # Main client component
├── components/              # 25 copied feature components
│   ├── context-card.tsx
│   ├── trip-card.tsx
│   ├── segment-card.tsx
│   ├── reservation-card.tsx
│   ├── message-segments-renderer.tsx
│   ├── place-hover-card.tsx
│   ├── chat-*.tsx
│   ├── edit-*.tsx
│   ├── timeline-view.tsx
│   ├── table-view.tsx
│   ├── photos-view.tsx
│   └── ... (20+ more)
├── ui/                      # 11 copied UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── hover-card.tsx
│   └── ... (6+ more)
└── lib/
    ├── exp-prompts.ts       # AI prompts for exp
    ├── parse-card-syntax.ts # Card syntax parser
    └── actions/             # 3 copied server actions
        ├── update-trip-simple.ts
        ├── update-segment-simple.ts
        └── update-reservation-simple.ts
```

## Import Conventions

### exp1-Specific Imports (Copied Files)

All components and UI elements within exp1 use **absolute paths** to exp1 resources:

```typescript
// ✅ CORRECT - References exp1's own components
import { Button } from "@/app/exp/ui/button"
import { TripCard } from "@/app/exp/components/trip-card"
import { updateTripSimple } from "@/app/exp/lib/actions/update-trip-simple"
```

```typescript
// ❌ WRONG - Would reference shared components (not isolated)
import { Button } from "@/components/ui/button"
import { TripCard } from "@/components/trip-card"
```

### Shared Imports (Root Infrastructure)

These imports reference shared infrastructure that remains in the root:

```typescript
// ✅ CORRECT - Shared utilities
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { useAutoSave } from "@/hooks/use-auto-save"
import type { V0Itinerary } from "@/lib/v0-types"
import { transformTripToV0Format } from "@/lib/v0-data-transform"
import { getUserPersonalizationData } from "@/lib/personalization"
import { MessageSegment } from "@/lib/types/place-pipeline"
```

## Dependency Categories

### 1. Copied Components (exp1-specific)

**Location**: `/app/exp1/components/` and `/app/exp1/ui/`

**Why copied**: These are the UI layer that you want to modify without affecting `/app/exp`

**Feature Components** (25 files):
- `context-card.tsx` - Editable trip/segment/reservation cards
- `trip-card.tsx`, `segment-card.tsx`, `reservation-card.tsx` - Display cards
- `message-segments-renderer.tsx` - Renders AI messages with cards
- `place-hover-card.tsx` - Hover card for place suggestions
- `chat-welcome-message.tsx`, `chat-quick-actions.tsx`, `chat-context-welcome.tsx`
- `trip-selector.tsx`, `chat-name-dropdown.tsx`
- `edit-chat-modal.tsx`, `edit-trip-modal.tsx`, `edit-trip-form.tsx`
- `ai-loading-animation.tsx`, `itinerary-empty-state.tsx`
- `timeline-view.tsx`, `table-view.tsx`, `photos-view.tsx`
- `reservation-detail-modal.tsx`
- `suggestion-detail-modal.tsx`, `quick-trip-modal.tsx`
- `conflict-indicator.tsx`, `alternative-time-slots.tsx`, `status-icon-indicator.tsx`

**UI Components** (11 files):
- `button.tsx`, `select.tsx`, `dialog.tsx`
- `input.tsx`, `label.tsx`, `badge.tsx`
- `save-indicator.tsx`, `click-to-edit-field.tsx`
- `hover-card.tsx`, `separator.tsx`, `popover.tsx`

### 2. Copied Actions (exp1-specific)

**Location**: `/app/exp1/lib/actions/`

**Why copied**: These are simple update actions used by context cards

**Files** (3):
- `update-trip-simple.ts` - Update trip title and dates
- `update-segment-simple.ts` - Update segment name
- `update-reservation-simple.ts` - Update reservation details

### 3. Shared Infrastructure (NOT copied)

**Why shared**: These are stable utilities that don't need isolation

#### **lib/** - Core utilities
- `lib/prisma.ts` - Database client
- `lib/v0-types.ts` - Type definitions
- `lib/v0-data-transform.ts` - Data transformation utilities
- `lib/personalization.ts` - User personalization logic
- `lib/types/place-pipeline.ts` - Place suggestion types
- `lib/types/amadeus-pipeline.ts` - Amadeus API types
- `lib/types/place-suggestion.ts` - Place suggestion types
- `lib/ai/get-lucky-prompts.ts` - AI prompt generation
- `lib/utils.ts` - Utility functions (cn, etc.)
- `lib/google-places/resolve-suggestions.ts` - Google Places API
- `lib/smart-scheduling.ts` - Scheduling logic
- `lib/pending-suggestions.ts` - Pending suggestions state
- `lib/anonymous-tracking.ts` - Anonymous analytics
- `lib/upload-thing.ts` - File upload utilities
- `lib/actions/chat-actions.ts` - Chat-related server actions
- `lib/actions/create-quick-trip.ts` - Quick trip creation
- `lib/actions/check-conflicts.ts` - Conflict checking
- `lib/actions/update-trip.ts` - Full trip update action

#### **auth.ts** - Authentication
- `auth.ts` - NextAuth configuration
- `lib/auth-logger.ts` - Auth logging
- `lib/auth-validation.ts` - Auth validation

#### **hooks/** - React hooks
- `hooks/use-auto-save.ts` - Auto-save hook

#### **Generated files**
- `app/generated/prisma/client` - Prisma client (generated)
- `app/generated/prisma` - Prisma types (generated)

## Adding New Dependencies

### When to Copy vs Share

**Copy to exp1 if**:
- It's a UI component that you plan to modify
- It's specific to the exp/exp1 interface
- It's tightly coupled to exp1's visual design

**Keep shared if**:
- It's a utility function or type
- It's used across multiple parts of the app
- It's infrastructure (auth, database, etc.)
- It's stable and unlikely to change

### How to Add a New Dependency

#### Adding a new exp1-specific component:

1. Copy the component to `/app/exp1/components/` or `/app/exp1/ui/`
2. Update all imports in the new file:
   ```typescript
   // Change this:
   import { Button } from "@/components/ui/button"
   
   // To this:
   import { Button } from "@/app/exp/ui/button"
   ```
3. Update any files that import this component to use the exp1 path

#### Using a new shared utility:

Just import it normally - no copying needed:
```typescript
import { someUtil } from "@/lib/some-util"
```

## Testing

To verify exp1 is properly isolated:

1. Start the dev server: `npm run dev`
2. Navigate to `/exp1?tripId=<some-trip-id>`
3. Check for import errors in the browser console
4. Verify all components render correctly
5. Test chat functionality and card editing

## Benefits of This Approach

1. **Complete UI isolation** - Modify exp1 components without affecting exp
2. **Shared stability** - Core utilities remain consistent across the app
3. **Clear boundaries** - Easy to see what's exp1-specific vs shared
4. **Refactor freedom** - Safe to experiment with exp1's UI layer
5. **Smaller footprint** - Don't duplicate stable infrastructure code

## Notes

- The original `/app/exp` remains completely untouched
- No circular dependencies between exp and exp1
- Can safely delete exp1 folder without affecting exp
- All exp1 imports are either to `/app/exp1/*` or shared root paths
- If you need to add more components, follow the "Copy vs Share" guidelines above
