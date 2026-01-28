/**
 * Seed Trips API Route
 * 
 * POST /api/admin/seed-trips
 * 
 * Generates seed trip data for testing and development.
 * Accepts userId and tripSize, returns generated trip details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSeedTrip, deleteSeedTrip, deleteAllTripsForUser, type TripSize } from '@/lib/seed-data/seed-trip-generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// POST - Generate a seed trip
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tripSize, action } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'delete-all') {
      const count = await deleteAllTripsForUser(userId);
      return NextResponse.json({
        success: true,
        action: 'delete-all',
        deletedCount: count,
        message: `Deleted ${count} trip(s) for user`,
      });
    }

    if (action === 'delete') {
      const { tripId } = body;
      if (!tripId) {
        return NextResponse.json(
          { error: 'tripId is required for delete action' },
          { status: 400 }
        );
      }
      await deleteSeedTrip(tripId);
      return NextResponse.json({
        success: true,
        action: 'delete',
        tripId,
        message: 'Trip deleted successfully',
      });
    }

    // Default action: generate trip
    if (!tripSize || !['large', 'medium', 'small', 'micro'].includes(tripSize)) {
      return NextResponse.json(
        { error: 'tripSize must be one of: large, medium, small, micro' },
        { status: 400 }
      );
    }

    console.log(`[Seed Trips] Generating ${tripSize} trip for user ${userId}`);

    // Enable debug mode for detailed logging
    const debug = body.debug === true;
    
    const startTime = Date.now();
    const result = await generateSeedTrip(userId, tripSize as TripSize, debug);
    const duration = Date.now() - startTime;

    console.log(`[Seed Trips] Generated trip ${result.tripId} in ${duration}ms`);
    console.log(`[Seed Trips] Summary:`, result.summary);

    return NextResponse.json({
      success: true,
      action: 'generate',
      tripId: result.tripId,
      segmentIds: result.segmentIds,
      reservationIds: result.reservationIds,
      summary: result.summary,
      generationTime: duration,
      message: `Successfully generated ${tripSize} trip with ${result.summary.reservationCount} reservations`,
    });
  } catch (error: any) {
    console.error('[Seed Trips] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate seed trip',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get information about available trip sizes
// ============================================================================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    availableSizes: [
      {
        size: 'large',
        name: 'Grand European Tour',
        duration: '21 days',
        destinations: ['San Francisco', 'Amsterdam', 'Paris', 'Tuscany'],
        segments: 6,
        estimatedReservations: '40-50',
        description: 'Complete European tour with all reservation types and segment types',
      },
      {
        size: 'medium',
        name: 'Paris & Tuscany Escape',
        duration: '10 days',
        destinations: ['San Francisco', 'Paris', 'Tuscany'],
        segments: 5,
        estimatedReservations: '20-25',
        description: 'Focused trip combining Parisian elegance with Tuscan countryside',
      },
      {
        size: 'small',
        name: 'Amsterdam Long Weekend',
        duration: '5 days',
        destinations: ['San Francisco', 'Amsterdam'],
        segments: 3,
        estimatedReservations: '12-15',
        description: 'Quick getaway to Amsterdam with museums and dining',
      },
      {
        size: 'micro',
        name: 'Paris Quick Visit',
        duration: '2 days',
        destinations: ['San Francisco', 'Paris'],
        segments: 3,
        estimatedReservations: '6-8',
        description: 'Whirlwind Paris trip hitting essential highlights',
      },
    ],
    usage: {
      generate: 'POST with { userId: string, tripSize: "large"|"medium"|"small"|"micro" }',
      delete: 'POST with { userId: string, action: "delete", tripId: string }',
      deleteAll: 'POST with { userId: string, action: "delete-all" }',
    },
  });
}
