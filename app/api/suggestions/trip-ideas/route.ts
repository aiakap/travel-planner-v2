import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAITripSuggestions } from "@/lib/ai/generate-trip-suggestions";

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const profileData = await req.json();
    
    // #region agent log
    await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:profileData',message:'Profile data received',data:{hasHobbies:!!profileData?.hobbies,hasPrefs:!!profileData?.preferences,hasProfile:!!profileData?.profile},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const suggestions = await generateAITripSuggestions(profileData);
    
    // #region agent log
    await fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:POST:suggestions',message:'AI suggestions generated',data:{count:suggestions?.length,firstHasCoords:!!(suggestions?.[0]?.destinationLat),firstTitle:suggestions?.[0]?.title},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json({ suggestions });
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
