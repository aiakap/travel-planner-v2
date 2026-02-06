# Cursor Layout Management Guide

## Overview

Cursor automatically saves your workspace layout per project. This means each project can have its own unique arrangement of panels, sidebars, and open files.

## What's Been Configured

### 1. Global Settings Updated

The following settings have been added to your Cursor global settings (`~/Library/Application Support/Cursor/User/settings.json`):

```json
{
  "window.restoreWindows": "all",           // Restore all windows on startup
  "workbench.editor.restoreViewState": true, // Remember which files were open
  "workbench.editor.limit.enabled": false,   // No limit on open editors
  "window.restoreZoomLevel": true            // Preserve zoom level per workspace
}
```

### 2. Workspace File Created

A workspace file has been created: `travel-planner-v2.code-workspace`

This file provides:
- Explicit layout preferences for this project
- Project-specific settings
- Can be version controlled and shared with team members

## How to Use

### Automatic Layout Saving (Default)

**No action needed!** Cursor automatically saves your layout when you:

1. Arrange your panels, sidebars, and files how you want them
2. Close Cursor
3. Reopen the project

Your exact layout will be restored, including:
- Open files and their positions
- Sidebar visibility (left/right)
- Panel positions and sizes
- Split editor arrangements
- Terminal positions

### Using the Workspace File (Optional)

To use the explicit workspace file:

1. **Open via File Menu**: 
   - `File → Open Workspace from File`
   - Select `travel-planner-v2.code-workspace`

2. **Or via Command Line**:
   ```bash
   cursor travel-planner-v2.code-workspace
   ```

**Benefits**:
- More explicit control over workspace settings
- Can be shared with team members
- Can be version controlled
- Portable across machines

## Testing Your Layout

To verify layout saving is working:

1. **Arrange your layout** exactly how you want it:
   - Position the file explorer (left or right)
   - Open specific files
   - Arrange split editors
   - Position the terminal/panel

2. **Close Cursor completely**

3. **Reopen the project**:
   - `File → Open Recent → travel-planner-v2`
   - Or use the workspace file

4. **Verify** everything is restored as you left it

## Multiple Projects, Multiple Layouts

Each project you open in Cursor gets its own saved layout:

1. **Project A**: Can have file explorer on the left, terminal at bottom
2. **Project B**: Can have file explorer on the right, no terminal visible
3. **Project C**: Can have split editors and multiple panels

When you switch between projects, Cursor automatically switches layouts.

## Current Layout Storage

Your travel-planner-v2 layout is stored in:
```
~/.cursor/projects/Users-alexkaplinsky-Desktop-Dev-site-travel-planner-v2/
```

This is managed automatically by Cursor.

## Limitations

**What Cursor CANNOT do natively**:
- Save multiple named layouts within the same project (e.g., "coding mode" vs "planning mode")
- Quick-switch between layouts with keyboard shortcuts
- Export/import layouts between projects

**Workarounds**:
1. Create multiple `.code-workspace` files with different names:
   - `travel-planner-coding.code-workspace`
   - `travel-planner-planning.code-workspace`
   - `travel-planner-debugging.code-workspace`

2. Use VSCode extensions (may work in Cursor):
   - "Workspace Layout" by folke
   - "Layout Saver" by vijaychandar186

## Tips

1. **Consistent Layouts**: If you want the same layout across all projects, just arrange it once and it becomes the default for new projects

2. **Sidebar Position**: Toggle with `Cmd+B` (Mac) or `Ctrl+B` (Windows/Linux)

3. **Panel Position**: Toggle with `Cmd+J` (Mac) or `Ctrl+J` (Windows/Linux)

4. **Activity Bar**: Toggle with `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux)

5. **Reset Layout**: If something goes wrong, use `View → Appearance → Reset View Locations`

## Troubleshooting

### Layout Not Saving

1. Check that the settings in `settings.json` are present
2. Make sure you're opening the same folder/workspace each time
3. Try using the workspace file explicitly

### Layout Different on Restart

1. Verify `window.restoreWindows` is set to `"all"`
2. Check that you're not opening a different folder with a similar name
3. Clear workspace storage: `~/.cursor/projects/` (backup first!)

### Want Different Layout for Same Project

Create multiple workspace files:
```bash
cp travel-planner-v2.code-workspace travel-planner-coding.code-workspace
cp travel-planner-v2.code-workspace travel-planner-planning.code-workspace
```

Then customize each and open the appropriate one for your current task.

## Next Steps

1. Arrange your current workspace layout exactly how you want it
2. Close and reopen Cursor to verify it's saved
3. Open other projects and set up their layouts
4. Enjoy automatic layout switching between projects!

---

**Questions or Issues?**
- Check Cursor documentation: https://docs.cursor.com
- VSCode layout docs (Cursor is based on VSCode): https://code.visualstudio.com/docs/getstarted/userinterface
