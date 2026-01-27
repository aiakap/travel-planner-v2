# View Trip Page - Usage Guide

## Quick Start

1. Navigate to `/view` in your browser
2. Select a trip from the dropdown
3. Explore the 4 tabs to view your trip in different ways
4. Click any segment or reservation to chat about it in `/exp`

## Tab Overview

### 📊 Overview Tab

**What it shows:**
- Beautiful hero image with trip title and description
- Stats cards showing:
  - Number of flights, hotels, restaurants, activities
  - Total trip cost
- Grid of segment cards with images, dates, and costs

**Interactions:**
- Click "Chat About This Trip" to open trip in chat
- Click "Open in Experience Builder" to edit trip
- Click any segment card to chat about that segment

**Best for:**
- Getting a quick overview of your entire trip
- Seeing all segments at a glance
- Jumping directly to chat about specific segments

---

### 📅 Timeline Tab

**What it shows:**
Three different view modes (you can switch between them):

1. **Vertical Timeline** (best for short trips ≤5 days)
   - Day-by-day breakdown
   - Full details for each reservation
   - Chronological vertical layout
   - Segment images and color-coded sections

2. **Gantt Chart** (best for medium trips 6-14 days)
   - Horizontal timeline bars showing segment durations
   - Reservation markers positioned on timeline
   - Visual representation of trip flow
   - Compact overview of entire trip

3. **Compact List** (best for long trips 15+ days)
   - Condensed segment rows
   - Expand/collapse for details
   - Quick scanning of dates and costs
   - Most efficient for long trips

**Interactions:**
- Toggle between view modes using buttons at top
- Click segments to expand/collapse details
- Click reservations to chat about them
- Click chat icon to discuss segment
- Your view mode preference is saved

**Best for:**
- Understanding the day-by-day flow
- Seeing when things happen
- Getting detailed information about each day

---

### 📆 Calendar Tab

**What it shows:**
- Traditional month calendar view
- Days color-coded by segment
- Badge showing number of reservations per day
- Side panel with detailed day information

**Interactions:**
- Use ◀ ▶ buttons to navigate between months
- Click any trip date to see details in side panel
- Side panel shows all reservations for that day
- Click reservations in side panel to chat
- Click X to close day details
- Legend at bottom shows segment colors

**Best for:**
- Understanding which days of the month you're traveling
- Quick date lookups
- Seeing which dates have the most activities
- Planning around specific calendar dates

---

### 🗺️ Map Tab

**What it shows:**
- Interactive Google Map with your entire trip
- Segment routes as colored lines (dashed for flights)
- Start/end points for each segment (colored circles)
- Reservation markers (color-coded by type)
- Control panel on the right side

**Map Interactions:**
- Click segment routes to select that segment
- Click markers to see reservation details
- Info windows pop up with full details
- "Chat About This" button in info windows
- Zoom/pan like any Google Map

**Control Panel Interactions:**
- Click segment cards to focus map on that segment
- Toggle filters to show/hide reservation types:
  - ✈️ Flights (red markers)
  - 🏨 Hotels (blue markers)
  - 🍽️ Restaurants (orange markers)
  - 🚗 Transport (purple markers)
  - 🎯 Activities (green markers)
- Click reservations in selected segment to focus on them
- Click "Clear" to reset all filters
- Legend shows segment colors

**Best for:**
- Understanding the geographic flow of your trip
- Seeing distances between locations
- Locating specific reservations
- Understanding the route you'll take

---

## Chat Integration

**Every interactive element connects to chat:**

From any tab, clicking a segment or reservation will:
1. Navigate to `/exp` (the chat interface)
2. Load the conversation for that item (or create new one)
3. Set context so AI knows what you're asking about
4. Allow you to ask questions, make changes, or get suggestions

**Example workflows:**
- Click a hotel reservation → Chat opens → Ask "Can you find a cheaper option?"
- Click a segment → Chat opens → Ask "What activities should I add here?"
- Click a flight → Chat opens → Ask "Are there better flight times?"

---

## Color System

**Segments are color-coded consistently across all tabs:**
- Gray = Travel segments (getting from A to B)
- Blue, Red, Green, Purple, Orange = Stay/destination segments

**Reservation types have consistent icons and colors:**
- ✈️ Flights = Red
- 🏨 Hotels = Blue
- 🍽️ Restaurants = Orange
- 🚗 Transport = Purple
- 🎯 Activities = Green

---

## Tips & Tricks

### View Mode Auto-Selection
The Timeline tab automatically picks the best view based on trip length:
- Short trip (≤5 days) → Vertical timeline
- Medium trip (6-14 days) → Gantt chart
- Long trip (15+ days) → Compact list

You can override this and your preference is saved.

### Shareable Links
The active tab is saved in the URL, so you can:
- Bookmark specific tabs
- Share links to specific views
- Return to the same view later

Examples:
- `/view?tab=overview`
- `/view?tab=timeline`
- `/view?tab=calendar`
- `/view?tab=map`

### Empty States
If you see "No segments yet" or "No reservations yet":
- Your trip exists but needs content
- Click "Open in Experience Builder" to add segments
- Or navigate to the trip edit page to add manually

### Mobile Experience
The page is fully responsive:
- Tab labels become icons on small screens
- Layouts stack vertically
- Touch-friendly button sizes
- Calendar grid adapts to screen width
- Map controls move to bottom on mobile

### Keyboard Navigation
- Tab key to move between interactive elements
- Enter/Space to activate buttons
- Arrow keys in calendar to navigate dates
- Escape to close modals/panels

---

## Common Questions

**Q: Why don't I see my trip?**
A: Only non-draft trips appear. Check trip status and set it to "Planning", "Live", or "Archived".

**Q: Why is the map not loading?**
A: Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in your `.env` file.

**Q: Can I edit trips from this page?**
A: Click "Open in Experience Builder" or click any segment/reservation to open chat where you can make changes.

**Q: How do I export or share my trip?**
A: Currently, you can share the URL. Export features may be added in the future.

**Q: Why do some segments not have images?**
A: Images are optional. If missing, the segment will show without an image.

**Q: Can I see multiple trips at once?**
A: Use the dropdown at the top to switch between trips. Only one trip is shown at a time.

**Q: What if my trip spans multiple months?**
A: In Calendar tab, use the month navigation arrows to view different months.

**Q: Can I filter timeline by segment?**
A: Click a segment in the Map tab and use the side panel to focus on specific segments.

---

## Troubleshooting

**Map not showing:**
1. Check browser console for errors
2. Verify Google Maps API key in `.env`
3. Ensure API key has Maps JavaScript API enabled
4. Check if browser blocks third-party scripts

**Missing data:**
1. Ensure trip has segments added
2. Ensure segments have start/end locations with coordinates
3. Check that reservations have required fields
4. Verify database has complete data

**Slow performance:**
1. Long trips (20+ days) may take time to render
2. Use Compact view mode for better performance
3. Filter reservations in Map tab to reduce markers
4. Consider splitting very long trips into multiple trips

**Styling issues:**
1. Clear browser cache
2. Check if dark mode is affecting colors
3. Verify Tailwind CSS is loaded
4. Check browser console for CSS errors

---

## Feature Highlights

✨ **Most Loved Features:**
1. Chat integration everywhere - never leave the conversation
2. Auto-selecting best timeline view - smart defaults
3. Interactive map with filtering - powerful exploration
4. Calendar with day details - intuitive date navigation
5. Consistent colors across tabs - easy to follow segments
6. Beautiful segment cards - visual and informative
7. Responsive design - works great on mobile
8. URL state management - shareable links to specific views

---

**Enjoy exploring your trips! 🌍✈️🗺️**
