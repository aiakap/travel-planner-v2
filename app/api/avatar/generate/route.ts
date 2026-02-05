import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAvatarImage, AVATAR_STYLES, type AvatarStyle } from "@/lib/avatar-generation";

export const maxDuration = 60; // Allow up to 60 seconds for image generation

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { style, customPrompt } = body;

    // Validate style
    if (!style) {
      return NextResponse.json(
        { error: "Style is required" },
        { status: 400 }
      );
    }

    const validStyles = AVATAR_STYLES.map(s => s.id);
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: `Invalid style. Valid options: ${validStyles.join(", ")}` },
        { status: 400 }
      );
    }

    console.log(`[avatar/generate] Generating avatar for user ${session.user.id} with style: ${style}`);

    // Generate the avatar image
    const imageUrl = await generateAvatarImage(
      customPrompt || null,
      style as AvatarStyle
    );

    console.log(`[avatar/generate] Avatar generated successfully: ${imageUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl,
      style,
    });
  } catch (error) {
    console.error("[avatar/generate] Error:", error);
    
    const message = error instanceof Error ? error.message : "Failed to generate avatar";
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET endpoint to return available styles
export async function GET() {
  return NextResponse.json({
    styles: AVATAR_STYLES,
  });
}
