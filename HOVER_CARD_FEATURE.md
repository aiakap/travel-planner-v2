# Place Hover Card Feature

## Overview

A rich hover card that displays complete Google Places data when hovering over place links in the chat interface.

## Features

### Visual Display
- **Hero Image**: Place photo (or Street View fallback)
- **Gradient Overlay**: Beautiful dark gradient for text readability
- **Responsive Width**: 384px (w-96) with proper alignment

### Information Shown

**Rating & Reviews:**
- ⭐ Star rating (e.g., 4.6)
- 👥 Total review count (e.g., 1,234 reviews)
- Displayed in amber badge

**Price Level:**
- 💰 Visual price indicator ($ to $$$$)
- Displayed in green badge

**Location:**
- 📍 Full formatted address
- 🔗 "View on Google Maps" link (opens in new tab)
- Line-clamps to 2 lines for long addresses

**Operating Hours:**
- 🕐 "Open Now" / "Closed" badge
- Green badge when open, gray when closed

**Contact Information:**
- 📞 Phone number (clickable tel: link)
- 🌐 Website (opens in new tab)
- Both truncate if too long

**Additional Details:**
- 📷 Photo count indicator
- 🗺️ Technical details (expandable):
  - Place ID
  - GPS coordinates (Lat/Lng)

## Usage

### In MessageSegmentsRenderer

Automatically applied to all place segments:

```tsx
import { MessageSegmentsRenderer } from "@/components/message-segments-renderer";

<MessageSegmentsRenderer
  segments={messageSegments}
  onPlaceClick={(suggestion, placeData) => {
    // Handle click to add to itinerary
  }}
/>
```

### Standalone Component

Can be used independently:

```tsx
import { PlaceHoverCard } from "@/components/place-hover-card";

<PlaceHoverCard placeData={googlePlaceData} placeName="Hotel Name">
  <button>Hover me!</button>
</PlaceHoverCard>
```

## Behavior

### Hover Delay
- **200ms delay** before opening (prevents accidental triggers)
- Immediate close on mouse leave

### Positioning
- **Side**: Top (opens above the trigger)
- **Align**: Start (aligns to left edge)
- Auto-adjusts if doesn't fit on screen

### Interaction
- Links inside card are clickable (phone, website, maps)
- Click propagation stopped for links
- Can expand "Technical Details" section

### Fallback
- If place not found: Shows minimal card with "not available" message
- If no photo: Shows title at top instead of overlay
- If no data field: That section is hidden

## Styling

### Card Design
- **White background** with subtle shadow
- **Rounded corners** (top for image, standard for content)
- **Padding**: 0 on container, 16px (p-4) on content
- **Max width**: 384px (w-96)

### Image Overlay
- 128px height (h-32)
- Dark gradient: `from-black/60 to-transparent`
- Text positioned at bottom with 8px padding

### Badges
- **Rating**: Amber theme (bg-amber-50, text-amber-700)
- **Price**: Green theme (bg-green-50, text-green-700)
- **Open/Closed**: Green (open) or Gray (closed)

### Links
- Blue text (`text-blue-600`)
- Underline on hover
- External link icon (ExternalLink) after text

## Example Screenshots

### Full Data Card:
```
┌─────────────────────────────────────┐
│   [Photo with gradient overlay]     │
│   Hotel Plaza Athénée ←text here   │
├─────────────────────────────────────┤
│ ⭐ 4.6 (1,234)   💰 $$$$           │
│                                     │
│ 📍 25 Avenue Montaigne, Paris...   │
│ 🕐 Open Now                         │
│ ─────────────────────────           │
│ 📞 +33 1 53 67 66 65                │
│ 🌐 Visit Website ↗                  │
│ 🗺️ View on Google Maps ↗           │
│                                     │
│ 📷 5 photos available               │
│ ▸ Technical Details                 │
└─────────────────────────────────────┘
```

### Minimal Card (Place Not Found):
```
┌─────────────────────────────────────┐
│ Hotel Name                          │
│ Place data not available from       │
│ Google Places                       │
└─────────────────────────────────────┘
```

## Technical Implementation

### Component: `components/place-hover-card.tsx`

**Props:**
- `placeData`: GooglePlaceData | undefined
- `placeName`: string (fallback name)
- `children`: React.ReactNode (trigger element)

**Dependencies:**
- Radix UI HoverCard
- Lucide icons
- Custom Badge and Separator components

**State:**
- `photoUrl`: Fetched async from Google Places Photo API

### Photo Loading
```typescript
useEffect(() => {
  if (placeData?.photos?.[0]) {
    getPhotoUrl(placeData.photos[0].reference, 400).then(setPhotoUrl);
  }
}, [placeData]);
```

Photos loaded client-side to avoid blocking initial render.

## Performance

### Optimizations
- Hover delay (200ms) prevents unnecessary renders
- Photos loaded on-demand (lazy)
- Line clamps prevent layout shift
- External links prefetch disabled (noopener)

### Bundle Size
- Uses existing Radix UI HoverCard (~3KB)
- No additional dependencies
- Icons from Lucide (already in project)

## Accessibility

- ✅ Keyboard navigation (tab to trigger, enter to open)
- ✅ Screen reader friendly (semantic HTML)
- ✅ Focus management (returns to trigger on close)
- ✅ ARIA labels on links
- ✅ Color contrast meets WCAG AA

## Testing

### Test on `/test/place-pipeline`
1. Run pipeline with "suggest 2 hotels in Paris"
2. Hover over place links in Stage 3 preview
3. Verify all data displays correctly
4. Test clickable links (phone, website, maps)

### Edge Cases to Test
- ❌ Place not found (should show minimal card)
- 🖼️ No photos (should show title instead)
- 📞 Missing contact info (sections hidden)
- ⭐ No rating (badge not shown)
- 🕐 No hours data (section hidden)

## Future Enhancements

Possible additions:
- 📸 Photo carousel (multiple photos)
- ⏰ Full weekly hours schedule
- 💬 Recent reviews
- 🗺️ Embedded mini-map
- 🚗 Distance from user location
- ⭐ "Add to favorites" button

---

**Status**: ✅ Implemented  
**Files Created**: 1 new component  
**Files Modified**: 2 (renderer + test page)  
**Linter Errors**: 0
