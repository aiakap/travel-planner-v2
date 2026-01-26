import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserContextForDisplay } from "@/lib/actions/user-context";

/**
 * GET /api/user-context
 * Returns the complete user context for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const context = await getUserContextForDisplay(session.user.id);
    
    console.log("📦 [GET /api/user-context] Returning context for user:", session.user.id);
    
    return NextResponse.json(context, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("[GET /api/user-context] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch user context",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
