/**
 * Profile Graph Reorganization API Route - DEPRECATED
 * 
 * This endpoint is no longer needed with the relational profile system.
 * The new system handles categorization automatically via the category processor.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "This endpoint is deprecated", 
        message: "The relational profile system handles categorization automatically via the category processor."
      },
      { status: 410 } // 410 Gone
    );
  } catch (error) {
    console.error("Error in deprecated reorganize endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "This endpoint is deprecated", 
        message: "The relational profile system handles categorization automatically via the category processor."
      },
      { status: 410 } // 410 Gone
    );
  } catch (error) {
    console.error("Error in deprecated reorganize endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
