import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

const CONTEXT_ACTIONS_PROMPT = `You are a travel planning assistant. Given a trip element and full trip context, generate 4-6 concise action suggestions the user might want to take.

Return ONLY a JSON array of actions with this format:
[
  {"id": "1", "label": "Change dates", "prompt": "I want to change the dates for this trip"},
  {"id": "2", "label": "Add destination", "prompt": "Can you add another destination to this trip?"}
]

Be specific to the item type:
- **Trip**: rename, change dates, add destinations, view budget, optimize schedule
- **Segment**: change dates, change locations, add reservations, rename
- **Reservation**: confirm, add conf #, change dates, move to different segment, change status, cancel, find alternatives

Consider the current state:
- If reservation is "suggested" or "pending" → offer to confirm or find alternatives
- If reservation is "confirmed" → offer to change conf #, update details, cancel
- If no flights exist in trip → suggest adding flights
- If trip has no hotel → suggest adding accommodations
- If segment has no reservations → suggest adding some

Keep labels short (2-4 words). Make prompts natural and conversational.`;

function getDefaultActions(type: string, data?: any) {
  if (type === "trip") {
    return [
      { id: "1", label: "Change dates", prompt: "I want to change the trip dates" },
      { id: "2", label: "Rename trip", prompt: "I want to rename this trip" },
      { id: "3", label: "Add destination", prompt: "Can you add another destination?" },
      { id: "4", label: "View budget", prompt: "Show me a budget breakdown for this trip" }
    ];
  } else if (type === "segment") {
    return [
      { id: "1", label: "Change dates", prompt: "I want to change the dates for this segment" },
      { id: "2", label: "Add hotel", prompt: "Add a hotel to this segment" },
      { id: "3", label: "Add activity", prompt: "Add an activity or restaurant to this segment" },
      { id: "4", label: "Rename", prompt: "Rename this segment" }
    ];
  } else {
    const status = data?.status?.toLowerCase() || 'pending';
    
    if (status === 'confirmed') {
      return [
        { id: "1", label: "Update details", prompt: "I want to update details for this reservation" },
        { id: "2", label: "Change dates", prompt: "Change the dates for this reservation" },
        { id: "3", label: "Add conf #", prompt: "Add a confirmation number" },
        { id: "4", label: "Cancel", prompt: "I want to cancel this reservation" }
      ];
    } else {
      return [
        { id: "1", label: "Confirm booking", prompt: "I want to confirm this reservation" },
        { id: "2", label: "Change dates", prompt: "Change the dates for this reservation" },
        { id: "3", label: "Find alternatives", prompt: "Find alternative options for this" },
        { id: "4", label: "Remove", prompt: "Remove this reservation from my trip" }
      ];
    }
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, data, fullTripContext } = await req.json();
    
    console.log(`📋 [Context API] Generating actions for ${type}`);
    
    // Build context string
    const contextStr = JSON.stringify({
      type,
      item: data,
      tripContext: fullTripContext
    }, null, 2);
    
    // Generate actions using AI
    let actions;
    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `${CONTEXT_ACTIONS_PROMPT}\n\nContext:\n${contextStr}`,
        temperature: 0.7,
        maxRetries: 2,
      });
      
      console.log(`✅ [Context API] AI response received`);
      
      // Parse JSON response
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        actions = JSON.parse(jsonMatch[0]);
        console.log(`   Generated ${actions.length} actions`);
      } else {
        console.warn("   No JSON array found in response, using defaults");
        actions = getDefaultActions(type, data);
      }
    } catch (e) {
      console.error("❌ [Context API] Failed to generate/parse AI actions:", e);
      actions = getDefaultActions(type, data);
    }
    
    return NextResponse.json({ actions });
  } catch (error) {
    console.error("❌ [Context API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
