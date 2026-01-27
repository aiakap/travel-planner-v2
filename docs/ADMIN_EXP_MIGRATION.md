# Admin Interface Exp Migration Guide

**Date**: January 27, 2026  
**Status**: Complete  
**Type**: Enhancement & Modernization

---

## Overview

The admin interface has been enhanced to align with the exp system's structured outputs architecture. This guide documents what changed, why, and how to use the new features.

## What Changed

### New Features Added

1. **Card Type Explorer** (`/admin/cards`)
   - Interactive reference for all 10 card types
   - Schema validation and testing
   - Field reference documentation
   - Card-to-prompt mapping table

2. **Suggestion Testing** (`/admin/suggestions`)
   - Test place suggestions (Google Places API)
   - Test transport suggestions (Amadeus API)
   - Test hotel suggestions (Amadeus Hotel API)
   - Schema validation for all suggestion types

3. **Structured Output Testing** (`/admin/apis/ai-content`)
   - New tab for testing exp-response-schema
   - Visual card previews
   - Real-time schema validation
   - Full structured response display

4. **Enhanced Prompt Testing** (`/admin/prompts/test`)
   - "Test with AI" button for live generation
   - Card generation preview
   - Suggestion display
   - Token usage and validation metrics

5. **API Endpoints**
   - `/api/admin/cards/validate` - Validate card JSON
   - `/api/admin/suggestions/validate` - Validate suggestion JSON
   - `/api/admin/test/exp-response` - Test structured outputs

### Updated Components

- **Admin Dashboard**: Updated stats to show 10 card types, 3 suggestion types
- **AI Content Page**: Added structured output testing tab
- **Prompt Test Page**: Added AI testing with card preview

### No Breaking Changes

- All existing admin features continue to work
- No old functionality removed
- Backward compatible with existing workflows

## The Exp System

### What is Exp?

The exp system (`/app/exp`) uses OpenAI's Structured Outputs feature with Zod schemas instead of text-based card syntax parsing.

**Old Approach** (now deprecated):
```typescript
// AI returns text with embedded syntax
const text = "Here's your trip: [TRIP_CARD: tripId=123, title=Paris]"
// Parse with regex
const cards = parseCardsFromText(text)
```

**New Approach** (exp system):
```typescript
// AI returns structured JSON
const response = await generateObject({
  schema: expResponseSchema,
  // ...
})
// Response is already structured
const cards = response.cards // Array of Card objects
```

### Benefits

1. **100% Consistency**: OpenAI guarantees response matches schema
2. **Type Safety**: Full TypeScript support with Zod inference
3. **No Parsing Errors**: No more regex failures or missed cards
4. **Better Validation**: Automatic schema validation
5. **Cleaner Code**: Direct object access, no string parsing

## Card Types Reference

The exp system defines 10 card types in `/lib/schemas/exp-response-schema.ts`:

| Card Type | Usage | Example Trigger |
|-----------|-------|----------------|
| `trip_card` | Trip overview | "Plan a trip to Paris" |
| `segment_card` | Trip segments | "Add a stay in Rome" |
| `reservation_card` | General reservations | "I booked a hotel" |
| `hotel_reservation_card` | Hotel confirmations | Paste email confirmation |
| `dining_schedule_card` | Restaurant suggestions | "Where should I eat?" |
| `activity_table_card` | Activity listings | "Things to do in Tokyo" |
| `flight_comparison_card` | Flight options | "Find flights to London" |
| `budget_breakdown_card` | Cost summary | "How much will this cost?" |
| `day_plan_card` | Daily itinerary | "What should I do on Monday?" |
| `places_map_card` | Interactive map | "Show me on a map" |

## Suggestion Types Reference

Three suggestion types for API integrations:

| Type | Purpose | API |
|------|---------|-----|
| `places` | Restaurants, hotels, museums | Google Places API |
| `transport` | Flights, trains, transfers | Amadeus API |
| `hotels` | Hotel bookings | Amadeus Hotel API |

## Using the New Features

### Card Type Explorer

**Purpose**: Understand and test card schemas

**Steps**:
1. Navigate to `/admin/cards`
2. Browse the 10 card types in the grid
3. Click a card to see details and examples
4. Switch to "Schema Editor" tab
5. Paste or edit JSON
6. Click "Validate" to check schema compliance
7. View visual preview of valid cards

**Use Cases**:
- Learning card structures
- Testing new card configurations
- Validating AI responses
- Creating example cards for testing

### Suggestion Testing

**Purpose**: Test suggestion schemas independently

**Steps**:
1. Navigate to `/admin/suggestions`
2. Choose tab: Places, Transport, or Hotels
3. Fill in the form fields
4. Click "Validate"
5. View validation results
6. See validated JSON

**Use Cases**:
- Testing suggestion payloads before sending to AI
- Validating API request formats
- Understanding required fields
- Debugging suggestion issues

### Structured Output Testing

**Purpose**: Test full exp responses with AI

**Steps**:
1. Navigate to `/admin/apis/ai-content`
2. Click "Structured Output" tab
3. Enter user message
4. Select output type (full/cards/suggestions)
5. Choose model
6. Click "Generate Structured Output"
7. View cards, suggestions, and validation

**Use Cases**:
- Testing AI card generation
- Previewing card rendering
- Validating exp responses
- Comparing models

### Enhanced Prompt Testing

**Purpose**: Build prompts AND test with AI

**Steps**:
1. Navigate to `/admin/prompts/test`
2. Configure context (or load from database entity)
3. Click "Build Prompt" to see assembled prompt
4. Click "Test with AI" to generate with OpenAI
5. View generated cards and suggestions
6. Check validation status

**Use Cases**:
- Testing prompt effectiveness
- Seeing which cards are generated
- Validating AI outputs
- Comparing plugin combinations

## Migration Path

### For Developers

**If you're building new features**:
1. Use exp-response-schema for card definitions
2. Use validation API endpoints
3. Reference card explorer for examples
4. Test with suggestion testing tool

**If you're maintaining existing code**:
1. No changes required immediately
2. Old code still works
3. Gradually adopt structured approach
4. Use deprecation markers as guide

### For Content Creators

**Testing AI responses**:
1. Use Admin → Card Types to learn card structures
2. Use Admin → Suggestions to test payloads
3. Use Admin → AI Content → Structured Output to preview results
4. Use Admin → Prompts → Test with AI for end-to-end testing

## Deprecated Features

### Marked as Deprecated (NOT Removed)

The following patterns are deprecated but still functional:

1. **Text-based card syntax**: `[TRIP_CARD: ...]`
   - Still works in old endpoints
   - Use structured outputs instead
   - See `STRUCTURED_OUTPUTS_MIGRATION_COMPLETE.md`

2. **Manual card parsing**: `parseCardsFromText()`
   - Removed from exp system
   - Still exists in archived code
   - Use structured JSON instead

3. **Card syntax validation**: `validateAIResponse()`
   - Replaced by Zod schemas
   - Use `validateExpResponse()` instead

### Why Deprecate?

- **Reliability**: Structured outputs are guaranteed by OpenAI
- **Type Safety**: Zod provides compile-time checking
- **Maintainability**: One schema definition for all uses
- **Performance**: No regex parsing overhead

## Architecture Diagrams

### Old Flow (Deprecated)

```
User Message → OpenAI (loose JSON) → Text with "[CARD: ...]" → 
Regex Parsing → Card Objects → Validation → UI Rendering
```

### New Flow (Exp System)

```
User Message → OpenAI (structured output with Zod) → 
Structured JSON → Direct Use → UI Rendering
```

### Admin Integration

```
Admin Dashboard
├── Cards → Card Explorer → Schema Reference
├── Suggestions → Form Testing → Validation
├── AI Content → Structured Output → Preview
└── Prompts → Test with AI → Full Generation
```

## Common Questions

### Q: Do I need to update existing code?

**A**: No, existing code continues to work. The exp system is additive, not replacing.

### Q: Should I use the old card syntax?

**A**: No, use structured outputs for new development. Old syntax is deprecated.

### Q: How do I test my AI prompts now?

**A**: Use `/admin/prompts/test` with the "Test with AI" button for full end-to-end testing.

### Q: What if I need to validate custom card JSON?

**A**: Use `/admin/cards` schema editor or `/api/admin/cards/validate` endpoint.

### Q: Can I still use the old AI Content page tabs?

**A**: Yes, all existing tabs (Trip Suggestions, Place Descriptions, Travel Dossier) still work.

### Q: How do I know which plugins trigger which cards?

**A**: Check `/admin/cards` → "Prompt Mapping" tab for complete reference.

## Best Practices

### For Testing

1. **Start with Card Explorer**: Understand structures first
2. **Use Suggestion Testing**: Validate payloads before AI
3. **Test with Real Entities**: Use database entity loading in prompt test
4. **Check Validation**: Always verify schema compliance

### For Development

1. **Use TypeScript Types**: Import from exp-response-schema
2. **Validate Early**: Check schemas before sending to AI
3. **Handle Empty Arrays**: AI returns `[]` not undefined
4. **Check Required Fields**: All fields must be present (use empty strings for missing data)

### For Content

1. **Reference Examples**: Use card explorer for correct formats
2. **Test Incrementally**: Validate small changes frequently
3. **Use Presets**: Load existing entities for realistic testing
4. **Document Findings**: Note which prompts work best for each card type

## Support & Resources

### Documentation

- **This Guide**: `/docs/ADMIN_EXP_MIGRATION.md`
- **Structured Outputs**: `/STRUCTURED_OUTPUTS_MIGRATION_COMPLETE.md`
- **Admin Dev Guide**: `/app/admin/DEVELOPER_README.md`
- **Prompt System**: `/app/exp/lib/prompts/README.md`

### Interactive Tools

- **Card Explorer**: `/admin/cards`
- **Suggestion Testing**: `/admin/suggestions`
- **Prompt Testing**: `/admin/prompts/test`
- **AI Content**: `/admin/apis/ai-content`

### API Endpoints

- **Card Validation**: `POST /api/admin/cards/validate`
- **Suggestion Validation**: `POST /api/admin/suggestions/validate`
- **Exp Response**: `POST /api/admin/test/exp-response`
- **Prompt Building**: `POST /api/admin/prompts/test`

### Code References

- **Schema Definitions**: `/lib/schemas/exp-response-schema.ts`
- **Prompt Registry**: `/app/exp/lib/prompts/registry.ts`
- **Prompt Builder**: `/app/exp/lib/prompts/build-exp-prompt.ts`
- **Main Endpoint**: `/app/api/chat/simple/route.ts`

## Troubleshooting

### Schema Validation Fails

**Problem**: Card or suggestion doesn't pass validation

**Solution**:
1. Check all required fields are present
2. Verify field types match schema
3. Use empty strings/0 for missing data (not null/undefined)
4. Check enum values match exactly

### Card Preview Doesn't Show

**Problem**: Valid JSON but no visual preview

**Solution**:
1. Verify `type` field matches exactly (e.g., "trip_card")
2. Check all required fields have values
3. Reload page if previews stop working
4. Check browser console for errors

### AI Doesn't Return Expected Cards

**Problem**: Testing with AI doesn't generate expected card types

**Solution**:
1. Check which plugins are active (prompt testing results)
2. Verify trigger conditions are met (see mapping table)
3. Try more explicit user messages
4. Check if context is configured correctly

### Suggestions Not Validating

**Problem**: Suggestion form validation fails

**Solution**:
1. Check all required fields are filled
2. Verify date formats (YYYY-MM-DD)
3. Ensure enum values are correct (ECONOMY, not economy)
4. Check numbers are not strings

## Changelog

### January 27, 2026 - Initial Release

**Added**:
- Card Type Explorer page
- Suggestion Testing page
- Structured Output tab in AI Content
- Card generation preview in Prompt Testing
- Card-to-prompt mapping table
- Three new API endpoints
- Migration guide documentation

**Updated**:
- Admin dashboard stats and links
- AI Content page structure
- Prompt Testing with AI button
- Developer documentation

**Deprecated** (not removed):
- Text-based card syntax
- Manual card parsing functions
- Old validation methods

---

**Questions or Issues?**  
Refer to admin developer documentation or check the interactive tools in `/admin`.
