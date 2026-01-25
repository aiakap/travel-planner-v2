# Object-Based Chat System

A highly configurable, scalable chat system where each object type (trip, profile, etc.) is self-contained with its own configuration, prompts, and view components.

## Architecture

### Folder Structure

```
app/object/
├── [object-type]/           # Dynamic route for any object type
│   ├── page.tsx            # Server component (auth + data fetching)
│   └── client.tsx          # Client component (chat layout)
├── _core/                  # Shared core components (minimal)
│   ├── chat-layout.tsx     # Split panel layout
│   ├── chat-panel.tsx      # Left panel (chat)
│   ├── data-panel.tsx      # Right panel (data view)
│   ├── resizable-divider.tsx
│   └── types.ts            # Core types
├── _configs/               # Object type configurations
│   ├── types.ts            # Config types
│   ├── loader.ts           # Config loader
│   ├── registry.ts         # Config registry
│   ├── new_chat.config.ts
│   ├── profile_attribute.config.ts
│   └── trip_explorer.config.ts
├── _views/                 # Right panel view components
│   ├── trip-view.tsx
│   ├── profile-view.tsx
│   └── trip-preview-view.tsx
└── _cards/                 # Left panel card components
    ├── hotel-card.tsx
    ├── profile-suggestion-card.tsx
    └── trip-structure-card.tsx
```

## Features

### ✅ Split Panel Layout
- **Left Panel (40%)**: Chat with interactive cards
- **Right Panel (60%)**: Live data view
- Resizable divider (drag to adjust)
- Collapsible panels (click arrows)
- Keyboard shortcuts:
  - `Cmd/Ctrl + [` - Toggle left panel
  - `Cmd/Ctrl + ]` - Toggle right panel
  - `Cmd/Ctrl + \` - Reset to default

### ✅ Configuration-Driven
- Each object type defined by a single config file
- No changes needed to core components
- Add new object types in minutes

### ✅ Minimal Dependencies
- Only depends on: Prisma schema, API keys, Next.js, React
- No dependencies on existing `/app/exp`, `/app/profile`, etc.
- Clean, isolated implementation

## Usage

### Access an Object Type

Navigate to: `/object/[object-type]?param=value`

**Examples:**
- `/object/new_chat?tripId=abc123` - Trip chat
- `/object/profile_attribute` - Profile builder
- `/object/trip_explorer` - Trip creator

### Available Object Types

1. **new_chat** - Trip management with AI
   - Suggest hotels, restaurants, activities
   - View trip with segments and reservations
   - Requires `?tripId=xxx` parameter

2. **profile_attribute** - Profile builder
   - Build travel profile with AI
   - Add hobbies, preferences, interests
   - View profile data in real-time

3. **trip_explorer** - Trip structure creator
   - Create trip structure before committing
   - AI helps plan segments
   - Preview before saving to database

## Adding a New Object Type

### Step 1: Create View Component

```tsx
// app/object/_views/my-view.tsx
export function MyView({ data }: { data: any }) {
  return <div>{/* Your view */}</div>;
}
```

### Step 2: Create Card Components

```tsx
// app/object/_cards/my-card.tsx
import { CardProps } from "../_core/types";

export function MyCard({ data, onAction, onDataUpdate }: CardProps) {
  return <div>{/* Your card */}</div>;
}
```

### Step 3: Create Data Fetcher (Optional)

```tsx
// lib/object/data-fetchers/my-data.ts
export async function fetchMyData(userId: string, params?: any) {
  // Fetch from database
  return { myData: ... };
}
```

### Step 4: Create Config

```tsx
// app/object/_configs/my_object.config.ts
import { ObjectConfig } from "./types";
import { MyView } from "../_views/my-view";
import { MyCard } from "../_cards/my-card";
import { fetchMyData } from "@/lib/object/data-fetchers/my-data";

export const myObjectConfig: ObjectConfig = {
  id: "my_object",
  name: "My Object",
  description: "Description",
  
  systemPrompt: `AI instructions here...
  
  When suggesting items, use this format:
  [MY_CARD: { "field": "value" }]`,
  
  dataSource: {
    fetch: async (userId, params) => {
      return await fetchMyData(userId, params);
    },
  },
  
  leftPanel: {
    welcomeMessage: "Welcome!",
    placeholder: "Type a message...",
    cardRenderers: {
      my_card: MyCard,
    },
  },
  
  rightPanel: {
    component: MyView,
  },
};
```

### Step 5: Register Config

```tsx
// app/object/_configs/registry.ts
import { myObjectConfig } from "./my_object.config";

registerConfig(myObjectConfig);
```

### Step 6: Update Response Parser

```tsx
// lib/object/response-parser.ts
// Add regex to extract your card type
const myCardRegex = /\[MY_CARD:\s*(\{[\s\S]*?\})\]/g;
while ((match = myCardRegex.exec(response)) !== null) {
  const data = JSON.parse(match[1]);
  cards.push({
    id: `my-card-${Date.now()}-${Math.random()}`,
    type: "my_card",
    data,
  });
  text = text.replace(match[0], "");
}
```

### Step 7: Navigate

Go to: `/object/my_object`

**That's it!** No changes needed to core components, API routes, or layout.

## API

### POST `/api/object/chat`

Generic chat endpoint for all object types.

**Request:**
```json
{
  "objectType": "new_chat",
  "message": "Find hotels in Paris",
  "userId": "user123",
  "params": { "tripId": "abc123" },
  "messageHistory": [...]
}
```

**Response:**
```json
{
  "text": "I found 3 hotels...",
  "cards": [
    {
      "id": "hotel-1",
      "type": "hotel",
      "data": { "name": "Hotel Name", ... }
    }
  ],
  "updatedData": null
}
```

## Styling

Currently uses minimal inline styles for functionality. To add styling:

1. Replace inline styles with Tailwind classes
2. Use Shadcn components for UI primitives
3. Add animations and transitions
4. Implement themes

## Testing

To test the system:

1. **Start dev server**: `npm run dev`
2. **Navigate to**: `/object/new_chat?tripId=YOUR_TRIP_ID`
3. **Test chat**: Type messages and see AI responses
4. **Test cards**: Click buttons on cards
5. **Test panels**: Resize, collapse, expand
6. **Test keyboard shortcuts**: Cmd+[, Cmd+], Cmd+\

## Success Criteria

- ✅ Can add new object type in <30 minutes
- ✅ Zero dependencies on existing code (except schema/API keys)
- ✅ Works for trip, profile, and any future object types
- ✅ Clean, maintainable code
- ✅ Resizable and collapsible panels
- ✅ Generic AI integration

## Next Steps

1. Add more card types (restaurant, activity, flight, etc.)
2. Implement card actions (book, save, delete)
3. Add real-time data updates
4. Implement process orchestrator pattern
5. Add more object types
6. Improve styling
7. Add tests
