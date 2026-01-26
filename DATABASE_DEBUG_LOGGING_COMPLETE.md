# Database Debug Logging - Complete

## Summary

Added comprehensive logging to track database writes and reads to identify why items aren't appearing on the dossier page despite successful database writes.

## Logging Added

### 1. Verification Logging in addProfileSuggestion

**File:** `lib/actions/add-profile-suggestion.ts`

Added after database upsert:

```typescript
// Verify what's actually in the database
const verifyRead = await prisma.userProfileGraph.findUnique({
  where: { userId: session.user.id }
});

console.log('🔍 VERIFICATION:', {
  upsertedId: upsertResult.id,
  verifiedId: verifyRead?.id,
  upsertedLength: upsertResult.graphData.length,
  verifiedLength: verifyRead?.graphData.length,
  match: upsertResult.graphData === verifyRead?.graphData,
  idsMatch: upsertResult.id === verifyRead?.id
});
```

This verifies that the upserted data matches what's actually in the database.

### 2. Multiple Records Check

Added query to check for multiple records:

```typescript
const allRecords = await prisma.userProfileGraph.findMany({
  where: { userId: session.user.id }
});

console.log('📊 All records for user:', allRecords.map(r => ({
  id: r.id,
  xmlLength: r.graphData.length,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt
})));
```

This identifies if there are multiple UserProfileGraph records for the same user (which would violate the unique constraint).

### 3. Dossier Page Read Logging

**File:** `lib/actions/profile-graph-actions.ts`

Added logging in `getUserProfileGraph`:

```typescript
console.log('📖 [getUserProfileGraph] Reading for userId:', targetUserId, {
  found: !!profileGraph,
  id: profileGraph?.id,
  xmlLength: profileGraph?.graphData?.length
});

// After parsing
console.log('📖 [getUserProfileGraph] Parsed graph:', {
  nodeCount: graphData.nodes.length,
  edgeCount: graphData.edges.length
});
```

This shows what the dossier page actually reads from the database.

### 4. Enhanced Cache Invalidation

Changed from:
```typescript
revalidatePath("/profile/graph");
revalidatePath("/object/profile_attribute");
```

To:
```typescript
revalidatePath("/profile/graph", "page");
revalidatePath("/object/profile_attribute", "page");
revalidatePath("/", "layout");
```

More aggressive cache clearing to ensure the dossier page sees fresh data.

## What to Look For

### When clicking a chip on `/object/profile_attribute`:

1. **🟢 Database upsert COMPLETE** - Shows upsert succeeded
2. **🔍 VERIFICATION** - Shows if upserted data matches database read
   - If `match: false` → Database write is being rolled back
   - If `idsMatch: false` → Multiple records exist
3. **📊 All records for user** - Shows how many records exist
   - Should be exactly 1 record
   - If > 1 → Unique constraint is broken

### When navigating to `/profile/graph`:

1. **📖 [getUserProfileGraph] Reading** - Shows what the dossier page reads
   - Compare `id` with the upsert ID
   - Compare `xmlLength` with the upserted length
2. **📖 [getUserProfileGraph] Parsed graph** - Shows parsed node count
   - Should match the number of items added

## Expected Findings

One of these will be revealed:

1. **Verification mismatch** → Database transaction is rolling back
2. **Multiple records** → Unique constraint is not enforced
3. **Different IDs** → Dossier reads a different record than we write to
4. **Same ID, different length** → Caching issue
5. **Same ID, same length, different nodes** → XML parsing issue

## Testing Instructions

1. Clear the terminal output (Cmd+K in terminal)
2. Refresh `/object/profile_attribute`
3. Click ONE chip
4. Look for the 🔍 and 📊 logs in terminal
5. Navigate to `/profile/graph`
6. Look for the 📖 logs in terminal
7. Compare the IDs and lengths between write and read

## Files Modified

1. `lib/actions/add-profile-suggestion.ts` - Added verification and multiple records check
2. `lib/actions/profile-graph-actions.ts` - Added read logging
3. Both files - Enhanced cache invalidation

## Next Steps

After seeing the logs, we'll know exactly what's wrong and can fix it precisely.
