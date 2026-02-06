# Debug Code Locations - Test EXP Page

This document tracks all debug/logging code in the test implementation that should be removed before production deployment.

## Summary
- **Client file**: `/app/test/exp/client.tsx` - 29 console statements
- **API file**: `/app/api/chat/simple/route.ts` - 23 console statements

## Files with Debug Code

### 1. `/app/test/exp/client.tsx`

**Debug logging to remove:**
- Line ~237: Trip detection logging (entire useEffect can be simplified)
- Lines throughout: Various `console.log` statements for trip refetching
- Lines throughout: All emoji-prefixed logs (🔍, 🎨, ✅, ❌, 🔄, 📍)

**Search patterns to find:**
```
console.log
console.error
console.warn
```

### 2. `/app/api/chat/simple/route.ts`

**Debug logging to remove:**
- Lines 34-36: Pipeline start logs with separators
- Lines 45-58: Stage 1 logging
- Lines 80-96: Stage 2 logging  
- Lines 120-138: Stage 3 logging
- Lines 157-160: Pipeline complete logs
- Line 197: System prompt preview log

**Sections to clean:**
```typescript
// Remove these console.log blocks:
console.log("\n" + "=".repeat(80));
console.log("🚀 PIPELINE START");
console.log("✅ Stage 1 complete (${stage1Timing}ms)");
console.log("✅ Stage 2 complete (${stage2Timing}ms)");
console.log("✅ Stage 3 complete (${stage3Timing}ms)");
console.log("🎉 PIPELINE COMPLETE");
```

## Cleanup Instructions (for later)

When ready to move to production:

1. **Remove all console statements** except critical error logging
2. **Keep error catching** but simplify error messages
3. **Remove emoji decorators** from all logs
4. **Remove timing/performance logs** unless needed for monitoring
5. **Keep structural error handling** (try/catch blocks)

## Production-Ready Error Logging

Keep only essential error logs:
```typescript
// KEEP: Critical errors
console.error("[API Error]:", error);

// REMOVE: Debug traces, success confirmations, timing info
console.log("✅ Stage complete (123ms)"); // DELETE
console.log("🔍 Processing message"); // DELETE
```

## Testing Checklist Before Cleanup

- [ ] All features work correctly on `/test/exp`
- [ ] Place links are clickable with hover cards
- [ ] Reservations can be added to itinerary
- [ ] Messages persist correctly
- [ ] No infinite loops or hanging
- [ ] Loading states work properly
- [ ] Error states handled gracefully

## Notes

- Debug code is intentionally left in place during development phase
- This allows us to troubleshoot issues and verify behavior
- Once all features are stable and tested, follow cleanup instructions above
- Test page (`/test/exp`) will be kept separate from main experience builder
