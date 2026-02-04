import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAssistedTripSuggestion } from "@/lib/ai/generate-assisted-suggestion";
import type { AssistedTripRequest } from "@/lib/types/assisted-wizard";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: AssistedTripRequest = await req.json();

    // Validate required fields
    if (!body.answers) {
      return NextResponse.json(
        { error: "Missing wizard answers" },
        { status: 400 }
      );
    }

    // Generate the assisted trip suggestion
    const result = await generateAssistedTripSuggestion({
      answers: body.answers,
      profileItems: body.profileItems || [],
      userProfile: body.userProfile || {
        name: session.user.name || "Traveler",
        dateOfBirth: null,
        city: null,
        country: null,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating assisted trip suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate trip suggestion" },
      { status: 500 }
    );
  }
}
