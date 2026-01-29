import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobProgress } from "@/lib/cache/job-progress";

/**
 * GET /api/quick-add/status/[jobId]
 * 
 * Returns the current progress of a background job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('[Status API] Unauthorized access attempt')
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    console.log('[Status API] Checking job:', jobId)
    
    const progress = getJobProgress(jobId);

    if (!progress) {
      console.log('[Status API] Job not found:', jobId)
      return NextResponse.json(
        { error: "Job not found", jobId: jobId },
        { status: 404 }
      );
    }

    console.log('[Status API] Job progress:', {
      jobId: progress.jobId,
      completed: progress.completed,
      total: progress.total,
      status: progress.completed === progress.total ? 'complete' : 'processing'
    })

    return NextResponse.json({
      jobId: progress.jobId,
      tripId: progress.tripId,
      total: progress.total,
      completed: progress.completed,
      results: progress.results,
      status: progress.completed === progress.total ? 'complete' : 'processing',
      updatedAt: progress.updatedAt.toISOString()
    });

  } catch (error) {
    console.error("[Status API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to get job status",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
