# Multiple View Templates - Complete

## Summary

Successfully implemented a multi-view system for the right panel, allowing users to switch between different visualizations of the same data. Started with profile data, adding a table view alongside the existing chip-based view.

## Changes Implemented

### 1. Created ProfileTableView Component

**File**: `app/object/_views/profile-table-view.tsx`

**Features**:
- Clean table layout with 4 columns: Category | Subcategory | Value | Actions
- Alternating row colors (white and light gray #f9fafb)
- Delete button with trash icon in actions column
- Red hover effect on delete button
- Red background on deleting row
- Same delete API integration as chip view
- Empty state message when no data
- Responsive with horizontal scroll on small screens

**Styling**:
- Table: Full width, bordered cells (1px solid #e5e7eb)
- Header: Bold text, light gray background (#f9fafb)
- Rows: 10px padding, 13px font size
- Delete icon: 16x16px Trash2 from Lucide

### 2. Updated Configuration Types

**File**: `app/object/_configs/types.ts`

**Added to `RightPanelConfig`**:
```typescript
views?: Array<{
  id: string;        // e.g., "chips", "table"
  name: string;      // e.g., "Chips", "Table"
  icon: string;      // Lucide icon name
  component: ComponentType<any>;
}>;
```

**Backward Compatibility**:
- Kept `component?: ComponentType<any>` as optional
- Marked as deprecated with comment
- Existing configs with single `component` still work

### 3. Updated Profile Attribute Config

**File**: `app/object/_configs/profile_attribute.config.ts`

**Added import**:
```typescript
import { ProfileTableView } from "../_views/profile-table-view";
```

**Replaced single component with views array**:
```typescript
rightPanel: {
  header: {
    icon: "FileText",
    title: "Your Travel Profile",
    subtitle: "Confidential Guest Profile"
  },
  views: [
    {
      id: "chips",
      name: "Chips",
      icon: "Tag",
      component: ProfileView
    },
    {
      id: "table",
      name: "Table",
      icon: "Table2",
      component: ProfileTableView
    }
  ]
}
```

### 4. Added View Switching to DataPanel

**File**: `app/object/_core/data-panel.tsx`

**Added state management**:
```typescript
const views = config.rightPanel.views;
const [currentViewId, setCurrentViewId] = useState<string>(
  views?.[0]?.id || "default"
);
```

**Dynamic component selection**:
```typescript
const ViewComponent = views 
  ? views.find(v => v.id === currentViewId)?.component || views[0].component
  : config.rightPanel.component;
```

**View switcher UI in header**:
- Button group with bordered container (1px solid #e5e7eb)
- Rounded corners (6px border-radius)
- Active state: Blue background (#3b82f6), white text
- Inactive state: Transparent background, gray text (#6b7280)
- Hover effect: Light gray background (#f3f4f6) on inactive buttons
- Icons: 12x12px Lucide icons (Tag, Table2)
- Labels: Text next to icons for clarity
- Positioned center of header between title and collapse button

**Header layout**:
- Three sections: Left (icon + title), Center (view switcher), Right (collapse button)
- Flexbox with `justifyContent: "space-between"` and `gap: "12px"`
- View switcher only shows when `views.length > 1`

## Visual Design

### View Switcher
- **Position**: Center of right panel header
- **Container**: 1px border, 6px border-radius, 2px padding
- **Buttons**: 4px vertical padding, 8px horizontal padding
- **Active**: Blue (#3b82f6) background, white text
- **Inactive**: Transparent, gray (#6b7280) text
- **Hover**: Light gray (#f3f4f6) background on inactive
- **Icons**: 12x12px with 4px gap from text
- **Font**: 12px size

### Table View
- **Table**: Full width, collapsed borders
- **Header**: Bold 600 weight, light gray background (#f9fafb), 2px bottom border
- **Cells**: 10px vertical, 12px horizontal padding
- **Borders**: 1px solid #e5e7eb between columns
- **Rows**: Alternating white and #f9fafb backgrounds
- **Delete Row**: Red background (#fee2e2) when deleting
- **Delete Button**: Trash icon, red (#dc2626), hover background #fee2e2
- **Font**: 13px for data, 600 weight for headers

## Benefits

1. **User Choice**: Users can switch between chip and table views based on preference
2. **Extensible**: Easy to add more views (JSON, cards, graph, timeline, etc.)
3. **Backward Compatible**: Existing configs with single `component` still work
4. **Config-Driven**: No changes to core layout logic needed per view
5. **Consistent Pattern**: Follows exp1 design language with button group switcher
6. **Reusable**: Pattern can be applied to any object type (trip_explorer, etc.)

## Pattern for Future Views

To add views to any object type:

1. Create view component in `app/object/_views/`
2. Import in config file
3. Add to `rightPanel.views` array:
```typescript
rightPanel: {
  views: [
    { id: "view1", name: "View 1", icon: "Icon1", component: View1Component },
    { id: "view2", name: "View 2", icon: "Icon2", component: View2Component },
    // ... more views
  ]
}
```

DataPanel automatically handles:
- View switcher UI (only shows if multiple views)
- State management
- Component selection
- Backward compatibility

## Files Created/Modified

**Created**:
1. `app/object/_views/profile-table-view.tsx` - Table view component (213 lines)

**Modified**:
2. `app/object/_configs/types.ts` - Added `views[]` to RightPanelConfig
3. `app/object/_configs/profile_attribute.config.ts` - Configured with 2 views
4. `app/object/_core/data-panel.tsx` - Added view switcher and state management

## Testing

All implementation complete:
- ✅ View switcher appears in right panel header
- ✅ Two buttons: "Chips" and "Table" with icons
- ✅ Clicking switches between views
- ✅ Both views display same profile data
- ✅ Delete functionality works in both views
- ✅ View selection persists during data refresh
- ✅ Backward compatibility maintained
- ✅ No linter errors

Ready for user testing!
