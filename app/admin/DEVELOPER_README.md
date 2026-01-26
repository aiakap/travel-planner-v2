# Admin Interface - Developer Documentation

**Version**: 1.0  
**Last Updated**: January 26, 2026  
**Purpose**: Comprehensive developer guide and reference for the admin interface

---

## 🤖 For AI Assistants / Cursor Chat

When the user says **"look at /admin"** or asks to work on the admin interface, **start here**.

### Essential Context Files (Read These First)

1. **This file** - Complete architecture and structure reference
2. `ADMIN_PROMPT_INTERFACE_COMPLETE.md` - Initial prompt management implementation details
3. `ENTITY_SELECTION_TESTING_COMPLETE.md` - Entity selection feature documentation
4. `PROMPT_PLUGIN_SYSTEM_COMPLETE.md` - Core prompt system architecture
5. `app/exp/lib/prompts/README.md` - Detailed prompt plugin system guide

### Quick Architecture Summary

- **Admin Dashboard**: `/admin` - Central hub with 3 main sections
- **Prompts Section**: `/admin/prompts` - Manages AI prompt plugins (view, edit, test)
- **Entity Selection**: Built into testing interface - Test with real database data
- **API Testing**: `/admin/apis` - Monitors external API integrations
- **Current State**: All preview-only (no file persistence yet)
- **Tech Stack**: Next.js 14 App Router, React, TypeScript, Prisma, shadcn/ui

### Common User Requests

| User Says | What They Mean | Where to Look |
|-----------|----------------|---------------|
| "Add a new section to admin" | New dashboard card + page | `app/admin/page.tsx` + new page |
| "Fix the entity selector" | Dropdown/loading issues | `app/admin/prompts/test/page.tsx` lines 30-175 |
| "Add a new plugin" | New prompt section | `app/exp/lib/prompts/registry.ts` |
| "Test API isn't working" | API endpoint issues | `app/api/admin/prompts/test/route.ts` |
| "Add health check for X" | New integration status | `app/api/admin/health/route.ts` |

### Important Patterns to Follow

```typescript
// ✅ CORRECT - Prisma import
import { prisma } from "@/lib/prisma";

// ❌ WRONG - Direct import from generated files
import { prisma } from "@/app/generated/prisma";

// ✅ CORRECT - Client component with state
"use client";
import { useState } from "react";

// ✅ CORRECT - Error handling in API routes
try {
  const data = await prisma.user.findMany();
  return NextResponse.json({ users: data });
} catch (error) {
  console.error("[Admin API] Error:", error);
  return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
}
```

---

## 📁 File Structure & Architecture

### Frontend Pages

```
app/admin/
├── layout.tsx                           # Admin layout wrapper with auth warning banner
├── page.tsx                             # Dashboard with stats cards and quick actions
├── README.md                            # User-facing usage guide
├── DEVELOPER_README.md                  # This file - developer reference
│
├── prompts/                             # Prompt Plugin Management Section
│   ├── page.tsx                         # Plugin list with search/filter/priority badges
│   ├── [pluginId]/page.tsx             # Individual plugin viewer/editor (preview-only)
│   └── test/page.tsx                   # Prompt testing interface with entity selection
│
└── apis/                                # API Integration Testing Section
    ├── page.tsx                         # API testing dashboard with health checks
    └── _components/
        ├── api-test-form.tsx            # Interactive form for testing API calls
        ├── api-status-badge.tsx         # Status indicator components (configured/unconfigured)
        ├── api-response-viewer.tsx      # JSON response display with syntax highlighting
        └── api-test-layout.tsx          # Shared layout wrapper for API test pages
```

### Backend API Routes

```
app/api/admin/
├── health/
│   └── route.ts                         # GET - External API health checks
│                                        # Returns: Status for Google Maps, Amadeus, OpenAI, Imagen, UploadThing
│
└── prompts/
    ├── route.ts                         # GET - Fetch all plugins from registry
    │                                    # Returns: Array of plugin metadata (id, name, priority, preview)
    │
    ├── [pluginId]/
    │   └── route.ts                     # GET - Fetch single plugin details
    │                                    # PUT - Update plugin (preview-only, not persisted)
    │
    ├── test/
    │   └── route.ts                     # POST - Build prompt with custom context
    │                                    # Body: { context: { userMessage, messageCount, ... } }
    │                                    # Returns: { prompt, activePlugins, stats }
    │
    └── entities/
        ├── route.ts                     # GET - Fetch entity lists for dropdowns
        │                                # Params: ?type=users|trips|segments|reservations
        │                                # Returns: Array of entities with counts
        │
        └── [entityType]/[entityId]/
            └── route.ts                 # GET - Build test context from entity
                                         # Params: entityType=trip|segment|reservation
                                         # Returns: { context, entityInfo }
```

### Related System Files

```
app/exp/lib/prompts/                     # Core Prompt Plugin System
├── types.ts                             # Type definitions (PromptPlugin, PromptBuildContext)
├── registry.ts                          # Plugin registration and configuration
├── build-exp-prompt.ts                  # Main prompt assembly function
├── base-exp-prompt.ts                   # Base prompt (always included)
├── card-syntax-prompt.ts                # Card syntax definitions
├── email-parsing-prompt.ts              # Email parsing instructions
├── smart-defaults-prompt.ts             # Smart defaults logic
├── context-awareness-prompt.ts          # Context-aware instructions
├── examples-prompt.ts                   # Example conversations
└── README.md                            # Detailed plugin system docs

components/ui/                           # shadcn/ui Component Library
├── card.tsx                             # Card, CardHeader, CardTitle, CardContent, CardFooter
├── button.tsx                           # Button with variants (default, outline, ghost, destructive)
├── badge.tsx                            # Badge with variants (default, secondary, outline, destructive)
├── input.tsx                            # Input field
├── textarea.tsx                         # Textarea
├── select.tsx                           # Select dropdown
├── switch.tsx                           # Toggle switch
├── radio-group.tsx                      # Radio button group
├── alert.tsx                            # Alert, AlertDescription
├── collapsible.tsx                      # Collapsible, CollapsibleTrigger, CollapsibleContent
└── ... (30+ other components)

lib/
├── prisma.ts                            # ✅ Prisma client singleton (ALWAYS import from here)
└── utils.ts                             # cn() utility for className merging

prisma/
└── schema.prisma                        # Database schema (User, Trip, Segment, Reservation, etc.)
```

---

## 🎯 Features & Capabilities

### 1. Prompt Plugin Management (`/admin/prompts`)

**Purpose**: View and manage the AI prompt plugin system that powers conversational trip planning.

**What It Does**:
- Displays all 6 prompt plugins (1 base + 5 conditional)
- Shows plugin priority, content preview, and activation logic
- Provides search and filtering capabilities
- Demonstrates token savings compared to monolithic prompt

**How It Works**:
1. Fetches plugins from `createPromptRegistry()` via `/api/admin/prompts`
2. Displays in card grid with priority-based color coding
3. Clicking "View Details" navigates to plugin editor

**Key Implementation Details**:
- **File**: `app/admin/prompts/page.tsx` (8.5 KB, client component)
- **State**: `plugins[]`, `loading`, `searchQuery`, `filterEnabled`
- **API**: `GET /api/admin/prompts`
- **Priority Colors**:
  - 🔵 Blue (0-9): Core
  - 🟣 Purple (10-29): Creation
  - 🟠 Orange (30-49): Context
  - 🔷 Teal (50-69): Enhancement
  - 🟣 Pink (70+): Experimental

**Known Limitations**:
- ⚠️ **Preview-only editing** - Changes not persisted to TypeScript files
- ⚠️ **Built-in plugins only** - Cannot create new plugins via UI (yet)
- ⚠️ **No version control** - No history or rollback capability
- ⚠️ **Function editing disabled** - `shouldInclude` logic shown as string only

**Related Files**:
- Plugin registry: `app/exp/lib/prompts/registry.ts`
- Plugin types: `app/exp/lib/prompts/types.ts`
- Individual plugin files: `app/exp/lib/prompts/*-prompt.ts`

---

### 2. Plugin Editor (`/admin/prompts/[pluginId]`)

**Purpose**: View detailed information about a specific prompt plugin.

**What It Does**:
- Displays full plugin content (not truncated)
- Shows activation logic (`shouldInclude` function as string)
- Provides statistics (characters, estimated tokens, priority)
- Allows "preview" edits (not persisted)

**How It Works**:
1. Fetches plugin data via `/api/admin/prompts/[pluginId]`
2. Displays in form-like interface with textareas
3. Save button acknowledges changes but doesn't persist

**Key Implementation Details**:
- **File**: `app/admin/prompts/[pluginId]/page.tsx` (9.8 KB, client component)
- **State**: `plugin`, `loading`, `saving`, `saved`
- **API**: `GET /api/admin/prompts/[pluginId]`, `PUT /api/admin/prompts/[pluginId]`
- **Validation**: Name required, priority 0-999, content max 50K chars

**Why Preview-Only?**:
The plugin system uses TypeScript files with function definitions. To persist changes:
- Would need database storage with serialized functions
- Requires `eval()` or `new Function()` (security concerns)
- OR migrate to JSON-based configuration with limited logic

**Decision**: Start with read-only/preview to provide visibility and testing tools. Add persistence layer later when architecture is finalized.

---

### 3. Prompt Testing Interface (`/admin/prompts/test`)

**Purpose**: Interactive tool for testing how prompts are assembled with different contexts.

**What It Does**:
- **Manual Context Configuration**: Set all context parameters manually
- **Entity Selection**: Load real data from database (users → trips → segments → reservations)
- **Quick Presets**: Pre-configured test scenarios (trip creation, email parsing, etc.)
- **Prompt Building**: Calls actual `buildExpPrompt()` function
- **Results Display**: Shows active plugins, stats, full assembled prompt
- **Token Savings**: Calculates reduction vs monolithic prompt (11,211 chars)

**Entity Selection Feature**:

Cascading dropdowns allow loading real database entities:

```
1. Select Entity Type → [Trip, Segment, Reservation]
2. Select User → Dropdown of all users (name, email, trip count)
3. Select Trip → Filtered by selected user (title, dates, segment count)
4. [If Segment] Select Segment → Filtered by trip (name, route, reservation count)
5. [If Reservation] Select Reservation → Filtered by segment (name, type, confirmation)
6. Click "Load Entity Context" → Auto-fills all context fields
```

**Auto-Population Logic**:
- Finds most recent conversation for entity
- Counts messages in that conversation
- Sets `chatType` based on entity (TRIP/SEGMENT/RESERVATION)
- Sets `hasExistingTrip` to true
- Includes trip data and entity metadata
- Leaves `userMessage` empty (tester fills in)

**Key Implementation Details**:
- **File**: `app/admin/prompts/test/page.tsx` (24.8 KB, client component)
- **State**: 
  - Context: `userMessage`, `messageCount`, `hasExistingTrip`, `chatType`, `metadata`
  - Entity selection: `entityType`, `selectedUserId`, `selectedTripId`, `selectedSegmentId`, `selectedReservationId`
  - Entity data: `users[]`, `trips[]`, `segments[]`, `reservations[]`
  - UI: `loading*`, `loadedEntityInfo`, `result`, `error`
- **APIs Used**:
  - `GET /api/admin/prompts/entities?type=users` - Fetch user list
  - `GET /api/admin/prompts/entities?type=trips&userId=X` - Fetch user's trips
  - `GET /api/admin/prompts/entities?type=segments&tripId=X` - Fetch trip's segments
  - `GET /api/admin/prompts/entities?type=reservations&segmentId=X` - Fetch segment's reservations
  - `GET /api/admin/prompts/entities/{type}/{id}` - Build context from entity
  - `POST /api/admin/prompts/test` - Test prompt building

**React Effects**:
```typescript
// Auto-fetch users on mount
useEffect(() => { fetchUsers(); }, []);

// Auto-fetch trips when user selected
useEffect(() => {
  if (selectedUserId) fetchTrips(selectedUserId);
}, [selectedUserId]);

// Auto-fetch segments when trip selected (for segment/reservation types)
useEffect(() => {
  if (selectedTripId && (entityType === "segment" || entityType === "reservation")) {
    fetchSegments(selectedTripId);
  }
}, [selectedTripId, entityType]);

// Auto-fetch reservations when segment selected (for reservation type)
useEffect(() => {
  if (selectedSegmentId && entityType === "reservation") {
    fetchReservations(selectedSegmentId);
  }
}, [selectedSegmentId, entityType]);
```

**Manual Override**:
All auto-filled fields remain editable. Testers can:
- Modify any context value after loading
- Test edge cases with real data + manual tweaks
- Combine entity data with custom scenarios

**Quick Presets**:
- **Trip Creation**: New trip planning scenario
- **Email Parsing**: Hotel confirmation email
- **Vague Dates**: "next summer" date inference
- **Segment Focus**: Update existing segment
- **Simple Query**: Minimal prompt (shows 81% token savings)

**Results Display**:
- Plugin count, character count, token estimate, savings percentage
- List of active plugins (badges)
- Collapsible sections for prompt inspection
- Copy to clipboard button

---

### 4. API Testing Dashboard (`/admin/apis`)

**Purpose**: Monitor and test external API integrations.

**What It Does**:
- Health checks for all external APIs
- Configuration validation (env vars present)
- Status indicators (configured/unconfigured)
- Interactive testing forms (future)

**Monitored APIs**:
1. **Google Maps**: Maps, geocoding, places
   - Env vars: `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. **Amadeus**: Flight search and booking
   - Env vars: `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`
3. **OpenAI**: AI chat responses
   - Env var: `OPENAI_API_KEY`
4. **Google Imagen**: AI image generation
   - Env var: `GOOGLE_APPLICATION_CREDENTIALS`
   - Config: `IMAGEN_PROJECT`, `IMAGEN_LOCATION`, `IMAGEN_MODEL`
5. **UploadThing**: File uploads
   - Env vars: `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`

**Key Implementation Details**:
- **File**: `app/admin/apis/page.tsx` (7+ KB, client component)
- **API**: `GET /api/admin/health`
- **Components**: `ApiStatusBadge`, `ApiStatusDetail`
- **Refresh**: Manual refresh button (no auto-refresh)

---

## 🔌 API Endpoints Reference

### Prompt Management

#### `GET /api/admin/prompts`

Fetch all plugins from registry.

**Request**: None  
**Response**:
```typescript
{
  plugins: Array<{
    id: string;                    // Plugin ID (e.g., "card-syntax")
    name: string;                  // Display name
    priority: number;              // 0-999
    contentLength: number;         // Character count
    contentPreview: string;        // First 200 chars
    hasCustomLogic: boolean;       // Has shouldInclude function
    enabled: boolean;              // Always true (all enabled)
  }>,
  total: number
}
```

**Implementation**: `app/api/admin/prompts/route.ts`  
**Used By**: `app/admin/prompts/page.tsx`

---

#### `GET /api/admin/prompts/[pluginId]`

Fetch single plugin details.

**Request**: Path param `pluginId`  
**Response**:
```typescript
{
  id: string;
  name: string;
  content: string;               // Full prompt text
  priority: number;
  shouldIncludeCode: string;     // Function as string
  enabled: boolean;
  isBuiltIn: boolean;
  description: string;
}
```

**Special Case**: `pluginId="base"` returns base prompt  
**Implementation**: `app/api/admin/prompts/[pluginId]/route.ts`  
**Used By**: `app/admin/prompts/[pluginId]/page.tsx`

---

#### `PUT /api/admin/prompts/[pluginId]`

Update plugin (preview-only, not persisted).

**Request**:
```typescript
{
  name: string;          // Required
  content: string;       // Required
  priority: number;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;       // "Plugin update acknowledged (not persisted - preview only)"
  pluginId: string;
}
```

**Implementation**: `app/api/admin/prompts/[pluginId]/route.ts`  
**Used By**: `app/admin/prompts/[pluginId]/page.tsx`

---

#### `POST /api/admin/prompts/test`

Build prompt with custom context.

**Request**:
```typescript
{
  context: {
    userMessage: string;           // Required
    messageCount?: number;
    hasExistingTrip?: boolean;
    chatType?: 'TRIP' | 'SEGMENT' | 'RESERVATION';
    metadata?: Record<string, any>;
  }
}
```

**Response**:
```typescript
{
  prompt: string;                  // Assembled prompt
  activePlugins: string[];         // Plugin names
  stats: {
    totalLength: number;           // Character count
    pluginCount: number;
    estimatedTokens: number;       // chars / 4
  },
  context: object;                 // Echo back for reference
}
```

**Implementation**: `app/api/admin/prompts/test/route.ts`  
**Calls**: `buildExpPrompt()` from `app/exp/lib/prompts/build-exp-prompt.ts`  
**Used By**: `app/admin/prompts/test/page.tsx`

---

### Entity Selection

#### `GET /api/admin/prompts/entities`

Fetch entity lists for dropdowns.

**Query Params**:
- `type`: `"users"` | `"trips"` | `"segments"` | `"reservations"` (required)
- `userId`: Filter trips by user (required for type=trips)
- `tripId`: Filter segments by trip (required for type=segments)
- `segmentId`: Filter reservations by segment (required for type=reservations)

**Response Examples**:

```typescript
// type=users
{ users: [{ id, name, email, tripCount }] }

// type=trips&userId=X
{ trips: [{ id, title, startDate, endDate, userId, segmentCount }] }

// type=segments&tripId=X
{ segments: [{ id, name, startTitle, endTitle, tripId, order, reservationCount }] }

// type=reservations&segmentId=X
{ reservations: [{ id, name, confirmationNumber, segmentId, type, category }] }
```

**Ordering**: By `createdAt DESC`  
**Limit**: 100 results per query  
**Implementation**: `app/api/admin/prompts/entities/route.ts`  
**Used By**: `app/admin/prompts/test/page.tsx` (cascading dropdowns)

---

#### `GET /api/admin/prompts/entities/[entityType]/[entityId]`

Build test context from entity.

**Path Params**:
- `entityType`: `"trip"` | `"segment"` | `"reservation"`
- `entityId`: Entity ID

**Response**:
```typescript
{
  context: {
    conversationId?: string;       // From latest conversation
    chatType: 'TRIP' | 'SEGMENT' | 'RESERVATION';
    messageCount: number;          // From conversation
    hasExistingTrip: boolean;      // Always true
    tripData: {
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
      segmentCount?: number;
    };
    metadata: Record<string, any>; // Entity-specific data
  },
  entityInfo: {
    type: string;
    id: string;
    // Type-specific fields (title, name, userName, etc.)
    messageCount: number;
  }
}
```

**Context Building Logic**:

For **Trip**:
```typescript
const trip = await prisma.trip.findUnique({
  where: { id: entityId },
  include: {
    user: { select: { name: true, email: true } },
    segments: { select: { id: true, name: true } },
    conversations: {
      where: { chatType: "TRIP" },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: "desc" },
      take: 1
    }
  }
});
```

For **Segment**: Similar query with `segment` → `trip` → `user` relationships  
For **Reservation**: Similar query with `reservation` → `segment` → `trip` → `user` relationships

**Implementation**: `app/api/admin/prompts/entities/[entityType]/[entityId]/route.ts`  
**Used By**: `app/admin/prompts/test/page.tsx` (Load Entity Context button)

---

### API Health

#### `GET /api/admin/health`

Check status of external APIs.

**Request**: None  
**Response**:
```typescript
{
  googleMaps: {
    configured: boolean;
    hasKey: boolean;
    hasPublicKey: boolean;
  };
  amadeus: {
    configured: boolean;
    hasClientId: boolean;
    hasClientSecret: boolean;
    environment: string;
  };
  openai: {
    configured: boolean;
    hasKey: boolean;
  };
  imagen: {
    configured: boolean;
    hasProject: boolean;
    hasCredentials: boolean;
    location: string;
    model: string;
  };
  uploadthing: {
    configured: boolean;
    hasSecret: boolean;
    hasAppId: boolean;
  };
  timestamp: string;
}
```

**Implementation**: `app/api/admin/health/route.ts`  
**Used By**: `app/admin/apis/page.tsx`

---

## 🛠️ Development Guidelines

### Adding New Admin Features

#### 1. Create a New Admin Page

**File**: `app/admin/{feature}/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FeaturePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/feature");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feature Name</h2>
          <p className="text-muted-foreground">Description</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your content here */}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. Create API Routes

**File**: `app/api/admin/{feature}/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";  // ✅ ALWAYS import from here

export async function GET(request: Request) {
  try {
    // Your logic here
    const data = await prisma.yourModel.findMany();
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Admin API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 }
      );
    }
    
    // Process
    const result = await processData(body);
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Admin API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
```

#### 3. Add to Dashboard

**File**: `app/admin/page.tsx`

```typescript
import { YourIcon } from "lucide-react";

// In the dashboard grid:
<Card>
  <CardHeader>
    <CardTitle>Feature Name</CardTitle>
    <CardDescription>
      Brief description of the feature
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Link href="/admin/your-feature">
      <Button variant="outline" className="w-full">
        Open Feature
        <YourIcon className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  </CardContent>
</Card>
```

### State Management Patterns

```typescript
// ✅ Loading states
const [loading, setLoading] = useState(false);
const [data, setData] = useState<YourType | null>(null);

// ✅ Error handling
const [error, setError] = useState<string | null>(null);

// ✅ Success feedback
const [saved, setSaved] = useState(false);
setTimeout(() => setSaved(false), 3000); // Auto-hide after 3s

// ✅ Form state
const [formData, setFormData] = useState({
  field1: "",
  field2: 0,
});

// ✅ Controlled inputs
<Input
  value={formData.field1}
  onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
/>
```

### Component Patterns

```typescript
// ✅ Import from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ✅ Loading state
{loading && (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
)}

// ✅ Error state
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

// ✅ Empty state
{data.length === 0 && (
  <Card>
    <CardContent className="py-12 text-center">
      <p className="text-muted-foreground">No data found</p>
    </CardContent>
  </Card>
)}
```

### Error Handling Best Practices

```typescript
// ✅ In API routes
try {
  const result = await operation();
  return NextResponse.json({ success: true, result });
} catch (error) {
  console.error("[Admin API] Descriptive context:", error);
  return NextResponse.json(
    { 
      error: "User-friendly message",
      details: error instanceof Error ? error.message : "Unknown error"
    },
    { status: 500 }
  );
}

// ✅ In client components
try {
  const response = await fetch("/api/admin/endpoint");
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Request failed");
  }
  const data = await response.json();
  setData(data);
} catch (err) {
  setError(err instanceof Error ? err.message : "An error occurred");
  console.error("Failed to fetch:", err);
}
```

---

## 📝 Common Development Tasks

### Adding a New Dashboard Card

**File**: `app/admin/page.tsx`

1. Import icon from `lucide-react`:
```typescript
import { YourIcon } from "lucide-react";
```

2. Add Card to the grid (currently 3 columns):
```typescript
<div className="grid gap-4 md:grid-cols-3">
  {/* Existing cards */}
  
  <Card>
    <CardHeader>
      <CardTitle>Your Feature</CardTitle>
      <CardDescription>
        Brief description
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Link href="/admin/your-feature">
        <Button variant="outline" className="w-full">
          Open Feature
          <YourIcon className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
</div>
```

3. Update grid columns if adding to "Quick Actions" section:
```typescript
// Change from md:grid-cols-2 to md:grid-cols-3
<div className="grid gap-4 md:grid-cols-3">
```

---

### Adding a New Prompt Plugin

**Files**: 
1. `app/exp/lib/prompts/{name}-prompt.ts` - New prompt file
2. `app/exp/lib/prompts/registry.ts` - Plugin registration

**Step 1**: Create prompt file

```typescript
// app/exp/lib/prompts/my-feature-prompt.ts
export const MY_FEATURE_PROMPT = `
## My Feature Instructions

[Your prompt content here]

- Instruction 1
- Instruction 2
- Instruction 3
`;
```

**Step 2**: Register in registry

```typescript
// app/exp/lib/prompts/registry.ts

// 1. Import at top
import { MY_FEATURE_PROMPT } from "./my-feature-prompt";

// 2. Define plugin object
const myFeaturePlugin: PromptPlugin = {
  id: 'my-feature',
  name: 'My Feature Name',
  content: MY_FEATURE_PROMPT,
  priority: 40,  // Choose appropriate priority (see Priority Levels below)
  shouldInclude: (context: PromptBuildContext) => {
    // Define when this plugin should be included
    // Examples:
    
    // Always include:
    return true;
    
    // Only for new trips:
    return !context.hasExistingTrip;
    
    // Only when user mentions keywords:
    const keywords = ['hotel', 'accommodation'];
    return keywords.some(kw => context.userMessage.toLowerCase().includes(kw));
    
    // Only after certain message count:
    return (context.messageCount || 0) > 10;
    
    // Based on chat type:
    return context.chatType === 'SEGMENT';
  }
};

// 3. Add to registry in createPromptRegistry()
export function createPromptRegistry(): PromptRegistry {
  const registry = new Map<string, PromptPlugin>();
  
  // Existing plugins...
  registry.set('card-syntax', cardSyntaxPlugin);
  registry.set('email-parsing', emailParsingPlugin);
  // ...
  
  // Add your plugin
  registry.set('my-feature', myFeaturePlugin);
  
  return registry;
}
```

**Priority Levels**:
- **0-9**: Core (base prompt only)
- **10-29**: Entity Creation (cards, syntax)
- **30-49**: Context Handling (defaults, awareness)
- **50-69**: Enhancement Features (examples, optimization)
- **70+**: Experimental/Optional

**Testing**: Use `/admin/prompts/test` to verify your plugin activates correctly

---

### Modifying Entity Selection

**File**: `app/admin/prompts/test/page.tsx`

**Common Modifications**:

1. **Add a new entity type** (e.g., "User"):

```typescript
// 1. Add to entity type radio group (lines ~340-360)
<RadioGroup value={entityType} onValueChange={setEntityType}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="user" id="type-user" />
    <Label htmlFor="type-user">User</Label>
  </div>
  {/* Existing options... */}
</RadioGroup>

// 2. Add context building logic in API route
// app/api/admin/prompts/entities/[entityType]/[entityId]/route.ts
case "user": {
  const user = await prisma.user.findUnique({
    where: { id: entityId },
    include: { /* ... */ }
  });
  // Build context...
}
```

2. **Change dropdown display format**:

```typescript
// In SelectItem (lines ~380-420)
<SelectItem key={trip.id} value={trip.id}>
  {/* Customize display */}
  {trip.title} - {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
</SelectItem>
```

3. **Add additional entity fields**:

```typescript
// In entity API route
const trips = await prisma.trip.findMany({
  where: { userId },
  select: {
    // Existing fields...
    id: true,
    title: true,
    startDate: true,
    endDate: true,
    // Add new field
    status: true,
    description: true,
  },
});
```

**Key Code Sections**:
- State declarations: Lines 30-50
- Fetch functions: Lines 70-130
- useEffect hooks: Lines 60-110
- Load Entity Context handler: Lines 145-175
- Entity selection UI: Lines 270-450
- Entity info display: Lines 450-520

---

### Adding API Health Checks

**Files**:
1. `app/api/admin/health/route.ts` - Add check logic
2. `app/admin/apis/page.tsx` - Update UI

**Step 1**: Add check in health route

```typescript
// app/api/admin/health/route.ts

export async function GET() {
  return NextResponse.json({
    // Existing checks...
    googleMaps: { /* ... */ },
    amadeus: { /* ... */ },
    
    // Add new service
    yourService: {
      configured: !!(
        process.env.YOUR_SERVICE_API_KEY &&
        process.env.YOUR_SERVICE_SECRET
      ),
      hasApiKey: !!process.env.YOUR_SERVICE_API_KEY,
      hasSecret: !!process.env.YOUR_SERVICE_SECRET,
      environment: process.env.YOUR_SERVICE_ENV || "not set",
    },
    
    timestamp: new Date().toISOString(),
  });
}
```

**Step 2**: Update interface and UI

```typescript
// app/admin/apis/page.tsx

// 1. Update interface
interface HealthStatus {
  // Existing services...
  googleMaps: { /* ... */ };
  amadeus: { /* ... */ };
  
  // Add new service
  yourService: {
    configured: boolean;
    hasApiKey: boolean;
    hasSecret: boolean;
    environment: string;
  };
  
  timestamp: string;
}

// 2. Add card in UI (lines ~150+)
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <YourIcon className="h-5 w-5" />
        <CardTitle>Your Service</CardTitle>
      </div>
      <ApiStatusBadge status={health.yourService} />
    </div>
    <CardDescription>
      Your service description
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ApiStatusDetail
      label="API Key"
      value={health.yourService.hasApiKey ? "Set" : "Not set"}
      status={health.yourService.hasApiKey}
    />
    <ApiStatusDetail
      label="Secret"
      value={health.yourService.hasSecret ? "Set" : "Not set"}
      status={health.yourService.hasSecret}
    />
    <ApiStatusDetail
      label="Environment"
      value={health.yourService.environment}
      status={health.yourService.environment !== "not set"}
    />
  </CardContent>
</Card>
```

---

## 🏗️ Architecture Decisions

### Why Preview-Only Editing?

**Problem**: Plugin system uses TypeScript files with function definitions (`shouldInclude`).

**Options Considered**:
1. **Direct file writes** - Security risk, requires file system access
2. **Database storage with eval()** - Security concerns, hard to debug
3. **JSON configuration** - Limited logic, no type safety
4. **Preview-only** - Safe, provides visibility and testing

**Decision**: Start with preview-only (option 4) to provide immediate value:
- ✅ Visibility into plugin system
- ✅ Testing tools for prompt assembly
- ✅ No security concerns
- ✅ Fast to implement
- ❌ No persistence (acceptable for MVP)

**Future**: Add persistence layer when architecture is finalized. Options:
- Store plugins in database with serialized logic
- Use sandboxed execution environment
- Migrate to declarative JSON configuration
- Hybrid approach (core in TS, custom in DB)

---

### Why Cascading Dropdowns?

**Problem**: Entity relationships are hierarchical (User → Trip → Segment → Reservation).

**Alternative Approaches**:
1. **Flat dropdown with all entities** - Overwhelming, hard to find specific items
2. **Search-based selection** - Requires knowing entity names in advance
3. **Tree view** - Complex UI, poor mobile experience
4. **Cascading dropdowns** - Intuitive, matches mental model

**Decision**: Cascading dropdowns (option 4) because:
- ✅ Enforces valid relationships (can't select segment without trip)
- ✅ Reduces dropdown size (filtered lists)
- ✅ Provides context as you navigate (see trip details when selecting segment)
- ✅ Matches user mental model of data structure
- ✅ Works well on mobile
- ❌ Requires more clicks (acceptable tradeoff)

**Implementation**: React effects auto-fetch dependent entities when parent changes.

---

### Why Manual Override After Entity Load?

**Problem**: Auto-populated context might not match desired test scenario.

**Alternative Approaches**:
1. **Lock fields after load** - Can't test edge cases
2. **Separate modes (auto vs manual)** - Confusing UX, more complex
3. **Manual override** - Best of both worlds

**Decision**: Manual override (option 3) because:
- ✅ Fast for common cases (one-click auto-fill)
- ✅ Flexible for edge cases (edit any field)
- ✅ Combine real data with test scenarios
- ✅ Single, unified interface
- ✅ Maintains user control

**Example Use Cases**:
- Load real trip, modify message count to test different activation thresholds
- Use real conversation context, change user message to test specific scenarios
- Load entity but set `hasExistingTrip` to false to test new trip logic

---

### Why No Authentication Yet?

**Problem**: Admin interface needs access control.

**Alternative Approaches**:
1. **Immediate auth implementation** - Blocks other features
2. **IP whitelist** - Not scalable
3. **Warning banner + defer** - Ship features faster

**Decision**: Warning banner + defer (option 3) because:
- ✅ Faster feature development
- ✅ Clear communication of current state
- ✅ Not blocking user testing
- ✅ Easy to add later (middleware pattern)
- ❌ Open to all users (acceptable for internal tool)

**Warning Banner**: Clear notice on every admin page about open access.

**Future**: Add NextAuth middleware to protect `/admin/*` routes:
```typescript
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/admin/:path*"],
};
```

---

## 🔗 Related Systems & Dependencies

### Prompt Plugin System

**Location**: `app/exp/lib/prompts/`  
**Purpose**: Core system for building dynamic, context-aware AI prompts

**Key Files**:
- `types.ts` - Type definitions (`PromptPlugin`, `PromptBuildContext`, `PromptRegistry`)
- `registry.ts` - Plugin registration and `createPromptRegistry()` function
- `build-exp-prompt.ts` - Main `buildExpPrompt()` function for prompt assembly
- `base-exp-prompt.ts` - Base prompt (always included, priority 0)
- Individual prompt files (`*-prompt.ts`) - Conditional prompt sections

**Integration**:
- **Production**: Used by `app/api/chat/simple/route.ts` for chat responses
- **Admin**: Managed and tested via `/admin/prompts`

**Documentation**: See `app/exp/lib/prompts/README.md` for detailed plugin system docs

---

### Chat System

**Location**: `app/exp/`, `app/api/chat/`  
**Purpose**: Main conversational trip planning interface

**Key Files**:
- `app/exp/client.tsx` - Main chat UI component (1,848 lines)
- `app/exp/page.tsx` - Chat page
- `app/api/chat/simple/route.ts` - Chat API endpoint

**Integration with Prompts**:
```typescript
// app/api/chat/simple/route.ts (lines ~180-200)
if (useExpPrompt) {
  const { buildExpPrompt } = await import("@/app/exp/lib/prompts/build-exp-prompt");
  
  const promptContext = {
    conversationId,
    chatType: conversation?.chatType,
    messageCount,
    userMessage: message,
    hasExistingTrip: !!conversation?.tripId,
    metadata: {}
  };
  
  const result = buildExpPrompt(promptContext);
  customPrompt = result.prompt;
  
  console.log("Active plugins:", result.activePlugins.join(', '));
}
```

---

### Database Models

**Schema**: `prisma/schema.prisma`

**Key Models for Admin**:

```prisma
model User {
  id                String    @id @default(cuid())
  name              String?
  email             String    @unique
  trips             Trip[]
  conversations     ChatConversation[]
  // ... other fields
}

model Trip {
  id            String    @id @default(cuid())
  title         String
  startDate     DateTime
  endDate       DateTime
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  segments      Segment[]
  conversations ChatConversation[]
  // ... other fields
}

model Segment {
  id           String        @id @default(cuid())
  name         String
  startTitle   String
  endTitle     String
  tripId       String
  trip         Trip          @relation(fields: [tripId], references: [id])
  reservations Reservation[]
  conversations ChatConversation[]
  // ... other fields
}

model Reservation {
  id                  String    @id @default(cuid())
  name                String
  confirmationNumber  String?
  segmentId           String
  segment             Segment   @relation(fields: [segmentId], references: [id])
  conversations       ChatConversation[]
  // ... other fields
}

model ChatConversation {
  id            String    @id @default(cuid())
  userId        String
  tripId        String?
  segmentId     String?
  reservationId String?
  chatType      ChatType  @default(TRIP)
  messages      ChatMessage[]
  // ... other fields
}

model ChatMessage {
  id             String    @id @default(cuid())
  conversationId String
  role           String
  content        String
  conversation   ChatConversation @relation(fields: [conversationId])
  // ... other fields
}

enum ChatType {
  TRIP
  SEGMENT
  RESERVATION
}
```

**Used By**: Entity selection API endpoints for loading test contexts

---

### UI Component Library

**Location**: `components/ui/`  
**Framework**: shadcn/ui (Radix UI primitives + Tailwind CSS)

**Commonly Used Components**:

| Component | Usage | File |
|-----------|-------|------|
| Card | Content containers | `card.tsx` |
| Button | Actions | `button.tsx` |
| Badge | Status indicators | `badge.tsx` |
| Input | Text inputs | `input.tsx` |
| Textarea | Multi-line text | `textarea.tsx` |
| Select | Dropdowns | `select.tsx` |
| Switch | Toggle controls | `switch.tsx` |
| RadioGroup | Radio buttons | `radio-group.tsx` |
| Alert | Notifications | `alert.tsx` |
| Collapsible | Expandable sections | `collapsible.tsx` |

**Pattern**: All components accept `className` prop for Tailwind customization

**Utility**: `cn()` function from `lib/utils.ts` for className merging

---

## 🐛 Troubleshooting

### "Select User" Dropdown Not Loading

**Symptoms**: 
- Dropdown shows "Loading..." indefinitely
- Dropdown is empty
- Console error about Prisma

**Causes**:
1. ❌ Wrong Prisma import in API route
2. ❌ Database connection issue
3. ❌ No users in database

**Solutions**:

1. **Check Prisma import**:
```typescript
// ✅ CORRECT
import { prisma } from "@/lib/prisma";

// ❌ WRONG
import { prisma } from "@/app/generated/prisma";
```

2. **Verify database connection**:
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

3. **Check if users exist**:
```bash
# Run Prisma Studio
npx prisma studio

# Or check via psql
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

4. **Run seed script if empty**:
```bash
npm run db:seed
# or
node prisma/seed.js
```

**Related Files**:
- `app/api/admin/prompts/entities/route.ts` (API endpoint)
- `app/admin/prompts/test/page.tsx` (UI component, line ~70)

---

### Prompt Not Building

**Symptoms**:
- "Build Prompt" button does nothing
- Error message appears
- No results shown

**Causes**:
1. ❌ User message field is empty
2. ❌ Invalid context values
3. ❌ API endpoint error
4. ❌ Plugin system not initialized

**Solutions**:

1. **Check user message**:
```typescript
// Field must not be empty
<Button 
  onClick={handleTest} 
  disabled={testing || !userMessage}  // <- Validates here
>
```

2. **Validate context values**:
```typescript
// Common issues:
- messageCount: Must be number (not string)
- chatType: Must be "TRIP" | "SEGMENT" | "RESERVATION" | "none"
- metadata: Must be valid JSON
```

3. **Check browser console**:
```javascript
// Open DevTools (F12) → Console tab
// Look for:
"Failed to fetch"          // Network error
"Invalid JSON"             // Metadata parsing error
"Failed to build prompt"   // API error
```

4. **Test API endpoint directly**:
```bash
curl -X POST http://localhost:3000/api/admin/prompts/test \
  -H "Content-Type: application/json" \
  -d '{"context":{"userMessage":"test"}}'
```

5. **Check plugin registry**:
```typescript
// Verify plugins are registered
import { createPromptRegistry } from "@/app/exp/lib/prompts/registry";
const registry = createPromptRegistry();
console.log(registry.size); // Should be 5+
```

**Related Files**:
- `app/admin/prompts/test/page.tsx` (UI, lines 180-230)
- `app/api/admin/prompts/test/route.ts` (API endpoint)
- `app/exp/lib/prompts/build-exp-prompt.ts` (Core logic)

---

### API Health Check Failing

**Symptoms**:
- API shows as "Unconfigured"
- Red status badge
- Missing environment variables

**Causes**:
1. ❌ Environment variables not set
2. ❌ Incorrect variable names
3. ❌ Server not restarted after .env changes

**Solutions**:

1. **Check environment variables**:
```bash
# View all env vars
cat .env

# Check specific vars
echo $GOOGLE_MAPS_API_KEY
echo $AMADEUS_CLIENT_ID
echo $OPENAI_API_KEY
```

2. **Verify variable names**:
```bash
# Correct names (from app/api/admin/health/route.ts):
GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
AMADEUS_CLIENT_ID
AMADEUS_CLIENT_SECRET
AMADEUS_ENVIRONMENT
OPENAI_API_KEY
GOOGLE_APPLICATION_CREDENTIALS
IMAGEN_PROJECT
IMAGEN_LOCATION
IMAGEN_MODEL
UPLOADTHING_SECRET
UPLOADTHING_APP_ID
```

3. **Restart dev server**:
```bash
# Kill server (Ctrl+C) and restart
npm run dev
```

4. **Check .env.local** (overrides .env):
```bash
# If using .env.local
cat .env.local
```

5. **Verify credentials work**:
```bash
# Test Google Maps
curl "https://maps.googleapis.com/maps/api/geocode/json?address=test&key=$GOOGLE_MAPS_API_KEY"

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Related Files**:
- `.env` - Environment variables
- `app/api/admin/health/route.ts` - Health check logic
- `app/admin/apis/page.tsx` - Health check UI

---

### Cascading Dropdowns Not Working

**Symptoms**:
- Trip dropdown doesn't populate after selecting user
- Segment dropdown doesn't appear
- "Loading..." state persists

**Causes**:
1. ❌ useEffect dependency array incorrect
2. ❌ API endpoint returning empty array
3. ❌ State not updating correctly

**Solutions**:

1. **Check useEffect dependencies**:
```typescript
// Correct pattern (lines 60-110):
useEffect(() => {
  if (selectedUserId) {
    fetchTrips(selectedUserId);
  }
}, [selectedUserId]); // <- Must include selectedUserId
```

2. **Verify API returns data**:
```bash
# Test trips endpoint
curl "http://localhost:3000/api/admin/prompts/entities?type=trips&userId=USER_ID"

# Check response
{
  "trips": [
    { "id": "...", "title": "...", "segmentCount": 3 }
  ]
}
```

3. **Check state updates**:
```typescript
// Add console.logs
const fetchTrips = async (userId: string) => {
  console.log("Fetching trips for user:", userId);
  const response = await fetch(`/api/admin/prompts/entities?type=trips&userId=${userId}`);
  const data = await response.json();
  console.log("Received trips:", data.trips);
  setTrips(data.trips || []);
};
```

4. **Reset dependent state**:
```typescript
// When user changes, clear trips/segments/reservations
useEffect(() => {
  if (selectedUserId) {
    fetchTrips(selectedUserId);
  } else {
    setTrips([]);
    setSelectedTripId("");
    setSegments([]);
    setSelectedSegmentId("");
  }
}, [selectedUserId]);
```

**Related Files**:
- `app/admin/prompts/test/page.tsx` (Lines 60-130)

---

## 📊 Quick Reference

### Priority Levels

| Range | Category | Purpose | Example Plugins |
|-------|----------|---------|-----------------|
| 0-9 | Core | Base instructions, always included | Base Prompt |
| 10-29 | Entity Creation | Card syntax, entity creation | Card Syntax |
| 30-49 | Context Handling | Smart defaults, context awareness | Email Parsing, Smart Defaults, Context Awareness |
| 50-69 | Enhancement | Examples, optimizations | Examples |
| 70+ | Experimental | Optional features | Future plugins |

**Usage**: Set priority based on when the plugin should appear in the final prompt. Lower numbers execute first.

---

### Environment Variables Reference

| Variable | Service | Purpose | Example |
|----------|---------|---------|---------|
| `DATABASE_URL` | PostgreSQL | Database connection | `postgresql://user:pass@host:5432/db` |
| `GOOGLE_MAPS_API_KEY` | Google Maps | Server-side maps API | `AIza...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps | Client-side maps API | `AIza...` |
| `AMADEUS_CLIENT_ID` | Amadeus | Flight search API | `abc123...` |
| `AMADEUS_CLIENT_SECRET` | Amadeus | Flight search secret | `xyz789...` |
| `AMADEUS_ENVIRONMENT` | Amadeus | API environment | `test` or `production` |
| `OPENAI_API_KEY` | OpenAI | AI chat responses | `sk-...` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud | Imagen image generation | `path/to/credentials.json` |
| `IMAGEN_PROJECT` | Google Cloud | GCP project ID | `my-project-123` |
| `IMAGEN_LOCATION` | Google Cloud | Imagen region | `us-central1` |
| `IMAGEN_MODEL` | Google Cloud | Imagen model | `imagegeneration@006` |
| `UPLOADTHING_SECRET` | UploadThing | File upload secret | `sk_live_...` |
| `UPLOADTHING_APP_ID` | UploadThing | Upload app ID | `abc123xyz` |

---

### Common Icons (from lucide-react)

```typescript
import {
  ArrowLeft,        // Back buttons
  ArrowRight,       // Forward/next actions
  Loader2,          // Loading spinner (with animate-spin)
  Database,         // Database/entity icons
  FileText,         // Documents/plugins
  TestTube,         // Testing
  Settings,         // Configuration
  Plug,             // API/integrations
  Map,              // Maps
  Plane,            // Flights
  Bot,              // AI
  Image,            // Images
  Check,            // Success
  X,                // Close/clear
  AlertCircle,      // Errors
  CheckCircle2,     // Success with circle
  ChevronDown,      // Expand
  ChevronRight,     // Collapse
  Copy,             // Copy to clipboard
  Play,             // Execute/run
  Search,           // Search
  Eye,              // View
} from "lucide-react";
```

---

### Keyboard Shortcuts

**Current**: No keyboard shortcuts implemented

**Future Opportunities**:
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + /` - Toggle search bar
- `Ctrl/Cmd + Enter` - Build prompt (in test interface)
- `Ctrl/Cmd + B` - Toggle sidebar
- `Esc` - Close modals/clear selections

---

### HTTP Status Codes Used

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/POST/PUT |
| 400 | Bad Request | Missing required params, invalid input |
| 404 | Not Found | Entity/plugin doesn't exist |
| 500 | Server Error | Database error, unexpected exception |

---

### File Size Reference

```
Frontend Pages:
- app/admin/page.tsx                      ~4.2 KB (Dashboard)
- app/admin/prompts/page.tsx              ~8.5 KB (Plugin list)
- app/admin/prompts/[pluginId]/page.tsx   ~9.8 KB (Plugin editor)
- app/admin/prompts/test/page.tsx        ~24.8 KB (Test interface)
- app/admin/apis/page.tsx                 ~7.0 KB (API testing)

Backend API Routes:
- app/api/admin/prompts/route.ts          ~1.4 KB
- app/api/admin/prompts/[pluginId]/route.ts   ~2.1 KB
- app/api/admin/prompts/test/route.ts         ~1.0 KB
- app/api/admin/prompts/entities/route.ts     ~5.5 KB
- app/api/admin/prompts/entities/[entityType]/[entityId]/route.ts   ~7.2 KB
- app/api/admin/health/route.ts           ~3.0 KB

Total Admin Interface: ~75 KB
```

---

## 📚 Additional Resources

### Implementation Documentation

- `ADMIN_PROMPT_INTERFACE_COMPLETE.md` - Initial admin interface implementation
- `ENTITY_SELECTION_TESTING_COMPLETE.md` - Entity selection feature
- `PROMPT_PLUGIN_SYSTEM_COMPLETE.md` - Core prompt system architecture

### System Documentation

- `app/exp/lib/prompts/README.md` - Detailed prompt plugin system guide
- `prisma/schema.prisma` - Complete database schema
- `components/ui/` - shadcn/ui component source code

### External Resources

- [Next.js 14 Docs](https://nextjs.org/docs) - Next.js App Router
- [Prisma Docs](https://www.prisma.io/docs) - Database ORM
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling
- [Lucide Icons](https://lucide.dev/) - Icon library

---

## 🎯 Next Steps & Future Enhancements

### Planned Features

1. **Plugin Persistence**
   - Database storage for custom plugins
   - File system writes for built-in plugins
   - Version control and rollback
   - Import/export functionality

2. **Authentication & Authorization**
   - NextAuth integration
   - Role-based access control
   - Admin user management
   - Audit logging

3. **Analytics Dashboard**
   - Plugin usage tracking
   - Token savings metrics
   - Error rate monitoring
   - Performance analytics

4. **Enhanced Testing**
   - Saved test scenarios
   - Batch testing multiple contexts
   - A/B testing framework
   - Prompt comparison tools

5. **API Testing Expansion**
   - Interactive API call forms
   - Response caching
   - Rate limit monitoring
   - Error rate tracking

### Known Technical Debt

- [ ] No persistence layer for plugin edits
- [ ] No authentication/authorization
- [ ] No caching for entity lists
- [ ] No pagination (100 item limit)
- [ ] No search within dropdowns
- [ ] No keyboard shortcuts
- [ ] No bulk operations
- [ ] No export/import functionality

---

## 🤝 Contributing Guidelines

### Before Making Changes

1. Read this README completely
2. Check existing completion documents
3. Review related system documentation
4. Understand current architecture decisions

### When Adding Features

1. Follow existing patterns
2. Use shadcn/ui components
3. Import Prisma from `@/lib/prisma`
4. Add loading/error states
5. Include TypeScript types
6. Update this README
7. Create completion document

### Code Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises
- Include JSDoc comments for complex logic
- Follow existing naming conventions

### Testing

- Test manually in browser
- Check all loading states
- Verify error handling
- Test edge cases
- Clear browser cache if styling changes

---

## 📝 Changelog

### Version 1.0 (January 26, 2026)

**Initial Release**:
- Admin dashboard with stats and quick actions
- Prompt plugin management (view, edit preview, test)
- Entity selection for testing with real data
- API health monitoring
- Comprehensive developer documentation

**Features**:
- 6 prompt plugins (1 base + 5 conditional)
- Cascading entity dropdowns (User → Trip → Segment → Reservation)
- Manual and preset-based testing modes
- Token savings calculation
- Priority-based plugin system

**Known Limitations**:
- Preview-only editing (no persistence)
- No authentication (open to all users)
- No custom plugin creation via UI

---

**Last Updated**: January 26, 2026  
**Maintainer**: Development Team  
**Questions**: Refer to completion documents or ask in team chat
