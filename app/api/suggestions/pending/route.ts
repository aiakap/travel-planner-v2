import { NextRequest, NextResponse } from "next/server";
import { savePendingSuggestion, getPendingSuggestion } from "@/lib/pending-suggestions";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = await savePendingSuggestion(data);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving pending suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save suggestion" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    const suggestion = await getPendingSuggestion(id || undefined);
    
    return NextResponse.json({ 
      success: true, 
      suggestion 
    });
  } catch (error) {
    console.error("Error retrieving pending suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve suggestion" },
      { status: 500 }
    );
  }
}
