# Language Multi-Country Support - COMPLETE

## Issue
The language assistant was only generating ONE language guide for the entire trip, even when visiting multiple countries with different languages. For example, a trip to Paris → Rome → Barcelona would only get a French guide, not French + Italian + Spanish.

## Solution
Refactored the language API and UI to generate and display a separate guide for each unique language across all destinations.

## Changes Made

### 1. API Route (`app/api/trip-intelligence/language/route.ts`)

#### Before
- Collected all destinations into a single set
- Called `determineTargetLanguage()` once with all destinations concatenated
- Generated ONE guide for ONE language
- Returned `{ guide: LanguageGuide }`

#### After
- Maps each destination to its language code
- Groups destinations by language (e.g., "Paris" → `fr`, "Rome" → `it`)
- Generates a separate guide for EACH unique language
- Each guide includes the specific destinations where that language is spoken
- Returns `{ guides: LanguageGuide[] }` (array instead of single object)

**Key improvements:**
```typescript
// Build destination → language mapping
const destinationMap = new Map<string, string[]>() // language code -> [destinations]
trip.segments.forEach(seg => {
  const destination = seg.endTitle
  const language = determineTargetLanguage(destination)
  
  if (!destinationMap.has(language.code)) {
    destinationMap.set(language.code, [])
  }
  if (!destinationMap.get(language.code)!.includes(destination)) {
    destinationMap.get(language.code)!.push(destination)
  }
})

// Generate a guide for each unique language
for (const [languageCode, destinations] of destinationMap.entries()) {
  // ... generate guide with AI ...
  guides.push(guide)
}
```

**Added helper function:**
```typescript
function getLanguageInfo(code: string): { name: string; code: string }
```

**Updated interface:**
```typescript
interface LanguageGuide {
  id: string
  targetLanguage: string
  targetLanguageCode: string
  userProficiency: 'beginner' | 'intermediate' | 'advanced'
  destinations?: string  // NEW: Shows which destinations use this language
  scenarios: LanguageScenario[]
}
```

### 2. Language View Component (`app/view1/components/language-view.tsx`)

#### Before
- Handled single `guide` object
- Displayed one language header
- Showed all scenarios under that single language

#### After
- Handles array of `guides`
- Displays separate section for each language
- Each section shows:
  - Language name and flag-style icon
  - Destinations where this language is spoken
  - Proficiency level badge
  - Scenarios (Airport, Hotel, Restaurant, etc.)
- All guides share the same learning tips at the bottom

**UI Structure:**
```
Language Guides
├── Japanese Guide
│   ├── For: Tokyo, Osaka
│   ├── Proficiency Badge (Beginner)
│   └── Scenarios (Airport, Hotel, Restaurant, etc.)
├── Korean Guide
│   ├── For: Seoul
│   ├── Proficiency Badge (Intermediate)
│   └── Scenarios (Airport, Hotel, Restaurant, etc.)
└── Learning Tips (shared)
```

### 3. Hook Update (`app/view1/hooks/use-cached-intelligence.ts`)
Already fixed in previous update to handle caching properly without GET requests.

## Files Changed
1. `/app/api/trip-intelligence/language/route.ts` - Multi-language generation logic
2. `/app/view1/components/language-view.tsx` - UI to display multiple guides
3. `/app/view1/hooks/use-cached-intelligence.ts` - Cache handling (previous fix)

## Example User Experience

### Single Country Trip
**Trip:** New York → Paris (7 days)
**Result:** 1 guide (French)

### Multi-Country Trip
**Trip:** Paris → Rome → Barcelona (14 days)
**Result:** 3 guides
1. **French Guide** - For: Paris
2. **Italian Guide** - For: Rome  
3. **Spanish Guide** - For: Barcelona

### Mixed Language Trip
**Trip:** Tokyo → Kyoto → Seoul
**Result:** 2 guides
1. **Japanese Guide** - For: Tokyo, Kyoto
2. **Korean Guide** - For: Seoul

## Benefits
- ✅ Comprehensive language support for multi-country trips
- ✅ Personalized phrases for each destination's language
- ✅ Clear visual separation between different language guides
- ✅ Shows which destinations use which language
- ✅ Respects user's proficiency level in each language separately
- ✅ AI generates context-aware phrases for each language
- ✅ Scales to any number of languages/destinations

## Testing
To test the multi-language feature:

1. Create a trip with multiple countries (e.g., European tour)
2. Navigate to `/view1/[tripId]?tab=language`
3. Fill out the language questionnaire (select known languages + proficiency)
4. Click "Generate Language Guide"
5. Verify you see separate guide sections for each language
6. Each guide should show the destinations where that language is used
7. All scenarios should be properly translated for each language

## Supported Languages
Currently auto-detected:
- Japanese (ja) - Japan, Tokyo, Osaka
- Spanish (es) - Spain, Mexico, Latin America
- French (fr) - France, Paris
- German (de) - Germany, Berlin, Munich
- Italian (it) - Italy, Rome, Milan
- Mandarin Chinese (zh) - China, Beijing, Shanghai
- Korean (ko) - Korea, Seoul
- Portuguese (pt) - Portugal, Lisbon
- Greek (el) - Greece, Athens

*Note: Language detection is keyword-based. In production, this should use geocoding API for accurate country/language mapping.*

## Future Enhancements
- Add more languages and better detection
- Show language difficulty rating
- Add downloadable phrase cards (PDF)
- Audio pronunciation guides
- Regional dialect support (e.g., European Spanish vs. Latin American Spanish)
