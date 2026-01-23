# Profile Graph - Quick Start Guide

## What's New?

The profile graph builder now gives you full control over what gets added to your profile. Instead of automatically adding everything the AI extracts, you now see suggestions with +/- buttons to accept or reject each one.

## How It Works

### 1. Start with a Blank Canvas
- Navigate to `/profile/graph`
- Your graph starts completely empty
- No pre-defined categories cluttering the view

### 2. Chat Naturally
- Tell the AI about yourself: travel preferences, hobbies, family, etc.
- Example: "I fly United and stay at Hyatt hotels"

### 3. Review Suggestions
- The AI extracts information and shows it as suggestions
- Each suggestion has:
  - A colored badge showing the category
  - The item value
  - [+] button to accept
  - [-] button to reject

### 4. Accept or Reject
- Click [+] to add the suggestion to your profile
- Click [-] to dismiss the suggestion
- Your graph updates immediately when you accept

### 5. Watch Your Graph Grow
- Categories appear dynamically as you accept items
- The graph grows organically through conversation
- Only shows categories that have items

## Example Conversation

**You:** "I fly United and stay at Hyatt hotels"

**AI:** "Great choices! United and Hyatt are excellent partners. Do you have status with either of them?"

**Suggestions appear:**
```
┌────────────────────────────────────┐
│ 🔵 Travel Preferences              │
│ United Airlines               [+][-]│
│ airlines                           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 🔵 Travel Preferences              │
│ Hyatt Hotels                  [+][-]│
│ hotels                             │
└────────────────────────────────────┘
```

**You click [+] on United Airlines**

**Result:** 
- "Travel Preferences" category appears in your graph
- "United Airlines" node appears under the category
- Suggestion disappears from the list

**You click [-] on Hyatt Hotels**

**Result:**
- Suggestion immediately disappears
- Nothing added to your graph

## Tips

### Getting Started
- Start with broad topics: "Tell me about your travel preferences"
- Be specific: "I prefer United Airlines" vs "I like flying"
- Share multiple things: "I have 3 kids and I love photography"

### Managing Suggestions
- You can accept/reject suggestions in any order
- Suggestions stay until you accept or reject them
- You can continue chatting while suggestions are pending

### Building Your Graph
- Accept suggestions you agree with
- Reject suggestions that are inaccurate or too vague
- The AI learns from the conversation context
- Your graph reflects only what you've accepted

### Categories
The AI can organize information into these categories:
- 🔵 **Travel Preferences** - Airlines, hotels, travel class, loyalty programs
- 🌸 **Family & Relationships** - Spouse, children, parents, siblings, friends
- 🟢 **Hobbies & Interests** - Sports, arts, outdoor activities, culinary, entertainment
- 🟡 **Spending Priorities** - Budget allocation, what you prioritize
- 🟣 **Travel Style** - Solo vs group, luxury vs budget, adventure vs relaxation
- 🔷 **Destinations** - Places visited, wishlist, favorites
- ⚪ **Other** - Anything else

## Common Scenarios

### Scenario 1: Multiple Items at Once
**You:** "I fly United, stay at Hyatt, and prefer first class"

**Result:** Three suggestions appear
- United Airlines (airlines)
- Hyatt Hotels (hotels)
- First Class (travel-class)

**Action:** Accept all three or pick and choose

### Scenario 2: Family Information
**You:** "I have 3 kids and a wife"

**Result:** Four suggestions appear
- 3 children (children)
- Spouse (spouse)

**Action:** Accept to add family category to your graph

### Scenario 3: Hobbies
**You:** "I'm a photographer and I run marathons"

**Result:** Two suggestions appear
- Photography (arts)
- Marathon running (sports)

**Action:** Accept to add hobbies category to your graph

### Scenario 4: Correcting Mistakes
**You:** "I fly United"
**AI suggests:** "United Airlines"
**You:** "Actually, I meant I used to fly United, not anymore"

**Action:** Click [-] to reject the suggestion, then clarify in your next message

## Keyboard Shortcuts (Coming Soon)

- `Tab` - Navigate between suggestions
- `Enter` - Accept focused suggestion
- `Delete` - Reject focused suggestion
- `Escape` - Clear all pending suggestions

## Troubleshooting

### Suggestions Not Appearing
- Make sure you're sharing specific information
- Try being more explicit: "I prefer United Airlines" vs "I like planes"
- Check that you've sent the message (press Enter or click send)

### Graph Not Updating
- Make sure you clicked [+] to accept the suggestion
- Check your network connection
- Refresh the page if needed

### Wrong Category
- Reject the suggestion with [-]
- Rephrase your message to be more specific
- The AI will learn from context

### Can't See My Graph
- Make sure you've accepted at least one suggestion
- Try zooming out using the zoom controls
- Click "Reset View" to center the graph

## Data & Privacy

- Your profile graph is stored in your account
- Only you can see your profile graph
- You can export your data as XML
- You can clear your entire graph at any time
- Rejected suggestions are not stored

## Next Steps

1. **Start Chatting** - Share information about yourself
2. **Review Suggestions** - Accept what's accurate, reject what's not
3. **Build Your Graph** - Watch it grow organically
4. **Export Data** - Download your profile as XML
5. **Use in Planning** - Your profile helps personalize trip suggestions

## Need Help?

- Click the "?" icon for in-app help
- Check the full documentation in `PROFILE_GRAPH_IMPROVEMENTS_COMPLETE.md`
- See visual examples in `PROFILE_GRAPH_UI_GUIDE.md`

## Feedback

We'd love to hear your thoughts on the new suggestion-based workflow! Let us know:
- What works well
- What's confusing
- What features you'd like to see
- Any bugs or issues you encounter

---

**Ready to get started?** Navigate to `/profile/graph` and start building your profile!
