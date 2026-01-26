import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { removeProfileValue } from "@/lib/actions/profile-relational-actions";

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
    const { userValueId } = body;

    if (!userValueId) {
      return NextResponse.json(
        { error: "Missing userValueId" },
        { status: 400 }
      );
    }

    const result = await removeProfileValue(session.user.id, userValueId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete value" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in delete-relational route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
