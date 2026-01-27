# Trip Status Management - Visual Guide

## UI Components Overview

### 1. Non-Draft Trip Card (with Status Dropdown and Chat Button)

```
┌─────────────────────────────────────────────────────────────────┐
│  ▼  [Trip Image]  Paris Adventure                               │
│                   [Planning ▼]  ← Status badge with dropdown    │
│                   Jan 15, 2026 – Jan 22, 2026                   │
│                   3 segments • 8 reservations                    │
│                                                                  │
│                   [💬] [👁] [✏️] [➕] [🗑️]  ← Action buttons    │
│                    ↑ Chat with AI                                │
└─────────────────────────────────────────────────────────────────┘
```

**Status Dropdown Menu:**
```
┌─────────────┐
│ Planning ✓  │ ← Current status (disabled)
│ Live        │
│ Archived    │
└─────────────┘
```

### 2. Draft Trip Card (with Resume Button)

```
┌─────────────────────────────────────────────────────────────────┐
│  ▼  [Trip Image]  Tokyo Trip                                    │
│                   [Draft]  ← Status badge (no dropdown)         │
│                   Feb 10, 2026 – Feb 17, 2026                   │
│                   0 segments • 0 reservations                    │
│                                                                  │
│                   [▶️ Resume]  ← Blue resume button             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Status Badge Colors

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Draft   │  │ Planning │  │   Live   │  │ Archived │
│  (Gray)  │  │  (Blue)  │  │ (Green)  │  │ (Amber)  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 4. Toast Notifications

**Success:**
```
┌────────────────────────────────────────┐
│ ✓  Trip status updated to Live         │
│                                    [×] │
└────────────────────────────────────────┘
```

**Error:**
```
┌────────────────────────────────────────┐
│ ⚠  Failed to update trip status        │
│                                    [×] │
└────────────────────────────────────────┘
```

## User Workflows

### Workflow 1: Open Trip in AI Chat

```
1. User finds non-draft trip in manage page
   ┌─────────────────────────┐
   │ Paris Adventure         │
   │ [Planning ▼]            │
   │ [💬] [👁] [✏️] [➕] [🗑️] │
   │  ↑                      │
   └─────────────────────────┘

2. User clicks chat bubble (💬) button

3. Redirected to /exp?tripId=xxx with trip loaded
   ┌─────────────────────────────────────┐
   │ Journey Architect - Paris Adventure │
   │                                     │
   │ [Trip loaded in chat interface]     │
   │                                     │
   │ How can I help with your trip?      │
   │ [Chat input field...]               │
   └─────────────────────────────────────┘
```

### Workflow 2: Change Trip Status (Planning → Live)

```
1. User clicks dropdown icon (⋮) next to "Planning" badge
   ┌─────────────┐
   │ Planning ✓  │
   │ Live        │ ← User clicks here
   │ Archived    │
   └─────────────┘

2. Status updates, toast appears
   [✓ Trip status updated to Live]

3. Badge color changes from blue to green
   [Planning] → [Live]
```

### Workflow 3: Resume Draft Trip

```
1. User finds draft trip in manage page
   ┌─────────────────────────┐
   │ Tokyo Trip              │
   │ [Draft]                 │
   │ [▶️ Resume]             │
   └─────────────────────────┘

2. User clicks "Resume" button

3. Redirected to /trip/new with draft loaded
   ┌─────────────────────────────────────┐
   │ Trip Builder                        │
   │                                     │
   │ Title: Tokyo Trip                   │
   │ Start Date: Feb 10, 2026           │
   │ End Date: Feb 17, 2026             │
   │                                     │
   │ [Continue editing...]               │
   └─────────────────────────────────────┘
```

### Workflow 4: Archive Completed Trip

```
1. Trip is currently "Live"
   [Live ▼]

2. User opens dropdown, selects "Archived"
   ┌─────────────┐
   │ Planning    │
   │ Live ✓      │
   │ Archived    │ ← User clicks here
   └─────────────┘

3. Status updates to "Archived"
   [Live] → [Archived]
   [✓ Trip status updated to Archived]
```

## Status Filter Bar

```
┌────────────────────────────────────────────────────────────┐
│ Filter by Status:                                          │
│                                                            │
│ [Active] [All] [Planning] [Live] [Archived] [Draft]      │
│   ✓                                                        │
└────────────────────────────────────────────────────────────┘
```

- **Active** (default): Shows all non-draft trips
- **All**: Shows all trips including drafts
- **Planning/Live/Archived/Draft**: Shows only trips with that status

## Status Transition Diagram

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         │ Finalize in
                         │ trip builder
                         ▼
                    ┌──────────┐
              ┌────▶│ PLANNING │◀────┐
              │     └────┬─────┘     │
              │          │           │
              │          ▼           │
              │     ┌──────────┐    │
              │     │   LIVE   │────┘
              │     └────┬─────┘
              │          │
              │          ▼
              │     ┌──────────┐
              └─────│ ARCHIVED │
                    └──────────┘

Legend:
→ : Allowed transition
◀ : Bidirectional transition
```

## Component Hierarchy

```
ManageClient
├── Status Filter Bar
├── Trip Sections (Upcoming/Past)
│   └── Trip Cards
│       ├── Trip Header (collapsible)
│       │   ├── Trip Image
│       │   ├── Trip Info
│       │   │   ├── Title
│       │   │   ├── Status Badge + Dropdown (non-draft)
│       │   │   │   └── DropdownMenu
│       │   │   │       ├── Planning option
│       │   │   │       ├── Live option
│       │   │   │       └── Archived option
│       │   │   ├── Dates
│       │   │   └── Segment/Reservation count
│       │   └── Action Buttons
│       │       ├── Resume Button (draft only)
│       │       └── Chat/View/Edit/Add/Delete (non-draft)
│       │           ├── Chat Button → /exp?tripId={id}
│       │           ├── View Button → /trips/{id}
│       │           ├── Edit Button → /trips/{id}/edit
│       │           ├── Add Segment → /trips/{id}/itinerary/new
│       │           └── Delete Button → Confirmation Dialog
│       └── Expanded Content (segments/reservations)
├── Delete Confirmation Dialog
└── Toast Notification
```

## Responsive Behavior

### Desktop (>768px)
- Full action buttons with icons and labels
- Dropdown menu appears below status badge
- Toast appears in bottom-right corner

### Mobile (<768px)
- Icon-only action buttons
- Dropdown menu adapts to screen size
- Toast appears at bottom (full width)

## Keyboard Navigation

```
Tab       : Navigate between interactive elements
Enter     : Open dropdown / Select option
Escape    : Close dropdown
Space     : Toggle dropdown
Arrow Up  : Navigate dropdown options up
Arrow Down: Navigate dropdown options down
```

## Loading States

### During Status Update
```
┌─────────────────────────────────────────┐
│  Paris Adventure                        │
│  [Planning ⋯]  ← Dropdown disabled      │
│                                         │
│  [👁] [✏️] [➕] [🗑️]                    │
└─────────────────────────────────────────┘
```

### During Page Refresh
```
┌─────────────────────────────────────────┐
│  Loading trips...                       │
│  [Spinner animation]                    │
└─────────────────────────────────────────┘
```

## Error States

### Failed Status Update
```
┌────────────────────────────────────────┐
│ ⚠  Failed to update trip status        │
│    Please try again                    │
│                                    [×] │
└────────────────────────────────────────┘
```

Status badge remains unchanged, user can retry.

## Accessibility Features

- **ARIA Labels**: All buttons have descriptive labels
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Status changes announced
- **Focus Indicators**: Clear focus states on all interactive elements
- **Color Contrast**: All text meets WCAG AA standards

## Color Palette

```
Draft Status:
- Background: #f1f5f9 (slate-100)
- Text: #334155 (slate-700)
- Border: #e2e8f0 (slate-200)

Planning Status:
- Background: #dbeafe (blue-100)
- Text: #1d4ed8 (blue-700)
- Border: #bfdbfe (blue-200)

Live Status:
- Background: #d1fae5 (emerald-100)
- Text: #047857 (emerald-700)
- Border: #a7f3d0 (emerald-200)

Archived Status:
- Background: #fef3c7 (amber-100)
- Text: #b45309 (amber-700)
- Border: #fde68a (amber-200)

Resume Button:
- Background: #2563eb (blue-600)
- Hover: #1d4ed8 (blue-700)
- Text: #ffffff (white)
```

## Animation Details

### Status Badge Update
```
1. Fade out old badge (150ms)
2. Update text and color
3. Fade in new badge (150ms)
```

### Dropdown Menu
```
- Slide down: 200ms ease-out
- Slide up: 150ms ease-in
```

### Toast Notification
```
- Slide up from bottom: 300ms ease-out
- Auto-dismiss after 3000ms
- Fade out: 200ms ease-in
```

## Best Practices for Users

1. **Use Planning Status**: For trips you're still organizing
2. **Switch to Live**: When trip is confirmed and active
3. **Archive Completed Trips**: Keep your manage page clean
4. **Resume Drafts**: Don't lose incomplete trip planning
5. **Filter by Status**: Find trips quickly with status filters

## Developer Notes

### Adding Custom Status Actions
```typescript
// In handleStatusChange function
const handleStatusChange = async (tripId: string, newStatus: TripStatus) => {
  // Add custom logic here (e.g., send notifications)
  if (newStatus === TripStatus.LIVE) {
    await sendTripStartNotification(tripId);
  }
  
  // Continue with status update
  await updateTripStatus(tripId, newStatus);
};
```

### Customizing Toast Messages
```typescript
setToast({
  message: `Trip "${trip.title}" is now ${getTripStatusLabel(newStatus)}`,
  type: "success",
});
```

### Adding Status Badges to Other Pages
```typescript
import { getTripStatusBadgeColor, getTripStatusLabel } from "@/components/manage-client";

<span className={`text-xs px-2 py-0.5 rounded border ${getTripStatusBadgeColor(trip.status)}`}>
  {getTripStatusLabel(trip.status)}
</span>
```
