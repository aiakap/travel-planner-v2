# User Profile Info in Trip Suggestions - Complete

## Overview
Enhanced the trip suggestions feature to include personal profile information (name, date of birth, city, country) in the AI prompt, enabling more personalized and age-appropriate trip recommendations.

## Changes Implemented

### 1. Database Query Updates ✅
**File**: `lib/actions/profile-graph-actions.ts`

Updated `getUserProfileGraph()` to fetch user profile data:
```typescript
// Fetch user with profile
const user = await prisma.user.findUnique({
  where: { id: targetUserId },
  select: {
    id: true,
    name: true,
    email: true,
    image: true,
    profile: {
      select: {
        dateOfBirth: true,
        city: true,
        country: true
      }
    }
  }
});
```

### 2. Server Component Updates ✅
**File**: `app/suggestions/page.tsx`

Extracts and passes user profile information to client:
```typescript
// User profile info for trip suggestions
const userProfile = {
  name: profileGraph.user.name || session.user.name || "",
  dateOfBirth: profileGraph.user.profile?.dateOfBirth || null,
  city: profileGraph.user.profile?.city || null,
  country: profileGraph.user.profile?.country || null,
};
```

### 3. Client Component Updates ✅
**File**: `app/suggestions/client.tsx`

- Added `userProfile` to component props
- Passes `userProfile` to API endpoint when generating suggestions
- Type definition includes all profile fields

### 4. API Route Updates ✅
**File**: `app/api/suggestions/trip-ideas/route.ts`

Updated to receive and use user profile information:
```typescript
const profile = {
  name: userProfile?.name || null,
  dateOfBirth: userProfile?.dateOfBirth || null,
  city: userProfile?.city || (destinations.length > 0 ? destinations[0].value : null),
  country: userProfile?.country || null
};
```

Prioritizes user profile location over destinations from profile items.

### 5. AI Generation Updates ✅
**File**: `lib/ai/generate-trip-suggestions.ts`

Enhanced prompt with personal information:
- **Name**: Uses traveler's name in prompt
- **Age**: Calculates age from date of birth and includes in prompt
- **Location**: Uses city/country for local suggestion context

```typescript
// Calculate age from date of birth if available
let ageInfo = "";
if (profileData.profile?.dateOfBirth) {
  const dob = new Date(profileData.profile.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  ageInfo = ` (Age: ${age})`;
}

const travelerName = profileData.profile?.name || "Traveler";

const prompt = `Generate 4 DIVERSE personalized trip suggestions for this traveler:

**Traveler**: ${travelerName}${ageInfo}
**Hobbies/Interests**: ${hobbiesList || "None specified"}
**Travel Preferences**: ${preferencesList || "None specified"}
**Traveling with**: ${relationshipsList || "Solo"}
**Home Location**: ${location}
```

## Benefits

### 1. **Age-Appropriate Suggestions**
- AI can tailor activities to traveler's age
- Different recommendations for 25yo vs 65yo
- Considers physical activity levels appropriately

### 2. **Personalized Addressing**
- Uses traveler's actual name in reasoning
- Makes suggestions feel more personal
- Better engagement with the recommendations

### 3. **Better Location Context**
- Uses actual home city for local suggestions
- More accurate "within 30 min of home" recommendations
- Real local places instead of generic suggestions

### 4. **Enhanced Prompts**
- AI has more context about the traveler
- Can reference age in explanations ("perfect for someone in their 30s")
- Better reasoning about why trips match the person

## Example Prompt Enhancement

### Before:
```
**Hobbies/Interests**: Hiking, Photography
**Travel Preferences**: Budget-conscious
**Traveling with**: Solo
**Home Location**: San Francisco
```

### After:
```
**Traveler**: Alex Johnson (Age: 32)
**Hobbies/Interests**: Hiking, Photography
**Travel Preferences**: Budget-conscious
**Traveling with**: Solo
**Home Location**: San Francisco, California
```

## Data Flow

```
User Profile (DB)
  ├─ name
  ├─ profile.dateOfBirth
  ├─ profile.city
  └─ profile.country
       ↓
getUserProfileGraph()
       ↓
suggestions/page.tsx (server)
       ↓
SuggestionsClient (client)
       ↓
API /suggestions/trip-ideas
       ↓
generateAITripSuggestions()
       ↓
OpenAI GPT-4o (with enhanced prompt)
       ↓
Personalized Trip Suggestions
```

## Database Schema

User profile data comes from the `UserProfile` table:
```prisma
model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  firstName       String?
  lastName        String?
  dateOfBirth     DateTime?
  city            String?
  country         String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Testing Recommendations

1. **With Complete Profile**:
   - User with name, DOB, city, country
   - Verify age is calculated correctly
   - Check that location-specific suggestions work

2. **With Partial Profile**:
   - User with only name
   - User with only location
   - Verify graceful handling of missing data

3. **Without Profile**:
   - User with no UserProfile record
   - Should still generate suggestions using "Traveler"
   - Fallback to "Unknown" location

4. **Age-Based Differences**:
   - Create profiles with different ages (25, 45, 65)
   - Compare suggestion appropriateness
   - Verify physical activity levels match age

## Notes

- All fields are optional - system gracefully handles missing data
- Age is calculated on-the-fly from date of birth
- User profile location takes priority over destinations in profile items
- Backward compatible with old API format (without userProfile)
- No changes to database schema required - uses existing UserProfile table
