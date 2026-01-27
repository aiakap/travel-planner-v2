# Admin Interface - Quick Start Guide

## 🎉 What's New

**January 27, 2026** - The admin interface has been enhanced with exp system integration!

**New Features**:
- ⭐ **Card Type Explorer** - Interactive reference for all 10 card types with schema validation
- ⭐ **Suggestion Testing** - Test place, transport, and hotel suggestion schemas
- ⭐ **AI Testing** - Generate cards with OpenAI and see visual previews
- ⭐ **Structured Output Tab** - Full exp response testing in AI Content page
- ⭐ **Prompt Mapping** - See which prompts trigger which cards

**See**: `/docs/ADMIN_EXP_MIGRATION.md` for complete migration guide

## 🚀 Getting Started

Navigate to **`/admin`** in your browser to access the admin panel.

## 📍 Page Structure

```
/admin
├── Dashboard (landing page)
│   ├── Stats overview (plugins, cards, suggestions)
│   ├── Quick actions
│   └── System information
│
├── /cards ⭐ NEW (card type explorer)
│   ├── Overview - All 10 card types
│   ├── Schema Editor - Test & validate JSON
│   ├── Field Reference - Complete schema docs
│   └── Prompt Mapping - Card-to-prompt relationships
│
├── /suggestions ⭐ NEW (suggestion testing)
│   ├── Places tab - Google Places schema
│   ├── Transport tab - Amadeus transport schema
│   └── Hotels tab - Amadeus hotel schema
│
├── /prompts (plugin management)
│   ├── All plugins list
│   ├── Search & filter
│   ├── Priority guidelines
│   └── Plugin cards
│
├── /prompts/[pluginId] (plugin viewer)
│   ├── Metadata (name, ID, priority)
│   ├── Content editor
│   ├── Activation logic
│   └── Statistics
│
├── /prompts/test (testing interface) ⭐ ENHANCED
│   ├── Context configuration
│   ├── Entity selection (load from database)
│   ├── Quick presets
│   ├── Build & test prompts
│   ├── Test with AI (live generation) ⭐ NEW
│   └── Card preview & validation ⭐ NEW
│
└── /apis (API testing)
    ├── Dashboard - Health checks
    ├── /ai-content ⭐ ENHANCED
    │   ├── Structured Output tab ⭐ NEW
    │   ├── Trip Suggestions
    │   ├── Place Descriptions
    │   └── Travel Dossier
    └── Individual API tests (Google Maps, Amadeus, OpenAI, etc.)
```

## 🎯 Quick Actions

### Explore Card Types ⭐ NEW
1. Go to `/admin/cards`
2. Browse the **10 card types** (trip, segment, reservation, etc.)
3. Switch to **Schema Editor** to test JSON validation
4. Check **Field Reference** for complete schema documentation
5. View **Prompt Mapping** to see card-to-prompt relationships

### Test Suggestions ⭐ NEW
1. Go to `/admin/suggestions`
2. Choose tab: **Places**, **Transport**, or **Hotels**
3. Fill in form fields
4. Click **"Validate"** to check schema compliance
5. View validated JSON output

### Test with AI ⭐ ENHANCED
1. Go to `/admin/prompts/test`
2. Configure context (or load from database entity)
3. Click **"Test with AI"** for live generation ⭐ NEW
4. View **generated cards** with visual previews ⭐ NEW
5. See **suggestions** (places, transport, hotels) ⭐ NEW
6. Check **validation status** and token usage ⭐ NEW

### Test Structured Outputs ⭐ NEW
1. Go to `/admin/apis/ai-content`
2. Click **"Structured Output"** tab
3. Enter user message
4. Select output type (full/cards/suggestions)
5. Click **"Generate"**
6. View cards, suggestions, and validation results

### View All Plugins
1. Go to `/admin`
2. Click **"View Plugins"**
3. Browse the 6 plugins (1 base + 5 conditional)

### View Plugin Details
1. From plugins list, click **"View Details"** on any card
2. See full content, activation logic, and stats
3. Note: Edits are preview-only (not persisted)

### Test Prompt Building
1. Go to `/admin/prompts/test`
2. Click a **quick preset** or enter custom context
3. Click **"Build Prompt"**
4. View results: active plugins, stats, full prompt
5. Use **collapsible sections** to explore prompt parts
6. Click **"Copy"** to copy full prompt

## 🎨 Priority Colors

- 🔵 **Blue** (0-9): Core - Base prompt
- 🟣 **Purple** (10-29): Entity Creation - Cards, syntax
- 🟠 **Orange** (30-49): Context Handling - Defaults, awareness
- 🔷 **Teal** (50-69): Enhancement - Examples
- 🟣 **Pink** (70+): Experimental

## ⚠️ Important Notes

### No Persistence
Changes made in the editor are **preview-only**. The plugin system uses TypeScript files that aren't modified by this interface.

### No Authentication
Currently **open to all users**. Authentication will be added in a future update.

### Read-Only Built-In Plugins
All current plugins are built-in and read-only. Future versions will support creating custom plugins.

## 🧪 Test Scenarios

### Scenario 1: Trip Creation
- **Triggers**: Card Syntax, Examples
- **Message**: "Plan a trip to Tokyo"
- **Expected**: 3 plugins, ~5,900 chars

### Scenario 2: Email Parsing
- **Triggers**: Card Syntax, Email Parsing
- **Message**: "Here is my confirmation..."
- **Expected**: 3 plugins, ~6,000 chars

### Scenario 3: Vague Dates
- **Triggers**: Card Syntax, Smart Defaults, Examples
- **Message**: "I want to go next summer"
- **Expected**: 4 plugins, ~7,200 chars

### Scenario 4: Segment Focus
- **Triggers**: Context Awareness
- **Context**: chatType = "SEGMENT"
- **Expected**: 2 plugins, ~4,800 chars

### Scenario 5: Simple Query
- **Triggers**: Base only
- **Message**: "What time is checkout?"
- **Context**: messageCount = 15, hasExistingTrip = true
- **Expected**: 1 plugin, ~2,100 chars (81% savings!)

## 📊 Understanding Stats

### Plugin Count
Number of prompt sections included in the assembled prompt.

### Total Characters
Raw character count of the assembled prompt.

### Estimated Tokens
Rough estimate: characters ÷ 4 (OpenAI's approximation).

### Token Savings
Percentage reduction vs. the old monolithic prompt (11,211 chars).

## 🔗 Navigation Tips

- Use the **back arrow** (←) to return to previous pages
- Click **"Back to App"** in header to return to main site
- All pages have breadcrumb-style navigation
- Search bar in plugins list for quick finding

## 🐛 Troubleshooting

### Plugin Not Loading
- Check browser console for errors
- Verify `/api/admin/prompts` endpoint is accessible
- Ensure plugin system is properly initialized

### Test Results Not Showing
- Verify context fields are valid
- Check that user message is not empty
- Look for error messages in the results area

### Save Button Doesn't Persist
- This is expected! See "No Persistence" note above
- Changes are acknowledged but not saved to files

## 📚 Related Documentation

- **Plugin System**: `app/exp/lib/prompts/README.md`
- **Implementation Plan**: `.cursor/plans/admin_prompt_management_interface_*.plan.md`
- **Completion Summary**: `ADMIN_PROMPT_INTERFACE_COMPLETE.md`

## 🎉 You're Ready!

Head to **`/admin`** and start exploring the prompt plugin system!
