import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { 
  calculateProgressPercentage, 
  getProgressMessage,
  type GenerationProgress,
} from '@/lib/sample-trip/background-generator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/trips/[id]/generation-status
 * 
 * Returns the current generation status of a sample trip.
 * Used by the client to poll for progress during generation.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      );
    }

    // Fetch trip with ownership check
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        generationProgress: true,
        generationError: true,
        title: true,
        isSample: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Parse generation progress
    const progress = trip.generationProgress as GenerationProgress | null;
    const percentComplete = calculateProgressPercentage(progress);
    const statusMessage = getProgressMessage(progress);

    // Determine overall status
    let status: 'generating' | 'ready' | 'failed';
    if (trip.status === 'GENERATING') {
      status = 'generating';
    } else if (trip.generationError) {
      status = 'failed';
    } else {
      status = 'ready';
    }

    return NextResponse.json({
      tripId: trip.id,
      status,
      progress: {
        step: progress?.step || 'starting',
        completed: progress?.completed || [],
        failed: progress?.failed || [],
        percentComplete,
        message: statusMessage,
      },
      error: trip.generationError || undefined,
      title: trip.title,
      isSample: trip.isSample,
    });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generation status' },
      { status: 500 }
    );
  }
}
