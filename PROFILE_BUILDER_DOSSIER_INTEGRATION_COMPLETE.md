# Profile Builder Dossier Integration - Complete

## Summary

Successfully updated the Profile Builder (`/object/profile_attribute`) to use the ProfileGraph (dossier) data source instead of the structured profile tables. Also enforced AI suggestion generation and implemented data refresh functionality.

## Changes Made

### 1. Switched to ProfileGraph Data Source

**File: `lib/object/data-fetchers/profile.ts`**
- Replaced `getUserProfile` call with direct `UserProfileGraph` query
- Now fetches XML data and parses it using `parseXmlToGraph()`
- Returns parsed graph data with nodes/edges instead of structured tables

**File: `app/object/_views/profile-view.tsx`**
- Updated to display graph nodes instead of hobbies/preferences arrays
- Groups nodes by category dynamically
- Shows items as tags with category headers

**File: `lib/actions/add-profile-suggestion.ts`**
- Replaced `UserHobby` creation with `UserProfileGraph` upsert
- Uses `addItemToXml()` to add items to the XML structure
- Maintains existing graph data when adding new items

### 2. Enforced AI Suggestion Generation

**File: `app/object/_configs/profile_attribute.config.ts`**
- Updated system prompt with stronger directive language
- Added "CRITICAL RULE" that every user message should result in at least one PROFILE_SUGGESTION card
- Emphasized extracting all profile-related information from casual conversation

### 3. Implemented Data Refresh Mechanism

**File: `app/object/_core/chat-layout.tsx`**
- Added `refreshTrigger` state to track refresh requests
- Added `useEffect` hook that refetches data when `refreshTrigger` increments
- Updated `onDataUpdate` handler to support action-based updates
- When `action: "refresh_profile"` is received, triggers data refetch

**File: `app/object/_cards/profile-suggestion-card.tsx`**
- Already correctly calls `onDataUpdate({ action: "refresh_profile" })` after successful accept
- No changes needed

## Data Flow

```
User accepts suggestion
  ↓
ProfileSuggestionCard.handleAccept()
  ↓
addProfileSuggestion() - saves to UserProfileGraph
  ↓
onDataUpdate({ action: "refresh_profile" })
  ↓
ChatLayout increments refreshTrigger
  ↓
useEffect detects change, calls config.dataSource.fetch()
  ↓
fetchProfileData() queries UserProfileGraph
  ↓
ProfileView displays updated graph nodes
```

## Benefits

1. **Unified Data Model**: Profile Builder now uses the same graph-based system as `/profile/graph` and the dossier generator
2. **Flexible Structure**: Graph nodes can represent any type of profile data without schema changes
3. **Consistent Experience**: Data added in Profile Builder appears in the dossier and vice versa
4. **Real-time Updates**: Right panel refreshes immediately when suggestions are accepted
5. **Enforced Suggestions**: AI now consistently generates suggestion cards for every user message

## Testing

To test the changes:

1. Navigate to `/object/profile_attribute`
2. Send a message like "I love hiking and prefer window seats"
3. Verify that PROFILE_SUGGESTION cards appear for both items
4. Click "Accept" on a suggestion
5. Verify the right panel updates immediately to show the new item
6. Navigate to `/profile/graph` to confirm the data appears there too

## Related Files

- `/app/object/_configs/profile_attribute.config.ts` - Configuration
- `/lib/object/data-fetchers/profile.ts` - Data fetcher
- `/app/object/_views/profile-view.tsx` - View component
- `/lib/actions/add-profile-suggestion.ts` - Server action
- `/app/object/_core/chat-layout.tsx` - Layout with refresh logic
- `/app/object/_cards/profile-suggestion-card.tsx` - Card component

## Database Schema

Uses the `UserProfileGraph` table:
```prisma
model UserProfileGraph {
  id        String   @id @default(cuid())
  userId    String   @unique
  graphData String?  // XML string with profile data
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

The `graphData` field stores XML in this format:
```xml
<profile>
  <Outdoor_Activities>
    <hobby>
      <item value="Skiing" addedAt="2024-01-01T00:00:00.000Z" />
    </hobby>
  </Outdoor_Activities>
  <Travel_Preferences>
    <preference>
      <item value="Window Seat" addedAt="2024-01-01T00:00:00.000Z" />
    </preference>
  </Travel_Preferences>
</profile>
```

The XML is parsed to graph nodes using `parseXmlToGraph()` from `lib/profile-graph-xml.ts`.
