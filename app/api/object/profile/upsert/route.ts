/**
 * Profile Upsert API Route
 * 
 * HTTP interface for upserting profile items
 * Used by generic object system and direct API calls
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { upsertProfileItem } from "@/lib/actions/profile-crud-actions";

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
    const { category, subcategory, value, metadata } = body;

    // Validate required fields
    if (!category || !subcategory || !value) {
      return NextResponse.json(
        { error: "Missing required fields: category, subcategory, value" },
        { status: 400 }
      );
    }

    console.log("📥 [Profile Upsert API] Request:", {
      category,
      subcategory,
      value,
      userId: session.user.id
    });

    // #region agent log
    const fs = require('fs');
    fs.appendFileSync('/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/.cursor/debug.log', JSON.stringify({location:'upsert-route.ts:45',message:'Before upsertProfileItem',data:{category,subcategory,value,userId:session.user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})+'\n');
    // #endregion

    // Call server action
    const result = await upsertProfileItem({
      category,
      subcategory,
      value,
      metadata
    });

    // #region agent log
    fs.appendFileSync('/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/.cursor/debug.log', JSON.stringify({location:'upsert-route.ts:54',message:'After upsertProfileItem',data:{success:result.success,nodeCount:result.graphData.nodes.length,hasXmlData:!!result.xmlData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})+'\n');
    // #endregion

    console.log("📤 [Profile Upsert API] Success:", {
      nodeCount: result.graphData.nodes.length
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ [Profile Upsert API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to upsert profile item",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
