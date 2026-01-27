import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Email Extraction Analysis Endpoint
 * 
 * Analyzes an email and returns type detection results WITHOUT extracting.
 * This is step 1 of the interactive approval flow.
 * 
 * Returns:
 * - Detection results with scoring breakdown
 * - All available reservation types for the dropdown
 * - User can then approve or override the detected type
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { emailText } = await request.json();

    if (!emailText) {
      return NextResponse.json(
        { error: "Email text is required" },
        { status: 400 }
      );
    }

    console.log(`📧 Email analysis request received, text length: ${emailText.length}`);

    // Step 1: Run detection with detailed scoring
    console.log('🔍 Running type detection...');
    const detectionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat/detect-paste`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: emailText })
      }
    );

    if (!detectionResponse.ok) {
      throw new Error('Detection API failed');
    }

    const detection = await detectionResponse.json();
    console.log(`✅ Detection complete: ${detection.detectedType || 'none'} (${Math.round((detection.confidence || 0) * 100)}%)`);

    // Step 2: Get all available reservation types from database
    console.log('📋 Loading all reservation types...');
    const allTypes = await prisma.reservationType.findMany({
      include: { category: true },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    console.log(`✅ Loaded ${allTypes.length} reservation types`);

    // Format available types for dropdown
    const availableTypes = allTypes.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.name
    }));

    return NextResponse.json({
      detection,
      availableTypes,
      metadata: {
        emailLength: emailText.length,
        typesCount: allTypes.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("❌ Email analysis error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to analyze email",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
