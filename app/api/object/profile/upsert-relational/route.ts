import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addProfileValue } from "@/lib/actions/profile-relational-actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { value, categorySlug, metadata } = body;

    if (!value || !categorySlug) {
      return NextResponse.json(
        { error: "Missing required fields: value, categorySlug" },
        { status: 400 }
      );
    }

    const result = await addProfileValue(
      session.user.id,
      value,
      categorySlug,
      metadata
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to add value" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Error in upsert-relational route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
