# Travel Planner System - Plans Index

**Created:** January 22, 2026, 8:45pm  
**Updated:** January 26, 2026
**Location:** Workspace root directory

---

## Recent Implementations

### ✅ Journey Architect (January 26, 2026)
📋 **[JOURNEY_ARCHITECT_COMPLETE.md](JOURNEY_ARCHITECT_COMPLETE.md)**

AI-powered timeline builder using strict terminology (Journey/Chapter/Moment). Acts as "Intelligent Drafter" to create trip structures through natural language conversation.

**Key Features:**
- Intelligent drafting (infers missing pieces)
- Automatic travel time estimation
- Aspirational naming
- Scope control (politely declines Moment requests)
- Full integration with existing Trip/Segment models

**Access:** `/object/journey_architect`

---

## Master Plan

📋 **[MASTER_PLAN_PROFILE_GRAPH_COMPLETE.md](MASTER_PLAN_PROFILE_GRAPH_COMPLETE.md)**

Consolidated execution plan with all phases, features, and timeline.

---

## Individual Step Plans (Incremental Implementation)

### Phase 1: Foundation & Safety
1. ✅ **[STEP_1_JSON_SAFETY_LAYER.md](STEP_1_JSON_SAFETY_LAYER.md)** - Zod schemas and JSON sanitization (COMPLETED)
2. ✅ **[STEP_2_CONCIERGE_PROMPT.md](STEP_2_CONCIERGE_PROMPT.md)** - AI concierge format with auto-add (COMPLETED)

### Phase 2-4: Auto-Add & User Feedback
3. ⏳ **[STEP_3_AUTO_ADD_BACKEND.md](STEP_3_AUTO_ADD_BACKEND.md)** - Process auto-add items in backend
4. ⏳ **[STEP_4_TOAST_NOTIFICATIONS.md](STEP_4_TOAST_NOTIFICATIONS.md)** - Toast notifications for feedback
5. ⏳ **[STEP_5_SUGGESTION_CHIPS.md](STEP_5_SUGGESTION_CHIPS.md)** - Interactive suggestion chips with (+)/(x)

### Phase 5-6: Simplification & Layout
6. ⏳ **[STEP_6_CATEGORY_LIMITS.md](STEP_6_CATEGORY_LIMITS.md)** - 5/5 category and item limits
7. ⏳ **[STEP_7_AI_REORGANIZATION.md](STEP_7_AI_REORGANIZATION.md)** - AI-driven subcategory organization

### Phase 7-8: Advanced Layout (Optional)
8. ⏳ **[STEP_8_RADIAL_LAYOUT.md](STEP_8_RADIAL_LAYOUT.md)** - Radial/concentric circles layout (OPTIONAL)
9. ⏳ **[STEP_9_THEME_SYSTEM.md](STEP_9_THEME_SYSTEM.md)** - Theme selector integration (SKIP if themes removed)

### Phase 9: Polish
10. ⏳ **[STEP_10_NODE_HIGHLIGHTING.md](STEP_10_NODE_HIGHLIGHTING.md)** - Node highlighting and animations

---

## Related Plans (In ~/.cursor/plans/)

### Active Plans from Other Window

**Plan A:** `theme_cleanup_d90ff89a.plan.md`
- Remove themes, simplify UI
- Keep only "clean" theme
- Remove theme selector

**Plan B:** `dossier_view_364e99cd.plan.md`
- AI narrative generation
- Elegant prose format
- 4 standard sections

**Plan C:** `graph_layout_improvements_140db014.plan.md`
- Smart symmetry
- Better spacing
- Larger fonts

**Plan D:** `suggestions_integration_5fc8af69.plan.md`
- New suggestions page
- Uses dossier text
- Integration with Experience Builder

---

## Execution Sequence

### Recommended Order

1. **Steps 1-2** ✅ (COMPLETED) - Foundation
2. **Step 3** - Auto-add backend
3. **Step 4** - Toast notifications
4. **Step 5** - Suggestion chips
5. **Plan A** - Theme cleanup (simplify)
6. **Plan C** - Layout improvements (smart angles, fonts)
7. **Step 6** - Category limits
8. **Step 7** - AI reorganization
9. **Step 10** - Node highlighting (skip Steps 8-9 if themes removed)
10. **Plan B** - Dossier view
11. **Plan D** - Suggestions integration

### Alternative Order (If Keeping Themes)

1-7. Same as above
8. **Step 8** - Radial layout algorithm
9. **Step 9** - Theme system with radial option
10. **Step 10** - Node highlighting
11. **Plan B** - Dossier view
12. **Plan D** - Suggestions integration

---

## Feature Summary by Category

### AI Intelligence
- Concierge-style responses
- Auto-add high-confidence items
- Suggest medium-confidence items
- AI subcategory reorganization
- AI narrative dossier generation
- Dossier-powered trip suggestions

### User Interface
- Toast notifications
- Interactive suggestion chips
- Single clean theme (or multi-theme system)
- View mode switcher (Graph / Dossier)
- Elegant dossier view
- Trip suggestions page
- Node highlighting animations

### Graph Layout
- Smart symmetrical hub distribution
- Tiered spoke lengths
- Larger, readable fonts
- Standardized item widths
- Enhanced visual hierarchy
- Professional polish

### Data & Logic
- 5 categories / 5 items limits
- Automatic reorganization
- Robust JSON parsing
- Category validation
- Updated function signatures

### Integration Flow
- Profile → Dossier → Suggestions → Trip
- Clear navigation between pages
- Seamless data flow
- Experience Builder integration

---

## Quick Start

To begin execution:

```bash
# Start from Step 3 (Steps 1-2 already complete)
open STEP_3_AUTO_ADD_BACKEND.md
```

Or to see the big picture:

```bash
# View master plan
open MASTER_PLAN_PROFILE_GRAPH_COMPLETE.md
```

---

## Files Created

### In Workspace Root
- `STEP_1_JSON_SAFETY_LAYER.md`
- `STEP_2_CONCIERGE_PROMPT.md`
- `STEP_3_AUTO_ADD_BACKEND.md`
- `STEP_4_TOAST_NOTIFICATIONS.md`
- `STEP_5_SUGGESTION_CHIPS.md`
- `STEP_6_CATEGORY_LIMITS.md`
- `STEP_7_AI_REORGANIZATION.md`
- `STEP_8_RADIAL_LAYOUT.md`
- `STEP_9_THEME_SYSTEM.md`
- `STEP_10_NODE_HIGHLIGHTING.md`
- `MASTER_PLAN_PROFILE_GRAPH_COMPLETE.md`
- `PLANS_INDEX.md` (this file)

### In ~/.cursor/plans/
- `theme_cleanup_d90ff89a.plan.md` (Plan A)
- `dossier_view_364e99cd.plan.md` (Plan B)
- `graph_layout_improvements_140db014.plan.md` (Plan C)
- `suggestions_integration_5fc8af69.plan.md` (Plan D)

---

## Notes

- All plans are independent and can be executed separately
- Each plan has clear testing criteria
- Rollback strategy defined for each step
- Plans A-D integrate seamlessly with Steps 1-10
- Total estimated time: 12-15 hours
- 2 hours already complete (Steps 1-2)
