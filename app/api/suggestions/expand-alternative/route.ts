import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { expandAlternativeToFullSuggestion } from "@/lib/ai/generate-assisted-suggestion";
import type { ExpandAlternativeRequest } from "@/lib/types/assisted-wizard";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: ExpandAlternativeRequest = await req.json();

    // Validate required fields
    if (!body.alternative) {
      return NextResponse.json(
        { error: "Missing alternative to expand" },
        { status: 400 }
      );
    }

    if (!body.originalAnswers) {
      return NextResponse.json(
        { error: "Missing original wizard answers" },
        { status: 400 }
      );
    }

    // Expand the alternative to a full suggestion
    const fullSuggestion = await expandAlternativeToFullSuggestion({
      alternative: body.alternative,
      originalAnswers: body.originalAnswers,
      profileItems: body.profileItems || [],
      userProfile: body.userProfile || {
        name: session.user.name || "Traveler",
        dateOfBirth: null,
        city: null,
        country: null,
      },
    });

    return NextResponse.json({ suggestion: fullSuggestion });
  } catch (error) {
    console.error("Error expanding alternative:", error);
    return NextResponse.json(
      { error: "Failed to expand alternative" },
      { status: 500 }
    );
  }
}
