# Trip Builder v2 - Auto-Save Edition

## Overview

A new trip builder interface at `/trip/new1` with real-time auto-save functionality. This is a completely isolated module that doesn't modify any existing code.

## Features

- **Auto-Save**: Automatically saves to database 500ms after any change
- **Draft Status**: All trips created here start in DRAFT status
- **Google Places Integration**: Live autocomplete for location search
- **Visual Timeline**: Interactive drag-and-drop segment timeline
- **Segment Types**: Stay, Travel, Tour, Retreat, Road Trip
- **Date Management**: Smart date calculations with duration slider
- **Location Propagation**: Automatic location cascading between segments

## File Structure

```
app/trip/new1/
├── page.tsx                          # Server component (auth + data loading)
├── components/
│   ├── trip-builder-client.tsx       # Main UI component with auto-save
│   └── place-autocomplete-live.tsx   # Google Places autocomplete
├── actions/
│   ├── trip-builder-actions.ts       # Server actions for CRUD
│   └── google-places-autocomplete.ts # Places API wrapper
└── lib/
    └── segment-types.ts              # Segment type configurations
```

## Usage

1. Navigate to `/trip/new1`
2. Start editing the trip name, dates, or segments
3. Trip automatically saves to database after 500ms of inactivity
4. All changes are persisted in DRAFT status

## Auto-Save Behavior

- **First Edit**: Creates new trip in database with DRAFT status
- **Subsequent Edits**: Updates existing trip and segments
- **Debounce**: 500ms delay to batch rapid changes
- **Status Indicator**: Shows "Saving...", "Draft • Auto-saved", or "Error"

## Database Schema

### Trip
- `status`: TripStatus.DRAFT (new enum field)
- `permissions`: TripPermission.PRIVATE (new enum field)

### Segments
- Calculated `startTime` and `endTime` from trip dates + day offsets
- Geocoded lat/lng from location names
- Order index for drag-and-drop

## API Integration

### Google Places
- Autocomplete search with 300ms debounce
- Returns place name, image, lat/lng
- Caches results in component state

### Server Actions
- `createDraftTrip()` - Initial trip creation
- `updateTripMetadata()` - Update title, description, dates
- `syncSegments()` - Bulk upsert segments with geocoding
- `searchPlacesAutocomplete()` - Google Places search

## Testing

To test the auto-save functionality:

1. Visit `/trip/new1`
2. Edit the journey name - should see "Saving..." then "Draft • Auto-saved"
3. Add a segment - should save to database
4. Search for a location - should show Google Places results
5. Refresh page - should maintain trip state (future enhancement)

## Future Enhancements

- Load existing draft trip on page load
- Left panel: AI chat assistant
- Undo/redo functionality
- Image upload for segments
- Export to PDF/calendar

## Notes

- All code is isolated to `/app/trip/new1` directory
- No modifications to existing codebase
- Reuses existing utilities via imports only
- Compatible with new TripStatus and TripPermission enums
