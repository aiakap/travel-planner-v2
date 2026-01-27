import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint to view image generation logs
 * GET /api/admin/image-logs?limit=50&entityType=trip
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const entityType = searchParams.get("entityType");
    const status = searchParams.get("status");
    const promptStyle = searchParams.get("promptStyle");

    // Build where clause
    const where: any = {};
    if (entityType) {
      where.entityType = entityType;
    }
    if (status) {
      where.status = status;
    }
    if (promptStyle) {
      where.promptStyle = promptStyle;
    }

    // Fetch logs
    const logs = await prisma.imageGenerationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200), // Cap at 200
    });

    // Get summary stats
    const stats = await prisma.imageGenerationLog.groupBy({
      by: ["status"],
      _count: true,
    });

    const promptStats = await prisma.imageGenerationLog.groupBy({
      by: ["promptName"],
      where: { promptName: { not: null } },
      _count: true,
      orderBy: { _count: { promptName: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        byStatus: stats.reduce((acc: any, item: any) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        topPrompts: promptStats.map((p: any) => ({
          name: p.promptName,
          count: p._count,
        })),
        total: logs.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching image logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET specific log by ID
 * GET /api/admin/image-logs/[id]
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json(
        { success: false, error: "logId required" },
        { status: 400 }
      );
    }

    const log = await prisma.imageGenerationLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: "Log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error: any) {
    console.error("Error fetching image log:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
