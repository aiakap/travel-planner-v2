import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { initializeSegmentTypes } from '@/app/trip/new/lib/segment-types';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch segment types from database
    const segmentTypes = await prisma.segmentType.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Initialize segment type map
    const segmentTypeMap = initializeSegmentTypes(segmentTypes);

    return NextResponse.json({ segmentTypeMap });
  } catch (error) {
    console.error('Error fetching segment types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment types' },
      { status: 500 }
    );
  }
}
