import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAITripSuggestions } from "@/lib/ai/generate-trip-suggestions";
import { ProfileGraphItem } from "@/lib/types/profile-graph";

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    
    // Check if it's the new XML-based format or old format
    if (body.profileItems) {
      // New format: Transform XML profile items to expected format
      const profileItems = body.profileItems as ProfileGraphItem[];
      const userProfile = body.userProfile;
      
      const hobbies = profileItems
        .filter(item => item.category === 'hobbies')
        .map(item => ({
          hobby: {
            name: item.value,
            category: item.metadata?.subcategory || null
          }
        }));
      
      const travelPrefs = profileItems.filter(
        item => item.category === 'travel-preferences' || item.category === 'travel-style'
      );
      const preferences = travelPrefs.map(item => ({
        preferenceType: {
          name: item.metadata?.subcategory || item.category || 'preference'
        },
        option: {
          value: item.value,
          label: item.value
        }
      }));
      
      const relationships = profileItems
        .filter(item => item.category === 'family')
        .map(item => ({
          relationshipType: item.metadata?.subcategory || 'companion',
          nickname: null
        }));
      
      // Use user profile location first, fallback to destinations from profile items
      const destinations = profileItems.filter(item => item.category === 'destinations');
      const profile = {
        name: userProfile?.name || null,
        dateOfBirth: userProfile?.dateOfBirth || null,
        city: userProfile?.city || (destinations.length > 0 ? destinations[0].value : null),
        country: userProfile?.country || null
      };
      
      const profileData = {
        hobbies,
        preferences,
        relationships,
        profile
      };
      
      // #region agent log
      await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:profileData',message:'Profile data received (XML format)',data:{hasHobbies:!!profileData?.hobbies,hasPrefs:!!profileData?.preferences,hasProfile:!!profileData?.profile,itemCount:profileItems.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const suggestions = await generateAITripSuggestions(profileData);
      
      // #region agent log
      await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:suggestions',message:'AI suggestions generated',data:{count:suggestions?.length,firstHasCoords:!!(suggestions?.[0]?.destinationLat),firstTitle:suggestions?.[0]?.title},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json({ suggestions });
    } else {
      // Old format: Use as-is for backward compatibility
      const profileData = body;
      
      // #region agent log
      await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:profileData',message:'Profile data received (old format)',data:{hasHobbies:!!profileData?.hobbies,hasPrefs:!!profileData?.preferences,hasProfile:!!profileData?.profile},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const suggestions = await generateAITripSuggestions(profileData);
      
      // #region agent log
      await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:suggestions',message:'AI suggestions generated',data:{count:suggestions?.length,firstHasCoords:!!(suggestions?.[0]?.destinationLat),firstTitle:suggestions?.[0]?.title},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json({ suggestions });
    }
  } catch (error) {
    // #region agent log
    await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:error',message:'Error in API route',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:'No stack'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    console.error("Error generating trip suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
