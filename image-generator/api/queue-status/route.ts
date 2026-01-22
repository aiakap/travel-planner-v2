import { NextResponse } from "next/server";
import { readQueue, getQueueStats } from "../../lib/queue-manager";

export async function GET() {
  try {
    const queue = await readQueue();
    const stats = await getQueueStats();

    return NextResponse.json({
      queue: queue.prompts,
      stats,
    });
  } catch (error: any) {
    console.error("Error reading queue:", error);
    return NextResponse.json(
      { error: error.message || "Failed to read queue" },
      { status: 500 }
    );
  }
}
