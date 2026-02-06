# How to Arrange Your Cursor Layout

## Target Layout (From Your Screenshot)

```
┌─────────────┬──────────────────────┬─────────────────┐
│   Agent     │                      │  File Explorer  │
│   Panel     │   Editor Area        │                 │
│  (Left)     │   (Center)           │    (Right)      │
│             │                      │                 │
│ - Agents    │  - Open files/tabs   │  - Project tree │
│ - Plans     │  - Main content      │  - Folders      │
│ - To-dos    │                      │  - Files        │
└─────────────┴──────────────────────┴─────────────────┘
```

## Step-by-Step Instructions

### 1. Open the Agent Panel (Left Side)

**Option A - Via Command Palette:**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Agent" or "Show Agent"
3. Select the command to open the Agent panel

**Option B - Via Menu:**
1. Look for "View" in the top menu
2. Find "Agent" or "Agents" submenu
3. Click to open

**Option C - Via Keyboard Shortcut:**
- Look for the Agent icon in the Activity Bar (left edge)
- Click it to open the Agent panel

### 2. Move File Explorer to the Right Side

**Current state**: File explorer is probably on the left by default

**To move it to the right:**

1. **Right-click on the Activity Bar** (the thin vertical bar with icons on the far left)
2. Look for an option like "Move Side Bar Right" or "Side Bar Position"
3. Click it to move the sidebar to the right

**OR use Command Palette:**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "View: Toggle Side Bar Position"
3. Press Enter

**OR use Menu:**
1. Go to `View` → `Appearance` → `Move Side Bar Right`

### 3. Ensure Both Panels Are Visible

**Agent Panel (Left):**
- Should be open and docked on the left side
- Shows: Agents, Plans, To-dos

**File Explorer (Right):**
- Should be open and docked on the right side
- Shows: Project file tree

**Editor (Center):**
- Automatically fills the middle space
- Shows your open files and tabs

### 4. Adjust Panel Widths

**To resize panels:**
1. Hover your mouse over the border between panels
2. Your cursor will change to a resize cursor (↔)
3. Click and drag to adjust the width
4. Release when you're happy with the size

**Recommended widths:**
- Agent Panel: ~200-300px (enough to see agent names and status)
- File Explorer: ~200-250px (enough to see file names)
- Editor: Remaining space (maximum area for code)

### 5. Hide Bottom Panel (Optional)

If you want to maximize vertical space like in your screenshot:

1. Press `Cmd+J` (Mac) or `Ctrl+J` (Windows/Linux) to toggle the bottom panel
2. Or go to `View` → `Appearance` → `Toggle Panel`

### 6. Verify Your Layout

Your layout should now look like:
- **Left**: Agent panel with your agents, plans, and to-dos
- **Center**: Editor area with your open files
- **Right**: File explorer showing your project structure

## Keyboard Shortcuts Reference

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Toggle File Explorer | `Cmd+B` | `Ctrl+B` |
| Toggle Bottom Panel | `Cmd+J` | `Ctrl+J` |
| Command Palette | `Cmd+Shift+P` | `Ctrl+Shift+P` |
| Toggle Sidebar Position | Via Command Palette | Via Command Palette |

## Troubleshooting

### Can't Find Agent Panel

The Agent panel is a Cursor-specific feature. If you can't find it:
1. Look for an icon that looks like a robot or chat bubble in the Activity Bar
2. Try `Cmd+Shift+P` and search for "Agent"
3. Check `View` menu for Agent-related options

### File Explorer Won't Move to Right

1. Make sure you're right-clicking on the Activity Bar (the thin vertical bar with icons)
2. Try the Command Palette method: `Cmd+Shift+P` → "Toggle Side Bar Position"
3. Check `View` → `Appearance` → `Move Side Bar Right`

### Panels Are Too Wide/Narrow

1. Hover over the border between panels until you see the resize cursor (↔)
2. Click and drag to adjust
3. The editor will automatically fill the remaining space

### Layout Doesn't Save

Make sure the settings we added earlier are in place:
- Check that `window.restoreWindows` is set to `"all"` in settings
- Close and reopen Cursor to test if the layout persists

## Quick Reset

If something goes wrong and you want to start over:

1. Go to `View` → `Appearance` → `Reset View Locations`
2. This will reset all panels to their default positions
3. Then follow the steps above to arrange them again

## After You Arrange It

Once you have the layout arranged:
1. **It will automatically save** (thanks to the settings we configured)
2. **Close Cursor** and reopen to verify it's saved
3. **Every time you open this project**, the layout will be restored

## Alternative: Use Workspace File

If you want to ensure the layout is always correct:

1. Open the workspace file: `File` → `Open Workspace from File`
2. Select `travel-planner-v2.code-workspace`
3. This will enforce the layout settings defined in the workspace file

---

**Need help?** If you're still having trouble, let me know which specific step you're stuck on!
