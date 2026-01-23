# Master Plan: Profile Graph Complete System

**Created:** January 22, 2026, 8:45pm  
**Status:** Ready for Execution  
**Estimated Total Time:** 12-15 hours

---

## Overview

This master plan consolidates all profile graph enhancements into a single, ordered execution plan. It combines incremental AI improvements, UI simplification, layout enhancements, and integration with the suggestions system.

---

## Execution Order & Feature Summary

### Phase 1: Foundation & Safety (Steps 1-2)
**Time:** 1 hour  
**Goal:** Add robust JSON parsing and update AI to concierge format

- ✅ **Step 1: JSON Safety Layer** - Add Zod schemas and sanitization (COMPLETED)
- ✅ **Step 2: Concierge AI Prompt** - Update AI to return auto-add items and suggestions (COMPLETED)

**Features Added:**
- Robust JSON validation with Zod
- Try-parse-first sanitization approach
- AI returns high-confidence auto-add items (0.9+)
- AI returns medium-confidence suggestions (0.5-0.8)
- Backward compatible with Mad-Lib format

---

### Phase 2: Auto-Add Backend (Step 3)
**Time:** 1.5 hours  
**Goal:** Process auto-add items in backend, update graph silently

- ⏳ **Step 3: Auto-Add Items Backend** - Process autoAddItems array, update database

**Features Added:**
- Items auto-add to database when AI is confident
- Graph updates automatically
- No UI feedback yet (silent operation)
- Updated `addGraphItem` function signature

**Files Modified:**
- `app/api/profile-graph/chat/route.ts`
- `lib/actions/profile-graph-actions.ts`

---

### Phase 3: User Feedback (Step 4)
**Time:** 1 hour  
**Goal:** Show toast notifications when items are auto-added

- ⏳ **Step 4: Toast Notifications** - Add toast component and show feedback

**Features Added:**
- Toast notification when items auto-added
- Shows item names and count
- Auto-dismisses after 3 seconds
- Staggered toasts for multiple events

**Files Modified:**
- `components/graph-chat-interface.tsx`
- `components/ui/toast.tsx` (NEW)

---

### Phase 4: Suggestion Chips UI (Step 5)
**Time:** 2 hours  
**Goal:** Replace Mad-Lib format with interactive suggestion chips

- ⏳ **Step 5: Inline Suggestion Chips** - Create chips with (+) and (x) buttons

**Features Added:**
- Suggestions appear as blue chips inline in message
- (+) button to accept and add to profile
- (x) button to reject and remove
- Chips turn green when accepted
- Smooth animations and transitions

**Files Modified:**
- `components/inline-suggestion-chip.tsx` (NEW)
- `components/graph-chat-interface.tsx`

---

### Phase 5: Theme Cleanup (Plan A)
**Time:** 1 hour  
**Goal:** Remove unnecessary themes, simplify to single "clean" theme

- ⏳ **Plan A: Theme Cleanup** - Remove 4 extra themes, eliminate theme selector

**Features Added:**
- Single, consistent visual style
- Simpler codebase (less theme logic)
- Cleaner UI (no theme selector clutter)
- Foundation ready for layout improvements

**Files Modified:**
- `lib/types/graph-themes.ts` - Keep only "clean" theme
- `components/graph-controls.tsx` - Remove theme selector
- `app/profile/graph/client.tsx` - Remove theme state
- `components/profile-graph-canvas.tsx` - Hardcode clean theme

---

### Phase 6: Layout Improvements (Plan C)
**Time:** 2-3 hours  
**Goal:** Enhance hub-spoke layout with smart distribution and better spacing

- ⏳ **Plan C: Graph Layout Improvements** - Smart angles, tiered spokes, better typography

**Features Added:**
- Smart symmetrical hub distribution (1-5 categories)
  - 1 category: Top (90°)
  - 2 categories: Top/Bottom (90°, 270°)
  - 3 categories: Triangle (90°, 210°, 330°)
  - 4 categories: Square (45°, 135°, 225°, 315°)
  - 5 categories: Pentagon
- Tiered spoke lengths to reduce overlap
- Larger fonts (User: 18px, Category: 15px, Item: 13px)
- Standardized item width (140px)
- Enhanced shadows and visual hierarchy

**Files Modified:**
- `lib/graph-layout.ts` - Smart angle calculation
- `lib/types/graph-themes.ts` - Update font sizes
- `components/graph-nodes/*.tsx` - Update styling

---

### Phase 7: Category Limits (Step 6)
**Time:** 1 hour  
**Goal:** Enforce 5/5 limits and return reorganization flags

- ⏳ **Step 6: Category Limits Validation** - Add validateCategoryLimits function

**Features Added:**
- Maximum 5 primary categories
- Maximum 5 items per category
- Returns `requiresReorganization` flag when limits hit
- Toast notification when reorganization needed

**Files Modified:**
- `lib/actions/profile-graph-actions.ts`

---

### Phase 8: AI Reorganization (Step 7)
**Time:** 2 hours  
**Goal:** AI automatically reorganizes items into subcategories when limits hit

- ⏳ **Step 7: AI Reorganization System** - Create AI subcategory organizer

**Features Added:**
- AI analyzes items and creates 2-4 semantic subcategories
- Automatic reorganization when 6th item added
- Graph updates with new subcategory structure
- Toast shows reorganization progress

**Files Modified:**
- `lib/ai/subcategory-organizer.ts` (NEW)
- `app/api/profile-graph/reorganize/route.ts` (NEW)
- `components/graph-chat-interface.tsx`

---

### Phase 9: Dossier View (Plan B)
**Time:** 3-4 hours  
**Goal:** Create AI-powered narrative "Traveler Dossier" view

- ⏳ **Plan B: Dossier View** - AI narrative generation from graph data

**Features Added:**
- View mode switcher (Graph / Dossier)
- AI generates elegant narrative from profile data
- 4 standard sections:
  - I. Logistics & Transit
  - II. Accommodation & Sleep Hygiene
  - III. Palate & Wellness
  - IV. Passions & Curiosities
- Bracketed items [Like This] for emphasis
- Action buttons: "View Suggestions" and "Create Trip"

**Files Modified:**
- `components/profile-views/view-mode-switcher.tsx` (NEW)
- `components/profile-views/dossier-view.tsx` (NEW)
- `lib/ai/dossier-generator.ts` (NEW)
- `app/api/profile-graph/generate-dossier/route.ts` (NEW)
- `app/profile/graph/client.tsx`

---

### Phase 10: Suggestions Integration (Plan D)
**Time:** 2-3 hours  
**Goal:** Create suggestions page that uses dossier for AI trip ideas

- ⏳ **Plan D: Suggestions Integration** - New /profile/suggestions page

**Features Added:**
- New page at `/profile/suggestions`
- Uses dossier narrative for richer AI context
- Generates 4-6 personalized trip suggestions
- Progressive image loading
- "Create Trip" integration with Experience Builder
- Navigation: Profile → Dossier → Suggestions → Trip

**Files Modified:**
- `app/profile/suggestions/page.tsx` (NEW)
- `app/profile/suggestions/client.tsx` (NEW)
- `app/api/suggestions/trip-ideas/route.ts` - Update to use dossier

---

### Phase 11: Polish & Highlighting (Steps 8-10)
**Time:** 2 hours  
**Goal:** Add radial layout option, theme system, and node highlighting

**Note:** Steps 8-9 may be SKIPPED based on Phase 5 (Theme Cleanup). If we remove themes, we don't need radial layout. However, Step 10 (highlighting) is still valuable.

- ⏳ **Step 8: Radial Layout** - Add radial layout calculation (OPTIONAL)
- ⏳ **Step 9: Theme System** - Add theme selector with radial option (SKIP if themes removed)
- ⏳ **Step 10: Node Highlighting** - Pulse animation for new nodes

**Features Added (Step 10 only):**
- New nodes pulse 3 times with yellow highlight
- Smooth transitions and animations
- Professional, polished appearance

**Files Modified:**
- `components/profile-graph-canvas.tsx`
- `app/profile/graph/client.tsx`
- `app/globals.css` - Pulse animation

---

## Complete Feature List

### AI & Intelligence
- ✅ Robust JSON parsing with Zod validation
- ✅ Concierge-style AI responses
- ✅ Auto-add high-confidence items (0.9+)
- ✅ Suggest medium-confidence items (0.5-0.8)
- ⏳ AI-driven subcategory reorganization
- ⏳ AI narrative dossier generation
- ⏳ Dossier-powered trip suggestions

### User Interface
- ⏳ Toast notifications for feedback
- ⏳ Inline suggestion chips with (+)/(x) buttons
- ⏳ Single clean theme (simplified)
- ⏳ View mode switcher (Graph / Dossier)
- ⏳ Elegant dossier view with 4 sections
- ⏳ Trip suggestions page with cards
- ⏳ Node highlighting with pulse animation

### Graph Layout
- ⏳ Smart symmetrical hub distribution (1-5 categories)
- ⏳ Tiered spoke lengths to reduce overlap
- ⏳ Larger, more readable fonts
- ⏳ Standardized item width (140px)
- ⏳ Enhanced shadows and visual hierarchy
- ⏳ Professional, polished appearance

### Data & Logic
- ⏳ 5 categories / 5 items per category limits
- ⏳ Automatic reorganization when limits hit
- ⏳ Updated addGraphItem function signature
- ⏳ Category validation before adding items

### Integration & Flow
- ⏳ Profile → Dossier → Suggestions → Trip flow
- ⏳ Dossier text feeds suggestions system
- ⏳ Suggestions integrate with Experience Builder
- ⏳ Clear navigation between all pages

---

## Consolidated Files to Modify

### New Files to Create (11 total)
1. `components/ui/toast.tsx`
2. `components/inline-suggestion-chip.tsx`
3. `lib/ai/subcategory-organizer.ts`
4. `app/api/profile-graph/reorganize/route.ts`
5. `components/profile-views/view-mode-switcher.tsx`
6. `components/profile-views/dossier-view.tsx`
7. `lib/ai/dossier-generator.ts`
8. `app/api/profile-graph/generate-dossier/route.ts`
9. `app/profile/suggestions/page.tsx`
10. `app/profile/suggestions/client.tsx`
11. `app/globals.css` (add pulse animation)

### Existing Files to Modify (10 total)
1. `lib/ai/profile-graph-chat.ts` ✅
2. `app/api/profile-graph/chat/route.ts`
3. `lib/actions/profile-graph-actions.ts`
4. `components/graph-chat-interface.tsx`
5. `lib/types/graph-themes.ts`
6. `components/graph-controls.tsx`
7. `app/profile/graph/client.tsx`
8. `components/profile-graph-canvas.tsx`
9. `lib/graph-layout.ts`
10. `components/graph-nodes/*.tsx` (user, category, item)

---

## Testing Strategy

### After Each Phase
1. Refresh page at http://localhost:3003/profile/graph
2. Type "I like swimming"
3. Verify expected behavior for that phase
4. Check browser console for errors
5. If broken, roll back that phase only and debug

### Final Integration Test
1. Build complete profile with 5 categories
2. Switch to Dossier view
3. Verify narrative generation
4. Navigate to Suggestions page
5. Verify trip suggestions generated
6. Click "Create Trip" to Experience Builder
7. Verify smooth flow through entire system

---

## Rollback Strategy

Each phase is independent. If a phase breaks:
1. `git diff` to see changes in that phase
2. `git restore <files>` for that phase only
3. Debug with instrumentation
4. Fix and retry

---

## Success Criteria

All phases complete:
- ✅ Conversational AI with auto-add and suggestions
- ✅ Toast notifications for user feedback
- ✅ Interactive suggestion chips
- ✅ Single, clean theme (simplified)
- ✅ Smart symmetrical graph layout
- ✅ 5/5 category limits enforced
- ✅ AI-driven reorganization
- ✅ Elegant dossier narrative view
- ✅ Dossier-powered trip suggestions
- ✅ Complete Profile → Dossier → Suggestions → Trip flow
- ✅ Professional, polished UX throughout

---

## Estimated Timeline

- **Phase 1-2:** ✅ COMPLETED (2 hours)
- **Phase 3-4:** 2.5 hours (Auto-add + Toasts)
- **Phase 5:** 1 hour (Theme cleanup)
- **Phase 6:** 2.5 hours (Layout improvements)
- **Phase 7:** 1 hour (Category limits)
- **Phase 8:** 2 hours (AI reorganization)
- **Phase 9:** 3.5 hours (Dossier view)
- **Phase 10:** 2.5 hours (Suggestions integration)
- **Phase 11:** 1 hour (Polish & highlighting)

**Total:** 12-15 hours (2 hours already complete)

---

## Notes

- Steps 8-9 (Radial layout and theme system) may be SKIPPED if we proceed with Plan A (Theme Cleanup)
- Step 10 (Node highlighting) should still be implemented for polish
- All phases are designed to be independent and testable
- Each phase adds value and can be deployed separately
- The system works at every phase, just with fewer features
