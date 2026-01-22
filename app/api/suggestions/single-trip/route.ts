import { NextRequest, NextResponse } from "next/server";
import { generateSingleTripSuggestion } from "@/lib/ai/generate-single-trip-suggestion";

export async function POST(req: NextRequest) {
  try {
    const { destination, profileData } = await req.json();
    
    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }
    
    // Generate 1 trip suggestion for the destination
    const suggestion = await generateSingleTripSuggestion(destination, profileData);
    
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error generating trip suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
