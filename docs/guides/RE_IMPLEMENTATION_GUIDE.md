# Re-Implementation Guide

## Quick Reference for Rebuilding Features

This guide provides a quick-start checklist for re-implementing features if needed. Each feature includes dependencies, key files, and estimated complexity.

---

## Critical Path (Must Do First)

### 1. Database Schema Changes
**Priority:** CRITICAL - Do these first before anything else

#### Reservation Metadata
```bash
# Files to review:
- RESERVATION_METADATA_IMPLEMENTATION_COMPLETE.md
- prisma/migrations/20260128000000_add_reservation_metadata/
- lib/reservation-metadata-types.ts
- lib/utils/reservation-metadata.ts

# Steps:
1. Add metadata field to Reservation model
2. Run migration
3. Implement type system
4. Add UI components
```

#### Wall Clock Fields
```bash
# Files to review:
- WALL_CLOCK_FIELDS_IMPLEMENTATION_COMPLETE.md
- prisma/migrations/20260128100000_add_wall_clock_fields/
- scripts/add-wall-clock-triggers.ts

# Steps:
1. Add wall clock fields to Segment and Reservation models
2. Run migration
3. Add PostgreSQL triggers
4. Backfill existing data
```

---

## Major Features (High Impact)

### 2. View1 Dynamic Journey System
**Complexity:** High  
**Time Estimate:** 4-6 hours  
**Dependencies:** None

```bash
# Files to review:
- VIEW1_DYNAMIC_JOURNEY_IMPLEMENTATION_COMPLETE.md (344 lines)

# Key changes:
1. Create app/view1/[[...tripId]]/page.tsx
2. Create new-journey-experience.tsx
3. Update app/view1/client.tsx (single itinerary prop)
4. Remove trip selector dropdown
5. Add journey creation cards

# Testing checklist:
- /view1 shows creation experience
- /view1/[tripId] shows trip dashboard
- Tab navigation includes trip ID in URL
- No errors when clicking trips from manage1
```

### 3. Manage1 Page
**Complexity:** Medium  
**Time Estimate:** 2-3 hours  
**Dependencies:** View1 dynamic system (for navigation)

```bash
# Files to review:
- MANAGE1_IMPLEMENTATION_COMPLETE.md

# Key files to create:
- app/manage1/[[...tripId]]/page.tsx
- app/manage1/client.tsx
- app/manage1/components/ (7 components)
- app/manage1/styles/manage1-theme.css
- app/view1/styles/shared-theme.css

# Testing checklist:
- /manage1 shows trip list
- Click trip navigates to /view1/[tripId]
- Search and filters work
- Stats display correctly
```

### 4. Quick Add Feature
**Complexity:** High  
**Time Estimate:** 4-6 hours  
**Dependencies:** Reservation metadata (for storing extracted data)

```bash
# Files to review:
- QUICK_ADD_IMPLEMENTATION_COMPLETE.md
- QUICK_ADD_PROCESSOR_ARCHITECTURE.md (407 lines - READ THIS FIRST)

# Key files to create:
- components/quick-add-modal.tsx
- app/api/quick-add/extract/route.ts
- app/api/quick-add/create/route.ts
- lib/actions/quick-add-reservation.ts
- lib/utils/flight-assignment.ts

# Testing checklist:
- Paste flight confirmation → extracts correctly
- Paste hotel confirmation → extracts correctly
- Smart segment assignment works
- Trip dates extend if needed
```

### 5. Timezone Fix Implementation
**Complexity:** High  
**Time Estimate:** 3-4 hours  
**Dependencies:** None (but affects everything)

```bash
# Files to review:
- TIMEZONE_FIX_IMPLEMENTATION_COMPLETE.md
- TIMEZONE_DATE_PICKER_FIX_COMPLETE.md
- DATEPICKER_TIMEZONE_FIX_COMPLETE.md

# Key files to create:
- lib/utils/date-timezone.ts
- lib/utils/date-timezone.test.ts

# Key fixes:
- Date picker timezone handling
- View1 timezone display
- Journey manager timezone handling
- Reservation edit timezone handling

# Testing checklist:
- Date picker shows correct local dates
- No off-by-one errors
- Timezone display is consistent
- Edit forms preserve timezone correctly
```

---

## Medium Priority Features

### 6. Intelligence Caching
**Complexity:** Medium  
**Time Estimate:** 2-3 hours  
**Dependencies:** None

```bash
# Files to review:
- INTELLIGENCE_CACHING_COMPLETE.md

# Key files to create:
- lib/cache/redis.ts
- lib/cache/intelligence-cache.ts

# Update all intelligence API routes:
- app/api/trip-intelligence/activities/route.ts
- app/api/trip-intelligence/cultural/route.ts
- app/api/trip-intelligence/currency/route.ts
- app/api/trip-intelligence/dining/route.ts
- app/api/trip-intelligence/emergency/route.ts
- app/api/trip-intelligence/language/route.ts

# Testing checklist:
- First request hits AI API
- Second request uses cache
- Cache expires after 24 hours
- Cost reduction visible in logs
```

### 7. PDF Generation System
**Complexity:** Medium  
**Time Estimate:** 2-3 hours  
**Dependencies:** None

```bash
# Files to review:
- PDF_GENERATION_SYSTEM_COMPLETE.md

# Key files to create:
- lib/pdf/pdf-generator.ts
- lib/pdf/pdf-template.tsx
- app/api/pdf/generate/route.ts

# Dependencies to install:
- puppeteer
- react-dom/server

# Testing checklist:
- Generate PDF for trip
- PDF includes all segments
- PDF includes all reservations
- Maps render correctly
```

### 8. Calendar Export
**Complexity:** Low  
**Time Estimate:** 1-2 hours  
**Dependencies:** None

```bash
# Files to review:
- CALENDAR_EXPORT_IMPLEMENTATION_COMPLETE.md

# Key files to create:
- app/api/calendar/export/route.ts

# Dependencies to install:
- ics

# Testing checklist:
- Export .ics file
- Import to Google Calendar
- All events show correctly
- Timezones are correct
```

### 9. Smart Segment Assignment
**Complexity:** Medium  
**Time Estimate:** 2-3 hours  
**Dependencies:** Quick Add feature

```bash
# Files to review:
- SMART_SEGMENT_ASSIGNMENT_COMPLETE.md

# Key logic:
- Analyze reservation dates and locations
- Match to existing segments or create new
- Handle edge cases (overnight, multi-day)

# Testing checklist:
- Flight assigned to correct segment
- Hotel creates new segment if needed
- Multi-day reservations handled correctly
```

### 10. Optimistic Delete
**Complexity:** Medium  
**Time Estimate:** 1-2 hours  
**Dependencies:** None

```bash
# Files to review:
- OPTIMISTIC_DELETE_IMPLEMENTATION_COMPLETE.md
- OPTIMISTIC_DELETE_UX_ENHANCEMENT_COMPLETE.md

# Key files to create:
- hooks/use-optimistic-delete.ts

# Update delete actions:
- Immediate UI feedback
- Toast with undo button
- Rollback on error

# Testing checklist:
- Delete shows instant feedback
- Undo button works
- Network errors handled gracefully
```

---

## Low Priority (Polish & Enhancements)

### 11. Language Learning Agent
```bash
- LANGUAGE_LEARNING_AGENT_COMPLETE.md
- app/api/trip-intelligence/language/route.ts
- app/view1/components/language-view.tsx
```

### 12. Logo Maker
```bash
- LOGO_MAKER_IMPLEMENTATION_COMPLETE.md
- app/admin/apis/imagen/logo/page.tsx
- app/api/admin/logo/generate/route.ts
```

### 13. Trip Template Selector
```bash
- TRIP_TEMPLATE_SELECTOR_IMPLEMENTATION_COMPLETE.md
- components/template-selection-modal.tsx
- lib/actions/get-trip-templates.ts
```

### 14. Natural Language Reservation
```bash
- NATURAL_LANGUAGE_RESERVATION_COMPLETE.md
- Parse "dinner at 7pm tomorrow" → create reservation
```

### 15. Auto Trip Description
```bash
- AUTO_TRIP_DESCRIPTION_IMPLEMENTATION_COMPLETE.md
- lib/utils/trip-description.ts
- AI-generated descriptions
```

---

## Bug Fixes to Re-Apply

### Timezone Fixes (Multiple)
```bash
- TIMEZONE_FIX_IMPLEMENTATION_COMPLETE.md
- TIMEZONE_DATE_PICKER_FIX_COMPLETE.md
- DATEPICKER_TIMEZONE_FIX_COMPLETE.md
- VIEW1_TIMEZONE_FIX_COMPLETE.md
- JOURNEY_MANAGER_TIMEZONE_FIX_COMPLETE.md
- RESERVATION_EDIT_TIMEZONE_FIX_COMPLETE.md
```

### Quick Add Fixes
```bash
- QUICK_ADD_FIXES_COMPLETE.md
- QUICK_ADD_EXTRACTION_FIX_COMPLETE.md
- QUICK_ADD_DEBUG_AND_TEXTAREA_FIX_COMPLETE.md
```

### UI Fixes
```bash
- MODAL_RESET_FIX_COMPLETE.md
- STYLE_SWITCHER_FIX_COMPLETE.md
- POLLING_FAILURE_FIX_COMPLETE.md
```

### Database Fixes
```bash
- DATABASE_SCHEMA_SYNC_COMPLETE.md
- JOURNEY_MANAGER_ATOMIC_TRANSACTIONS_COMPLETE.md
```

---

## Testing Strategy

### After Each Feature:
1. **Dev Server:** Verify no compilation errors
2. **Type Check:** Run `npm run type-check`
3. **Linter:** Run `npm run lint`
4. **Manual Test:** Test the specific feature
5. **Regression Test:** Test related features

### Before Committing:
1. **Full Build:** Run `npm run build`
2. **All Tests:** Run test suite if available
3. **Database:** Verify migrations applied
4. **Documentation:** Update completion docs

---

## Common Pitfalls

### 1. Timezone Issues
- Always use `lib/utils/date-timezone.ts` utilities
- Never use `new Date()` without timezone context
- Test across multiple timezones

### 2. Prisma Relations
- Case-sensitive: `ImagePromptStyle` not `imagePromptStyle`
- Always check schema for exact relation names
- Use Prisma Studio to verify data

### 3. View1 Props
- Client expects single `itinerary`, not `itineraries[]`
- Remove trip selector state
- Update tab navigation to include trip ID

### 4. Quick Add
- Two-phase: Extract → Enrich
- Background processing for flights
- Smart segment assignment logic

### 5. Database Migrations
- Always backup before migration
- Test migrations on dev database first
- Use `db pull` to sync schema after manual changes

---

## Rollback Strategy

If something goes wrong:

### 1. Git Status
```bash
git status
git diff
```

### 2. Selective Rollback
```bash
# Rollback specific file
git checkout HEAD -- path/to/file

# Rollback all changes
git reset --hard HEAD
```

### 3. Database Rollback
```bash
# Rollback last migration
npx prisma migrate reset

# Or restore from backup
psql -U user -d database < backup.sql
```

### 4. Cache Clear
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules if needed
rm -rf node_modules
npm install
```

---

## Quick Commands

### Development
```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Sync schema from database
npx prisma db pull

# Apply migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

### Git
```bash
# Status
git status

# Diff
git diff

# Commit
git add .
git commit -m "message"

# Push
git push
```

---

## Emergency Contacts

### If Site Breaks:
1. Check dev server logs
2. Check browser console
3. Check Prisma schema vs database
4. Clear `.next` cache
5. Restart dev server

### If Database Issues:
1. Check migrations applied
2. Run `npx prisma db pull`
3. Run `npx prisma generate`
4. Check PostgreSQL logs

### If Type Errors:
1. Run `npx prisma generate`
2. Clear `.next` cache
3. Restart TypeScript server in IDE
4. Check import paths

---

**Last Updated:** January 28, 2026, 9:30 PM  
**For Questions:** Review completion docs in root directory
