/**
 * Smart Defaults Prompt - Conditional
 * 
 * Rules for inferring dates, locations, and costs when user provides vague info.
 * Included when user message contains vague temporal or location terms.
 */

export const SMART_DEFAULTS_PROMPT = `## Smart Defaults

When users provide vague or incomplete information, use these smart defaults:

**Dates:**
- "next month" → actual date ~30 days from now
- "summer" → June-August dates
- "winter" → December-February dates
- "spring" → March-May dates
- "fall" → September-November dates
- "soon" → 2 weeks from now
- "weekend" → next available weekend
- No dates mentioned → default to 7 days, starting 2 weeks from now

**Locations:**
- If user doesn't specify origin, assume major hub (NYC, LA, Chicago, etc.)
- Use destination city as segment location
- For multi-city trips, split time evenly unless specified

**Costs:**
- Hotels: $100-300/night based on destination
  - Budget destinations: $100-150/night
  - Mid-range destinations: $150-250/night
  - Premium destinations: $250-400/night
- Restaurants: $30-80 per meal
  - Casual dining: $30-50
  - Nice restaurant: $50-80
  - Fine dining: $80-150
- Activities: $20-100 per person
  - Museums/attractions: $20-40
  - Tours: $50-100
  - Special experiences: $100-300

**Trip Duration:**
- Weekend trip: 2-3 days
- Week trip: 7 days
- Extended trip: 10-14 days
- Default if not specified: 7 days

Remember: These are reasonable starting points. Users can easily refine via chat or by editing the cards directly.`;
