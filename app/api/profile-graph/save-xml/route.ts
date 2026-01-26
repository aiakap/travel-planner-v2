/**
 * Profile Graph Save XML API Route
 * 
 * Saves XML data to the database and returns the saved result
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { xmlData } = body;

    // Validate required field
    if (!xmlData) {
      return NextResponse.json(
        { error: "XML data is required" },
        { status: 400 }
      );
    }

    console.log("💾 [Save XML API] Saving XML for user:", session.user.id);

    // Save to database
    const result = await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      update: { graphData: xmlData },
      create: { userId: session.user.id, graphData: xmlData }
    });

    console.log("✅ [Save XML API] XML saved successfully, length:", result.graphData.length);

    // Revalidate paths so other pages see the changes
    revalidatePath("/profile/graph");
    revalidatePath("/object/profile_attribute");

    // Return the saved XML from database
    return NextResponse.json({
      success: true,
      xmlData: result.graphData
    });

  } catch (error) {
    console.error("❌ [Save XML API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to save XML",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
