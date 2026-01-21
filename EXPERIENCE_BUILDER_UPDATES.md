# Experience Builder Updates

## Summary of Changes

### 1. **Default View & Layout**
- **Timeline view is now the default** (changed from table view)
- **Itinerary panel moved to the left side** (previously on right)
- **Chat panel moved to the right side** (previously on left)
- Layout now shows: `[Itinerary | Resizable Divider | Chat]`

### 2. **Consistent Item Listings**
Both Timeline and Table views now display items with:
- **No separate headers** for day, vendor, time, etc.
- **Unified card-style items** with:
  - Icon (colored based on segment)
  - Vendor name
  - Status badge
  - Multi-day badge (if applicable)
  - Description text
  - Cost display
  - Action buttons (visible on hover)

### 3. **Action Buttons**
Each itinerary item now has three action buttons (visible on hover):

#### a. **Contact Button** (Phone icon)
- Only appears if contact information is available
- Opens a dropdown menu with:
  - Phone number (click to call)
  - Email address (click to email)
  - Website link (opens in new tab)
- Styled like the trip name dropdown (smaller size)

#### b. **Edit Button** (Edit icon)
- Opens the reservation detail modal
- Allows editing item details

#### c. **Chat Button** (MessageCircle icon)
- Brings the item into the chat window
- Sends a message like: "Tell me more about [Vendor] ([Item Type])"

### 4. **Double-Click to Chat**
- Double-clicking any item triggers the same action as the chat button
- Provides quick access to discuss items in chat

## Technical Details

### Files Modified:
1. **`app/experience-builder/client.tsx`**
   - Changed default view mode to "timeline"
   - Swapped left/right panel contents (itinerary ↔ chat)
   - Added `handleChatAboutItem()` and `handleEditItem()` handlers
   - Passed handlers to view components

2. **`components/timeline-view.tsx`**
   - Removed day/time headers from items
   - Added action buttons (Contact, Edit, Chat)
   - Implemented contact dropdown menu
   - Added double-click handler
   - Added contact menu state management

3. **`components/table-view.tsx`**
   - Converted from table layout to list layout (matching timeline view)
   - Removed table headers
   - Added same action buttons as timeline view
   - Implemented contact dropdown menu
   - Added double-click handler

### New Props Added:
```typescript
interface ViewProps {
  // ... existing props
  onChatAboutItem?: (reservation: Reservation, itemTitle: string) => void
  onEditItem?: (reservation: Reservation) => void
}
```

### Contact Info Interface:
```typescript
interface Reservation {
  // ... existing fields
  contactPhone?: string
  contactEmail?: string
  website?: string
}
```

## User Experience Improvements

1. **Better Default**: Timeline view provides better visual context
2. **Consistent Interface**: Both views now look and behave the same
3. **Quick Actions**: Hover to reveal actions, no need to open modals first
4. **Easy Contact**: One-click access to phone, email, or website
5. **Chat Integration**: Double-click or click chat button to discuss items
6. **Intuitive Layout**: Itinerary on left, chat on right (natural reading order)

## Testing Recommendations

1. Test contact dropdown with various combinations of contact info
2. Verify double-click works on all items
3. Test that chat messages are properly formatted
4. Ensure edit button opens correct reservation details
5. Verify mobile view still works correctly
6. Test resizable panel with new layout
